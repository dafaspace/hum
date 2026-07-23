# Hum

**Capture before it fades.** A pocket archive for musical ideas.

Hum a melody, jot a lyric, snap a chord chart, record a field sound. Everything lands in one place with the metadata a musician actually needs: BPM, key, mood, project, tags.

No account. No server. No tracking. Your captures live on your device.

Live: [dafaspace.github.io/hum](https://dafaspace.github.io/hum)

## What it does

**Capture**
- One tap on the orb starts recording. Hold it instead to open a blank note for text or a photo, without touching the mic.
- Count-in metronome that locks an exact tempo onto the take.
- Multiple takes per note, each analysed independently.
- In-app camera (photo and video, with exposure control), gallery picker, and generic file attachments.

**Understand what you captured**
- **Hum to MIDI.** Pitch detection runs on-device (Google's SPICE model). You get a piano roll you can edit: nudge notes, delete wrong ones, snap the melody to a key. Export as `.mid` and drag it into any DAW.
- **Transcription.** Speech to text via Groq (free tier) or OpenAI Whisper. Bring your own API key; it is stored locally and used only for your own audio.
- **Chord detection** from a recording.

**Organize**
- Projects with colors and templates. Rename or delete them at any time; deleting a project never deletes its captures, they just move back to Drafts.
- Tags, status, BPM, key, mood.
- Grid and stream (diary) views, full-text search across notes, transcripts and tags.
- 12-week activity heatmap. Click any day to filter to it.
- Dark mode.

**Keep it safe**
- Requests persistent storage so the browser cannot silently evict the archive, and shows the real protection state in Settings.
- **ZIP backup** of everything (entries, projects, media) with one-click restore on any device.
- **Local Vault:** pick a folder and Hum writes every change into it automatically. Put that folder in iCloud or Dropbox for cloud backup without an account. Desktop only, since iOS Safari has no File System Access API.
- **Google Drive sync** as the cross-platform alternative.
- Per-entry export to TXT, MD, JSON, or the raw audio file.

**Works offline**
Installable PWA with a service worker. Once loaded it runs with no connection, and picks up new versions on its own.

## Running it

Open [the live version](https://dafaspace.github.io/hum), or serve the folder locally:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

Microphone and camera need a secure context, so use HTTPS or `localhost`. Opening `index.html` straight from the filesystem will not get you mic access.

## Tech

- Vanilla JS. No framework, no build step, no bundler.
- Everything inline in `index.html` (~356 KB) except `sw.js`, which browsers require to be a real same-origin file.
- `localStorage` holds metadata; **IndexedDB** holds media blobs, so recordings are not bound by the 5 MB localStorage quota.
- MediaRecorder for capture, Web Audio for playback and the metronome, TensorFlow.js + SPICE for pitch, JSZip for backups, lamejs for MP3 encoding.

## Status and roadmap

Current version: **v0.11**. In daily use, still evolving.

Done: transcription, hum to MIDI with an editable piano roll, chord detection, ZIP backup and restore, Local Vault, Google Drive sync, dark mode, offline PWA.

Next:
- Melody accuracy on a live mic. On-device pitch tracking of casual humming is genuinely unsolved by anyone right now; the piano-roll editor exists so you can fix what the model gets wrong.
- MusicXML and PDF export.
- An AI layer: auto-tagging, mood and genre detection, semantic search, related captures.
- Native wrappers for the app stores.

## License

MIT
