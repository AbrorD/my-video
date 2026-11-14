# Picture timeline mirrored from src/videos/mustang/story.ts so every synthesized SFX cue and musical hit lands
# frame-accurately on 2043 frames = 68.100 s @ 30 fps.
import json

FPS = 30
TOTAL = 2043
DUR = TOTAL / FPS  # 68.100 s exactly
fr = lambda f: f / FPS

FLASH = fr(138)          # 4.600 s: 4-frame white flash after hook
T_COW_FLASH1 = fr(75)    # 2.500 s: "taking pictures of cows"
T_FLYBY = 12.85          # f=385: screaming low pass down the runway
T_HATS = 14.18           # f=425: generals' hats blow into the bushes
T_COUGH = 20.02          # f=601: Allison engine coughs like an old lawnmower
T_COW_FLASH2 = fr(793)   # 26.433 s: muddy French road recon flash
T_SPARROW = fr(935)      # 31.167 s: sparrow chirp inside open engine bay
T_BOLT = 37.35           # f=1120: Ronnie Harker shouts "Bolt!"
T_DROP_ENG = 38.98       # f=1169: Rolls-Royce Merlin V12 drops into Mustang nose
T_PUFF1 = 45.82          # f=1375: "One lazy puff just makes smoke"
T_GULP1 = 47.32          # f=1420: bellows squeeze 1
T_GULP2 = 47.85          # f=1435: bellows squeeze 2
T_ROAR = 48.92           # f=1468: "and the fire roars!"
T_JET = 56.88            # f=1706: "into a tiny jet push"
T_BERLIN_PASS = 63.08    # f=1892: silver Mustangs roar over Berlin terrace

SHOTS = {
    1: (0, 138, "day", "hook_pasture"),
    2: (138, 351, "day", "rollout_1940"),
    3: (351, 474, "day", "low_pass_hats"),
    4: (474, 638, "day", "climb_cough"),
    5: (638, 829, "day", "bf109_and_mud"),
    6: (829, 906, "day", "slick_body"),
    7: (906, 955, "day", "sparrow_lungs"),
    8: (955, 1208, "day", "harker_merlin"),
    9: (1208, 1289, "golden", "thin_air_golden"),
    10: (1289, 1492, "golden", "campfire_bellows"),
    11: (1492, 1722, "golden", "merlin_jet_scoop"),
    12: (1722, 1861, "day", "bomber_escort"),
    13: (1861, TOTAL, "day", "berlin_payoff"),
}
XFADE = {4: 6, 8: 8, 9: 8, 10: 8, 11: 8, 12: 8, 13: 8}


def shot_t(i):
    a, b = SHOTS[i][:2]
    return fr(a), fr(b)


def shot_at(t):
    f = t * FPS
    for i, (a, b, *_r) in SHOTS.items():
        if a <= f < b:
            return i
    return 13


def words(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)
