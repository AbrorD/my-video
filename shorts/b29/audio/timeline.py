# Picture timeline mirrored from src/videos/b29/story.ts so every synthesized SFX cue and musical hit lands
# frame-accurately on 2045 frames = 68.167 s @ 30 fps.
import json

FPS = 30
TOTAL = 2045
DUR = TOTAL / FPS  # 68.166667 s
fr = lambda f: f / FPS

FLASH = fr(159)          # 5.300 s: 4-frame white flash after hook
T_DOLLARS = 1.80         # f=54: "three billion dollars"
T_HOOK_SPARKS = 4.70     # f=141: magnesium firework sparks on "fireworks"
T_ROLLOUT = 6.90         # f=207: Boeing rolls out the B-29 Superfortress
T_TUNNEL = 16.65         # f=500: crawl from nose to tail through a cozy metal tunnel
T_CRAM = 20.85           # f=625: crammed four massive engines into tight cowlings
T_FLARE = 28.35          # f=851: ignite the magnesium block like a giant roadside flare
T_JULY = 36.05           # f=1082: celebrating the Fourth of July
T_PUFF_FLAT = 42.80      # f=1284: "A flat puff just skims the surface"
T_SPOON = 45.67          # f=1370: "until you angle a spoon"
T_SCOOP = 46.35          # f=1391: "to scoop the breeze straight down inside"
T_BAFFLE = 48.30         # f=1449: "Mechanics bolted curved metal baffles"
T_COOL_FLOW = 51.35      # f=1541: "scooping cold sky air right around the rear cylinders"
T_SUPER_PASS = 55.65     # f=1670: "fleets of silver Superfortresses ruled the Pacific"
T_BOLT_COPY = 62.00      # f=1860: "copy the bomber bolt for bolt"
T_PATCH_DING = 64.60     # f=1938: "with a tiny patch over the exact same accidental drill hole"
T_DRILL_END = 66.10      # f=1983: "accidental drill hole a Boeing worker made in Seattle"

SHOTS = {
    1: (0, 159, "day", "hook_fireworks"),
    2: (159, 362, "day", "rollout_1943"),
    3: (362, 564, "day", "pressurized_tunnel"),
    4: (564, 753, "day", "tight_cowling_magnesium"),
    5: (753, 929, "day", "climb_flare_fire"),
    6: (929, 1028, "day", "high_wing_glory"),
    7: (1028, 1104, "day", "fourth_of_july"),
    8: (1104, 1210, "golden", "thin_air_golden"),
    9: (1210, 1435, "golden", "soup_spoon_analogy"),
    10: (1435, 1640, "day", "baffle_cowl_fix"),
    11: (1640, 1804, "day", "pacific_to_vladivostok"),
    12: (1804, TOTAL, "day", "soviet_drill_hole_payoff"),
}
XFADE = {5: 6, 8: 8, 9: 8, 10: 8, 11: 8, 12: 8}


def shot_t(i):
    a, b = SHOTS[i][:2]
    return fr(a), fr(b)


def shot_at(t):
    f = t * FPS
    for i, (a, b, *_r) in SHOTS.items():
        if a <= f < b:
            return i
    return 12


def words(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)
