# Synthesized sound effects + ambience beds for the P-51 Mustang short (numpy + scipy only), timed frame-accurately
# to timeline.py. Every EVENT is placed at naive + SFX_DB (-6.0 dB) relative to the voice stem's integrated loudness;
# ambience BEDS are measured by integrated loudness and not reduced.
import numpy as np
from dsp import (
    SR, TAU, ns, tt, rng, dbg, lp, hp, bp, peq, pan, st, place, fades, widen,
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


# ================================================================ custom aircraft & campfire synthesizers
def v12_engine(dur, r, f0=68.0, f1=72.0, sputter=False, supercharger=0.0):
    """Piston V12 aircraft engine: harmonic exhaust pulse train + prop wash + optional supercharger turbine whine."""
    n = ns(dur)
    t = np.arange(n) / SR
    f = np.linspace(f0, f1, n) * (1.0 + 0.018 * smooth_noise(n, r, 3.0))
    if sputter:
        # Choking lawnmower misfire AM + irregular RPM sag!
        sag = 0.58 + 0.42 * np.clip(np.sin(TAU * 6.5 * t + 1.8 * smooth_noise(n, r, 4.5)), -0.8, 1.0)
        f *= 0.72 + 0.28 * sag
    ph = phase(f)
    sig = sum((0.9 / (k ** 0.85)) * np.sin(k * ph + (k * 0.4)) for k in range(1, 9))
    sig = bp(sig, 45, 1800, 2)
    if sputter:
        gate = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(TAU * 7.8 * t + 2.2 * smooth_noise(n, r, 6.0))) ** 2
        sig *= gate
        # Backfire exhaust pops
        for pt in np.arange(0.12, dur - 0.1, 0.28):
            jt = pt + r.uniform(-0.05, 0.05)
            if 0 < jt < dur - 0.08:
                pop_t = tt(0.075)
                pop = bp(r.standard_normal(len(pop_t)), 140, 2200, 2) * np.exp(-pop_t / 0.012) * 1.9
                G._place_mono(sig, pop, jt)
    prop = bp(colored(n, r, 0.8), 90, 950, 1) * (0.35 + 0.2 * np.sin(ph * 0.5))
    whine = np.zeros(n)
    if supercharger > 0:
        wf = np.linspace(2150, 3250, n) * (1.0 + 0.008 * smooth_noise(n, r, 2.5))
        whine = np.sin(phase(wf)) * 0.16 * supercharger + np.sin(phase(wf * 1.5)) * 0.06 * supercharger
    return fades(widen(sig * 0.65 + prop + whine, r, 11, 0.55), 0.08, 0.12)


def flyby_doppler(dur, r, peak=0.75, f_hi=155.0, f_lo=68.0, pan_dir=1.0, whine_gain=0.0):
    """High-speed fighter flyby with realistic S-curve Doppler shift + prop tear + air roar."""
    n = ns(dur)
    t = np.arange(n) / SR
    dt = (t - peak) / 0.28
    dop = 1.0 - 0.5 * (1.0 + dt / np.sqrt(1.0 + dt ** 2))  # 1 approaching -> 0 receding
    f = f_lo + (f_hi - f_lo) * dop
    ph = phase(f)
    eng = sum((1.0 / (k ** 0.8)) * np.sin(k * ph) for k in range(1, 11))
    eng = bp(eng, 50, 3400, 2)
    env = np.exp(-((t - peak) / np.where(t < peak, 0.42, 0.55)) ** 2)
    air = G.whoosh(dur, r, peak, 280, 2600, 0.85, 0.35, 0.25)
    whine = np.sin(phase((1800 + 1900 * dop))) * whine_gain * env if whine_gain > 0 else 0.0
    mono = (eng * 0.75 * env + air * 0.9 + whine)
    # Smooth stereo pan sweep across frame
    p_curve = np.clip(((t - peak) / (dur * 0.42)) * pan_dir, -0.9, 0.9)
    ang = (p_curve + 1.0) * (np.pi / 4.0)
    out = np.vstack([mono * np.cos(ang), mono * np.sin(ang)])
    return fades(out, 0.03, 0.08), peak


def camera_shutter(r):
    """Vintage brass F.24 aerial recon camera mechanical click-clack + flash bulb pop."""
    dur = 0.28
    y = np.zeros(ns(dur))
    c1 = modal(0.06, [(2400, 1.0, 0.008), (4800, 0.7, 0.005), (1250, 0.6, 0.012)], r)
    c2 = modal(0.08, [(1950, 0.9, 0.010), (3900, 0.6, 0.006), (920, 0.5, 0.015)], r)
    t_pop = tt(0.12)
    pop = bp(r.standard_normal(len(t_pop)), 500, 6500, 1) * np.exp(-t_pop / 0.015) * 0.55
    G._place_mono(y, c1, 0.0)
    G._place_mono(y, pop, 0.018)
    G._place_mono(y, c2 * 0.85, 0.085)
    return widen(y, r, 7, 0.4)


def cow_moo(r, dur=0.72, f0=132.0):
    """Gentle comedic cartoon dairy cow 'mmmoooo' via nasal + vocal-tract formant resonators."""
    n = ns(dur)
    t = np.arange(n) / SR
    f = f0 * np.interp(t / dur, [0, 0.25, 0.7, 1.0], [0.94, 1.04, 0.98, 0.86]) * (1 + 0.012 * np.sin(TAU * 5.2 * t))
    ph = phase(f)
    glottal = sum((1.0 / (k ** 1.15)) * np.sin(k * ph) for k in range(1, 18))
    # Transition from closed 'mmm' (260 Hz) to open 'ooo' (380 + 780 Hz)
    m_env = np.clip(1.0 - t / 0.16, 0, 1)
    o_env = np.clip((t - 0.08) / 0.14, 0, 1)
    y = bp(glottal, 180, 360, 2) * m_env * 0.8 + (bp(glottal, 300, 520, 2) + 0.55 * bp(glottal, 680, 980, 2)) * o_env
    amp = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.65
    return fades(y * amp, 0.02, 0.08)


def hat_flap(r):
    """Peaked cap whipping off a general's head and rustling into bushes."""
    dur = 0.72
    swish = G.whoosh(0.32, r, 0.08, 450, 2800, 0.7, 0.12, 0.25)
    bush_t = tt(0.38)
    bush = bp(r.standard_normal(len(bush_t)), 900, 7500, 1) * np.exp(-bush_t / 0.14) * (0.6 + 0.4 * np.sin(TAU * 22 * bush_t))
    y = np.zeros(ns(dur))
    G._place_mono(y, swish, 0.0)
    G._place_mono(y, bush * 0.55, 0.30)
    return y


def merlin_drop_clank(r):
    """Heavy V12 engine block dropping onto steel mounts + suspension bounce."""
    dur = 0.95
    t = tt(dur)
    thud = np.exp(-t / 0.085) * np.sin(phase(78 * (1 - 0.28 * t))) * 2.1
    clang = modal(dur, [(420, 1.0, 0.09), (890, 0.8, 0.06), (1640, 0.6, 0.04), (2780, 0.4, 0.025)], r)
    chain = G.rattle(0.42, r, 55, np.exp(-np.linspace(0, 1, ns(0.42)) * 3.0), heavy=True) * 0.65
    squeak = G.creak(0.28, r, 240, 390, G.SMALLMETAL, rough=0.1) * 0.45
    y = thud + clang
    G._place_mono(y, chain, 0.01)
    G._place_mono(y, squeak, 0.14)
    return widen(fades(y, 0.002, 0.08), r, 9, 0.65)


def bellows_puff(r, strong=True):
    """Wooden bellows squeeze: creaking leather accordion + brass nozzle air jet."""
    dur = 0.42 if strong else 0.55
    air = G.whoosh(dur, r, 0.11 if strong else 0.22, 320, 3400 if strong else 1500, 0.9, 0.16, 0.35 if strong else 0.12)
    leather = G.creak(dur * 0.7, r, 85, 145, G.WOOD, rough=0.18) * 0.35
    y = air.copy()
    G._place_mono(y, leather, 0.0)
    return y, (0.11 if strong else 0.22)


def fire_roar_burst(r):
    """Campfire exploding from embers into a warm roaring blaze + crackling sparks."""
    dur = 1.45
    n = ns(dur)
    t = np.arange(n) / SR
    roar = bp(colored(n, r, 1.2), 65, 1100, 2) * np.interp(t, [0, 0.14, 0.55, 1.45], [0.0, 1.0, 0.78, 0.25])
    whoosh_low = np.exp(-t / 0.22) * np.sin(phase(62 * (1 - 0.2 * t))) * 1.1
    sparks = np.zeros(n)
    for _ in range(28):
        st_t = r.uniform(0.04, 1.25)
        sp = hp(r.standard_normal(ns(0.018)), 2800) * np.exp(-tt(0.018) / 0.003) * r.uniform(0.25, 0.85)
        G._place_mono(sparks, sp, st_t)
    return widen(fades(roar + whoosh_low + sparks * 0.6, 0.01, 0.15), r, 12, 0.8), 0.08


def sparrow_cheep(r):
    """Deterministic crisp two-syllable 'cheep-cheep!' for the tiny sparrow inside the open nose."""
    dur = 0.48
    n = ns(dur)
    y = np.zeros(n)
    for t0, f0, f1, sl in [(0.02, 3150.0, 4250.0, 0.11), (0.18, 3350.0, 4550.0, 0.13)]:
        m = ns(sl)
        u = np.linspace(0, 1, m)
        f = f0 + (f1 - f0) * np.sin(np.pi * u) + 180.0 * np.sin(2 * np.pi * 28.0 * u * sl)
        env = np.sin(np.pi * u) ** 1.3
        tone = (np.sin(phase(f)) + 0.28 * np.sin(phase(2.0 * f))) * env
        G._place_mono(y, tone, t0)
    return pan(fades(y, 0.004, 0.03), 0.1), 0.04


def cues():
    C = []
    R = rng(1942)
    rr = lambda: rng(int(R.integers(1 << 30)))
    add = C.append

    # ---- 1. Ambience Beds (integrated LUFS relative to voice, not reduced by -6 dB) ----
    def pasture_bed(dur, seed):
        def g():
            r = rng(seed)
            x = G.breeze(dur, r, 0.9, 0.14, 800)
            x += pan(G.bird_chirps(dur, r, 0.4, "sparrow") * 0.07, 0.45)
            x += pan(G.bird_chirps(dur, r, 0.28, "sparrow") * 0.05, -0.55)
            return fades(x, 0.25, 0.35), 0.0
        return g

    add(Cue(0.0, "amb_hook", "French pasture morning air + sparrows (Shot 1)", pasture_bed(T.FLASH, 101), -29, "bed", send=0.0))
    add(Cue(T.FLASH, "amb_airfield", "California / RAF airfield breeze + open tarmac air (Shots 2-8)",
            pasture_bed(40.25 - T.FLASH, 102), -30, "bed", send=0.0))

    def golden_bed(dur, seed):
        def g():
            r = rng(seed)
            x = G.breeze(dur, r, 0.7, 0.1, 650)
            x += pan(G.bird_chirps(dur, r, 0.3, "blackbird") * 0.05, -0.5)
            x += widen(G.crickets(dur, r, 3) * 0.008, r, 9, 1.0)
            return fades(x, 0.4, 0.4), 0.0
        return g

    add(Cue(40.25, "amb_golden", "golden-hour dusk breeze, blackbird & faint crickets (Shots 9-11)",
            golden_bed(57.40 - 40.25, 103), -29, "bed", send=0.0))

    def bomber_bed():
        r = rng(104)
        dur = 62.05 - 57.40
        # 12 big radial engines droning in tight formation
        d1 = v12_engine(dur, r, 54, 55, sputter=False) * 0.65
        d2 = v12_engine(dur, r, 56.5, 57.2, sputter=False) * 0.55
        return fades(d1 + d2, 0.35, 0.35), 0.0

    add(Cue(57.40, "amb_b17_drone", "three 4-engine B-17 Flying Fortresses droning at 25,000 ft (Shot 12)",
            bomber_bed, -23, "bed", send=0.0))
    add(Cue(62.05, "amb_berlin", "open Berlin terrace breeze + distant city air (Shot 13)",
            pasture_bed(T.DUR - 62.05, 105), -29, "bed", send=0.0))

    # ---- 2. Shot 1 (Hook): Low Recon Pass, Cow Shutter Click & Sputtering Climb ----
    add(Cue(0.05, "allison_hook", "Allison P-51 low pass -> choking sputter as it tries to climb above the clouds",
            lambda: (np.concatenate([v12_engine(3.15, rng(11), 72, 76), v12_engine(1.38, rng(12), 70, 52, sputter=True)], axis=1), 0.0),
            -9, send=0.14, cut=T.FLASH))
    add(Cue(T.T_COW_FLASH1, "recon_click_1", "F.24 brass recon camera shutter click + flash pop ('pictures of cows')",
            lambda: (camera_shutter(rng(13)), 0.0), -5, p=0.15, send=0.08))
    add(Cue(T.T_COW_FLASH1 + 0.14, "cow_moo_1", "startled French dairy cow deadpan 'moo'",
            lambda: (cow_moo(rng(14), 0.68, 134.0), 0.0), -9, p=0.3, send=0.16))
    add(Cue(T.FLASH, "flash_whoosh", "reverse swell + punch into the 4-frame white flash (f=138)",
            lambda: (widen(G.whoosh(0.72, rng(15), 0.32, 480, 4000, 0.9, 0.10, 0.38), rng(16), 11, 0.9), 0.32), -4, send=0.18))

    # ---- 3. Shot 2: 1940 California Prototype Rollout (102 Days!) ----
    for tm in (5.35, 6.25, 7.15):
        add(Cue(tm, "wrench_ratchet", "workshop wrench clink during prototype build",
                (lambda r=rr(): (G.clink(r, r.uniform(2100, 3400), 0.11), 0.0)), -13, p=-0.25, send=0.14))
    add(Cue(10.25, "102_days_cheer", "engineers light proud cheer on '102 days'",
            lambda: (G.applause(1.25, rng(22), 16, np.sin(np.pi * np.linspace(0, 1, ns(1.25)))) * 0.7, 0.0), -12, lpf=4500, send=0.25))

    # ---- 4. Shot 3: Screaming Low Pass & Generals' Hats Blown into Bushes! ----
    add(Cue(T.T_FLYBY, "mustang_low_pass", "Mustang screams low down the runway right past the generals (Doppler sweep)",
            lambda: flyby_doppler(2.1, rng(31), peak=0.85, f_hi=168, f_lo=72, pan_dir=1.0), -1, send=0.16))
    for k in range(3):
        add(Cue(T.T_HATS + k * 0.055, "hat_blow_off", f"general #{k+1}'s peaked cap whips off into the runway bushes",
                (lambda r=rr(): (hat_flap(r), 0.06)), -6, p=0.25 + 0.15 * k, send=0.12))
    add(Cue(T.T_HATS + 0.04, "generals_whoa", "startled generals gasp 'whoa!'",
            lambda: (G.whoa(rng(35), dur=0.42), 0.0), -9, p=0.35, send=0.18))

    # ---- 5. Shot 4: Climb Five Miles Up -> Coughing Like an Old Lawnmower! ----
    add(Cue(16.0, "climb_strain", "Allison V-1710 straining in thin air at 25,000 ft",
            lambda: (v12_engine(3.85, rng(41), 82, 64, sputter=False), 0.0), -11, send=0.15))
    add(Cue(T.T_COUGH - 0.12, "lawnmower_cough", "engine chokes & sputters like an old lawnmower ('coughing like an old lawnmower')",
            lambda: (v12_engine(1.45, rng(42), 62, 46, sputter=True), 0.0), -5, send=0.12))

    # ---- 6. Shot 5: German Bf 109s Wave Overhead -> Muddy French Road Recon ----
    add(Cue(21.62, "bf109_pass_1", "German Bf 109 #1 zooms effortlessly overhead",
            lambda: flyby_doppler(1.25, rng(51), peak=0.52, f_hi=185, f_lo=88, pan_dir=1.0, whine_gain=0.10), -6, send=0.16))
    add(Cue(22.10, "bf109_pass_2", "German Bf 109 #2 banking & waving above",
            lambda: flyby_doppler(1.15, rng(52), peak=0.48, f_hi=195, f_lo=92, pan_dir=0.85, whine_gain=0.10), -7, send=0.16))
    add(Cue(T.fr(700), "cut_mud_road", "hard cut down to muddy French road",
            lambda: (G.whoosh(0.45, rng(53), 0.09, 360, 2100, 0.8, 0.14, 0.16), 0.09), -11, send=0.1))
    add(Cue(T.T_COW_FLASH2, "recon_click_2", "F.24 recon camera click over muddy French road",
            lambda: (camera_shutter(rng(54)), 0.0), -6, p=0.1, send=0.08))

    # ---- 7. Shots 6 & 7: Slickest Laminar Body -> Lungs of a Sparrow! ----
    add(Cue(27.75, "laminar_gleam", "silky laminar-wing air shimmer ('slickest body ever put in the sky')",
            lambda: (G.whoosh(0.85, rng(61), 0.35, 550, 2800, 0.7, 0.28, 0.22), 0.35), -11, send=0.16))
    add(Cue(T.T_SPARROW, "sparrow_chirp", "tiny deadpan sparrow 'chirp-chirp' inside the open Mustang nose!",
            lambda: sparrow_cheep(rng(71)), -8, p=0.1, send=0.10))

    # ---- 8. Shot 8: Ronnie Harker & Rolls-Royce Merlin V12 Hoist Swap! ----
    for k, tm in enumerate([37.95, 38.28, 38.60]):
        add(Cue(tm, "hoist_chain", f"gantry chain ratchet {k+1}/3 lowering the Merlin V12",
                (lambda r=rr(): (G.bolt_strain(r, 0.8, 0.24), 0.0)), -11, p=-0.2, send=0.12))
    add(Cue(T.T_DROP_ENG, "merlin_drop_in", "ROLLS-ROYCE MERLIN V12 CLANKS INTO THE NOSE! Heavy block thud + mount ring",
            lambda: (merlin_drop_clank(rng(82)), 0.0), -1, p=-0.15, send=0.18))

    # ---- 9. Shot 10: Golden-Hour Campfire & Bellows Analogy ----
    add(Cue(T.T_PUFF1, "bellows_lazy_puff", "one weak wheezy bellows puff -> dry smoke hiss ('One lazy puff just makes smoke')",
            lambda: bellows_puff(rng(101), strong=False), -6, p=-0.15, send=0.10))
    add(Cue(T.T_GULP1, "bellows_gulp_1", "big bellows squeeze #1 ('squeeze two big gulps of air in')",
            lambda: bellows_puff(rng(102), strong=True), -5, p=-0.15, send=0.10))
    add(Cue(T.T_GULP2, "bellows_gulp_2", "big bellows squeeze #2 feeding oxygen into the coals",
            lambda: bellows_puff(rng(103), strong=True), -4, p=-0.15, send=0.10))
    add(Cue(T.T_ROAR, "campfire_roars", "CAMPFIRE ROARS TO LIFE! Warm blaze whoosh + crackling sparks",
            lambda: fire_roar_burst(rng(104)), -2, p=0.05, send=0.16))

    # ---- 10. Shot 11: Merlin Two-Stage Supercharger + Meredith Belly-Scoop Jet Push! ----
    add(Cue(50.05, "merlin_supercharger", "sweet Rolls-Royce Merlin V12 purr + rising two-stage supercharger whistle",
            lambda: (v12_engine(7.2, rng(111), 84, 108, sputter=False, supercharger=1.0), 0.0), -10, send=0.15))
    add(Cue(T.T_JET, "meredith_jet_push", "Meredith Effect belly radiator scoop surges into a crisp thermal jet push!",
            lambda: (widen(G.whoosh(0.85, rng(112), 0.14, 240, 3600, 0.95, 0.28, 0.42), rng(113), 10, 0.85), 0.14), -3, send=0.16))

    # ---- 11. Shot 12: 440 mph Escorting B-17 Bombers to Berlin ----
    add(Cue(58.45, "escort_pass", "440 mph P-51D Mustang banking past the B-17 formation",
            lambda: flyby_doppler(1.65, rng(121), peak=0.65, f_hi=178, f_lo=84, pan_dir=-1.0, whine_gain=0.14), -5, send=0.16))

    # ---- 12. Shot 13: Berlin Terrace Payoff — Victory Roar, Dropped Binoculars & Cow Photo! ----
    add(Cue(T.T_BERLIN_PASS, "berlin_mustang_roar", "silver Mustangs scream victoriously over Berlin with signature Merlin whistle!",
            lambda: flyby_doppler(1.9, rng(131), peak=0.72, f_hi=184, f_lo=78, pan_dir=1.0, whine_gain=0.18), -2, send=0.18))
    add(Cue(T.T_BERLIN_PASS + 0.48, "binoculars_drop", "Göring's dropped binoculars clatter onto the stone terrace",
            lambda: (np.concatenate([G.clink(rng(132), 1850, 0.14), G.clink(rng(133), 2350, 0.12) * 0.55]), 0.0), -9, p=-0.1, send=0.20))
    add(Cue(T.fr(1978), "whoosh_cow_photo", "smooth camera push-in to the framed cow recon photo on the desk",
            lambda: (G.whoosh(0.55, rng(134), 0.12, 340, 1900, 0.8, 0.16, 0.14), 0.12), -11, send=0.12))
    add(Cue(67.52, "cow_punchline_moo", "soft deadpan cow 'moo' button right after 'photograph cows'",
            lambda: (cow_moo(rng(135), 0.52, 128.0), 0.0), -10, p=0.15, send=0.18))

    # Subtle crossfade air transitions
    for f_xf, desc in [(955, "crossfade to RAF Duxford"), (1208, "crossfade to golden thin air"),
                       (1289, "crossfade to campfire clearing"), (1492, "crossfade to Merlin sky"), (1722, "crossfade to B-17 formation")]:
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
