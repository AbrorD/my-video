"""Tightens raw_voice.mp3 to STYLE_BIBLE.md Shorts cadence (~3.6-3.7 words/s, minimal dead air):
1. Uniformly speeds up raw_voice.mp3 with ffmpeg pitch-preserving atempo=1.25 to 48 kHz mono float WAV.
2. Tightens silent gaps > 0.20 s down to 0.12 s (with 12 ms cosine crossfades on zero-energy silence) while
   shifting every subsequent word's [s, e] in words.json by the exact removed sample count (zero timestamp drift).
3. Pads tail by 0.25 s to an exact multiple of 1/30 s (30 fps frame boundary) and writes voice.wav (48 kHz 24-bit)
   + words.json + prints beat timings.
"""
import json, math, os, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
ATEMPO = 1.25

raw_mp3 = os.path.join(HERE, "raw_voice.mp3")
tmp_wav = os.path.join(HERE, "_tempo.wav")
out_wav = os.path.join(HERE, "voice.wav")
words = json.load(open(os.path.join(HERE, "words_raw.json"), encoding="utf-8"))

subprocess.run(
    ["ffmpeg", "-y", "-v", "error", "-i", raw_mp3, "-af", f"atempo={ATEMPO}", "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s16le", tmp_wav],
    check=True,
)

with wave.open(tmp_wav, "rb") as wf:
    raw_bytes = wf.readframes(wf.getnframes())
x = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float64) / 32768.0
os.remove(tmp_wav)

# Scale word timestamps uniformly by ATEMPO
scaled = [{"w": w["w"], "s": w["s"] / ATEMPO, "e": w["e"] / ATEMPO} for w in words]

# Build tightened waveform + exact sample-accurate word timestamps
chunks = []
out_words = []
cur_out_samples = 0

# Keep 0.06 s (~2 frames) lead-in before word 0 ("voice starts at frame 1-4" per STYLE_BIBLE.md)
lead_keep = int(0.06 * SR)
s0_samp = max(0, int(scaled[0]["s"] * SR) - lead_keep)
cur_pos = s0_samp

fade_len = int(0.012 * SR)
fade_out = 0.5 * (1 + np.cos(np.linspace(0, math.pi, fade_len)))
fade_in = 1.0 - fade_out

for idx, w in enumerate(scaled):
    ws = int(round(w["s"] * SR))
    we = int(round(w["e"] * SR))
    # Append audio from cur_pos up to end of this word (plus tiny 45 ms consonant tail if followed by big gap)
    nxt_s = int(round(scaled[idx + 1]["s"] * SR)) if idx + 1 < len(scaled) else len(x)
    gap_s = (nxt_s - we) / SR

    if idx + 1 < len(scaled) and gap_s > 0.20:
        # Keep 55 ms tail after current word + 65 ms lead before next word = 0.12 s crisp pause
        tail = min(int(0.055 * SR), (nxt_s - we) // 2)
        lead = min(int(0.065 * SR), (nxt_s - we) // 2)
        seg = x[cur_pos : we + tail].copy()
        if len(seg) > fade_len:
            seg[-fade_len:] *= fade_out
        new_ws = (cur_out_samples + (ws - cur_pos)) / SR
        new_we = (cur_out_samples + (we - cur_pos)) / SR
        out_words.append({"w": w["w"], "s": round(new_ws, 3), "e": round(new_we, 3)})
        chunks.append(seg)
        cur_out_samples += len(seg)
        # Advance cur_pos to (nxt_s - lead) and fade in its start
        cur_pos = nxt_s - lead
        if cur_pos + fade_len < len(x):
            x[cur_pos : cur_pos + fade_len] *= fade_in
    else:
        end_pos = we if idx + 1 < len(scaled) else min(len(x), we + int(0.08 * SR))
        seg = x[cur_pos:end_pos]
        new_ws = (cur_out_samples + (ws - cur_pos)) / SR
        new_we = (cur_out_samples + (we - cur_pos)) / SR
        out_words.append({"w": w["w"], "s": round(new_ws, 3), "e": round(new_we, 3)})
        chunks.append(seg)
        cur_out_samples += len(seg)
        cur_pos = end_pos

y = np.concatenate(chunks)
# Pad tail by ~0.35 s so video ends cleanly right after the last word ("cows."), snapped to exact 30 fps frame count
raw_dur = len(y) / SR + 0.35
total_frames = int(math.ceil(raw_dur * 30.0))
total_dur = total_frames / 30.0
target_samples = int(round(total_dur * SR))
if len(y) < target_samples:
    y = np.pad(y, (0, target_samples - len(y)))
else:
    y = y[:target_samples]

# Write 24-bit 48 kHz mono WAV (dsp.read_wav supports 24-bit PCM!)
pk = np.max(np.abs(y))
if pk > 0.92:
    y = y * (0.92 / pk)
q = np.clip(np.round(y * 8388607.0), -8388608, 8388607).astype(np.int32)
b = np.empty((len(q), 3), dtype=np.uint8)
b[:, 0] = q & 0xFF
b[:, 1] = (q >> 8) & 0xFF
b[:, 2] = (q >> 16) & 0xFF
with wave.open(out_wav, "wb") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(3)
    wf.setframerate(SR)
    wf.writeframes(b.tobytes())

json.dump(out_words, open(os.path.join(HERE, "words.json"), "w", encoding="utf-8"), indent=2)
print(f"TOTAL_FRAMES={total_frames}  DUR={total_dur:.3f}s  WORDS={len(out_words)}  WPS={len(out_words)/total_dur:.2f}")
# Print sentence boundaries for shot planning
sent = []
for i, w in enumerate(out_words):
    if i == 0 or out_words[i - 1]["w"].endswith((".", "?", "!")) or out_words[i - 1]["w"].endswith(('."', '?"')):
        sent.append((i, w["w"], w["s"], round(w["s"] * 30)))
for idx, (wi, txt, st_t, fr) in enumerate(sent):
    end_w = out_words[sent[idx + 1][0] - 1] if idx + 1 < len(sent) else out_words[-1]
    print(f"S{idx+1:02d}: f={fr:4d}..{round(end_w['e']*30):4d} ({st_t:6.2f}s - {end_w['e']:6.2f}s) | {txt} ... {end_w['w']}")
