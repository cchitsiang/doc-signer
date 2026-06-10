# Doc Signer — Design Spec

**Date:** 2026-06-10
**Status:** Approved for planning

## Summary

A fully client-side (no server) Vite + React web app for signing and annotating
PDFs in the browser. The primary entry point is sharing a PDF from WhatsApp; the
app launches a PDF viewer and lets the user add a drawn signature, typed text, or
a saved signature image, then export the flattened PDF via download, re-share, or
print.

All PDF processing happens in the browser. No backend, no network calls after the
initial app load.

## Goals

- Open a PDF entirely client-side and render it for viewing.
- Add annotations to any page: freehand drawn signature, typed text, and a saved
  signature image (drawn-then-saved, reused from localStorage, or uploaded PNG).
- Place, move, and resize annotations on the page with touch and mouse.
- Flatten annotations into the PDF and output via: download, re-share to WhatsApp
  (Web Share API), and print.
- Two entry points: PWA Share Target (WhatsApp share sheet) and manual file pick.
- Mobile-first, touch-friendly UI built with shadcn/ui.

## Non-Goals (YAGNI)

- No server, accounts, or cloud storage.
- No multi-party signing workflows, audit trails, or certificate-based digital
  signatures (this is visible-mark signing, not cryptographic e-signature).
- No PDF form-field detection/auto-fill (date/checkmark stamps were considered and
  dropped from scope).
- No PDF page editing beyond annotation (no merge/split/reorder/delete pages).

## Tech Stack

- **Vite + React + TypeScript** — application base.
- **Tailwind CSS + shadcn/ui** — styling and UI primitives (Radix-based,
  components copied into the repo via the shadcn CLI).
- **pdfjs-dist (pdf.js)** — render each PDF page to a canvas for viewing.
- **pdf-lib** — write annotations into the PDF bytes; flatten and save.
- **signature_pad** — smooth freehand signature capture on a canvas; export PNG.
- **vite-plugin-pwa** — web app manifest + service worker for the Share Target
  entry point and offline capability.

### Rejected alternatives

- **PDFTron/Apryse, Nutrient** — commercial SDKs; cost and overkill for this scope.
- **react-pdf alone** — good for viewing, but cannot write/edit PDFs, so pdf-lib
  would still be required.

## Architecture

### The coordinate problem (core complexity)

pdf.js renders pages at a screen scale with origin **top-left** in CSS pixels,
affected by zoom and device-pixel-ratio. pdf-lib writes content in PDF **points**
with origin **bottom-left**. Every placed annotation must convert between these
spaces accurately, or marks land in the wrong spot.

This conversion is isolated in a single small module (`pdf/coordinates`) with pure
functions and unit tests. All placement math goes through it; no component does
ad-hoc coordinate math.

### Module boundaries

Each module has one purpose, a defined interface, and is independently testable.

- **`pdf/loader`** — Input: PDF bytes (`ArrayBuffer`/`Uint8Array`). Output: a
  loaded pdf.js document and a `renderPage(pageNumber, scale) -> canvas/bitmap`
  function. Depends on: pdfjs-dist. Owns pdf.js worker setup.

- **`pdf/coordinates`** — Pure conversion functions between screen space (rendered
  canvas CSS pixels) and PDF point space, per page, accounting for scale and page
  dimensions/rotation. Origin flip (top-left ↔ bottom-left) lives here. No
  dependencies. Fully unit-tested.

- **`pdf/exporter`** — Input: original PDF bytes + the annotation list. Uses
  pdf-lib to draw each annotation onto the correct page at converted coordinates
  (embed PNG for signatures/images, draw text for typed annotations), then returns
  flattened PDF bytes. Depends on: pdf-lib, `pdf/coordinates`.

- **`signature/SignaturePad`** — Wraps signature_pad. Draw a signature, clear, and
  export as a trimmed PNG data URL. Save/load named signatures to localStorage.
  Depends on: signature_pad.

- **`signature/storage`** — Pure localStorage read/write for saved signature PNGs
  (list, save, delete). No UI dependency.

- **`annotations/store`** — React state holding the list of placed annotations.
  Each annotation: `{ id, type: 'signature' | 'text', pageIndex, xScreen, yScreen,
  widthScreen, heightScreen, payload }` where payload is a PNG data URL (signature)
  or `{ text, fontSize, color }` (text). Actions: add, update (move/resize/edit),
  remove, clear. Screen-space coords are the source of truth while editing; export
  converts to PDF space at save time.

- **`share/output`** — Helpers: `download(bytes, filename)`,
  `shareToWhatsApp(bytes, filename)` via Web Share API (`navigator.canShare` with a
  `File`), and `printPdf(bytes)`. Each degrades gracefully when unsupported
  (e.g., hide Share if `navigator.share` absent).

- **`pwa/shareTargetHandler`** — Receives a PDF file shared into the installed PWA.
  The service worker (configured via vite-plugin-pwa) handles the `share_target`
  POST and forwards the file to the app (e.g., via a cached request the app reads
  on launch, or postMessage). Output: PDF bytes handed to `pdf/loader`.

### Components (UI)

- **`LandingScreen`** — Shown when no PDF is loaded. shadcn `Card` + `Button`
  file picker; drag-and-drop zone on desktop. Triggers `pdf/loader`.

- **`Viewer`** — Scrollable, vertically stacked rendered pages (canvas per page),
  mobile-first. Hosts the annotation overlay layer per page. Handles tap-to-place.

- **`PlacedAnnotation`** — A draggable/resizable overlay element rendered above a
  page canvas for each annotation in the store. Touch + mouse drag and resize
  handles. Text annotations editable via shadcn `Input`/`Popover`.

- **`Toolbar`** — shadcn `ToggleGroup` for tool selection (draw signature / type
  text / saved signature), `Button`s, `Tooltip`s. Sticky, thumb-reachable on
  mobile.

- **`SignatureDialog`** — shadcn `Dialog` (or `Drawer` on small screens) wrapping
  the signature pad. `Tabs`: Draw / Saved / Upload. Confirm inserts a signature
  annotation at a default position.

- **`OutputActions`** — Buttons (or `DropdownMenu`) for Download / Share / Print.
  `Sonner` toasts for success/error feedback.

- **`App`** — Top-level state machine: `no-pdf` → `editing` → `exporting`. Wires
  the share target handler on launch.

## Data Flow

1. **Entry:** PWA Share Target POST (service worker) **or** manual file pick →
   PDF bytes.
2. `pdf/loader` parses bytes; `Viewer` renders pages to canvases at a chosen scale.
3. User picks a tool → places an annotation → `annotations/store` adds it in
   screen space; `PlacedAnnotation` overlays let them move/resize/edit.
4. On **Done/Export:** `pdf/exporter` reads original bytes + annotation list,
   converts each via `pdf/coordinates` to PDF points, draws with pdf-lib, returns
   flattened bytes.
5. `share/output` performs download / share-to-WhatsApp / print on the bytes.

The original PDF bytes are retained in memory for export; annotations are never
baked in until export, so editing stays non-destructive.

## Error Handling

- **Invalid/corrupt PDF or non-PDF file:** loader rejects; `LandingScreen` shows
  an inline error and a Sonner toast; user can pick another file.
- **Large PDFs:** render pages lazily/on-demand to bound memory; show a loading
  state per page.
- **Share unsupported:** if `navigator.canShare`/`share` is absent or rejects the
  file, hide/disable Share and fall back to Download (toast explains).
- **Print unsupported edge cases:** fall back to opening the PDF blob in a new tab.
- **localStorage full/unavailable:** saved-signature save fails gracefully with a
  toast; drawing/uploading still works for one-off use.
- **Share Target launch with no file:** app falls back to `LandingScreen`.

## Testing Strategy

- **Unit (primary):** `pdf/coordinates` conversions across scales, page sizes, and
  rotations (round-trip screen→PDF→screen within tolerance). `signature/storage`
  read/write. `annotations/store` actions.
- **Integration:** `pdf/exporter` produces a valid PDF with an embedded image and
  text at expected coordinates (load the output back with pdf.js/pdf-lib and assert
  object presence/placement). Loader accepts valid bytes and rejects garbage.
- **Manual/E2E (smoke):** load a sample PDF, place a signature + text, export, and
  verify the downloaded PDF visually. Verify Share Target on an Android device with
  the installed PWA.
- TDD: write failing tests first for the pure modules (`coordinates`, `storage`,
  `store`) before implementation.

## Platform Notes

- **Mobile-first**, since the WhatsApp share flow is primarily mobile.
- **PWA Share Target** for `application/pdf` is best-supported on Android/Chromium.
  iOS Safari lacks Share Target; there, the manual file picker is the path (the app
  is still installable/usable). This is an accepted platform limitation, not a bug.
- **Web Share API with files** (re-share to WhatsApp) is likewise best on
  Android/Chromium; degrade to Download elsewhere.

## Open Questions

None blocking. Default app name "Doc Signer"; theme uses shadcn defaults
(adjustable later).
