# Home Hero Redesign — Design Spec

Date: 2026-09-15

## Context

The home page Hero (`components/home/Hero.tsx`) currently pairs a
generic marketing headline with a static illustrated "phone mockup"
showing a fake Personal Color result. The user now has a real set of
33 editorial fashion photos (portrait orientation, `resource/DGT MAR _
ẢNH CONTENT/DGT MAR _ ẢNH CONTENT/IMG_*.JPG`, 2000–8000px per side,
several MB each) and wants to:

1. Replace the headline/subheading copy with a new tagline + Vietnamese
   hook line + three feature-benefit bullets.
2. Replace the static phone mockup with a background photo slideshow
   built from those 33 photos.
3. On mobile, the slideshow fills the Hero as a full-bleed background
   behind the content. On desktop, the slideshow sits in its own
   rounded-corner panel to the right of the content, with no overlap
   (approved layout option, see "Layout" below).

Approved through the visual companion during brainstorming: mobile
layout (full-bleed background + bottom-anchored content + dark
gradient scrim for legibility) and desktop layout (Option A: content
left, image panel right in a rounded, shadowed card, no overlay).

## Content

Replaces `Home.Hero.versionBadge`, `heading`, and `subheading` in
`messages/vi.json`. Exact copy, as given by the user:

- Tagline (replaces `versionBadge`): `A LITTLE TWIST, A BETTER FIT`
- Heading/hook (replaces `heading`, no `<highlight>` markup — it's a
  short quoted line, not a sentence with one emphasized phrase):
  `"Vặn nhẹ góc nhìn, tủ đồ hóa xinh, tự tin vừa vặn."`
- Three benefit bullets (new `benefits` array, replaces `subheading`):
  1. `Nhìn tủ đồ qua một lăng kính hoàn toàn mới; thử hình dung mọi
     món đồ cũ đều được biến hóa thành outfit thời thượng chỉ trong
     vài giây.` (outfit try-on)
  2. `Hiểu rõ sắc da và những gam màu thực sự tôn vinh bạn; mua sắm
     thông minh hơn, mặc đẹp lâu bền hơn.` (personal color)
  3. `Lướt diễn đàn, trao đổi mẹo phối và cùng bạn bè nâng cấp phong
     cách mỗi ngày. Cạn kiệt ý tưởng lên đồ? Không bao giờ.` (forum)

Unchanged: `ctaPrimary`, `ctaSecondary`, `avatarInitials`, `rating`,
`ratingCaption`, `iconMarkAlt`. Removed (only used by the phone mockup
being deleted): `phoneMock.*`, `accuracyBadge.*`.

## Layout

**Desktop** (`lg:` and up) — same 12-column grid Hero already uses,
just swapping what's on the right:

- Left column (~7/12): tagline → heading → three bullets (each with a
  small check-style marker) → the two existing CTA buttons, unchanged
  → the existing avatar/rating social-proof row, unchanged.
- Right column (~5/12): `HeroSlideshow` (desktop image set) inside a
  rounded-corner (`rounded-[44px]`-scale), shadowed card, `self-stretch`
  so it matches the left column's natural height. No text overlays the
  image — this was the explicitly approved option over two alternatives
  (full-bleed with gradient-faded text, and a floating text card
  overlapping the image corner).

**Mobile** (below `lg:`) — `HeroSlideshow` (mobile image set) as an
`absolute inset-0` full-bleed background behind the whole Hero
section; content sits in a `relative z-10` layer. A fixed dark gradient
scrim (`linear-gradient` top-transparent → bottom-dark, roughly the
`from-black/35 via-black/55 to-black/90` shape) sits between the
slideshow and the content at all times — approved specifically because
some source photos are light/low-contrast and would make white text
unreadable without it; the scrim does not vary per photo.

## Components

### `components/home/HeroSlideshow.tsx` (new)

```ts
type HeroSlideshowProps = {
  images: { src: string; alt: string }[]
  className?: string
}
```

- Renders two stacked `<img>` layers (`absolute inset-0`) — a current
  and a next — cross-fading via `opacity`/`transition-opacity`
  (~1s transition) every 5s via `setInterval`, advancing an index held
  in `useState`. Cleans up the interval on unmount.
- Checks `window.matchMedia('(prefers-reduced-motion: reduce)')` on
  mount; if set, skips the interval entirely and renders only the
  first image — static, no motion.
- Purely presentational: doesn't know or care whether it's being used
  as a mobile background or a desktop panel. `Hero.tsx` mounts it
  twice — once with the mobile image set inside a `lg:hidden` wrapper,
  once with the desktop image set inside a `hidden lg:block` wrapper —
  same pattern this codebase already uses elsewhere for
  breakpoint-conditional rendering rather than one component branching
  internally on viewport.
- Images are decorative background, not content — `alt=""` on every
  `<img>`, and the wrapper gets `aria-hidden="true"`.

### `components/home/Hero.tsx` (modified)

- Delete the entire phone-mockup block (current lines ~100–177) and
  its `accuracyBadge` floating card.
- Add the two `HeroSlideshow` mounts described above.
- Replace `t('versionBadge')` badge pill, `t('heading')` (drop the
  `t.rich`/`highlight` call — plain `t('heading')` now, since the new
  copy has no embedded highlighted phrase), and the `subheading`
  paragraph (replaced by mapping the new `benefits` array to a
  bulleted list).
- CTA buttons and the avatar/rating row keep their current JSX
  unchanged (same translations, same behavior, same `useQrModal` call).

## Image asset pipeline

One-time preprocessing, not a runtime/build step — processed files are
committed as static assets like every other image in `public/home/`.

- Source: 33 `.JPG` files, portrait, EXIF-rotated, 2000–8000px,
  0.3–8MB each.
- Output locations:
  - `public/home/hero-slideshow/mobile/img-<n>.jpg` — resized (not
    aggressively cropped: originals are already ~2:3, close to ideal
    for a full-bleed portrait background) and compressed for web.
  - `public/home/hero-slideshow/desktop/img-<n>.jpg` — cropped to
    approximately 4:5 (matches the rounded panel's proportions in the
    approved desktop layout) with a per-photo focal point, since the
    tighter frame needs a deliberate crop rather than a uniform rule
    (confirmed during brainstorming: photos vary from tight face
    close-ups to full-body shots with a lot of empty space at the
    top — a single fixed crop rule would cut some of them badly).
  - `<n>` is the numeric suffix from the source filename (`IMG_2852.JPG`
    → `img-2852.jpg`) so the two directories stay easy to cross-reference.
- Process: a script applies a first-pass heuristic crop for the
  desktop set (bias toward the upper 60–70% of the frame, where the
  subject sits in most of these photos), renders a contact sheet of
  all 33 before/after pairs, and only the photos that look wrong on
  the contact sheet get a manual crop-region override before final
  export. Both outputs are resized to reasonable web dimensions
  (mobile: ~960px wide; desktop: ~800px wide) and compressed
  (JPEG quality ~80).
- `HeroSlideshow` receives the resulting file lists as plain arrays
  (e.g. a `lib/heroSlideshowImages.ts` constant) — no manifest/JSON
  needed, just two arrays of paths matching the two directories above.

## Testing

- `components/home/Hero.test.tsx`: update the heading-text assertion
  to match the new copy; keep the existing QR-modal-open test as-is
  (that CTA doesn't change).
- `components/home/HeroSlideshow.test.tsx` (new): renders with a fixed
  small image list; asserts the first image is shown initially; using
  `vi.useFakeTimers()`, advances 5s and asserts the second image is
  now the visible/opaque one; asserts no interval fires (image never
  changes after advancing time) when `prefers-reduced-motion` is
  mocked to `matches: true`.

## Out of scope

- No admin UI for managing the slideshow image set — it's a fixed,
  committed asset list, matching how every other static marketing
  image in `public/home/` is handled today.
- No lazy-loading/prioritization beyond what a plain `<img>` gives by
  default — consistent with the rest of the codebase, which doesn't
  use `next/image` anywhere.
