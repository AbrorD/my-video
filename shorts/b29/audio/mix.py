# Final BS.1770-4 mix for the Boeing B-29 Superfortress short ("The Bomber Whose Engines Were Made of Fireworks"):
#   - Voice (shorts/b29/voice/voice.wav): gain only (no EQ, no compression, no pitch shift)
#   - Music (music.py): +3 dB music standard, ducked -3.0 dB under spoken words from words.json
#   - SFX (sfx.py): -6 dB event standard relative to voice stem
#   - Master: -15.0 LUFS integrated, 4x-oversampled look-ahead limiter <= -1.2 dBTP, 68.167 s / 48 kHz / 24-bit stereo.
import os, sys, time, subprocess
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../mustang/audio")))

import numpy as np
from scipy import ndimage, signal
from dsp import (SR, ns, st, dbg, read_wav, write_wav, integrated, momentary, short_term, lra, true_peak, fades)
import timeline as T

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CACHE = os.path.join(HERE, "_cache")
N = ns(T.DUR)
TARGET_LUFS = -15.0
CEIL_DBTP = -1.2
DUCK_DB = -3.0

MUSIC_TARGET = {
    "hook": -9.5,
    "rollout": -10.5,
    "flare": -10.5,
    "soup": -11.5,
    "baffle": -10.0,
    "soviet": -11.0,
}

DIPS = [
    (4.35, 5.25, -2.5),    # "...made out of fireworks."
    (30.00, 30.92, -2.0),  # "...giant roadside flare."
    (46.80, 47.80, -2.0),  # "...straight down inside."
    (66.10, 67.80, -2.5),  # "...Boeing worker made in Seattle."
]

_s = lambda i: T.shot_t(i)
REPORT = [
    ("hook (1)", 0.0, _s(1)[1]),
    ("rollout+tunnel (2-3)", _s(2)[0], _s(3)[1]),
    ("magnesium flare (4-5)", _s(4)[0], _s(5)[1]),
    ("fourth of july (6-7)", _s(6)[0], _s(7)[1]),
    ("soup spoon (8-9)", _s(8)[0], _s(9)[1]),
    ("baffles+fleet (10-11)", _s(10)[0], _s(11)[1]),
    ("soviet clone (12)", _s(12)[0], T.DUR),
]


def log(*a):
    print(f"[{time.strftime('%H:%M:%S')}]", *a, flush=True)


def load_voice():
    x, sr = read_wav(os.path.join(ROOT, "voice", "voice.wav"))
    assert sr == SR, sr
    v = x[0] if x.shape[0] == 1 else x.mean(0)
    out = np.zeros(N)
    out[: min(N, len(v))] = v[:N]
    return st(out)


def speech_spans(words, merge=0.3):
    sp = []
    for w in words:
        s, e = float(w["s"]), float(w["e"])
        if sp and s - sp[-1][1] < merge:
            sp[-1][1] = max(sp[-1][1], e)
        else:
            sp.append([s, e])
    return sp


def duck_db(spans, depth=DUCK_DB, pre=0.08, post=0.12, att=0.07, rel=0.45):
    ctrl = 1000
    nc = int(T.DUR * ctrl) + 2
    va = np.zeros(nc)
    for s, e in spans:
        va[max(0, int((s - pre) * ctrl)): int((e + post) * ctrl)] = 1.0
    ka, kr = 1 - np.exp(-1 / (att * ctrl)), 1 - np.exp(-1 / (rel * ctrl))
    env = np.zeros(nc)
    e = 0.0
    for i in range(nc):
        tgt = va[i]
        e += (tgt - e) * (ka if tgt > e else kr)
        env[i] = e
    return np.interp(np.arange(N) / SR, np.arange(nc) / ctrl, depth * env)


def section_db(m_ducked, v):
    import music
    secs = music.SECTIONS
    gains = {}
    for name, a, b in secs:
        if name == "dropout":
            continue
        seg = slice(ns(a), ns(b))
        Lm, Lv = integrated(m_ducked[:, seg]), integrated(v[:, seg])
        gains[name] = (Lv + MUSIC_TARGET[name] - Lm) if np.isfinite(Lm) else 0.0
    gains["dropout"] = gains["flare"]
    curve = np.zeros(N)
    t = np.arange(N) / SR
    for name, a, _b in secs:
        curve[t >= a] = gains[name]
    sm = ndimage.uniform_filter1d(curve, ns(0.4), mode="nearest")
    hard = np.zeros(N, bool)
    for tb in (T.FLASH, 36.85):
        hard[ns(tb - 0.25): ns(tb + 0.25)] = True
    curve = np.where(hard, curve, sm)
    for a, b, db in DIPS:
        d = np.zeros(N)
        d[ns(a): ns(b)] = db
        curve += ndimage.uniform_filter1d(d, ns(0.06), mode="nearest")
    return curve, gains


def limiter(x, ceil_db=CEIL_DBTP, look=0.003, rel=0.08):
    c = dbg(ceil_db)
    n = x.shape[1]
    up = np.abs(signal.resample_poly(x, 4, 1, axis=-1)).max(0)
    pk = np.pad(up, (0, max(0, 4 * n - len(up))))[: 4 * n].reshape(n, 4).max(1)
    gr = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    La = max(1, ns(look))
    g1 = ndimage.minimum_filter1d(gr, 2 * La + 1, mode="nearest")
    g2 = g1.copy()
    idx = np.flatnonzero(g1 < 1.0)
    if len(idx):
        kr = 1 - np.exp(-1 / (rel * SR))
        gap = ns(rel * 8)
        brk = np.flatnonzero(np.diff(idx) > gap)
        starts = np.concatenate([[idx[0]], idx[brk + 1]])
        ends = np.concatenate([idx[brk], [idx[-1]]])
        for a, b_ in zip(starts, ends):
            e = min(n, b_ + gap)
            seg = g1[a:e]
            out = np.empty(len(seg))
            g = 1.0
            for k in range(len(seg)):
                g = min(seg[k], g + (1 - g) * kr)
                out[k] = g
            g2[a:e] = out
    g3 = ndimage.uniform_filter1d(g2, 2 * La + 1, mode="nearest")
    g3 = np.minimum(g3, 1.0)
    return x * g3[None, :], g3


def lufs(x):
    v = integrated(x)
    return v if np.isfinite(v) else -99.0


def section_table(v, m, s, words):
    Mv, Mb = momentary(v), momentary(m + s)
    tc = np.arange(len(Mv)) * 0.01 + 0.2
    speak = np.zeros(len(tc), bool)
    for w in words:
        speak |= (tc >= float(w["s"]) + 0.03) & (tc <= float(w["e"]) - 0.03)
    speak &= Mv > lufs(v) - 10
    rows = []
    for name, a, b in REPORT:
        seg = slice(ns(a), ns(b))
        Lv, Lm, Ls, Lb = lufs(v[:, seg]), lufs(m[:, seg]), lufs(s[:, seg]), lufs(m[:, seg] + s[:, seg])
        k = speak & (tc >= a) & (tc < b) & np.isfinite(Mb) & (Mb > -70)
        p10 = float(np.percentile(Mv[k] - Mb[k], 10)) if k.sum() > 5 else float("nan")
        med = float(np.median(Mv[k] - Mb[k])) if k.sum() > 5 else float("nan")
        rows.append((name, a, b, Lv, Lm, Ls, Lb, Lv - Lb, p10, med))
    return rows


def ffmpeg_ebur(path):
    try:
        r = subprocess.run(
            ["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
            capture_output=True, text=True, timeout=300
        )
        txt = r.stderr
        i = txt.rfind("Summary:")
        if i < 0:
            return txt[-1500:]
        out = []
        for line in txt[i:].splitlines():
            out.append(line.rstrip())
            if line.strip().startswith("Peak:"):
                break
        return "\n".join(l for l in out if l)
    except Exception as e:
        return f"ffmpeg check failed: {e}"


def write_cues(C, st_, rows, eb, v_ref, G):
    vI = v_ref + G
    L = [
        "# Boeing B-29 Superfortress Short - Synthesized Soundtrack Cue Sheet",
        "",
        f"- Master Integrated: **{st_['I']:.1f} LUFS**, True Peak: **{st_['TP']:.1f} dBTP**, LRA: {st_['LRA']:.1f} LU",
        f"- Stems: voice {st_['voice_I']:.1f} LUFS, music {st_['music_I']:.1f} LUFS, sfx {st_['sfx_I']:.1f} LUFS",
        "",
        "```",
        eb,
        "```",
        "",
        "| section (shots) | time s | voice | music | sfx | bed | margin LU | speech median LU | speech p10 LU |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    f = lambda x: "-" if x <= -98 else f"{x:.1f}"
    for r in rows:
        L.append(f"| {r[0]} | {r[1]:.2f}-{r[2]:.2f} | {f(r[3])} | {f(r[4])} | {f(r[5])} | {f(r[6])} | {r[7]:.1f} | {r[9]:.1f} | {r[8]:.1f} |")
    L += ["", "## SFX Events", "| # | time s | frame | cue | desc | applied LU | mix LUFS |", "|---|---|---|---|---|---|---|"]
    for i, c in enumerate(sorted(C, key=lambda c: (c.t, c.name))):
        meas = c.measured if c.measured is not None else c.applied
        L.append(f"| {i + 1} | {c.t:.3f} | {c.t * T.FPS:.1f} | {c.name} | {c.desc} | {c.applied:+.1f} | {vI + meas:.1f} |")
    with open(os.path.join(HERE, "cues.md"), "w", encoding="utf-8") as fh:
        fh.write("\n".join(L))


def main():
    t_start = time.time()
    words = T.words(os.path.join(ROOT, "voice", "words.json"))
    spans = speech_spans(words)
    v = load_voice()
    v_ref = integrated(v)
    log(f"voice: {v_ref:.2f} LUFS (as stereo), TP {true_peak(v):.2f} dBTP")

    import music
    b = music.build()
    m_raw = music.render(b, ref=-20.0)[0]
    log("music rendered", f"{lufs(m_raw):.2f} LUFS raw")
    dk = duck_db(spans)
    m_d = m_raw * dbg(dk)[None, :]
    sec_curve, sec_gains = section_db(m_d, v)
    m = m_d * dbg(sec_curve)[None, :]
    end = ns(T.DUR - 0.03)
    m[:, end:] *= np.linspace(1, 0, N - end)[None, :]

    import sfx
    s_st, C = sfx.render(v_ref)
    log("sfx rendered", f"{lufs(s_st):.2f} LUFS")

    mix0 = v + m + s_st
    G = TARGET_LUFS - lufs(mix0)
    for it in range(5):
        y, g3 = limiter(mix0 * dbg(G))
        L = lufs(y)
        log(f"master iter {it}: gain {G:+.2f} dB -> {L:.2f} LUFS, TP {true_peak(y):.2f} dBTP, max GR {-20 * np.log10(g3.min()):.2f} dB")
        if abs(L - TARGET_LUFS) < 0.02:
            break
        G += TARGET_LUFS - L
    y = fades(y, 0.0, 0.03)
    assert y.shape == (2, N)
    gv, gm, gs = v * dbg(G), m * dbg(G), s_st * dbg(G)
    write_wav(os.path.join(HERE, "mix.wav"), y)
    write_wav(os.path.join(HERE, "stem_voice.wav"), gv)
    write_wav(os.path.join(HERE, "stem_music.wav"), gm)
    write_wav(os.path.join(HERE, "stem_sfx.wav"), gs)
    log("wrote mix.wav + stems")

    I, TP, LRA = lufs(y), true_peak(y), lra(y)
    rows = section_table(gv, gm, gs, words)
    eb = ffmpeg_ebur(os.path.join(HERE, "mix.wav"))
    stats = dict(I=I, TP=TP, LRA=LRA, voice_I=lufs(gv), music_I=lufs(gm), sfx_I=lufs(gs), sec_gains=sec_gains)
    for r in rows:
        log(f"{r[0]:<22} voice {r[3]:6.1f}  music {r[4]:6.1f}  sfx {r[5]:6.1f}  bed {r[6]:6.1f}  margin {r[7]:5.1f}  speech med {r[9]:5.1f} p10 {r[8]:5.1f}")
    print(eb)
    write_cues(C, stats, rows, eb, v_ref, G)
    log(f"done in {time.time() - t_start:.0f} s")


if __name__ == "__main__":
    main()
