# Camera Color-Season Frame — Design Spec

Date: 2026-09-10

## Context

This is the first of three planned features for a fashion web app. The
overall app will eventually have a Python FastAPI backend and a
Next.js + TailwindCSS frontend. This feature is a pure frontend
prototype (no capture, no backend calls) to validate the camera +
overlay interaction pattern before styling/design work begins.

Feature: pressing a button opens a live camera view with a
biometric-scan-style oval face cutout, surrounded by a color "frame"
(seasonal color analysis wheel, per the reference image
`796095036_3684969334996102_2181821669349014766_n.jpg`). The user can
switch between 12 frame variants live (Spring/Summer/Autumn/Winter ×
Warm-Cool/Light-Deep/Bright-Soft), similar to switching filters in
Messenger. No photo is captured or saved — it's a live preview only.

## Project structure (monorepo)

```
fashion-web/
├── frontend/          # Next.js 14 (App Router) + TailwindCSS
│   ├── app/
│   │   ├── page.tsx              → home page, single button "Thử tính năng Camera Frame"
│   │   └── camera-frame/
│   │       └── page.tsx          → the camera + frame feature page
│   ├── components/
│   │   ├── CameraView.tsx        → requests permission + renders the video stream
│   │   ├── FrameOverlay.tsx      → draws the oval mask + color wedges (SVG)
│   │   └── FrameSwitcher.tsx     → prev/next buttons + current frame name
│   └── lib/palettes.ts           → color data for the 12 frame variants
└── backend/           # FastAPI, empty skeleton, no endpoints yet (for future features)
```

The home page has exactly one button that navigates straight to the
feature — no nav menu, no auth.

## Feature flow

1. Button on `/` navigates to `/camera-frame`.
2. Page requests camera access via `getUserMedia`, preferring the
   front-facing camera on mobile and the default webcam on desktop.
3. Video renders full-screen, mirrored (selfie-style).
4. An overlay sits above the video: a semi-transparent dark layer
   covering the full screen with a transparent oval cutout in the
   middle, revealing the face — matching a biometric-scan look.
5. Around the oval edge, colored wedge segments render per the
   currently selected palette (per the reference image), and swap
   instantly on frame change — no flicker, no camera stream restart.
6. Below the viewport: the current frame's name (e.g. "Spring ·
   Bright") plus left/right arrow buttons to cycle through the 12
   frames in a fixed order.
7. No capture button; nothing is saved or transmitted.
8. If camera permission is denied or no camera device exists, show a
   clear error message instead of a blank screen.
9. On unmount/navigation away, the camera stream is stopped to
   release the device.

## Palette data & responsive behavior

- 12 palettes are hardcoded in `lib/palettes.ts`, each with a display
  name (e.g. "Autumn · Deep") and an array of ~8-10 hex colors
  approximating the reference image (hand-authored, not
  pixel-extracted).
- `FrameOverlay` is an SVG component that takes `colors: string[]` as
  a prop and divides them into equal wedge segments around the oval.
  It has no knowledge of frame-selection logic, so it stays reusable.
- Layout uses `100dvh` + flex centering so the oval and overlay scale
  and stay centered on both portrait mobile and landscape desktop; the
  oval scales against the smaller viewport dimension so it always fits
  the frame.

## Testing approach

This feature requires real camera hardware/permissions, so it will be
verified manually via the dev server in a browser (layout, frame
switching, permission-denied error path, mobile/desktop resize) rather
than with automated tests.

## Out of scope

- The other 2 planned features (not designed yet).
- Any photo capture, storage, or backend interaction.
- Visual design polish (this is a functional prototype only).
- FastAPI backend implementation (skeleton only, no endpoints).
