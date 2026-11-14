# Merge the look sandboxes back into the main short folder, by owned files.
# Backs up main first (backup/<name>_<time>/), copies each sandbox's owned files, reports which owned files are
# missing or unchanged.
# Usage: python scripts/bridge_merge.py [cam,world,mat,char,post] [--name bridge] [--root .]
import argparse, filecmp, os, shutil, time

parser = argparse.ArgumentParser()
parser.add_argument("boxes", nargs="?", default="")
parser.add_argument("--name", default=os.environ.get("SHORT_NAME", "bridge"))
parser.add_argument("--root", default=os.environ.get("REMOTION_ROOT", os.getcwd()))
args = parser.parse_args()

ROOT = os.path.abspath(os.path.expanduser(args.root))
NAME = args.name
MAIN = os.path.join(ROOT, "src", "videos", NAME)

tsx_files = [f for f in os.listdir(MAIN) if f.endswith(".tsx")] if os.path.isdir(MAIN) else ["Bridge.tsx"]
OWN = {
    "cam": ["story.ts"],
    "world": ["world.ts", "lights.ts", "shade.ts", "grade.ts"],
    "mat": ["paint.ts", "build.ts"],
    "char": ["toon.ts", "cast.ts", "cardshade.ts"],
    "post": ["ink.ts", "lensblur.ts", *tsx_files],
}

which = [b for b in args.boxes.split(",") if b] if args.boxes else list(OWN)
bak = os.path.join(ROOT, "backup", time.strftime(f"{NAME}_%Y%m%d_%H%M%S"))
os.makedirs(os.path.dirname(bak), exist_ok=True)
shutil.copytree(MAIN, bak)
print("backup ->", bak)
for box in which:
    src = os.path.join(ROOT, "src", "videos", f"{NAME}_{box}")
    for f in OWN[box]:
        a, b = os.path.join(src, f), os.path.join(MAIN, f)
        if not os.path.exists(a):
            print(f"  {box}: {f} not in sandbox (skipped)")
            continue
        if os.path.exists(b) and filecmp.cmp(a, b, shallow=False):
            print(f"  {box}: {f} unchanged")
            continue
        shutil.copy2(a, b)
        print(f"  {box}: {f} -> main")
