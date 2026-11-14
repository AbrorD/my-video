# Original comedic-to-heroic military aviation march for the P-51 Mustang short (Bb major, 120 bpm), synthesized
# from scratch via instruments.py and locked to timeline.py (68.100 s).
import numpy as np
from dsp import SR, ns, rng, pan, place, dbg, make_ir, convolve_st, integrated, lp, hp
import instruments as I
import timeline as T

N = ns(T.DUR)
Q = 0.5  # quarter note = 0.5 s (120 bpm)

THEME = [
    (1, 0, 1, 82), (1, 1, .75, 82), (1, 1.75, .25, 84), (1, 2, 1, 86), (1, 3, 1, 82),
    (2, 0, 1, 77), (2, 1, .5, 79), (2, 1.5, .5, 81), (2, 2, 1, 82), (2, 3.5, .5, 77),
    (3, 0, .75, 79), (3, .75, .25, 81), (3, 1, .5, 82), (3, 1.5, .5, 79), (3, 2, 1, 87), (3, 3, .5, 86), (3, 3.5, .5, 84),
    (4, 0, 2, 84), (4, 3.5, .5, 77),
    (5, 0, 1, 82), (5, 1, .75, 82), (5, 1.75, .25, 84), (5, 2, 1, 86), (5, 3, 1, 89),
    (6, 0, .5, 87), (6, .5, .5, 86), (6, 1, .5, 84), (6, 1.5, .5, 82), (6, 2, 1, 81), (6, 3, .5, 82), (6, 3.5, .5, 84),
    (7, 0, .75, 86), (7, .75, .25, 84), (7, 1, .5, 82), (7, 1.5, .5, 81), (7, 2, 1, 79), (7, 3, 1, 84),
    (8, 0, 1, 82), (8, 1, .5, 77), (8, 1.5, .5, 74), (8, 2, 1, 70),
]
CHB = {
    1: ["Bb"] * 4, 2: ["F", "F", "Bb", "Bb"], 3: ["Cm", "Cm", "Eb", "Eb"], 4: ["F7"] * 4,
    5: ["Bb"] * 4, 6: ["Eb", "Eb", "F", "F"], 7: ["Gm", "Gm", "Cm", "F7"], 8: ["Bb"] * 4,
}
CH = {
    "Bb": dict(oom=(34, 41), pah=[53, 58, 62], hi=[58, 62, 65]),
    "F": dict(oom=(41, 36), pah=[53, 57, 60], hi=[57, 60, 65]),
    "F7": dict(oom=(41, 36), pah=[51, 57, 60], hi=[57, 60, 63]),
    "Cm": dict(oom=(36, 43), pah=[55, 60, 63], hi=[60, 63, 67]),
    "Eb": dict(oom=(39, 46), pah=[55, 58, 63], hi=[58, 63, 67]),
    "Gm": dict(oom=(43, 38), pah=[55, 58, 62], hi=[58, 62, 67]),
}
F = I.m2f

# Music sections locked to Mustang story beats ("dropout" = deadpan silence on "Unluckily, it had the lungs of a sparrow")
SECTIONS = [
    ("hook", 0.0, T.FLASH),
    ("rollout", T.FLASH, 11.70),
    ("flyby", 11.70, 15.80),
    ("cough", 15.80, 30.22),
    ("dropout", 30.22, 32.10),
    ("duxford", 32.10, 40.27),
    ("campfire", 40.27, 49.73),
    ("merlin", 49.73, 62.03),
    ("berlin", 62.03, T.DUR),
]


def swingb(b):
    fl = np.floor(b)
    fr_ = b - fl
    return fl + (2 / 3 if fr_ in (0.5, 0.75) else (1 / 3 if fr_ == 0.25 else fr_))


def theme(t_bar1, bars=range(1, 9), transpose=0, swing=False, late=0.0):
    ev = []
    for (b, beat, d, m) in THEME:
        if b not in bars:
            continue
        bb = swingb(beat) if swing else beat
        ev.append((t_bar1 + (b - 1) * 4 * Q + bb * Q + late, d * Q, m + transpose))
    return sorted(ev)


class Band:
    def __init__(self):
        self.tr = {}
        self.send = {}
        self.cues = []

    def track(self, name, send):
        if name not in self.tr:
            self.tr[name] = np.zeros((2, N))
            self.send[name] = send
        return self.tr[name]

    def add(self, name, x, t, p=0.0, g=1.0, send=0.15):
        buf = self.track(name, send)
        place(buf, pan(x, p) if np.ndim(x) == 1 else x, t, g)


R = rng(1940)
_r = lambda: rng(int(R.integers(1 << 30)))

SN = {
    "light": [1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 2, 0, 1, 1],
    "march": [3, 0, 1, 1, 2, 0, 1, 0, 3, 0, 1, 1, 2, 0, 1, 0],
    "drive": [2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1],
}


def oompah(b, t_bar, chords, vel=0.6, every=True, pah_vel=0.4, bounce=False):
    for beat in range(4):
        c = CH[chords[beat]]
        t = t_bar + beat * Q
        if bounce:
            lo = c["oom"][0] if c["oom"][0] >= 36 else c["oom"][0] + 12
            b.add("tuba", I.brass(F(lo), 0.2, vel, _r(), "tuba", scoop=-30), t, -0.1)
            b.add("tuba", I.brass(F(lo + 12), 0.16, vel * 0.85, _r(), "tuba", scoop=-45), t + Q / 2, -0.1)
        elif every or beat in (0, 2):
            m = c["oom"][beat % 2] if every else c["oom"][0 if beat == 0 else 1]
            b.add("tuba", I.brass(F(m), 0.3, vel * (1.0 if beat in (0, 2) else 0.88), _r(), "tuba"), t, -0.1)
        if every:
            for k, m in enumerate(c["pah"]):
                b.add("pah", I.brass(F(m), 0.15, pah_vel, _r(), "horn", scoop=-12), t + Q / 2 + 0.004 * k, 0.32 - 0.12 * k)
        elif beat in (1, 3):
            for k, m in enumerate(c["pah"]):
                b.add("pah", I.brass(F(m), 0.17, pah_vel, _r(), "horn", scoop=-12), t + 0.004 * k, 0.32 - 0.12 * k)


def snare_bar(b, t_bar, pat, vel, steps=range(16), cres=0.0):
    for s in steps:
        v = SN[pat][s]
        if not v:
            continue
        t = t_bar + s * Q / 4
        vv = vel * (1 + cres * s / 16) * {1: 0.5, 2: 0.9, 3: 0.95}[v] * R.uniform(0.93, 1.05)
        if v == 3:
            b.add("snare", I.snare(vv * 0.4, _r()), t - 0.026, 0.05)
        b.add("snare", I.snare(vv, _r()), t + R.normal(0, 0.002), 0.05)


def roll(b, t0, t1, v0, v1, accent=None, at=None):
    for t, v in I.snare_roll(t0, t1, v0, v1, _r()):
        b.add("snare", I.snare(v, _r(), dur=0.14, buzz=True), t, 0.05)
    if accent:
        at = t1 if at is None else at
        b.add("snare", I.snare(accent * 0.4, _r()), at - 0.026, 0.05)
        b.add("snare", I.snare(accent, _r()), at, 0.05)


def melody(b, name, notes, vel, transpose=0, fn="glock", p=0.0, gate=0.9):
    for (t, d, m) in notes:
        m = m + transpose
        if fn == "glock":
            x = I.glock(F(m), vel * R.uniform(0.92, 1.05), _r())
        elif fn == "fife":
            x = I.fife(F(m), d * gate, vel * R.uniform(0.94, 1.04), _r())
        elif fn == "vibes":
            x = I.vibes(F(m), vel * R.uniform(0.92, 1.05), _r(), dur=max(1.2, d + 0.8), damp=d + 0.35)
        elif fn == "musicbox":
            x = I.musicbox(F(m), vel * R.uniform(0.92, 1.05), _r())
        b.add(name, x, t, p)


def chorus(b, name, notes, voices, seed, falters=None, spread=0.75, vel=1.0, solo_gain=1.0):
    rr = rng(seed)
    for v in range(voices):
        rv = rng(seed * 101 + v)
        nv = [(t, d, m, vel * rv.uniform(0.85, 1.0)) for (t, d, m) in notes]
        if not nv:
            continue
        fal = (falters[v], -rv.uniform(1.5, 3.4)) if falters else None
        t0, y = I.whistle(
            nv, rv, detune=rv.uniform(-11, 11) if v else 0.0, jit=0.010,
            lag=rv.uniform(0, 0.022) if v else 0.0, vib_rate=rv.uniform(5.0, 6.6),
            vib_depth=rv.uniform(10, 22), breath=rv.uniform(0.04, 0.07), falter=fal
        )
        g = solo_gain if v == 0 else rv.uniform(0.45, 0.8)
        p = 0.0 if v == 0 else spread * rr.uniform(-1, 1)
        if v:
            y = lp(y, rv.uniform(5000, 9000), 1)
        b.add(name, y, t0, p, g)


def build():
    b = Band()
    for name, send in [
        ("whistle", 0.0), ("fife", 0.16), ("glock", 0.22), ("tuba", 0.10), ("pah", 0.18), ("snare", 0.13),
        ("cymbal", 0.16), ("stab", 0.16), ("timpani", 0.18), ("pad", 0.25), ("vibes", 0.26), ("musicbox", 0.26),
        ("pluck", 0.18), ("brush", 0.12), ("triangle", 0.25),
    ]:
        b.track(name, send)

    # ==== 1. HOOK (0.00 - 4.60 s): brisk fife + whistlers + snare roll into flash button stab at f=138! ====
    h = [n for n in theme(0.0, bars=[1, 2]) if n[0] < 4.2]
    chorus(b, "whistle", h, 6, 11)
    melody(b, "glock", h, 0.48, 12, "glock", -0.35)
    for bar in (1, 2):
        tb = (bar - 1) * 2.0
        oompah(b, tb, CHB[bar], 0.65, True, 0.40)
        snare_bar(b, tb, "march", 0.58, steps=range(16) if bar == 1 else range(8))
    roll(b, 3.1, 4.54, 0.22, 0.62)
    b.add("cymbal", I.cymbal(0.42, _r()), 0.0, 0.0)
    hook_cut = np.ones(N)
    a, z = ns(T.FLASH - 0.03), ns(T.FLASH + 0.015)
    hook_cut[a:z] = np.linspace(1, 0, z - a)
    hook_cut[z:] = 0
    for k in b.tr:
        b.tr[k] *= hook_cut[None, :]
    for m in [46, 53, 58, 62, 65]:
        b.add("stab", I.brass(F(m), 0.2, 0.8, _r(), "stab", scoop=-15), T.FLASH, (m - 56) / 20)
    b.add("tuba", I.brass(F(34), 0.25, 0.8, _r(), "tuba"), T.FLASH, -0.1)
    b.add("cymbal", I.cymbal(0.38, _r(), dur=1.2), T.FLASH, 0.0)
    b.cues.append((0.0, "hook: brisk aviation march + whistlers; snare fill into Bb button stab on white flash (4.60 s)"))

    # ==== 2. ROLLOUT & FLYBY (5.00 - 15.80 s): 1940 California workshop march -> brassy low-pass buzz ====
    roll(b, 4.72, 4.98, 0.14, 0.48, accent=0.52, at=5.0)
    r_notes = [n for n in theme(5.0, bars=range(1, 6)) if n[0] < 15.6]
    melody(b, "glock", r_notes, 0.44, 12, "glock", -0.35)
    melody(b, "fife", r_notes, 0.50, 0, "fife", 0.25)
    for bar in range(1, 6):
        tb = 5.0 + (bar - 1) * 2.0
        if tb >= 15.4:
            break
        oompah(b, tb, CHB[((bar - 1) % 8) + 1], 0.56 if tb < 11.7 else 0.68, tb >= 11.7, 0.38)
        snare_bar(b, tb, "light" if tb < 11.7 else "march", 0.42 if tb < 11.7 else 0.58)
    b.cues.append((5.0, "1940 California build & rollout: cheerful fife + glockenspiel + light snare"))
    b.cues.append((11.70, "full brass march as Mustang buzzes the runway & blows generals' hats off"))

    # ==== 3. CLIMB, COUGH & SLICK BODY (16.00 - 30.22 s): whistling climb falters at T_COUGH, dead stop at 30.22 s! ====
    c_notes = [n for n in theme(16.0, bars=[1, 2, 3]) if n[0] < 21.0]
    falters = [20.15, 20.02, 20.22, 20.08, 20.28, 20.12]
    chorus(b, "whistle", c_notes, 6, 44, falters=falters, spread=0.75, solo_gain=0.95)
    for bar in (1, 2):
        tb = 16.0 + (bar - 1) * 2.0
        oompah(b, tb, CHB[bar], 0.58, True, 0.38)
        snare_bar(b, tb, "march", 0.48)
    # Comedic plodding tuba + pizzicato under French mud road & "slickest body" (21.5 - 30.1 s), then DEAD STOP at 30.20 s!
    s_notes = [n for n in theme(22.0, bars=[5, 6, 7, 8]) if n[0] < 30.0]
    melody(b, "fife", s_notes, 0.44, 0, "fife", 0.2)
    melody(b, "glock", [n for n in s_notes if n[0] >= 27.6], 0.48, 12, "glock", -0.3)
    for k, tb in enumerate([22.0, 24.0, 26.0, 28.0]):
        oompah(b, tb, CHB[5 + k], 0.52, False, 0.32, bounce=(tb < 27.0))
        snare_bar(b, tb, "light", 0.36)
    stop = np.ones(N)
    sa = ns(30.18)
    stop[sa:sa + ns(0.02)] = np.linspace(1, 0, ns(0.02))
    stop[sa + ns(0.02):] = 0
    for k in b.tr:
        b.tr[k] *= stop[None, :]
    b.cues.append((20.02, "whistlers droop & falter right on 'coughing like an old lawnmower'"))
    b.cues.append((30.20, "DEAD STOP on 'Unluckily...' so 'the lungs of a sparrow' + sparrow chirp land in pure silence!"))

    # ==== 4. RAF DUXFORD SWAP (32.10 - 40.27 s): driving workshop build -> brass fanfare on Merlin V12 drop! ====
    for k, tb in enumerate([32.2, 34.2, 36.2]):
        oompah(b, tb, CHB[1 + k], 0.52 + 0.05 * k, True, 0.36 + 0.04 * k)
        snare_bar(b, tb, "drive" if k == 2 else "light", 0.42 + 0.08 * k, cres=0.35 if k == 2 else 0.0)
    roll(b, 38.1, T.T_DROP_ENG - 0.02, 0.30, 0.78)
    for m in [46, 53, 58, 62, 65, 70]:
        b.add("stab", I.brass(F(m), 0.32, 0.82, _r(), "stab", scoop=-10), T.T_DROP_ENG, (m - 58) / 22)
    b.add("timpani", I.timpani(F(46), 0.80, _r()), T.T_DROP_ENG, -0.1)
    b.add("cymbal", I.cymbal(0.35, _r(), dur=1.4), T.T_DROP_ENG, 0.0)
    b.cues.append((32.20, "RAF Duxford workshop build under Ronnie Harker -> snare roll into Merlin drop"))
    b.cues.append((T.T_DROP_ENG, "triumphant Bb brass + timpani stab as the Rolls-Royce Merlin V12 drops into the nose!"))

    # ==== 5. GOLDEN HOUR & CAMPFIRE BELLOWS (40.30 - 49.73 s): warm pad + vibes + music-box on bellows gulps ====
    chords = [
        (40.35, 43.0, [46, 58, 62, 65]),
        (43.0, 46.2, [46, 55, 63, 67]),
        (46.2, 48.88, [41, 57, 60, 63]),
        (48.88, 49.75, [46, 58, 62, 65]),
    ]
    for (ta, tb_, ms) in chords:
        b.add("pad", I.pad([F(m) for m in ms], tb_ - ta, 0.52, _r(), att=0.35, rel=0.5), ta, 0.0)
    for tm, m in [(41.0, 86), (42.2, 84), (43.6, 82), (45.0, 79), (T.T_PUFF1, 77)]:
        b.add("vibes", I.vibes(F(m), 0.45, _r(), dur=1.3, damp=0.7), tm, -0.22)
    # Music-box climbs on the two big bellows gulps -> bright triumphant bloom on T_ROAR!
    for tm, ms in [(T.T_GULP1, [82, 86, 89]), (T.T_GULP2, [86, 89, 94])]:
        for j, m in enumerate(ms):
            b.add("musicbox", I.musicbox(F(m), 0.62, _r()), tm + j * 0.12, 0.2)
        b.add("pluck", I.pluck(F(46), 0.75, _r(), dur=0.8), tm, -0.05)
    for m in [58, 62, 65, 70]:
        b.add("vibes", I.vibes(F(m), 0.55, _r(), dur=1.2, damp=0.8), T.T_ROAR, 0.15)
    b.add("triangle", I.triangle(0.38, _r()), T.T_ROAR, 0.3)
    b.cues.append((40.35, "warm golden-hour pad + vibraphone; music-box arpeggios locked to bellows gulps -> bloom on 'fire roars!'"))

    # ==== 6. MERLIN SUPERCHARGER & BOMBER ESCORT (49.80 - 62.03 s): heroic airborne march! ====
    m2 = [n for n in theme(50.0, bars=range(1, 7)) if n[0] < 61.8]
    chorus(b, "whistle", [n for n in m2 if n[0] >= 57.4], 7, 77, spread=0.75, vel=0.9, solo_gain=0.9)
    melody(b, "fife", m2, 0.54, 0, "fife", 0.25)
    melody(b, "glock", m2, 0.46, 12, "glock", -0.35)
    b.add("cymbal", I.cymbal(0.38, _r()), 57.44, 0.0)
    for bar in range(1, 7):
        tb = 50.0 + (bar - 1) * 2.0
        if tb >= 61.6:
            break
        heroic = tb >= 57.0
        oompah(b, tb, CHB[bar], 0.54 if not heroic else 0.68, heroic, 0.36 if not heroic else 0.46)
        snare_bar(b, tb, "light" if not heroic else "march", 0.38 if not heroic else 0.58)
    b.cues.append((50.0, "Merlin supercharger & Meredith scoop build -> full heroic march + whistlers at 440 mph escorting B-17s!"))

    # ==== 7. BERLIN TERRACE PAYOFF (62.05 - 68.10 s): cheeky swung jazz-march coda ending on 'photograph cows'! ====
    tn = [n for n in theme(62.1, bars=[1, 2, 3], swing=True, late=0.02) if n[0] < 67.3]
    tn += [(67.35, 0.45, 70)]
    melody(b, "vibes", tn, 0.60, 0, "vibes", -0.25)
    walk = [46, 50, 53, 50, 41, 45, 46, 48, 46, 41, 46, 34]
    for k, m in enumerate(walk):
        wt = 62.1 + k * Q
        if wt < 67.7:
            b.add("pluck", I.pluck(F(m), 0.85, _r(), dur=0.8), wt, -0.05)
            b.add("brush", I.brush(0.50 if k % 2 else 0.34, _r(), dur=0.40, swish=True), wt - 0.04, 0.1)
    for mm in [58, 62, 65, 70]:
        b.add("vibes", I.vibes(F(mm), 0.36, _r(), dur=0.65, damp=None, trem_depth=0.25), 67.45, 0.2)
    b.add("triangle", I.triangle(0.28, _r(), dur=0.5), 67.45, 0.3)
    b.cues.append((62.10, "cheeky swung vibraphone + walking bass + brushes over Göring & cow photo punchline; final Bb button at 67.45 s"))

    end = np.ones(N)
    ea = ns(67.85)
    end[ea:] = np.linspace(1, 0, N - ea) ** 1.5
    for k in b.tr:
        b.tr[k] *= end[None, :]
    return b


TARGET = {
    "whistle": 0.0, "fife": -3.0, "glock": -6.0, "tuba": -2.5, "pah": -7.5, "snare": -5.5, "cymbal": -11.0,
    "stab": -3.0, "timpani": -5.0, "pad": -3.5, "vibes": -2.0, "musicbox": -1.5, "pluck": -4.0, "brush": -13.0, "triangle": -15.0,
}


def render(b, ref=-20.0):
    hall = make_ir(1.4, 7, pre=0.018, hf=1.4)
    yard = make_ir(0.85, 8, pre=0.008, hf=1.8, early=[(0.11, 0.5, -0.4), (0.19, 0.35, 0.5)])
    dry = np.zeros((2, N))
    wet_hall = np.zeros((2, N))
    wet_yard = np.zeros((2, N))
    levels = {}
    for k, x in b.tr.items():
        if not np.any(x):
            continue
        L = integrated(x)
        g = dbg(ref + TARGET.get(k, -6) - L)
        levels[k] = (round(L, 1), round(ref + TARGET.get(k, -6), 1))
        x = x * g
        b.tr[k] = x
        dry += x
        if k == "whistle":
            wet_yard += 0.16 * x
        else:
            wet_hall += b.send[k] * x
    out = dry + 0.7 * convolve_st(wet_hall.mean(0), hall) + 0.8 * convolve_st(wet_yard.mean(0), yard)
    out = hp(out, 30, 2)
    return out, levels
