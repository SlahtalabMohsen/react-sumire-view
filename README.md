# Sumire View

Premium anime learning player with Yomitan integration for Japanese learners.

## Features

- **Video Player** — Drag-and-drop video loading, playback speed control, fullscreen, keyboard shortcuts
- **Subtitle Support** — Import SRT, VTT, and ASS subtitle files with multi-track display
- **Furigana Display** — Toggle furigana reading aids for kanji text
- **Yomitan Integration** — Hover over subtitles to use Yomitan popup dictionary
- **Word Save** — Click subtitle text to save vocabulary with context and timestamps
- **Bookmark & Notes** — Save timestamps with notes and export to text file
- **Dialogue Log** — Scrollable subtitle history with search and click-to-seek
- **Resizable Panels** — Drag the divider between video and subtitle area to resize
- **Theme System** — Light, dark, and sepia themes with seasonal accent colors
- **Keyboard Shortcuts** — Space (play), arrows (seek/volume), M (mute), F (fullscreen), K (play)

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- Framer Motion

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Load a video** — Drag and drop a video file onto the player, or click "Choose file"
2. **Import subtitles** — Open the Subtitles tab in the sidebar and import an SRT, VTT, or ASS file
3. **Resize panels** — Drag the divider between video and subtitle area to adjust heights
4. **Save vocabulary** — Click on subtitle text to save words for review
5. **Bookmarks** — Add notes at any timestamp and export them later

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space / K | Play / Pause |
| ← / → | Skip 5s backward / forward |
| ↑ / ↓ | Volume up / down |
| M | Toggle mute |
| F | Toggle fullscreen |
