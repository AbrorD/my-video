# Writes out/<name>/shots.json (shot frame ranges, crossfade windows, flash) from story.ts for scripts/short_qa.py.
# Usage: python scripts/bridge_shots.py [src/videos/<name>/story.ts] [out/<name>/shots.json]
import json, os, re, sys

story_path = sys.argv[1] if len(sys.argv) > 1 else "src/videos/bridge/story.ts"
out_path = sys.argv[2] if len(sys.argv) > 2 else "out/bridge/shots.json"

src = open(story_path, encoding="utf-8").read()
total_m = re.search(r"TOTAL\s*=\s*(\d+)", src)
total = int(total_m.group(1)) if total_m else 0
shots = [
    {"id": int(i), "a": int(a), "b": int(b) if b != "TOTAL" else total}
    for i, a, b in re.findall(r"\{\s*id:\s*(\d+),\s*a:\s*(\d+),\s*b:\s*(\w+),", src)
]
xf_m = re.search(r"XFADE[^=]*=\s*\{([^}]*)\}", src)
xf = {int(k): int(v) for k, v in re.findall(r"(\d+):\s*(\d+)", xf_m.group(1))} if xf_m else {}
flash_m = re.search(r"FLASH_AT\s*=\s*(\d+)", src)
flash = int(flash_m.group(1)) if flash_m else None
xfade = [[s["a"] - xf[s["id"]] // 2, s["a"] + xf[s["id"]] // 2] for s in shots if s["id"] in xf]
# planned hard cuts inside shots, and 7-frame flip kicks
cuts = [[int(f), int(f)] for f in re.findall(r"\{\s*f:\s*(\d+),\s*cut:\s*true", src)]
consts = {k: float(v) for k, v in re.findall(r"(?:const|export const)\s+(\w+)\s*=\s*([\d.]+)", src)}
kicks = []
m = re.search(r"const KICKS[^=]*=\s*\[(.*?)\];", src, re.S)
if m:
    for t0, _ in re.findall(r"\[([\w.]+),\s*([\d.]+)\]", m.group(1)):
        f0 = round((consts[t0] if t0 in consts else float(t0)) * 30)
        kicks.append([f0, f0 + 8])

if os.path.dirname(out_path):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
payload = {"shots": shots, "xfade": xfade, "planned": cuts + kicks}
if flash is not None:
    payload["flash"] = [flash, flash + 4]
json.dump(payload, open(out_path, "w", encoding="utf-8"), indent=1)
print(len(shots), "shots", xfade, flash, "cuts", [c[0] for c in cuts], "kicks", kicks, "->", out_path)
