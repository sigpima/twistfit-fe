---
name: TwistFit Atelier
colors:
  surface: '#f9f9ff'
  surface-dim: '#c7dbff'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dde9ff'
  surface-container-highest: '#d4e3ff'
  on-surface: '#041c37'
  on-surface-variant: '#45464f'
  inverse-surface: '#1c314d'
  inverse-on-surface: '#ebf1ff'
  outline: '#757680'
  outline-variant: '#c6c6d0'
  surface-tint: '#4f5d8b'
  primary: '#4c5a88'
  on-primary: '#ffffff'
  primary-container: '#6573a2'
  on-primary-container: '#fefcff'
  inverse-primary: '#b7c5f9'
  secondary: '#7b516d'
  on-secondary: '#ffffff'
  secondary-container: '#fdc8e9'
  on-secondary-container: '#7a506c'
  tertiary: '#615c48'
  on-tertiary: '#ffffff'
  tertiary-container: '#7a7560'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b7c5f9'
  on-primary-fixed: '#071843'
  on-primary-fixed-variant: '#374571'
  secondary-fixed: '#ffd7ef'
  secondary-fixed-dim: '#ebb7d8'
  on-secondary-fixed: '#300f28'
  on-secondary-fixed-variant: '#613a55'
  tertiary-fixed: '#eae2c9'
  tertiary-fixed-dim: '#cdc6ae'
  on-tertiary-fixed: '#1f1c0c'
  on-tertiary-fixed-variant: '#4b4734'
  background: '#f9f9ff'
  on-background: '#041c37'
  surface-variant: '#d4e3ff'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Montserrat
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 42px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Montserrat
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Montserrat
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1.25rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style
The design system embodies an airy, modern, and high-fashion boutique digital experience tailored for Gen Z and young adults exploring personal color analysis, seasonal palettes, and silhouette styling. Guided by the ethos *"A little twist, a better fit"*, the aesthetic blends tactile fashion editorial nuance with digital clarity.

The visual direction marries soft **watercolor wash textures** and delicate pastel tones with crisp, contemporary geometric framing. It evokes curiosity, warmth, self-expression, and refined youthful taste. Rather than rigid tech utilitarianism, it delivers soft-glow surfaces, warm cream undertones, and chic editorial contrast that make personalized fashion discovery feel like browsing a private designer showroom.

## Colors
The palette is built around four distinctive hues that provide both soft warmth and sharp readability:
- **Primary (`#7B89BA`) Slate Blue:** Serves as the primary functional anchor for active navigation elements, primary chips, interactive focal points, and core branding markers.
- **Secondary (`#FDC8E9`) Soft Pastel Pink:** Expresses energy, playful personal expression, and highlight swatches. Used for seasonal highlight tags, badge accents, and warm interactive micro-states.
- **Tertiary (`#FFF7DD`) Light Warm Cream:** Acts as the primary canvas foundation, warmth infuser, and elevated container surface. It eliminates sterile pure whites in favor of cozy boutique texture.
- **Neutral (`#304461`) Dark Navy Slate:** Provides rich editorial contrast for headlines, legible body copy, structural dividing rules, and deep contrast buttons.

Backgrounds utilize layered, low-opacity radial gradients replicating soft pastel watercolor textures over warm cream, keeping contrast comfortable while preserving the signature boutique vibe.

## Typography
Montserrat drives clarity, rhythmic structure, and contemporary chic energy across application interfaces, data modules, and action tiers.

- **Editorial Accents:** Hand-script flourishes (`Bogers Script`) and literary serif motifs (`Chapbook`) are reserved strictly for editorial hero moments, decorative subheadings, pull-quotes, and seasonal mood boards. They must never be applied to dense copy, navigation labels, form fields, or critical data readouts.
- **Microcopy & Footnotes:** Handled with light to regular weights in Montserrat, maintaining open trackings to ensure effortless legibility over textured watercolor backgrounds.
- **Hierarchy:** Titles favor clean medium-to-bold weights with subtle tight tracking, capturing a high-fashion editorial magazine atmosphere.

## Layout & Spacing
The layout follows a fluid 12-column grid system on desktop screens (breakpoint 1024px+), transitioning to an 8-column layout on tablet (768px-1023px), and a 4-column layout on mobile devices (<768px). 

Outer canvas margins maintain breathability, framing personal color test results, wardrobe cards, and test questions like curated catalog plates. Components preserve an airy interior spacing rhythm using 8pt-derived increments (`space-sm` for compact tags, `space-md` for form fields, and `space-xl` for sectional transitions).

## Elevation & Depth
Depth avoids heavy dropshadows or harsh black opacities. Instead, visual hierarchy is achieved through a fusion of **frosted glassmorphism** and **tinted ambient luminescence**:
- **Layer 0 (Canvas):** Dreamy, fluid watercolor gradient base anchored by `#FFF7DD` light warm cream with touches of diluted `#FDC8E9` and `#7B89BA`.
- **Layer 1 (Cards & Surface Panels):** Translucent porcelain white (`rgba(255, 255, 255, 0.72)`) with a subtle `backdrop-filter: blur(12px)` and a gentle 1px perimeter border tinted in `rgba(123, 137, 186, 0.18)`.
- **Layer 2 (Floating Modals & Color Swatches):** Elevated with an ambient tinted shadow (`0 8px 24px -4px rgba(48, 68, 97, 0.08)`), combined with soft pastel edge reflections (`0 1px 0 rgba(253, 200, 233, 0.4) inset`).
- **Interactive Focus & Hover:** Gentle lift accompanied by an amplified diffuse bloom in Slate Blue (`0 12px 28px -6px rgba(123, 137, 186, 0.25)`).

## Shapes
Geometry embraces organic softness, referencing clothing hanger curves and fluid fashion draping. 
Standard interactive elements feature a balanced roundedness (`roundedness: 2`, matching `0.5rem` / 8px for standard inputs, `1rem` / 16px for content cards, and `1.5rem` / 24px for large discovery panels).

Micro-tags, seasonal color swatches, filter pills, and core CTA buttons can expand to full pill forms (`rounded-full`) to emphasize touch-friendly friendliness for Gen Z smartphone users.

## Components

### Buttons
- **Primary CTA:** Deep Navy Slate background (`#304461`), warm cream text (`#FFF7DD`), Montserrat label-lg, fully rounded or 16px radius. On hover, smooth transition to Slate Blue (`#7B89BA`) with ambient bloom.
- **Secondary CTA:** Frosted Slate Blue outline (`1.5px solid #7B89BA`), filled with `rgba(255, 255, 255, 0.65)`, Slate Blue text, subtle pink glow on hover.
- **Tertiary / Soft CTA:** Soft Pastel Pink background (`#FDC8E9`), text in Dark Navy Slate (`#304461`), ideal for playful interactions like "Retake Test" or "Mix & Match".

### Color Swatches & Season Chips
- Interactive circular or rounded pill chips showcasing hue, saturation, and tone.
- Selected state: Encased in a double-ring accent—an outer Slate Blue ring separated by a 2px warm cream margin.

### Cards & Result Panels
- Built with frosted glass styling (`rgba(255, 255, 255, 0.8)` background, backdrop blur, delicate borders in `#7B89BA` at 15% opacity).
- Header sections feature ample padding (`space-lg`), pairing a bold Montserrat section title with an optional decorative accent script.

### Input Fields
- Understated warm surfaces (`rgba(255, 247, 221, 0.6)`) bounded by soft Slate Blue border lines (`1px solid rgba(123, 137, 186, 0.3)`).
- On focus: Crisp `#7B89BA` ring with soft `#FDC8E9` shadow glow. Placeholder typography in Montserrat body-md with muted navy tone.

### Checkboxes & Radio Buttons
- Custom circular indicators that mirror coat buttons or jewelry clasps.
- Checked state fills with Slate Blue (`#7B89BA`) displaying a pure warm cream check or nested concentric dot.

### Wardrobe & Fit Sliders
- Minimalist hanger-inspired horizontal rail track in Slate Blue with soft pastel pink or cream thumb handles, offering intuitive tactile feedback during fit calibration.