# Project State: Cartoon 3D Short — North American P-51 Mustang

- **Skill Aktif**: `cartoon-3d-short` (`.agent/skills/cartoon-3d-short/SKILL.md`)
- **Nama Proyek Short**: `mustang` (`MustangShort`, base `1080x1920` -> final 2K `1440x2560` @ 30 fps, `2043` frame = `68.100 s`)
- **Tahap Saat Ini**: **Tahap 9 & 10 (Verifikasi Stills, Render Final 2K & QA)**
- **Progres Selesai**:
  - **Tahap 1 & 2 (Riset & Naskah)**: Disetujui user (`shorts/mustang/SCRIPT.md`, Bahasa Inggris, 8 beat cerita).
  - **Tahap 3 (Voiceover & Word Timings)**: `shorts/mustang/voice/voice.wav` (`68.100 s`, 48 kHz 24-bit) & `shorts/mustang/voice/words.json` (`275` kata).
  - **Tahap 4–7 (3D World, 2D Cast & Post-Processing)**:
    - Seluruh modul `src/videos/mustang/` selesai (`Mustang.tsx`, `story.ts`, `aircraft.ts`, `build.ts`, `toon.ts`, `cast.ts`, `world.ts`, `lights.ts`, `shade.ts`, `cardshade.ts`, `ink.ts`, `lensblur.ts`, `grade.ts`, `paint.ts`).
    - `three` & `@types/three` dikunci ke `0.182.0` untuk kompatibilitas mulus dengan `@react-three/fiber` v9 (bebas warning `THREE.Clock` r183+), dan `PostEffectComposer` dirender sinkron di `useFrame` tanpa async mount lag.
  - **Tahap 8 (Synthesized Audio & LUFS Mix)**:
    - `shorts/mustang/audio/mix.wav` selesai disintesis & dimaster ke **-15.0 LUFS** integrated, **-1.2 dBTP** true peak (`shorts/mustang/audio/cues.md`).
- **Tahap Berikutnya**:
  - Verifikasi 7 still revisi (`out/mustang/r_*.jpg`) + side-by-side sheet (`out/mustang/sbs.jpg`), render video 2K `1440x2560` (`out/mustang/video.mp4`), mux audio ke `out/mustang/final.mp4`, dan jalankan `scripts/short_qa.py`.
