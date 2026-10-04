"""Generate our original, short water-pour cue; no external samples required."""
import math
import random
import struct
import wave
from pathlib import Path

RATE = 44100
random.seed(27)
samples = [0.0] * int(RATE * 1.15)

# Damped, upward-chirping bubble resonances give water its characteristic plop.
for start, frequency, gain, decay in [(0.008, 580, 0.45, 0.085), (0.18, 820, 0.3, 0.07),
                                     (0.43, 1100, 0.2, 0.06)] + [
    (random.uniform(0.025, 0.65), random.uniform(520, 2100),
     random.uniform(0.025, 0.11), random.uniform(0.014, 0.045)) for _ in range(48)
]:
    for n in range(int(decay * 7 * RATE)):
        index = int(start * RATE) + n
        if index >= len(samples):
            break
        t = n / RATE
        envelope = (1 - math.exp(-t / 0.0015)) * math.exp(-t / decay)
        phase = 2 * math.pi * frequency * (t + 0.13 * decay * (1 - math.exp(-t / decay)))
        samples[index] += gain * envelope * (math.sin(phase) + 0.12 * math.sin(phase * 2.03))

# A very quiet, band-limited stream beneath the droplets, with a soft release.
low, high = 0.0, 0.0
for n in range(len(samples)):
    t = n / RATE
    low += 0.2 * (random.uniform(-1, 1) - low)
    high += 0.045 * (low - high)
    envelope = min(t / 0.04, 1) * max(0, min((0.73 - t) / 0.2, 1))
    samples[n] += (low - high) * envelope * 0.15

dry = samples[:]
for delay, gain in [(0.026, 0.16), (0.057, 0.08)]:
    offset = int(RATE * delay)
    for n in range(offset, len(samples)):
        samples[n] += dry[n - offset] * gain
peak = max(abs(value) for value in samples)
output = Path(__file__).resolve().parents[1] / 'assets/audio/water-pour.wav'
output.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(output), 'wb') as result:
    result.setparams((1, 2, RATE, 0, 'NONE', 'not compressed'))
    result.writeframes(b''.join(struct.pack('<h', round(value / peak * 0.30 * 32767)) for value in samples))
print(f'{output.name}: {len(samples) / RATE:.2f}s, peak -10.5 dBFS, mono PCM')
