const HREF =
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0'
const LINK_ID = 'material-symbols-stylesheet'

// Material Symbols isn't available via next/font/google, so it's loaded as a
// stylesheet link. `rel="preload"` fetches it without blocking render; the
// inline script flips the link to `rel="stylesheet"` once loaded, applying
// it. This has to be a plain script executed as the HTML parses, not a React
// onLoad handler — this component is server-rendered, so by the time React
// hydrates and could attach a synthetic onLoad listener, the browser's
// native `load` event on the link may have already fired (especially from
// cache), and a listener attached after the fact never sees it, leaving the
// stylesheet stuck unapplied. The script looks the link up by id rather than
// `previousElementSibling` because Next's App Router reorders/hoists <head>
// tags, so the two elements don't stay adjacent in the rendered DOM.
export default function MaterialSymbolsStylesheet() {
  return (
    <>
      <link id={LINK_ID} rel="preload" href={HREF} as="style" />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var l=document.getElementById('${LINK_ID}');if(!l)return;var apply=function(){l.onload=null;l.rel='stylesheet'};l.onload=apply;if(l.sheet)apply()})()`,
        }}
      />
      <noscript>
        <link rel="stylesheet" href={HREF} />
      </noscript>
    </>
  )
}
