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
gets you from WhatsApp to a loaded PDF in ~2 taps. The app accepts a PDF three ways:

| Param                         | Meaning                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| `?id=<id>`                    | Read-once fetch from the ephemeral upload endpoint (recommended). |
| `?url=<href>` / `#url=<href>` | Fetch a PDF directly from a link (link host must allow CORS).     |
| `#pdf=<base64>`               | Inline base64 (tiny files only; large PDFs exceed URL limits).    |

### Recommended Shortcut — ephemeral upload (any size, fully automatic)

The PDF is uploaded to the app's own Vercel Blob store, fetched once by the app,
then **deleted immediately** (read-once). Create the Shortcut (Shortcuts app → **+**):

1. Shortcut settings → **Show in Share Sheet** → accept **Files / PDFs**.
2. **Get Contents of URL**
   - URL: `https://doc-signer-beige.vercel.app/api/upload`
   - Method: **POST**
   - Request Body: **File** → **Shortcut Input**
3. **Get Dictionary Value** → key `id` (from the previous step's response).
4. **Text**: `https://doc-signer-beige.vercel.app/?id=` + the **Dictionary Value**.
5. **Open URLs** → the Text from step 4.
6. Name it e.g. "Sign PDF".

Then: WhatsApp → a PDF → **Share** → **Sign PDF** → the app opens with the PDF
loaded, ready to sign. Limit ~4 MB per PDF (Vercel function body limit). The PDF
briefly transits the app's own Vercel Blob store and is deleted on first read.

### Privacy-first alternative (nothing leaves the device)

Make the Shortcut just **Open URLs** → `https://doc-signer-beige.vercel.app`, then
tap **Open PDF** in the app and pick the file. One extra tap, fully client-side.
