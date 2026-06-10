# Doc Signer

Client-side PDF signer. Open a PDF (shared from WhatsApp via PWA, or picked
manually), add a drawn / typed / saved signature, and export by download, share,
or print. No server — everything runs in your browser.

## Stack

Vite + React + TypeScript · Tailwind v4 + shadcn/ui (Claude-style theme) ·
pdf.js (render) · pdf-lib (write/flatten) · signature_pad · vite-plugin-pwa ·
oxc (oxlint + oxfmt) · Vitest.

## Develop

```
npm install
npm run dev
```

## Test

```
npm test
```

## Lint / Format

```
npm run lint        # oxlint
npm run fmt          # oxfmt (write)
npm run fmt:check    # oxfmt (check only)
```

## Build

```
npm run build && npm run preview
```

## Notes

`pdfjs-dist` is pinned to `5.4.624` (exact). Versions ≥ 5.5 call
`Map.prototype.getOrInsertComputed`, an unshipped TC39 proposal method absent in
current browsers, which throws during page rendering. Do not bump past 5.4.x until
that method ships broadly.

## WhatsApp share target

Install the app to your home screen (Android / Chromium). It then appears in
WhatsApp's share sheet for PDF files: share a PDF, the app launches, and the
viewer opens with the document ready to sign.

iOS Safari does not support the Web Share Target API — there, open the app URL
and use **Open PDF** to pick the file manually. Re-sharing the signed PDF back to
WhatsApp likewise requires Web Share with files (Android / Chromium); elsewhere it
falls back to a download.

## iOS Shortcut (share a PDF straight into the app)

iOS can't register a web Share Target, but an iOS **Shortcut** in the Share Sheet
gets you from WhatsApp to a loaded PDF in ~2 taps. The app reads a base64 PDF from
the URL fragment (`/#pdf=<base64>`), which never leaves the device.

Create the Shortcut (Shortcuts app → **+**):

1. Shortcut settings → **Show in Share Sheet** → accept **Files / PDFs**.
2. Action **Base64 Encode** — input: **Shortcut Input**. (Set _Line Breaks: None_.)
3. Action **Text**: `https://doc-signer-beige.vercel.app/#pdf=` then insert the
   **Base64 Encoded** variable right after the `=`.
4. Action **Open URLs** — input: the **Text** from step 3.
5. Name it e.g. "Sign PDF".

Then: WhatsApp → a PDF → **Share** → **Sign PDF** → the app opens with the PDF
loaded, ready to sign. Works best for typical documents; very large PDFs (>~2 MB)
can exceed URL-length limits.
