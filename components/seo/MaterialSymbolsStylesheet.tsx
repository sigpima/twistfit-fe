'use client'

const HREF =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0'

// Material Symbols isn't available via next/font/google, so it's loaded as a
// stylesheet link. Loading it with `media="print"` keeps it off the critical
// rendering path, then it's swapped to `all` once fetched — the standard
// non-blocking stylesheet pattern. This needs a Client Component because the
// swap requires an onLoad handler, which a Server Component can't attach.
export default function MaterialSymbolsStylesheet() {
  return (
    <>
      <link
        rel="stylesheet"
        href={HREF}
        media="print"
        onLoad={(event) => {
          event.currentTarget.media = 'all'
        }}
      />
      <noscript>
        <link rel="stylesheet" href={HREF} />
      </noscript>
    </>
  )
}
