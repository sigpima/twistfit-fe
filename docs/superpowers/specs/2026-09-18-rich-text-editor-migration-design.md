# Rich text editor migration (blog + forum post body)

## Problem

The blog admin editor and the forum post editor both use a raw-markdown
textarea (`components/admin/MarkdownToolbar.tsx` + `lib/markdownEditor.ts`,
consumed by `components/admin/BlogPostForm.tsx` and
`components/forum/ForumPostForm.tsx`). Three problems were raised:

1. **SEO**: markdown `# heading` in post content renders as a real
   `<h1>` HTML tag. The post detail pages already render the post
   title as their own `<h1>`, so a `#` in the body produces a
   duplicate H1 — bad for SEO.
2. **Toolbar buttons show text labels** ("In đậm", "Nghiêng", ...)
   instead of icons.
3. **The bigger UX problem**: users have to learn raw markdown syntax
   and click a separate "Preview" tab to see the formatted result.
   Reproduced live (Playwright) and confirmed a concrete bug on top of
   this: clicking a toolbar button while the cursor is scrolled to an
   earlier part of a long post visually jumps the textarea to the
   bottom. Root cause: React re-assigns the controlled `<textarea>`'s
   `.value` on every toolbar edit, which is a native browser trigger
   for the caret (and the visible scroll position) to jump to the end
   of the text; the toolbar's `requestAnimationFrame` callback restores
   the *caret index* afterward but never restores `scrollTop`, so the
   view stays stuck at the bottom even though the caret itself is
   correct.
4. **Inserted images render small and left-aligned** on the published
   page. Root cause (also confirmed by direct inspection, not
   inference): `@tailwindcss/typography` is not installed and there is
   no custom CSS for `.prose` anywhere in the repo — it is a
   completely inert class name today. Headings happen to look
   acceptable only because of the browser's built-in UA stylesheet;
   images have no such built-in fallback, so they render at native
   pixel size with no centering or max-width.

## Decision

Replace the raw-markdown textarea + toolbar with a WYSIWYG editor
(TipTap), while keeping the wire format markdown end-to-end — the
editor round-trips markdown in/out via the `tiptap-markdown`
extension, so nothing downstream changes:

- **Storage stays markdown.** `content`/`body` fields keep their
  current type and meaning in both `blog_posts` and `forum_posts`. No
  backend or database change at all.
- **Rendering stays `renderMarkdown()` (marked + DOMPurify).** Every
  read-only consumer of markdown content — the public blog detail
  page, the public forum post page, the admin forum moderation
  preview dialog, and the FAQ accordion (`item.answerMarkdown`) — is
  unaffected by this migration and automatically inherits the two
  fixes below with zero code changes, since they all already go
  through the same `lib/markdown.ts` pipeline.
- `lib/readingTime.ts`'s `estimateReadingMinutes()` (naive whitespace
  word count) keeps working correctly because the stored text is
  still prose-shaped markdown, not a JSON document tree.

This was chosen over storing the editor's native JSON/HTML directly
specifically because of the reading-time calculator and the
just-shipped `extractHeadings()`/TOC feature, both of which assume the
stored content is plain markdown text — moving to a different storage
shape would require rewriting both, for no benefit to the user's
actual complaint (the complaint is about the *editing* experience, not
the storage format).

## Scope

**In scope** (both use the same new shared editor component):
- `components/admin/BlogPostForm.tsx` — blog post content field.
- `components/forum/ForumPostForm.tsx` — forum post body field.
- `lib/markdown.ts` — H1→H2 downgrade + prose CSS class parity.
- `app/globals.css` — new hand-written `.prose` rules.

**Out of scope** (unchanged):
- Backend: no schema, endpoint, or migration changes anywhere.
- The separate "featured image" / "cover image" upload fields on both
  forms (`coverImageUrl` on blog, `imageUrl` on forum) — these are
  already distinct from the markdown body today (their own file input
  + direct blob upload, not markdown syntax) and are not part of the
  body content at all. Untouched.
- FAQ content authoring (wherever `item.answerMarkdown` is edited
  today) — FAQ answers are typically short and were not part of the
  complaint; only its *rendering* (via the shared prose CSS + H1 fix)
  changes, automatically, with no code change on the FAQ side.
- `ImagePickerDialog.tsx` (the link/upload modal) — reused as-is, only
  what its `onConfirm` callback *does* with the result changes.

## Component design

New folder `components/editor/`:

- **`RichTextEditor.tsx`** — the only thing `BlogPostForm`/
  `ForumPostForm` talk to. Props: `value: string` (markdown),
  `onChange: (markdown: string) => void`, `uploadUrlEndpoint: string`.
  Internally: `useEditor()` from `@tiptap/react` with `StarterKit`
  (heading levels limited to `[2, 3]` — no H1 option exists in the UI
  at all, closing off the SEO problem at the source, not just patching
  the render step), `Link`, and `Image`, plus the `Markdown` extension
  from `tiptap-markdown` so `editor.storage.markdown.getMarkdown()` is
  the value passed to `onChange` on every update. Renders
  `<RichTextToolbar editor={editor} onRequestImage={...} />` above the
  content area, and reuses `ImagePickerDialog` internally for image
  insertion — its `onConfirm({ url, alt })` now calls
  `editor.chain().focus().setImage({ src: url, alt }).run()` instead
  of splicing markdown text. The content area gets
  `editorProps: { attributes: { class: 'prose max-w-none ...' } }` —
  the *same* prose classes the published pages use, so the editor
  looks exactly like the published result (true WYSIWYG, not
  approximate).
- **`RichTextToolbar.tsx`** — icon buttons (`material-symbols-outlined`,
  consistent with the rest of the app) calling TipTap commands
  directly (`editor.chain().focus().toggleBold().run()`, etc.) instead
  of the old text-splicing helpers. Icons: `format_h2`/`format_h3`
  (heading levels), `format_bold`, `format_italic`,
  `format_list_bulleted`, `format_list_numbered`, `format_quote`,
  `code`, `link`, `image` — these are the intended Material Symbols
  glyph names; if any turns out to be missing from the font subset the
  app actually loads, implementation substitutes the closest available
  equivalent rather than falling back to a text label. Every
  icon-only button gets an `aria-label`. Active formatting state (e.g.
  bold button highlighted
  while the cursor is inside bold text) reflects `editor.isActive(...)`,
  matching standard rich-text-editor conventions.

**Removed**: `components/admin/MarkdownToolbar.tsx`,
`lib/markdownEditor.ts`, and both forms' write/preview tab toggle (the
editor *is* the preview now, so "Preview" has no separate meaning
left).

**Structurally eliminated, not patched**: the scroll-jump bug cannot
recur in the new design because there is no controlled
`<textarea value=...>` anymore — ProseMirror (which TipTap wraps) owns
its own DOM and applies edits as fine-grained transactions instead of
whole-value replacement, so there is no `.value =` reassignment for
the browser to react to.

## The two concrete fixes

- **H1 downgrade** (`lib/markdown.ts`): the heading renderer already
  special-cases depth 2/3 for id injection; extend it so depth 1 is
  treated as depth 2 (real tag becomes `<h2>`, gets an id, and
  participates in the blog TOC like any other level-2 section) instead
  of passing through as a literal second `<h1>`. This is a backstop
  for pasted-in content that still contains `# ...` — the new editor's
  own heading picker only ever offers H2/H3, so this path shouldn't be
  reachable through normal authoring.
- **Image styling** (`app/globals.css`, hand-written under `.prose`,
  not the `@tailwindcss/typography` plugin — that plugin ships its own
  color/font opinions that would fight the app's existing Material-ish
  design tokens): `.prose img { display: block; margin: 2em auto;
  max-width: 100%; height: auto; border-radius: 1rem; }` — `1rem`
  matches `rounded-2xl`, the same corner treatment already used for
  the related-post thumbnails and other in-app content images, so
  in-body images look consistent with the rest of the site rather than
  introducing a new visual size. No float support is offered anywhere
  (no toolbar affordance for it, no CSS for it) — matches the explicit
  ask of "just centered, no text wrapping around it." The same rule
  set also covers headings,
  paragraphs, lists, blockquote, and inline code, since `.prose` was
  completely unstyled before this and every one of those elements is
  currently relying on accidental browser defaults.

## Testing

- `lib/markdown.test.ts`: add cases for the H1→H2 downgrade (depth-1
  heading gets an id and participates in `extractHeadings()`).
- New `components/editor/RichTextEditor.test.tsx` /
  `RichTextToolbar.test.tsx` replacing `MarkdownToolbar.test.tsx`.
- `BlogPostForm.test.tsx` / `ForumPostForm.test.tsx`: existing tests
  that interact with the raw `<textarea>` via `fireEvent.change` need
  rewriting against TipTap's contentEditable surface.

**Known risk to verify early, before building the full component**:
TipTap/ProseMirror's contentEditable behavior under jsdom (the test
environment this repo uses) is a known soft spot for rich-text editor
libraries in general — jsdom doesn't implement real `contenteditable`
editing behavior the way a browser does. The first implementation task
should be a small spike: mount a minimal TipTap editor in a vitest
test and confirm that (a) it mounts without throwing, and (b) toolbar
commands (e.g. `toggleBold`) can be triggered and asserted against
`editor.getHTML()`/`getText()` output. If direct DOM typing simulation
turns out to be unreliable in jsdom, tests can still drive the editor
through its imperative command API (`editor.commands.*`) rather than
simulating real keystrokes, which is the documented/supported TipTap
testing approach.

## Non-goals

- Collaborative/multi-cursor editing, comments, version history —
  none of that exists today and none of it was asked for.
- Changing the separate featured-image upload flow.
- Any backend change.
