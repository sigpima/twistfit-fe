#!/home/nuc/Documents/project/fashion-web/frontend/.venv-tools/bin/python3
"""Interactive vertical-position picker for the Hero desktop-wide background crops.

Reads each portrait mobile source image (public/home/hero-slideshow/mobile),
shows it with an overlay for the CROP_WIDTH x CROP_HEIGHT window that will be
cut out of it (full width, no horizontal crop needed since the source is
already CROP_WIDTH wide). Click-and-drag the window up/down to reposition it,
then save the result to public/home/hero-slideshow/desktop-wide.

Controls:
  drag (left mouse button) - move the crop window, follows the cursor
  a / d                    - previous / next image (autosaves current image)
  q / Esc / Ctrl+C         - save current image and quit

Nothing is ever lost: the crop position and the actual output JPEG are both
written to disk on every mouse-up and on every navigation, not just on exit.
Re-running the script resumes from the last saved positions.
"""
import glob
import json
import os
import signal
import sys

import cv2
import numpy as np
from PIL import Image

REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
SOURCE_DIR = os.path.join(REPO_ROOT, "public/home/hero-slideshow/mobile")
OUTPUT_DIR = os.path.join(REPO_ROOT, "public/home/hero-slideshow/desktop-wide")
CENTERS_FILE = os.path.join(REPO_ROOT, "hero_desktop_wide_centers.json")

CROP_WIDTH = 960
CROP_HEIGHT = 480  # 2:1 — a bit taller than the previous 960x411 (~2.34:1) crop
MAX_DISPLAY_HEIGHT = 860
JPEG_QUALITY = 90


def load_centers():
    if os.path.exists(CENTERS_FILE):
        with open(CENTERS_FILE) as f:
            return json.load(f)
    return {}


def save_centers(centers):
    with open(CENTERS_FILE, "w") as f:
        json.dump(centers, f, indent=2, sort_keys=True)


def pil_to_bgr(image):
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)


class CropSession:
    def __init__(self):
        self.paths = sorted(glob.glob(os.path.join(SOURCE_DIR, "*.jpg")))
        if not self.paths:
            sys.exit(f"No source images found in {SOURCE_DIR}")
        self.names = [os.path.basename(p) for p in self.paths]
        self.centers = load_centers()
        self.sources = [Image.open(p).convert("RGB") for p in self.paths]
        self.index = 0
        self.dragging = False
        self.dirty = set()

        cv2.namedWindow("Hero crop", cv2.WINDOW_AUTOSIZE)
        cv2.setMouseCallback("Hero crop", self._on_mouse)

    # -- geometry -----------------------------------------------------

    def _center_frac(self, name):
        return self.centers.get(name, 0.5)

    def _set_center_frac(self, name, frac):
        height = self.sources[self.names.index(name)].height
        half = (CROP_HEIGHT / 2) / height
        frac = max(half, min(1 - half, frac))
        self.centers[name] = frac
        self.dirty.add(name)

    def _crop_box(self, name):
        img = self.sources[self.names.index(name)]
        center_px = self._center_frac(name) * img.height
        top = int(round(center_px - CROP_HEIGHT / 2))
        top = max(0, min(top, img.height - CROP_HEIGHT))
        return top, top + CROP_HEIGHT

    def _scale(self, img):
        return min(1.0, MAX_DISPLAY_HEIGHT / img.height)

    # -- mouse ----------------------------------------------------------

    def _on_mouse(self, event, x, y, flags, _userdata):
        name = self.names[self.index]
        img = self.sources[self.index]
        scale = self._scale(img)
        y_src = y / scale

        if event == cv2.EVENT_LBUTTONDOWN:
            self.dragging = True
            self._set_center_frac(name, y_src / img.height)
        elif event == cv2.EVENT_MOUSEMOVE and self.dragging:
            self._set_center_frac(name, y_src / img.height)
        elif event == cv2.EVENT_LBUTTONUP and self.dragging:
            self.dragging = False
            self._set_center_frac(name, y_src / img.height)
            self.save_current()

    # -- rendering --------------------------------------------------------

    def render(self):
        name = self.names[self.index]
        img = self.sources[self.index]
        scale = self._scale(img)
        disp = img.resize((int(img.width * scale), int(img.height * scale)))
        frame = pil_to_bgr(disp)

        top, bottom = self._crop_box(name)
        top_d, bottom_d = int(top * scale), int(bottom * scale)

        overlay = frame.copy()
        overlay[:top_d, :] = (overlay[:top_d, :] * 0.35).astype(np.uint8)
        overlay[bottom_d:, :] = (overlay[bottom_d:, :] * 0.35).astype(np.uint8)
        cv2.rectangle(overlay, (0, top_d), (frame.shape[1] - 1, bottom_d), (0, 220, 255), 2)
        mid_d = (top_d + bottom_d) // 2
        cv2.line(overlay, (0, mid_d), (frame.shape[1], mid_d), (0, 220, 255), 1)

        saved_mark = "" if name in self.dirty else " (saved)"
        label = f"[{self.index + 1}/{len(self.names)}] {name}{saved_mark}"
        hint = "drag = move crop | a/d = prev/next | q / Ctrl+C = save & quit"
        for i, text in enumerate((label, hint)):
            y_text = 24 + i * 22
            cv2.putText(overlay, text, (10, y_text), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 3, cv2.LINE_AA)
            cv2.putText(overlay, text, (10, y_text), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

        cv2.imshow("Hero crop", overlay)

    # -- persistence ------------------------------------------------------

    def save_current(self):
        name = self.names[self.index]
        img = self.sources[self.index]
        top, bottom = self._crop_box(name)
        cropped = img.crop((0, top, CROP_WIDTH, bottom))
        cropped.save(os.path.join(OUTPUT_DIR, name), quality=JPEG_QUALITY)
        save_centers(self.centers)
        self.dirty.discard(name)

    def navigate(self, step):
        self.save_current()
        self.index = (self.index + step) % len(self.names)

    def run(self):
        try:
            while True:
                self.render()
                key = cv2.waitKey(20) & 0xFF
                if key in (ord("q"), 27):  # q or Esc
                    break
                elif key == ord("a"):
                    self.navigate(-1)
                elif key == ord("d"):
                    self.navigate(1)
        except KeyboardInterrupt:
            pass
        finally:
            self.save_current()
            cv2.destroyAllWindows()
            print(f"Saved crop centers to {CENTERS_FILE}")
            print(f"Saved cropped images to {OUTPUT_DIR}")


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    signal.signal(signal.SIGINT, signal.default_int_handler)
    CropSession().run()


if __name__ == "__main__":
    main()
