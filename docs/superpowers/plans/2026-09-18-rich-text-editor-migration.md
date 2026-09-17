# Rich Text Editor Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw-markdown textarea + text-splicing toolbar used by the blog admin editor and the forum post editor with a WYSIWYG rich-text editor (TipTap), while keeping markdown as the storage/wire format end-to-end, and fix the two concrete bugs raised alongside it (duplicate H1 tags, unstyled/left-aligned images).

**Architecture:** A new `components/editor/` package (`RichTextEditor` + `RichTextToolbar`) wraps TipTap (`@tiptap/react` + `@tiptap/starter-kit`, heading levels restricted to H2/H3) with the `tiptap-markdown` extension so the component's public contract stays `value: string` (markdown) in, `onChange(markdown: string)` out — no other part of the app needs to know TipTap exists. `BlogPostForm` and `ForumPostForm` swap their old textarea+toolbar+write/preview-tabs block for this one component. `lib/markdown.ts` gets a small H1→H2 downgrade fix, and `app/globals.css` gets real `.prose` CSS (there is none today) applied to both the editor's own canvas and every published page, so editing and reading look identical.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind v4 (CSS-first config, no `tailwind.config.*`), `@tiptap/react` 3.31.3, `@tiptap/starter-kit` 3.31.3, `@tiptap/extension-image` 3.31.3, `tiptap-markdown` 0.9.0, `marked` 18 + `isomorphic-dompurify` (rendering, unchanged), Vitest + `@testing-library/react` + jsdom.

**Spec:** `docs/superpowers/specs/2026-09-18-rich-text-editor-migration-design.md`

## Global Constraints

- Storage format does not change: `content`/`body` stay plain markdown strings on both `BlogPost` and `ForumPost`. No backend, schema, or migration work anywhere in this plan.
- Pin exact versions: `@tiptap/react@3.31.3`, `@tiptap/pm@3.31.3`, `@tiptap/core@3.31.3`, `@tiptap/starter-kit@3.31.3`, `@tiptap/extension-image@3.31.3`, `tiptap-markdown@0.9.0`.
- Heading levels in the editor are restricted to H2/H3 only (`StarterKit.configure({ heading: { levels: [2, 3] } })`) — there is no H1 option anywhere in the new editor.
- No `@tailwindcss/typography` plugin. All `.prose` styling is hand-written CSS in `app/globals.css`, using the existing `--color-*`/`--text-*`/`--spacing-*` custom properties already defined in that file's `@theme` block — never introduce new ad-hoc colors/sizes.
- Icons are `material-symbols-outlined` glyph names (the font is already loaded app-wide with the full glyph set, confirmed via `app/layout.tsx`) — never emoji, never new icon libraries.
- All user-facing strings go through `next-intl` / `messages/vi.json`, matching each component's existing translation namespace convention (`Admin.*`, `Forum.*`).
- Every new component gets a co-located `.test.tsx` file using this repo's existing `renderWithIntl` helper from `test-utils/renderWithIntl` (or manual `NextIntlClientProvider` wrapping where a test needs a custom label/DOM harness the helper doesn't support).
- TDD every step: write the failing test, run it, watch it fail, implement, run it again, watch it pass, then commit.

---

## Task 1: Install TipTap and build the minimal RichTextEditor core

**Files:**
- Create: `components/editor/RichTextEditor.tsx`
- Test: `components/editor/RichTextEditor.test.tsx`
- Modify: `package.json`, `package-lock.json` (via `npm install`)

**Interfaces:**
- Produces: `RichTextEditor({ value: string, onChange: (value: string) => void, labelId: string }): JSX.Element` — default export from `components/editor/RichTextEditor.tsx`. `labelId` must be the `id` of an external label element the caller renders; the editor's content region gets `aria-labelledby={labelId}` (a plain `<label htmlFor>` does **not** associate with a `contenteditable` div per the HTML spec, so this is the pattern every consumer must follow, not just a test convenience).

- [ ] **Step 1: Install the TipTap packages**

```bash
npm install @tiptap/react@3.31.3 @tiptap/pm@3.31.3 @tiptap/core@3.31.3 @tiptap/starter-kit@3.31.3 @tiptap/extension-image@3.31.3 tiptap-markdown@0.9.0
```

Run: `git status --porcelain package.json package-lock.json`
Expected: both files show as modified.

- [ ] **Step 2: Write the failing test**

Create `components/editor/RichTextEditor.test.tsx`:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import RichTextEditor from './RichTextEditor'

// Uses renderWithIntl (not a plain RTL render) from the very first test in this
// file — Task 2 wires a toolbar with useTranslations() into RichTextEditor, and
// that requires an intl context to exist by then. Starting here avoids having to
// swap the render helper out from under later tests.
function setup(initialValue = '') {
  const onChange = vi.fn()
  renderWithIntl(
    <div>
      <span id="content-label">Nội dung</span>
      <RichTextEditor value={initialValue} onChange={onChange} labelId="content-label" />
    </div>
  )
  return { onChange }
}

describe('RichTextEditor', () => {
  it('mounts and renders the initial markdown content', async () => {
    setup('## Xin chào\n\nĐoạn văn.')
    await waitFor(() => expect(screen.getByLabelText('Nội dung')).toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 2, name: 'Xin chào' })).toBeInTheDocument()
    expect(screen.getByText('Đoạn văn.')).toBeInTheDocument()
  })

  it('cannot represent a level-1 heading — restricted to levels 2 and 3', async () => {
    // A literal "# ..." in loaded markdown is not coerced up to H2 — the level-1
    // heading node type isn't in the schema at all, so it silently becomes a
    // plain paragraph. Accepted trade-off (see spec): this only affects admins
    // re-opening old content that already had the duplicate-H1 SEO problem this
    // migration exists to fix, and the text itself is not lost, only its
    // heading-ness, which the admin can restore as a proper H2/H3 if intended.
    setup('# Cấp 1\n\nNội dung.')
    await waitFor(() => expect(screen.getByLabelText('Nội dung')).toBeInTheDocument())
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(screen.getByText('Cấp 1')).toBeInTheDocument()
  })

  it('calls onChange with markdown text when the document changes', async () => {
    const { onChange } = setup('hello')
    const editable = await screen.findByLabelText('Nội dung')
    editable.focus()
    // toggling a mark via keyboard shortcut is a real, supported ProseMirror
    // interaction (not a test-only trick) and exercises the same onUpdate path
    // real typing would.
    fireEvent.keyDown(editable, { key: 'a', code: 'KeyA', ctrlKey: true })
    fireEvent.keyDown(editable, { key: 'b', code: 'KeyB', ctrlKey: true })
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('**hello**'))
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/editor/RichTextEditor.test.tsx`
Expected: FAIL — `Cannot find module './RichTextEditor'` (file doesn't exist yet).

- [ ] **Step 4: Write the implementation**

Create `components/editor/RichTextEditor.tsx`:

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'

export default function RichTextEditor({
  value,
  onChange,
  labelId,
}: {
  value: string
  onChange: (value: string) => void
  labelId: string
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Markdown],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelId,
        class: 'prose max-w-none rounded-b-xl bg-surface p-4 text-body-md text-on-surface focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange((editor.storage.markdown as { getMarkdown: () => string }).getMarkdown())
    },
  })

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant">
      <EditorContent editor={editor} />
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/editor/RichTextEditor.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json components/editor/RichTextEditor.tsx components/editor/RichTextEditor.test.tsx
git commit -m "feat(editor): add RichTextEditor core (TipTap + markdown round-trip)"
```

---

## Task 2: Build RichTextToolbar (text formatting buttons)

**Files:**
- Create: `components/editor/RichTextToolbar.tsx`
- Test: `components/editor/RichTextToolbar.test.tsx`
- Modify: `components/editor/RichTextEditor.tsx` (render the toolbar)
- Modify: `components/editor/RichTextEditor.test.tsx` (toolbar is now present — update the `onChange` test to go through a real button click instead of a raw keyboard mark-toggle)
- Modify: `messages/vi.json` (new `Admin.RichTextToolbar` block)

**Interfaces:**
- Consumes: `Editor | null` from `@tiptap/react` (the object `useEditor()` in `RichTextEditor.tsx` returns).
- Produces: `RichTextToolbar({ editor: Editor | null, onRequestImage: () => void }): JSX.Element | null` — default export from `components/editor/RichTextToolbar.tsx`. Renders `null` while `editor` is `null` (matches `RichTextEditor`'s own render-while-mounting behavior). The `onRequestImage` prop exists now so Task 3 can wire it without touching this file's public shape again.

- [ ] **Step 1: Add the toolbar's translation strings**

In `messages/vi.json`, add a new `Admin.RichTextToolbar` block right before the existing `Admin.MarkdownToolbar` block (both coexist until Task 8 deletes the old one):

```json
    "RichTextToolbar": {
      "heading2": "Tiêu đề 2",
      "heading3": "Tiêu đề 3",
      "bold": "In đậm",
      "italic": "In nghiêng",
      "bulletList": "Danh sách gạch đầu dòng",
      "numberedList": "Danh sách đánh số",
      "blockquote": "Trích dẫn",
      "inlineCode": "Mã (code)",
      "link": "Chèn liên kết",
      "linkPrompt": "Nhập đường dẫn liên kết:",
      "image": "Ảnh"
    },
```

- [ ] **Step 2: Write the failing test**

Create `components/editor/RichTextToolbar.test.tsx`. This tests the toolbar against a real mounted `RichTextEditor`-equivalent editor instance (built with the same extensions as Task 1) rather than a hand-rolled fake, so the commands it exercises are the real ones a user's clicks will run:

```tsx
import { describe, expect, it, vi } from 'vitest'
import { screen, waitFor, act, fireEvent } from '@testing-library/react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { useEffect } from 'react'
import { renderWithIntl } from '@/test-utils/renderWithIntl'
import RichTextToolbar from './RichTextToolbar'

function Harness({
  initialValue,
  onReady,
  onRequestImage = vi.fn(),
}: {
  initialValue: string
  onReady: (editor: Editor) => void
  onRequestImage?: () => void
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Markdown],
    content: initialValue,
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor) onReady(editor)
  }, [editor, onReady])

  if (!editor) return null

  return (
    <div>
      <RichTextToolbar editor={editor} onRequestImage={onRequestImage} />
      <EditorContent editor={editor} />
    </div>
  )
}

async function mount(initialValue: string, onRequestImage?: () => void) {
  let captured: Editor | null = null
  renderWithIntl(<Harness initialValue={initialValue} onReady={(e) => (captured = e)} onRequestImage={onRequestImage} />)
  await waitFor(() => expect(captured).not.toBeNull())
  const editor = captured as unknown as Editor
  // select the whole document, the same way a user pressing Ctrl+A would —
  // no direct .selectAll() call needed, this goes through the toolbar's own
  // click handlers exactly like the real component will be driven.
  act(() => {
    editor.chain().focus().selectAll().run()
  })
  return editor
}

describe('RichTextToolbar', () => {
  it('renders nothing while the editor is not ready yet', () => {
    renderWithIntl(<RichTextToolbar editor={null} onRequestImage={vi.fn()} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('every format button has an aria-label and no visible text', async () => {
    await mount('text')
    for (const name of [
      'Tiêu đề 2',
      'Tiêu đề 3',
      'In đậm',
      'In nghiêng',
      'Danh sách gạch đầu dòng',
      'Danh sách đánh số',
      'Trích dẫn',
      'Mã (code)',
      'Chèn liên kết',
      'Ảnh',
    ]) {
      const button = screen.getByRole('button', { name })
      expect(button).toBeInTheDocument()
      expect(button.textContent?.trim()).toBe('')
    }
  })

  it('toggles bold on the current selection and reports active state', async () => {
    const editor = await mount('some text')
    fireEvent.click(screen.getByRole('button', { name: 'In đậm' }))
    expect(editor.storage.markdown.getMarkdown()).toBe('**some text**')
    expect(screen.getByRole('button', { name: 'In đậm' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('applies heading level 2', async () => {
    const editor = await mount('a heading')
    fireEvent.click(screen.getByRole('button', { name: 'Tiêu đề 2' }))
    expect(editor.storage.markdown.getMarkdown()).toBe('## a heading')
  })

  it('toggles a bullet list', async () => {
    const editor = await mount('item one')
    fireEvent.click(screen.getByRole('button', { name: 'Danh sách gạch đầu dòng' }))
    expect(editor.storage.markdown.getMarkdown()).toBe('- item one')
  })

  it('applies a link via window.prompt', async () => {
    const editor = await mount('a link')
    vi.stubGlobal('prompt', () => 'https://example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Chèn liên kết' }))
    expect(editor.storage.markdown.getMarkdown()).toBe('[a link](https://example.com)')
    vi.unstubAllGlobals()
  })

  it('calls onRequestImage when the image button is clicked', async () => {
    const onRequestImage = vi.fn()
    await mount('x', onRequestImage)
    fireEvent.click(screen.getByRole('button', { name: 'Ảnh' }))
    expect(onRequestImage).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/editor/RichTextToolbar.test.tsx`
Expected: FAIL — `Cannot find module './RichTextToolbar'`.

- [ ] **Step 4: Write the implementation**

Create `components/editor/RichTextToolbar.tsx`:

```tsx
'use client'

import { useTranslations } from 'next-intl'
import type { Editor } from '@tiptap/react'

function buttonClass(isActive: boolean): string {
  return `flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-surface-container-high ${
    isActive ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant'
  }`
}

export default function RichTextToolbar({
  editor,
  onRequestImage,
}: {
  editor: Editor | null
  onRequestImage: () => void
}) {
  const t = useTranslations('Admin.RichTextToolbar')

  if (!editor) return null

  function handleLink() {
    const previousUrl = editor!.getAttributes('link').href as string | undefined
    const url = window.prompt(t('linkPrompt'), previousUrl ?? '')
    if (url === null) return
    if (url === '') {
      editor!.chain().focus().unsetLink().run()
      return
    }
    editor!.chain().focus().setLink({ href: url }).run()
  }

  const buttons: Array<{ label: string; icon: string; isActive: boolean; onClick: () => void }> = [
    {
      label: t('heading2'),
      icon: 'format_h2',
      isActive: editor.isActive('heading', { level: 2 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: t('heading3'),
      icon: 'format_h3',
      isActive: editor.isActive('heading', { level: 3 }),
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      label: t('bold'),
      icon: 'format_bold',
      isActive: editor.isActive('bold'),
      onClick: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: t('italic'),
      icon: 'format_italic',
      isActive: editor.isActive('italic'),
      onClick: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: t('bulletList'),
      icon: 'format_list_bulleted',
      isActive: editor.isActive('bulletList'),
      onClick: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: t('numberedList'),
      icon: 'format_list_numbered',
      isActive: editor.isActive('orderedList'),
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: t('blockquote'),
      icon: 'format_quote',
      isActive: editor.isActive('blockquote'),
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: t('inlineCode'),
      icon: 'code',
      isActive: editor.isActive('code'),
      onClick: () => editor.chain().focus().toggleCode().run(),
    },
    {
      label: t('link'),
      icon: 'link',
      isActive: editor.isActive('link'),
      onClick: handleLink,
    },
  ]

  return (
    <div className="flex flex-wrap gap-1 rounded-t-xl border border-b-0 border-outline-variant bg-surface p-1.5">
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          aria-label={button.label}
          aria-pressed={button.isActive}
          onClick={button.onClick}
          className={buttonClass(button.isActive)}
        >
          <span className="material-symbols-outlined text-[20px]">{button.icon}</span>
        </button>
      ))}
      <button
        type="button"
        aria-label={t('image')}
        onClick={onRequestImage}
        className={buttonClass(false)}
      >
        <span className="material-symbols-outlined text-[20px]">image</span>
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Wire the toolbar into RichTextEditor**

In `components/editor/RichTextEditor.tsx`, add the import and render the toolbar above `EditorContent`. `onRequestImage` is a no-op for now — Task 3 replaces it:

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import RichTextToolbar from './RichTextToolbar'

export default function RichTextEditor({
  value,
  onChange,
  labelId,
}: {
  value: string
  onChange: (value: string) => void
  labelId: string
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), Markdown],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelId,
        class: 'prose max-w-none rounded-b-xl bg-surface p-4 text-body-md text-on-surface focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange((editor.storage.markdown as { getMarkdown: () => string }).getMarkdown())
    },
  })

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant">
      <RichTextToolbar editor={editor} onRequestImage={() => {}} />
      <EditorContent editor={editor} />
    </div>
  )
}
```

- [ ] **Step 6: Update RichTextEditor's own onChange test for the toolbar's presence**

In `components/editor/RichTextEditor.test.tsx`, replace the third test (`'calls onChange with markdown text when the document changes'`) — now that a real Bold button exists, use it instead of a raw keyboard mark-toggle:

```tsx
  it('calls onChange with markdown text when the document changes', async () => {
    const { onChange } = setup('hello')
    const editable = await screen.findByLabelText('Nội dung')
    editable.focus()
    fireEvent.keyDown(editable, { key: 'a', code: 'KeyA', ctrlKey: true })
    fireEvent.click(screen.getByRole('button', { name: 'In đậm' }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('**hello**'))
  })
```

- [ ] **Step 7: Run both test files to verify everything passes**

Run: `npx vitest run components/editor/`
Expected: PASS (all tests in `RichTextEditor.test.tsx` and `RichTextToolbar.test.tsx`).

- [ ] **Step 8: Commit**

```bash
git add components/editor/RichTextToolbar.tsx components/editor/RichTextToolbar.test.tsx components/editor/RichTextEditor.tsx components/editor/RichTextEditor.test.tsx messages/vi.json
git commit -m "feat(editor): add RichTextToolbar with icon-based formatting buttons"
```

---

## Task 3: Wire image insertion via ImagePickerDialog

**Files:**
- Modify: `components/editor/RichTextEditor.tsx`
- Modify: `components/editor/RichTextEditor.test.tsx`

**Interfaces:**
- Consumes: `ImagePickerDialog` from `@/components/admin/ImagePickerDialog` (existing, unchanged — props `{ open, uploadUrlEndpoint, onCancel, onConfirm: ({url, alt}) => void }`), `@tiptap/extension-image` default export.
- Produces: `RichTextEditor` now takes one more required prop, `uploadUrlEndpoint: string` — every existing caller (none yet — `BlogPostForm`/`ForumPostForm` integration is Tasks 6/7) will need to pass it.

- [ ] **Step 1: Write the failing test**

Add to `components/editor/RichTextEditor.test.tsx`:

```tsx
  it('inserts an image via the toolbar image button and ImagePickerDialog', async () => {
    const onChange = vi.fn()
    renderWithIntl(
      <div>
        <span id="content-label">Nội dung</span>
        <RichTextEditor value="before" onChange={onChange} labelId="content-label" uploadUrlEndpoint="/blog/upload-url" />
      </div>
    )
    await waitFor(() => expect(screen.getByLabelText('Nội dung')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Ảnh' }))
    fireEvent.change(screen.getByLabelText('Đường dẫn ảnh'), { target: { value: 'https://example.com/a.jpg' } })
    fireEvent.change(screen.getByLabelText('Mô tả ảnh (alt text)'), { target: { value: 'Mô tả ảnh' } })
    fireEvent.click(screen.getByRole('button', { name: 'Chèn ảnh' }))

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(expect.stringContaining('![Mô tả ảnh](https://example.com/a.jpg)'))
    )
    expect(screen.queryByLabelText('Đường dẫn ảnh')).not.toBeInTheDocument()
  })
```

Update every earlier test in the same file to pass the new required prop — add `uploadUrlEndpoint="/blog/upload-url"` to the `RichTextEditor` element inside the `setup()` helper at the top of the file:

```tsx
function setup(initialValue = '') {
  const onChange = vi.fn()
  render(
    <div>
      <span id="content-label">Nội dung</span>
      <RichTextEditor value={initialValue} onChange={onChange} labelId="content-label" uploadUrlEndpoint="/blog/upload-url" />
    </div>
  )
  return { onChange }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run components/editor/RichTextEditor.test.tsx`
Expected: FAIL on the new test — clicking "Ảnh" does nothing (no dialog opens) since `onRequestImage` is still a no-op.

- [ ] **Step 3: Write the implementation**

Replace `components/editor/RichTextEditor.tsx` in full:

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import ImageExtension from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { useState } from 'react'
import ImagePickerDialog from '@/components/admin/ImagePickerDialog'
import RichTextToolbar from './RichTextToolbar'

export default function RichTextEditor({
  value,
  onChange,
  labelId,
  uploadUrlEndpoint,
}: {
  value: string
  onChange: (value: string) => void
  labelId: string
  uploadUrlEndpoint: string
}) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false)

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } }), ImageExtension, Markdown],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelId,
        class: 'prose max-w-none rounded-b-xl bg-surface p-4 text-body-md text-on-surface focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange((editor.storage.markdown as { getMarkdown: () => string }).getMarkdown())
    },
  })

  return (
    <div className="overflow-hidden rounded-xl border border-outline-variant">
      <RichTextToolbar editor={editor} onRequestImage={() => setImageDialogOpen(true)} />
      <EditorContent editor={editor} />
      <ImagePickerDialog
        open={imageDialogOpen}
        uploadUrlEndpoint={uploadUrlEndpoint}
        onCancel={() => setImageDialogOpen(false)}
        onConfirm={({ url, alt }) => {
          editor?.chain().focus().setImage({ src: url, alt }).run()
          setImageDialogOpen(false)
        }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run components/editor/RichTextEditor.test.tsx`
Expected: PASS (all tests, including the new image-insertion one).

- [ ] **Step 5: Commit**

```bash
git add components/editor/RichTextEditor.tsx components/editor/RichTextEditor.test.tsx
git commit -m "feat(editor): wire image insertion through the existing ImagePickerDialog"
```

---

## Task 4: Downgrade H1 to H2 in the render pipeline

**Files:**
- Modify: `lib/markdown.ts:15-36`
- Modify: `lib/markdown.test.ts`

**Interfaces:**
- No signature change — `renderMarkdown(content: string): string` and `extractHeadings(html: string): HeadingEntry[]` keep the exact same shape. Only the H1 behavior changes.

- [ ] **Step 1: Write the failing test**

Add to `lib/markdown.test.ts`, inside the existing `describe('renderMarkdown', ...)` block:

```tsx
  it('downgrades a level-1 heading to h2, giving it an id like any other level-2 heading', () => {
    const html = renderMarkdown('# Tiêu đề chính\n\nĐoạn văn.')
    expect(html).not.toContain('<h1>')
    expect(html).toContain('<h2 id="tieu-de-chinh">Tiêu đề chính</h2>')
  })
```

And add to the existing `describe('extractHeadings', ...)` block:

```tsx
  it('includes a downgraded level-1 heading as a depth-2 entry', () => {
    const html = renderMarkdown('# Tiêu đề chính')
    expect(extractHeadings(html)).toEqual([{ id: 'tieu-de-chinh', depth: 2, text: 'Tiêu đề chính' }])
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/markdown.test.ts`
Expected: FAIL — current output still contains `<h1>Tiêu đề chính</h1>` with no id.

- [ ] **Step 3: Write the implementation**

In `lib/markdown.ts`, replace the `heading` renderer (lines 20-30):

```ts
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens)
        const effectiveDepth = depth === 1 ? 2 : depth
        if (effectiveDepth !== 2 && effectiveDepth !== 3) {
          return `<h${depth}>${html}</h${depth}>\n`
        }
        const base = slugify(html.replace(/<[^>]+>/g, '')) || 'section'
        const count = slugCounts.get(base) ?? 0
        slugCounts.set(base, count + 1)
        const id = count === 0 ? base : `${base}-${count + 1}`
        return `<h${effectiveDepth} id="${id}">${html}</h${effectiveDepth}>\n`
      },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/markdown.test.ts`
Expected: PASS (all tests, including the two new ones).

- [ ] **Step 5: Commit**

```bash
git add lib/markdown.ts lib/markdown.test.ts
git commit -m "fix(markdown): downgrade level-1 headings to h2 to avoid a duplicate page H1"
```

---

## Task 5: Write real `.prose` CSS

**Files:**
- Modify: `app/globals.css`

**Interfaces:** None — this is pure CSS, no component/prop changes. Applies automatically to every existing `.prose` consumer (`app/blog/[slug]/page.tsx`, `components/forum/ForumPostDetail.tsx`, `components/admin/ForumPostViewDialog.tsx`, `components/faq/FaqAccordionItem.tsx`) and to the new editor canvas from Task 1 (`RichTextEditor` already sets `class: 'prose max-w-none ...'` on its content element).

- [ ] **Step 1: Append the prose rules to `app/globals.css`**

Add this block at the end of the file (after the existing `body { ... }` rule):

```css

.prose {
  color: var(--color-on-surface);
}

.prose h2 {
  margin-top: var(--spacing-space-lg);
  margin-bottom: var(--spacing-space-sm);
  font-size: var(--text-headline-sm);
  line-height: var(--text-headline-sm--line-height);
  font-weight: var(--text-headline-sm--font-weight);
  color: var(--color-on-surface);
}

.prose h3 {
  margin-top: var(--spacing-space-md);
  margin-bottom: var(--spacing-space-xs);
  font-size: var(--text-title-md);
  line-height: var(--text-title-md--line-height);
  font-weight: var(--text-title-md--font-weight);
  color: var(--color-on-surface);
}

.prose p {
  margin-top: var(--spacing-space-sm);
  margin-bottom: var(--spacing-space-sm);
}

.prose ul,
.prose ol {
  margin-top: var(--spacing-space-sm);
  margin-bottom: var(--spacing-space-sm);
  padding-left: var(--spacing-space-lg);
}

.prose ul {
  list-style-type: disc;
}

.prose ol {
  list-style-type: decimal;
}

.prose li {
  margin-top: var(--spacing-space-xs);
}

.prose blockquote {
  margin-top: var(--spacing-space-md);
  margin-bottom: var(--spacing-space-md);
  padding-left: var(--spacing-space-md);
  border-left: 3px solid var(--color-outline-variant);
  color: var(--color-on-surface-variant);
  font-style: italic;
}

.prose code {
  padding: 0.125rem 0.375rem;
  border-radius: var(--radius);
  background: var(--color-surface-container);
  font-size: 0.9em;
  font-family: ui-monospace, monospace;
}

.prose a {
  color: var(--color-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.prose img {
  display: block;
  margin: var(--spacing-space-lg) auto;
  max-width: 100%;
  height: auto;
  border-radius: 1rem;
}
```

- [ ] **Step 2: Visually verify against a real page**

Start the backend (`uvicorn app.main:app --reload --port 8000` from `/home/nuc/Documents/project/fashion-web/backend`, venv activated) and the frontend (`npm run dev` from this repo) in the background, then:

Run: `curl -s http://localhost:3000/blog/top-website-phoi-do | grep -c 'class="prose'`
Expected: at least 1 — `top-website-phoi-do` is a real seeded blog post (confirmed present via `GET /blog` during this plan's research phase). A full visual check (does it actually *look* right, not just that the class string is present) happens in Task 9's live smoke test, once real WYSIWYG-authored content with an image exists to look at.

Then stop both servers: `pkill -f "uvicorn app.main:app --reload --port 8000"` and `pkill -f "next dev"`.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "fix(css): give .prose real typography and centered images (was completely unstyled)"
```

---

## Task 6: Integrate RichTextEditor into BlogPostForm

**Files:**
- Modify: `components/admin/BlogPostForm.tsx`
- Modify: `components/admin/BlogPostForm.test.tsx`
- Modify: `messages/vi.json` (`Admin.BlogForm.fields.content` label, drop now-dead `tabWrite`/`tabPreview` keys)

**Interfaces:**
- Consumes: `RichTextEditor` from Task 3 (`{ value, onChange, labelId, uploadUrlEndpoint }`).

- [ ] **Step 1: Update the translation strings**

In `messages/vi.json`, inside `Admin.BlogForm`:
- Change `"content": "Nội dung (Markdown)"` to `"content": "Nội dung"`.
- Delete the `"tabWrite": "Soạn thảo",` and `"tabPreview": "Xem trước",` lines.

- [ ] **Step 2: Update the failing tests first**

In `components/admin/BlogPostForm.test.tsx`:

1. Delete these three tests entirely (each superseded by `RichTextEditor`/`RichTextToolbar`'s own test suites — see Tasks 1-3):
   - `'formats the selected content text as bold using the markdown toolbar'`
   - `'switches to the preview tab and renders the content as markdown'`
   - `'inserts an image into the content via the toolbar image picker'`

2. In `'sets the cover image URL from the image picker and submits it'`, delete the line that no longer has a matching form control:
   ```tsx
   fireEvent.change(screen.getByLabelText('Nội dung (Markdown)'), { target: { value: 'Nội dung' } })
   ```
   (this test is about the cover image URL flowing into the submit payload, not body content — the body field can stay at its default empty string.)

3. Add a new test verifying the editor renders existing content when editing:
   ```tsx
   it('renders the existing post content in the editor when editing', () => {
     vi.stubGlobal('fetch', vi.fn())
     renderWithIntl(<BlogPostForm initialPost={EXISTING_POST} />)
     expect(screen.getByText('Nội dung hiện có')).toBeInTheDocument()
   })
   ```

- [ ] **Step 3: Run tests to verify the remaining ones fail correctly**

Run: `npx vitest run components/admin/BlogPostForm.test.tsx`
Expected: FAIL — the new "renders the existing post content" test fails (old `<textarea>` still present, but the label text is now wrong for it since Step 1 changed the translation and the component hasn't been updated); the three deleted tests are gone from the run entirely.

- [ ] **Step 4: Update the component**

In `components/admin/BlogPostForm.tsx`, replace the import block (lines 1-12):

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import ImagePickerDialog from '@/components/admin/ImagePickerDialog'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { apiFetch } from '@/lib/apiClient'
import { BLOG_CATEGORIES, type BlogCategory, type BlogPost } from '@/lib/db'
import { slugify } from '@/lib/slugify'
```

Replace the state block (lines 22-37) — drops `contentTab`, `imageDialogOpen` (the body-image dialog; `RichTextEditor` owns its own now), and `contentTextareaRef`, keeps everything else including `coverDialogOpen` for the unrelated cover-image field:

```tsx
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [slug, setSlug] = useState(initialPost?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing)
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '')
  const [content, setContent] = useState(initialPost?.content ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(initialPost?.coverImageUrl ?? '')
  const [category, setCategory] = useState<BlogCategory>(initialPost?.category ?? BLOG_CATEGORIES[0])
  const [authorName, setAuthorName] = useState(initialPost?.authorName ?? '')
  const [isFeatured, setIsFeatured] = useState(initialPost?.isFeatured ?? false)
  const [publishedAt, setPublishedAt] = useState(initialPost?.publishedAt ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [coverDialogOpen, setCoverDialogOpen] = useState(false)
```

Replace the content field block and the body `ImagePickerDialog` right after it (originally lines 129-188) with:

```tsx
      <div className="space-y-1.5">
        <span id="post-content-label" className="text-label-md font-semibold text-on-surface">
          {t('fields.content')}
        </span>
        <RichTextEditor
          value={content}
          onChange={setContent}
          labelId="post-content-label"
          uploadUrlEndpoint="/blog/upload-url"
        />
        {errors.content && <p className="text-label-sm text-error">{errors.content}</p>}
      </div>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run components/admin/BlogPostForm.test.tsx`
Expected: PASS (all remaining/updated tests).

- [ ] **Step 6: Commit**

```bash
git add components/admin/BlogPostForm.tsx components/admin/BlogPostForm.test.tsx messages/vi.json
git commit -m "feat(blog-admin): replace the markdown textarea with RichTextEditor"
```

---

## Task 7: Integrate RichTextEditor into ForumPostForm

**Files:**
- Modify: `components/forum/ForumPostForm.tsx`
- Modify: `components/forum/ForumPostForm.test.tsx`
- Modify: `messages/vi.json` (drop now-dead `Forum.PostForm.tabWrite`/`tabPreview` keys)

**Interfaces:**
- Consumes: `RichTextEditor` from Task 3.

- [ ] **Step 1: Update the translation strings**

In `messages/vi.json`, inside `Forum.PostForm`, delete the `"tabWrite": "Soạn thảo",` and `"tabPreview": "Xem trước",` lines. (`fields.body` is already just `"Nội dung"` — no rename needed here, unlike blog.)

- [ ] **Step 2: Update the failing tests first**

In `components/forum/ForumPostForm.test.tsx`:

1. Remove the three `fireEvent.change(screen.getByLabelText('Nội dung'), { target: { value: 'Nội dung mới' } })` lines (there is no longer a `<textarea>`/form control that a `change` event applies to) — from `'POSTs to /forum/posts when creating and redirects to my-posts'`, `'shows a generic error and does not redirect when the API rejects the submission'`, and `'uploads a picked image and submits its resolved URL'`.

2. In `'uploads a picked image and submits its resolved URL'`, update the final payload assertion — body is now the default empty string, since that test is about the image upload flow, not body text:
   ```tsx
     expect(fetch).toHaveBeenCalledWith(
       '/forum/posts',
       expect.objectContaining({
         method: 'POST',
         body: JSON.stringify({
           title: 'Bài mới',
           body: '',
           category: 'general',
           imageUrl: 'https://blob.example.com/u1/x.jpg',
         }),
       })
     )
   ```

3. Add a new test verifying the editor renders existing content when editing:
   ```tsx
   it('renders the existing post body in the editor when editing', () => {
     vi.stubGlobal('fetch', vi.fn())
     renderWithIntl(<ForumPostForm initialPost={EXISTING_POST} />)
     expect(screen.getByText('Nội dung hiện có')).toBeInTheDocument()
   })
   ```

- [ ] **Step 3: Run tests to verify they fail appropriately**

Run: `npx vitest run components/forum/ForumPostForm.test.tsx`
Expected: FAIL — the new test fails (component not updated yet); other tests may still pass incidentally since the `content`/`body` field wasn't the focus, but re-run after Step 4 regardless.

- [ ] **Step 4: Update the component**

In `components/forum/ForumPostForm.tsx`, replace the import block (lines 1-11):

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import RichTextEditor from '@/components/editor/RichTextEditor'
import { apiFetch } from '@/lib/apiClient'
import { FORUM_CATEGORIES, type ForumCategory, type ForumPost } from '@/lib/forum'
```

Replace the state block (lines 21-30) — drops `bodyTab`, `bodyImageDialogOpen`, `bodyTextareaRef`:

```tsx
  const [title, setTitle] = useState(initialPost?.title ?? '')
  const [category, setCategory] = useState<ForumCategory>(initialPost?.category ?? FORUM_CATEGORIES[0])
  const [body, setBody] = useState(initialPost?.body ?? '')
  const [imageUrl, setImageUrl] = useState<string | null>(initialPost?.imageUrl ?? null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
```

Replace the body field block and the body `ImagePickerDialog` right after it (originally lines 126-185) with:

```tsx
      <div className="space-y-1.5">
        <span id="forum-body-label" className="text-label-md font-semibold text-on-surface">
          {t('PostForm.fields.body')}
        </span>
        <RichTextEditor
          value={body}
          onChange={setBody}
          labelId="forum-body-label"
          uploadUrlEndpoint="/forum/upload-url"
        />
        {errors.body && <p className="text-label-sm text-error">{errors.body}</p>}
      </div>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run components/forum/ForumPostForm.test.tsx`
Expected: PASS (all remaining/updated tests).

- [ ] **Step 6: Commit**

```bash
git add components/forum/ForumPostForm.tsx components/forum/ForumPostForm.test.tsx messages/vi.json
git commit -m "feat(forum): replace the markdown textarea with RichTextEditor"
```

---

## Task 8: Remove the dead markdown-textarea code

**Files:**
- Delete: `components/admin/MarkdownToolbar.tsx`, `components/admin/MarkdownToolbar.test.tsx`
- Delete: `lib/markdownEditor.ts`, `lib/markdownEditor.test.ts`
- Modify: `messages/vi.json` (remove the now-unused `Admin.MarkdownToolbar` block)

**Interfaces:** None — by this point, Tasks 6 and 7 have removed every consumer of these four files.

- [ ] **Step 1: Confirm nothing still imports the old files**

Run: `grep -rln "MarkdownToolbar\|markdownEditor" --include="*.tsx" --include="*.ts" . | grep -v node_modules | grep -v ".next"`
Expected: only the four files being deleted in this task show up (their own definitions/tests), nothing else.

- [ ] **Step 2: Delete the files**

```bash
git rm components/admin/MarkdownToolbar.tsx components/admin/MarkdownToolbar.test.tsx lib/markdownEditor.ts lib/markdownEditor.test.ts
```

- [ ] **Step 3: Remove the now-unused translation block**

In `messages/vi.json`, delete the entire `Admin.MarkdownToolbar` block (the one with `bold`/`italic`/`heading2`/... keys — distinct from the `Admin.RichTextToolbar` block added in Task 2, which stays).

- [ ] **Step 4: Run the full frontend test suite**

Run: `npx vitest run`
Expected: PASS — no failures from missing imports, no leftover references. (Pre-existing unrelated failures, if any were already present before this plan started, are out of scope for this task — only failures caused by this deletion matter here.)

- [ ] **Step 5: Commit**

```bash
git add messages/vi.json
git commit -m "chore(editor): remove the old markdown-textarea toolbar and text-splicing helpers"
```

---

## Task 9: Full verification

**Files:** None modified — verification only.

- [ ] **Step 1: Run the full frontend test suite**

Run: `npx vitest run`
Expected: PASS. Compare the failure count (if any) against the baseline noted at the start of this plan's execution — this task must not introduce any new failures.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Live smoke test — blog admin editor**

Start both dev servers (backend `uvicorn app.main:app --reload --port 8000` from `/home/nuc/Documents/project/fashion-web/backend` with its venv activated, frontend `npm run dev` from this repo), then either manually or via a short Playwright script:
1. Log in as `admin@twistfit.vn` / `admin1234`.
2. Go to `/admin/blog/new`.
3. Click the H2 button, type a heading; click Bold, type some text; click the image button, paste an image URL, insert it.
4. Confirm the editor canvas shows real formatting (bold text is visibly bold, the image is centered, not left-aligned or tiny) — not raw `**`/`![]()` syntax.
5. Save the post, then open its public `/blog/<slug>` page and confirm it matches what the editor showed (same centered image, same heading style) and that `view-source:` (or `curl`) shows exactly one `<h1>` on the page.

- [ ] **Step 4: Live smoke test — forum post form**

Repeat the same flow at `/forum/new` (or wherever the forum post creation route is) logged in as a regular user, confirming the body editor behaves identically to the blog one.

- [ ] **Step 5: Stop both dev servers**

```bash
pkill -f "uvicorn app.main:app --reload --port 8000"
pkill -f "next dev"
```

Confirm both are down: `curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/health --max-time 2` and the equivalent for `http://localhost:3000/` should both fail to connect.

- [ ] **Step 6: Report**

Summarize to the user: what was verified, any deviations from the plan encountered during execution and why, and the final test/type-check status.
