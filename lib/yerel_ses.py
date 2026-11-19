"""Yerel oyunun EMA ve OpenVoice seslerini sırayla hazırlayan kalıcı işçi."""
import contextlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import traceback
import wave

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / 'data' / 'openvoice'
CACHE = ROOT / 'data' / 'ses'
sys.path.insert(0, str(MODEL))

with contextlib.redirect_stdout(sys.stderr):
    import numpy as np
    import torch
    from ema_lightning import EMA
    from openvoice.models import SynthesizerTrn

    torch.set_num_threads(4)
    ema = EMA(device='cpu')
    config = json.loads((MODEL / 'config.json').read_text())
    converter = SynthesizerTrn(0, 513, n_speakers=0, **config['model']).eval()
    converter.load_state_dict(torch.load(MODEL / 'checkpoint.pth', map_location='cpu', weights_only=True)['model'])
    with np.load(MODEL / 'muhtar.npz') as refs:
        source = torch.from_numpy(refs['source'])
        targets = {'muhtar': torch.from_numpy(refs['target'])}
    with np.load(MODEL / 'koyluler.npz') as refs:
        targets.update({role: torch.from_numpy(refs[role]) for role in refs.files if role != 'anlatici'})
    window = torch.hann_window(1024)
    ffmpeg = shutil.which('ffmpeg') or '/opt/homebrew/bin/ffmpeg'


def filtre(audio, graph, rate):
    proc = subprocess.run(
        [ffmpeg, '-v', 'error', '-f', 'f32le', '-ar', '24000', '-ac', '1', '-i', 'pipe:0',
         '-af', graph, '-ar', str(rate), '-f', 'f32le', 'pipe:1'],
        input=audio.astype('<f4').tobytes(), capture_output=True, check=True, timeout=10)
    return np.frombuffer(proc.stdout, dtype='<f4').copy()


def karakter_sesi(audio, target):
    samples = filtre(audio, 'aresample=22050', 22050)
    y = torch.from_numpy(samples)
    if y.numel() < 512:
        y = torch.nn.functional.pad(y, (0, 512 - y.numel()))
    y = torch.nn.functional.pad(y[None, None, :], (384, 384), mode='reflect').squeeze(1)
    spectrum = torch.stft(y, 1024, 256, 1024, window=window, center=False, return_complex=True)
    features = (spectrum.abs().square() + 1e-6).sqrt()
    with torch.inference_mode():
        result = converter.voice_conversion(features, torch.LongTensor([features.size(-1)]),
                                            sid_src=source, sid_tgt=target, tau=0.3)[0][0, 0].numpy()
    rms = max(1e-8, float(np.sqrt(np.mean(result ** 2))))
    return result * min(float(np.sqrt(np.mean(audio ** 2))) / rms, .97 / max(1e-8, np.max(abs(result))))


def hazirla(job):
    path = CACHE / ('yerel-' + job['id'] + '.wav')
    if path.exists():
        with wave.open(str(path)) as f:
            return f.getnframes() / f.getframerate()
    rate = 24000
    audio = np.asarray(ema.say(job['metin'], sample_rate=rate, seed=24).audio, dtype=np.float32).reshape(-1)
    if job['kim'] in targets:
        audio, rate = karakter_sesi(audio, targets[job['kim']]), 22050
    elif job['kim'] == 'bakkal':
        ratio = 2 ** (-3 / 12)
        graph = f'asetrate={round(rate * ratio)},aresample={rate},atempo={1/ratio:.6f},equalizer=f=200:g=1.5,alimiter=limit=0.95:level=false:latency=true'
        audio = filtre(audio, graph, rate)
    if not audio.size or not np.isfinite(audio).all():
        raise ValueError('Ses üretilemedi')
    with tempfile.NamedTemporaryFile(dir=CACHE, suffix='.part', delete=False) as tmp:
        name = tmp.name
    try:
        with wave.open(name, 'wb') as f:
            f.setparams((1, 2, rate, 0, 'NONE', ''))
            f.writeframes(np.rint(np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes())
        os.replace(name, path)
    finally:
        Path(name).unlink(missing_ok=True)
    return len(audio) / rate


for line in sys.stdin:
    job = json.loads(line)
    try:
        with contextlib.redirect_stdout(sys.stderr):
            duration = hazirla(job)
        result = {'id': job['id'], 'sure': duration}
    except Exception:
        traceback.print_exc(file=sys.stderr)
        result = {'id': job['id'], 'hata': True}
    print(json.dumps(result), flush=True)
