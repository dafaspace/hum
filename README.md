# Hum

**Personal pocket archive for creative minds.** Capture before it fades.

One-tap recording of melodies, lyrics, dreams, and ideas — with projects, tags, BPM/key/mood metadata, and instant export.

Everything offline-first. Single HTML file, installable as PWA.

## Features

- Audio, text, photo, video capture
- Projects with custom colors and templates
- Grid view (cards) and stream view (diary)
- 12-week heatmap calendar
- Full-text search
- Mobile-responsive, works offline
- No login, no server, no tracking

## How to use

1. Open `hum.html` in a browser
2. Tap the peach circle to record audio, or type to save text
3. Add tags, BPM, key, mood, notes
4. Organize into projects
5. Export per entry or entire project

For microphone on mobile: host on HTTPS (e.g., GitHub Pages, Netlify) or use `python3 -m http.server 8080` locally.

## Tech

- Vanilla JS, no frameworks
- localStorage (all data is yours)
- MediaRecorder API
- Service Worker for offline
- Single 1.6KB HTML file, no build step

## Roadmap

Audio → text (Whisper) → MIDI (basic-pitch) → cloud sync → semantic search.

## License

MIT
