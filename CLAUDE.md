# CLAUDE.md — Instructions for building Hum

You are building **Hum**, a personal creative archive app for a composer / musician / sound designer.

## Core concept

One app to capture any creative moment — hummed melody, lyric, dream, idea, field recording, photo reference — and organize it with metadata, tags, and projects. Speed of capture is the #1 priority. Everything else is secondary.

## Architecture

### Current state: single-file PWA prototype

The app is a single `hum.html` file. No framework, no build step, no backend. This is intentional — it keeps deployment trivial (one file on GitHub Pages = done) and removes all friction.

### Data model

All data lives in `localStorage` under two keys:

```
hum_entries — array of entry objects
hum_projects — array of project objects
```

**Entry:**
```json
{
  "id": "m1abc",
  "ts": 1714400000000,
  "type": "audio|text|idea|dream|photo|video|midi",
  "name": "Main theme sketch",
  "project": "project_id or null",
  "note": "free text",
  "tags": ["melody", "drone"],
  "bpm": 120,
  "key": "C min",
  "mood": "dark",
  "genre": "ambient",
  "status": "raw|dev|done|archived",
  "duration": 47,
  "data": "base64 data URL for audio/photo (null for text entries)",
  "mimeType": "audio/webm"
}
```

**Project:**
```json
{
  "id": "p1xyz",
  "name": "Dream Symphony",
  "desc": "Atmospheric album",
  "color": "#9580a8",
  "template": "composition|album|collab|sounddesign|diary|free",
  "ts": 1714400000000
}
```

### File structure (target — when we split from single file)

```
hum/
  index.html          — shell, loads app
  app.js              — main application logic
  styles.css          — all styles
  sw.js               — service worker for offline
  manifest.json       — PWA manifest
  icons/              — app icons (SVG + PNG)
  lib/
    db.js             — localStorage wrapper, import/export
    recorder.js       — MediaRecorder wrapper
    whisper.js        — Whisper API integration (future)
    midi.js           — basic-pitch + MIDI export (future)
    sync.js           — cloud sync (future)
```

Don't split yet. Keep single file until explicitly told to split.

## Design system

### Fonts
- **Newsreader** (serif) — titles, headings, brand. Regular weight 400–600. NOT italic.
- **Geist** (sans) — all UI text, labels, buttons. Weights 300–500.

### Colors (CSS variables)
```css
--paper: #faf7f2    /* main bg */
--paper2: #f3eee5   /* sidebar, inputs */
--paper3: #ebe5d9   /* heatmap bg, hover */
--paper4: #e0d9c9   /* borders */
--ink: #2a2622      /* primary text */
--ink2: #6a635a     /* secondary text */
--ink3: #a8a195     /* tertiary / labels */
--ink4: #d2ccbf     /* faint borders */
--warm: #e8a87c     /* primary accent — capture button */
--warm2: #d68f5e    /* accent hover */
--rose: #c47878     /* recording state, audio waveforms */
--sage: #88a896     /* success, green tones */
--plum: #9580a8     /* dreams */
--sky: #7fa0c0      /* photos, info */
```

### Design principles
- Light, warm, papery feel. No dark mode yet.
- Minimal borders, soft shadows. White cards on cream background.
- Rounded corners (12–26px).
- The capture button is the hero — warm peach orb with subtle breathing animation. First thing the eye hits.
- Icons are thin-stroke SVG (1.5px stroke, no fill).
- No emoji in UI. Icons only.
- Type pills use muted pastel backgrounds per entry type.

## Features — current

1. **Capture button** — one tap starts audio recording via MediaRecorder API. Stop → save modal.
2. **Quick text** — textarea, Enter saves. Opens save modal.
3. **Save modal** — title (optional), type, project, BPM, key, mood, tags, note, status, genre. All optional except type.
4. **Projects** — create with name, description, color, template. Entries can be assigned to a project.
5. **Tags** — freeform, typed with space/enter/comma separation.
6. **Grid view** — cards in responsive grid.
7. **Stream view** — chronological list grouped by day. Good for diary.
8. **Heatmap calendar** — 12-week activity map in sidebar. Click a day to filter.
9. **Detail panel** — slides from right, shows full entry with audio player.
10. **Export** — per-entry TXT, MD, JSON, audio download.
11. **Search** — full-text across name, note, tags.
12. **Mobile** — responsive, sidebar as overlay with backdrop, touch-friendly.
13. **PWA** — inline manifest, service worker, installable.

## Features — next (build in this order)

### Phase 1: Audio transcription
- Add Whisper API integration (OpenAI API).
- After recording stops, send audio to Whisper, get transcript.
- Save transcript in entry as `entry.transcript`.
- Show transcript in detail panel below audio player.
- Make transcript searchable.
- User must provide their own OpenAI API key (store in localStorage, settings modal).

### Phase 2: Audio → MIDI
- Integrate basic-pitch (Spotify, open source) via ONNX/WASM.
- After recording, run pitch detection on audio.
- Generate MIDI data from detected notes.
- Show simple piano roll visualization in detail panel.
- Export as .mid file using midi-writer-js (load from CDN).
- This is CPU-intensive — show progress, run in Web Worker if possible.

### Phase 3: Better export
- Export entire project as ZIP (all entries + metadata as JSON + audio files).
- MusicXML export from MIDI data.
- PDF export of text entries.
- Drag-and-drop project folder into DAW.

### Phase 4: Cloud sync
- File System Access API to read/write a local folder.
- Folder structure:
  ```
  HumVault/
    projects/
      dream-symphony/
        project.json
        captures/
          2026-04-28_14-32_main-theme.webm
          2026-04-28_14-32_main-theme.json
    inbox/
    _index.json
  ```
- Sync = write to folder. User puts folder in iCloud/Drive/Dropbox.
- App reads from folder on startup, writes on save.
- No server. No accounts. Files are the database.

### Phase 5: AI layer
- Claude API for auto-tagging, mood detection, genre detection.
- Semantic search via embeddings.
- "Related captures" suggestions.
- Weekly digest: "what you captured this week."
- User provides their own Anthropic API key.

### Phase 6: Polish
- Real audio waveform rendering (AnalyserNode, not decorative).
- Smooth transitions and micro-animations.
- Sound design: soft tick on record start, gentle confirm on save.
- Haptic feedback on mobile (navigator.vibrate).
- Dark mode.
- Keyboard shortcuts.
- Undo delete.

## Rules for Claude Code

1. **Keep it a single HTML file** until I say otherwise.
2. **No frameworks.** No React, no Vue, no Svelte. Vanilla JS.
3. **No build tools.** No npm, no webpack, no vite.
4. **External libraries** are OK via CDN only (e.g., midi-writer-js, basic-pitch WASM).
5. **Don't break existing features** when adding new ones.
6. **localStorage is the database.** Don't add IndexedDB, SQLite, or any other storage without asking.
7. **Mobile-first.** Always test that new features work on narrow viewports (380px).
8. **Design consistency.** Use the CSS variables above. Don't introduce new colors without asking.
9. **Fonts: Newsreader + Geist.** Don't change or add fonts.
10. **Icons: inline SVG, 1.5px stroke.** Consistent style with existing icons.
11. **No console.log left behind.** Clean up debug logging.
12. **Test audio recording** after any change to capture flow.
13. **Preserve user data.** Never clear localStorage or change key names without migration.
14. **English UI.** All strings in English.

## How to work

1. Read this file first.
2. Read `hum.html` to understand current implementation.
3. Make changes incrementally — one feature at a time.
4. After each change, verify:
   - App loads without errors
   - Existing entries display correctly
   - New entry can be created (text, audio)
   - Grid and Stream views both work
   - Mobile layout doesn't break
   - Heatmap renders correctly
5. Commit with clear message: `feat: add whisper transcription` or `fix: sidebar not closing on mobile`.
