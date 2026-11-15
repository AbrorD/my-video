# Synthesized sound effects + ambience beds for the Boeing B-29 Superfortress short, reusing dsp.py & sfx_gen.py
# from shorts/mustang/audio/ and timed frame-accurately to timeline.py.
import os, sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../mustang/audio")))

import numpy as np
from dsp import (
    SR, TAU, ns, tt, rng, dbg, lp, hp, bp, pan, place, fades, widen,
    make_ir, convolve_st, momentary_max, integrated, colored, smooth_noise, phase, modal
)
import sfx_gen as G
import timeline as T

N = ns(T.DUR)
SFX_DB = -6.0


class Cue:
    def __init__(self, t, name, desc, gen, naive, kind="event", p=0.0, extra=0.0, lpf=None, send=0.12, group=None, cut=None):
        self.t, self.name, self.desc, self.gen, self.naive = t, name, desc, gen, naive
        self.kind, self.p, self.extra, self.lpf, self.send, self.cut = kind, p, extra, lpf, send, cut
        self.group = group or name
        self.applied = naive + (SFX_DB if kind == "event" else 0.0) + extra
        self.measured = None


def radial_r3350(dur, r, f0=62.0, f1=66.0, strain=False):
    """Twin-row 18-cylinder Wright R-3350 Duplex-Cyclone radial bomber drone + prop beat."""
    n = ns(dur)
    t = np.arange(n) / SR
    f = np.linspace(f0, f1, n) * (1.0 + 0.015 * smooth_noise(n, r, 3.0))
    if strain:
        f *= 0.85 + 0.15 * np.sin(TAU * 5.5 * t)
    ph = phase(f)
    sig = sum((0.95 / (k ** 0.82)) * np.sin(k * ph + k * 0.3) for k in range(1, 10))
    sig = bp(sig, 40, 1750, 2)
    prop = bp(colored(n, r, 0.8), 80, 900, 1) * (0.38 + 0.22 * np.sin(ph * 0.5))
    return fades(widen(sig * 0.68 + prop, r, 11, 0.6), 0.08, 0.12)


def magnesium_flare_sizzle(r, dur=1.25):
    """Blinding white-hot magnesium engine fire: high-energy flare hiss, crackle sparks & low ignition whoosh."""
    n = ns(dur)
    t = np.arange(n) / SR
    whoosh_low = np.exp(-t / 0.18) * np.sin(phase(72 * (1 - 0.25 * t))) * 1.3
    sizzle = bp(r.standard_normal(n), 1400, 9500, 1) * np.interp(t, [0, 0.06, 0.45, dur], [0, 1.0, 0.82, 0.2]) * 0.75
    roar = bp(colored(n, r, 1.1), 120, 1400, 2) * np.interp(t, [0, 0.08, 0.6, dur], [0, 0.9, 0.7, 0.2])
    sparks = np.zeros(n)
    for _ in range(34):
        st_t = r.uniform(0.02, dur - 0.05)
        sp = hp(r.standard_normal(ns(0.015)), 3200) * np.exp(-tt(0.015) / 0.0025) * r.uniform(0.35, 1.0)
        G._place_mono(sparks, sp, st_t)
    return widen(fades(whoosh_low + sizzle + roar + sparks * 0.7, 0.006, 0.12), r, 10, 0.85), 0.05


def firework_pop_whistle(r):
    """Cheeky Fourth-of-July bottle-rocket whistle + festive pop-crackle on 'Fourth of July'."""
    dur = 0.78
    n = ns(dur)
    y = np.zeros(n)
    u = np.linspace(0, 1, ns(0.34))
    wh = np.sin(phase(1450 + 2100 * (u ** 1.4))) * np.sin(np.pi * u) * 0.55
    G._place_mono(y, wh, 0.0)
    t_pop = tt(0.18)
    pop = bp(r.standard_normal(len(t_pop)), 320, 5800, 1) * np.exp(-t_pop / 0.014) * 1.4
    G._place_mono(y, pop, 0.33)
    for _ in range(16):
        st_t = r.uniform(0.38, 0.72)
        cr = hp(r.standard_normal(ns(0.014)), 3000) * np.exp(-tt(0.014) / 0.002) * r.uniform(0.3, 0.75)
        G._place_mono(y, cr, st_t)
    return widen(fades(y, 0.004, 0.05), r, 8, 0.75), 0.33


def cash_register_ching(r):
    """Crisp metallic bell 'ka-ching!' on 'three billion dollars'."""
    dur = 0.52
    bell = modal(dur, [(2640, 1.0, 0.16), (5280, 0.65, 0.11), (3960, 0.45, 0.08)], r)
    drawer = G.clink(r, 1450, 0.09) * 0.5
    y = bell.copy()
    G._place_mono(y, drawer, 0.0)
    return widen(fades(y, 0.002, 0.06), r, 7, 0.5), 0.01


def soup_blow(r, scooped=False):
    """Breath puff across boiling soup bowl: flat steamy skim vs crisp spoon-scooped swirl."""
    dur = 0.52 if scooped else 0.58
    air = G.whoosh(dur, r, 0.14 if scooped else 0.22, 360, 3200 if scooped else 1600, 0.85, 0.18, 0.32 if scooped else 0.15)
    if scooped:
        chime = modal(0.35, [(1980, 0.45, 0.09), (2970, 0.35, 0.07)], r)
        G._place_mono(air, chime, 0.08)
    return widen(fades(air, 0.01, 0.08), r, 8, 0.6), (0.14 if scooped else 0.22)


def baffle_bolt_clank(r):
    """Crisp aluminum baffle plate clink + pneumatic wrench ratchet into B-29 nacelle."""
    dur = 0.68
    clang = modal(dur, [(620, 1.0, 0.07), (1380, 0.8, 0.05), (2420, 0.55, 0.035)], r)
    ratchet = G.rattle(0.34, r, 65, np.exp(-np.linspace(0, 1, ns(0.34)) * 2.5), heavy=False) * 0.6
    y = clang.copy()
    G._place_mono(y, ratchet, 0.04)
    return widen(fades(y, 0.002, 0.06), r, 8, 0.6), 0.02


def drill_whir_pop(r):
    """Short comedic hand-drill 'zzzz-plink!' for the accidental Seattle factory rivet hole."""
    dur = 0.48
    n = ns(0.28)
    u = np.linspace(0, 1, n)
    whir = np.sin(phase(680 + 920 * u)) * np.sin(np.pi * u) * 0.55
    plink = modal(0.22, [(3100, 0.9, 0.04), (4650, 0.6, 0.025)], r)
    y = np.zeros(ns(dur))
    G._place_mono(y, whir, 0.0)
    G._place_mono(y, plink, 0.24)
    return pan(fades(y, 0.004, 0.04), 0.15), 0.04


def cues():
    C = []
    R = rng(1944)
    rr = lambda: rng(int(R.integers(1 << 30)))
    add = C.append

    # ---- 1. Ambience Beds ----
    def airfield_bed(dur, seed):
        def g():
            r = rng(seed)
            x = G.breeze(dur, r, 0.85, 0.13, 780)
            x += pan(G.bird_chirps(dur, r, 0.35, "sparrow") * 0.06, 0.45)
            x += pan(G.bird_chirps(dur, r, 0.25, "sparrow") * 0.05, -0.5)
            return fades(x, 0.25, 0.35), 0.0
        return g

    add(Cue(0.0, "amb_hook", "airfield morning air (Shot 1)", airfield_bed(T.FLASH, 201), -29, "bed", send=0.0))
    add(Cue(T.FLASH, "amb_boeing", "1943 Boeing tarmac & pressurized bomber air (Shots 2-7)",
            airfield_bed(36.85 - T.FLASH, 202), -30, "bed", send=0.0))

    def golden_bed(dur, seed):
        def g():
            r = rng(seed)
            x = G.breeze(dur, r, 0.7, 0.1, 650)
            x += pan(G.bird_chirps(dur, r, 0.3, "blackbird") * 0.05, -0.5)
            x += widen(G.crickets(dur, r, 3) * 0.008, r, 9, 1.0)
            return fades(x, 0.4, 0.4), 0.0
        return g

    add(Cue(36.85, "amb_golden", "golden-hour dusk breeze & park air (Shots 8-9)",
            golden_bed(47.85 - 36.85, 203), -29, "bed", send=0.0))
    add(Cue(47.85, "amb_pacific", "high-altitude B-29 formation radial drone (Shots 10-11)",
            lambda: (radial_r3350(60.15 - 47.85, rng(204), 56, 58) * 0.55, 0.0), -25, "bed", send=0.0))
    add(Cue(60.15, "amb_soviet", "Soviet airfield apron breeze (Shot 12)",
            airfield_bed(T.DUR - 60.15, 205), -29, "bed", send=0.0))

    # ---- 2. Shot 1 (Hook): $3B Wonder-Bomber & Magnesium Firework Sparks ----
    add(Cue(0.06, "b29_hook_drone", "B-29 four Wright R-3350 radial engines banking low",
            lambda: (radial_r3350(4.8, rng(11), 64, 68), 0.0), -10, send=0.14, cut=T.FLASH))
    add(Cue(T.T_DOLLARS, "three_billion_ching", "cash register bell ching on 'three billion dollars'",
            lambda: cash_register_ching(rng(12)), -6, p=-0.2, send=0.12))
    add(Cue(T.T_HOOK_SPARKS, "hook_firework_sparks", "engine nacelle erupts in magnesium firework sparks ('made out of fireworks')",
            lambda: magnesium_flare_sizzle(rng(13), 0.85), -3, p=0.2, send=0.16, cut=T.FLASH))
    add(Cue(T.FLASH, "flash_whoosh", "reverse swell + punch into 4-frame white flash (f=159)",
            lambda: (widen(G.whoosh(0.72, rng(15), 0.32, 480, 4000, 0.9, 0.10, 0.38), rng(16), 11, 0.9), 0.32), -4, send=0.18))

    # ---- 3. Shot 2: 1943 Boeing B-29 Rollout ----
    add(Cue(T.T_ROLLOUT, "rollout_cheer", "proud engineers applause on B-29 Superfortress rollout",
            lambda: (G.applause(1.2, rng(22), 16, np.sin(np.pi * np.linspace(0, 1, ns(1.2)))) * 0.7, 0.0), -12, lpf=4500, send=0.24))

    # ---- 4. Shot 3: Warm Pressurized Cabin & Cozy Metal Tunnel ----
    add(Cue(13.05, "shiver_wind", "icy high-altitude wind gust on 'freeze in fleece jackets'",
            lambda: (G.whoosh(0.65, rng(31), 0.25, 420, 2600, 0.8, 0.2, 0.2), 0.25), -10, p=-0.35, send=0.14))
    add(Cue(T.T_TUNNEL, "tunnel_scoot", "hollow metallic tube scoot as crewman crawls through pressurized tunnel",
            lambda: (np.concatenate([G.clink(rng(32), 920, 0.12), G.clink(rng(33), 1180, 0.12) * 0.8]), 0.0), -9, p=0.15, send=0.18))

    # ---- 5. Shot 4: Crammed Engines into Tight Cowlings & Magnesium ----
    for k, tm in enumerate([T.T_CRAM, T.T_CRAM + 0.45, 23.30]):
        add(Cue(tm, "cowl_clamp", f"tight cowling metal clamp & magnesium tap {k+1}/3",
                (lambda r=rr(): (G.clink(r, r.uniform(1900, 3100), 0.11), 0.0)), -11, p=-0.15 + 0.15 * k, send=0.14))

    # ---- 6. Shot 5: Heavy Climb & Roadside Flare Magnesium Engine Fire! ----
    add(Cue(25.20, "climb_strain", "four R-3350 radials straining under heavy bomb load",
            lambda: (radial_r3350(3.2, rng(51), 68, 56, strain=True), 0.0), -10, send=0.14))
    add(Cue(T.T_FLARE, "magnesium_flare_roar", "MAGNESIUM ENGINE BLOCK IGNITES LIKE A ROADSIDE FLARE!",
            lambda: magnesium_flare_sizzle(rng(52), 1.45), -2, p=0.15, send=0.18))

    # ---- 7. Shots 6 & 7: High Wing Glory -> Fourth of July Firework Pop! ----
    add(Cue(31.40, "high_sky_gleam", "smooth stratospheric air shimmer ('fly higher than almost any fighter')",
            lambda: (G.whoosh(0.85, rng(61), 0.35, 520, 2700, 0.7, 0.28, 0.2), 0.35), -11, send=0.16))
    add(Cue(T.T_JULY, "fourth_of_july_pop", "deadpan Fourth-of-July bottle rocket whistle + festive firework pop!",
            lambda: firework_pop_whistle(rng(71)), -4, p=0.1, send=0.14))

    # ---- 8. Shot 9: Boiling Soup & Angled Spoon Analogy ----
    add(Cue(T.T_PUFF_FLAT, "soup_flat_puff", "flat breath puff skimming uselessly across the top of the soup bowl",
            lambda: soup_blow(rng(91), scooped=False), -6, p=-0.15, send=0.10))
    add(Cue(T.T_SPOON, "spoon_angle_clink", "silver spoon angled into bowl rim ('angle a spoon')",
            lambda: (G.clink(rng(92), 2650, 0.12), 0.0), -8, p=0.1, send=0.12))
    add(Cue(T.T_SCOOP, "soup_scoop_breeze", "angled spoon scoops cool breeze straight down to the bottom of the bowl!",
            lambda: soup_blow(rng(93), scooped=True), -3, p=0.1, send=0.14))

    # ---- 9. Shot 10: Curved Metal Baffles & Cool Rear Cylinders ----
    add(Cue(T.T_BAFFLE, "baffle_bolt_in", "mechanics bolt curved aluminum baffles & cowl vents into nacelle!",
            lambda: baffle_bolt_clank(rng(101)), -2, p=-0.1, send=0.16))
    add(Cue(T.T_COOL_FLOW, "cool_air_scoop", "crisp high-altitude air swooshing cleanly around rear cylinders",
            lambda: (widen(G.whoosh(0.9, rng(102), 0.22, 320, 3400, 0.9, 0.24, 0.36), rng(103), 10, 0.8), 0.22), -4, send=0.16))

    # ---- 10. Shot 11: Silver Superfortresses Over the Pacific ----
    add(Cue(T.T_SUPER_PASS, "superfortress_pass", "fleet of silver B-29 Superfortresses roaring past in formation",
            lambda: (widen(G.whoosh(1.2, rng(111), 0.45, 180, 2200, 0.85, 0.35, 0.32), rng(112), 11, 0.85), 0.45), -5, send=0.16))

    # ---- 11. Shot 12: Stalin's Bolt-for-Bolt Copy & Accidental Seattle Drill Hole ----
    add(Cue(T.T_BOLT_COPY, "bolt_for_bolt_stamp", "double metallic bolt ratchet on 'copy the bomber bolt for bolt'",
            lambda: baffle_bolt_clank(rng(121)), -5, p=-0.15, send=0.15))
    add(Cue(T.T_PATCH_DING, "patch_glint_ding", "bright inspection ding on 'tiny patch'",
            lambda: (G.clink(rng(122), 3200, 0.14), 0.0), -7, p=0.2, send=0.14))
    add(Cue(T.T_DRILL_END, "seattle_drill_hole", "comedic hand-drill 'zzzz-plink!' on 'accidental drill hole a Boeing worker made in Seattle'",
            lambda: drill_whir_pop(rng(123)), -5, p=0.15, send=0.14))

    for f_xf, desc in [(753, "crossfade to heavy climb"), (1104, "crossfade to golden stratosphere"),
                       (1210, "crossfade to soup bowl park"), (1435, "crossfade to baffle fix"),
                       (1640, "crossfade to Pacific fleet"), (1804, "crossfade to Soviet Tu-4")]:
        add(Cue(T.fr(f_xf), "whoosh_xfade", desc,
                (lambda r=rr(): (G.whoosh(0.7, r, 0.28, 300, 1550, 0.9, 0.20, 0.1), 0.28)), -13, send=0.14))

    return C


def render(v_ref, on_event=None):
    C = cues()
    out = np.zeros((2, N))
    send = np.zeros(N)
    for c in C:
        x, anchor = c.gen()
        x = np.asarray(x, float)
        x = pan(x, c.p) if x.ndim == 1 else x
        if c.cut is not None:
            k = ns(c.cut - (c.t - anchor))
            if 0 < k < x.shape[1]:
                x = fades(x[:, :k], 0.0, 0.02)
        tgt = v_ref + c.applied
        cur = momentary_max(x) if c.kind == "event" else integrated(x)
        if np.isfinite(cur):
            x = x * dbg(tgt - cur)
        if c.lpf:
            x = lp(x, c.lpf, 1)
        c.measured = momentary_max(x) - v_ref if c.kind == "event" else integrated(x) - v_ref
        t0 = c.t - anchor
        place(out, x, t0)
        if on_event:
            on_event(c, x, t0)
        if c.send > 0:
            G._place_mono(send, c.send * x.mean(0), t0)
    valley = make_ir(1.05, 77, pre=0.01, hf=1.6, early=[(0.08, 0.42, -0.5), (0.14, 0.28, 0.6), (0.22, 0.18, -0.2)])
    out += 0.52 * convolve_st(send, valley)
    out = hp(out, 25, 2)
    end = ns(T.DUR - 0.12)
    out[:, end:] *= np.linspace(1, 0, N - end)[None, :] ** 2
    return out, C
