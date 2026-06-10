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

## WhatsApp share target

Install the app to your home screen (Android / Chromium). It then appears in
WhatsApp's share sheet for PDF files: share a PDF, the app launches, and the
viewer opens with the document ready to sign.

iOS Safari does not support the Web Share Target API — there, open the app URL
and use **Open PDF** to pick the file manually. Re-sharing the signed PDF back to
WhatsApp likewise requires Web Share with files (Android / Chromium); elsewhere it
falls back to a download.
