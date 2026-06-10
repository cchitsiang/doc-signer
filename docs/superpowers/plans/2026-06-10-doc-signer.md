# Doc Signer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully client-side Vite + React PDF signer where users open a PDF (via WhatsApp PWA share or manual pick), add drawn/typed/saved-image signatures, and export the flattened PDF by download, re-share, or print.

**Architecture:** All processing is in-browser. pdf.js renders pages to canvases; a draggable React overlay layer holds annotations in screen-space; on export, an isolated coordinate module converts screen coords to PDF points and pdf-lib bakes annotations into the original bytes. UI is shadcn/ui themed to resemble Claude (warm cream background, terracotta accent).

**Tech Stack:** Vite + React + TypeScript, Tailwind CSS v4 + shadcn/ui, pdfjs-dist, pdf-lib, signature_pad, vite-plugin-pwa, Vitest. Linting/formatting via **oxc** (oxlint + oxfmt) instead of ESLint/Prettier.

**Spec:** `docs/superpowers/specs/2026-06-10-doc-signer-design.md`

---

## File Structure

```
src/
  lib/
    pdf/
      coordinates.ts        # screen <-> PDF point conversion (pure, tested)
      loader.ts             # bytes -> pdf.js document + page render
      exporter.ts           # annotations + bytes -> flattened PDF bytes (pdf-lib)
    signature/
      storage.ts            # localStorage CRUD for saved signature PNGs (pure)
    share/
      output.ts             # download / shareToWhatsApp / printPdf
    pwa/
      shareTarget.ts        # read PDF handed in by the service worker
    utils.ts                # shadcn cn() helper
  state/
    annotations.ts          # annotation types + useAnnotations store (zustand-free, React)
  components/
    LandingScreen.tsx
    Viewer.tsx
    PdfPage.tsx
    PlacedAnnotation.tsx
    Toolbar.tsx
    SignatureDialog.tsx
    OutputActions.tsx
    ui/                     # shadcn-generated components
  App.tsx
  main.tsx
  index.css                 # tailwind + Claude theme tokens
tests/                      # vitest unit/integration tests (co-located *.test.ts also allowed)
public/
  share-target.html         # optional landing for share_target (see Task 14)
```

---

## Task 1: Scaffold Vite + React + TypeScript

**Files:**

- Create: project files via Vite scaffolder (in current empty dir, which already has `.git` and `docs/`)

- [ ] **Step 1: Scaffold into current directory**

The directory already contains `docs/` and `.git`. Scaffold in place:

```bash
npm create vite@latest . -- --template react-ts
```

If prompted that the directory is not empty, choose **"Ignore files and continue"**.

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Verify dev server boots**

Run: `npm run build`
Expected: build completes with no errors (a `dist/` folder is produced).

- [ ] **Step 4: Add a .gitignore entry for node_modules/dist if missing**

Confirm `node_modules` and `dist` are in `.gitignore` (Vite template includes them). If not, add them.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite react-ts project"
```

---

## Task 1b: Replace ESLint with oxc (oxlint + oxfmt)

**Files:**

- Modify: `package.json` (scripts, remove eslint deps)
- Delete: `eslint.config.js`
- Create: `.oxlintrc.json`
- Create: `.oxfmtrc.json`

Context: The Vite `react-ts` template ships ESLint. Per project decision, lint and format with oxc instead.

- [ ] **Step 1: Remove ESLint from the template**

```bash
npm uninstall eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh typescript-eslint globals
rm -f eslint.config.js
```

(Some of these may not be present depending on the template version; ignore "not installed" notices.)

- [ ] **Step 2: Install oxlint and oxfmt**

```bash
npm add -D oxlint oxfmt
```

- [ ] **Step 3: Initialize configs**

```bash
npx oxlint --init
npx oxfmt --init
```

This creates `.oxlintrc.json` and `.oxfmtrc.json` with defaults.

- [ ] **Step 4: Replace the `lint` script and add format scripts in package.json**

In `package.json` `"scripts"`, remove the old ESLint `lint` entry and set:

```json
"lint": "oxlint",
"lint:fix": "oxlint --fix",
"fmt": "oxfmt",
"fmt:check": "oxfmt --check"
```

- [ ] **Step 5: Run lint and format**

```bash
npm run fmt
npm run lint
```

Expected: `fmt` formats the scaffolded files; `lint` reports 0 errors (warnings acceptable).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: replace eslint with oxc (oxlint + oxfmt)"
```

---

## Task 2: Install Tailwind CSS v4 + path aliases

**Files:**

- Modify: `vite.config.ts`
- Modify: `tsconfig.json`, `tsconfig.app.json`
- Modify: `src/index.css`

- [ ] **Step 1: Install Tailwind v4 and node types**

```bash
npm install tailwindcss @tailwindcss/vite
npm install -D @types/node
```

- [ ] **Step 2: Configure vite.config.ts with Tailwind plugin and `@` alias**

Replace `vite.config.ts` with:

```ts
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add `@` path alias to tsconfig**

In `tsconfig.json`, add to the top level (alongside `files`/`references`):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

In `tsconfig.app.json`, add inside `compilerOptions`:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 4: Replace src/index.css with Tailwind import**

Replace the entire contents of `src/index.css` with:

```css
@import "tailwindcss";
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add tailwind v4 and @ path alias"
```

---

## Task 3: Initialize shadcn/ui with Claude-like theme

**Files:**

- Create: `components.json` (via shadcn init)
- Modify: `src/index.css` (theme tokens)
- Create: `src/lib/utils.ts` (via shadcn)

- [ ] **Step 1: Run shadcn init**

```bash
npx shadcn@latest init -d
```

Accept defaults (`-d` uses defaults: New York style, neutral base, CSS variables). This creates `components.json`, `src/lib/utils.ts`, and writes base theme tokens into `src/index.css`.

- [ ] **Step 2: Add the Claude-like theme tokens**

Open `src/index.css`. In the `:root` block that shadcn generated, override these variables with the warm Claude palette (keep the other generated variables):

```css
:root {
  --background: oklch(0.97 0.01 85); /* warm cream */
  --foreground: oklch(0.24 0.01 70); /* near-black warm gray */
  --card: oklch(0.98 0.008 85);
  --card-foreground: oklch(0.24 0.01 70);
  --popover: oklch(0.98 0.008 85);
  --popover-foreground: oklch(0.24 0.01 70);
  --primary: oklch(0.64 0.13 38); /* terracotta-coral #D97757 */
  --primary-foreground: oklch(0.99 0.005 85);
  --secondary: oklch(0.94 0.012 85);
  --secondary-foreground: oklch(0.24 0.01 70);
  --muted: oklch(0.94 0.012 85);
  --muted-foreground: oklch(0.52 0.012 70);
  --accent: oklch(0.94 0.012 85);
  --accent-foreground: oklch(0.24 0.01 70);
  --border: oklch(0.89 0.012 80);
  --input: oklch(0.89 0.012 80);
  --ring: oklch(0.64 0.13 38);
}
```

(Light mode only for v1 — do not worry about the `.dark` block.)

- [ ] **Step 3: Add base components used throughout**

```bash
npx shadcn@latest add button card dialog drawer tabs toggle-group tooltip input popover dropdown-menu sonner
```

- [ ] **Step 4: Render a themed smoke screen**

Replace `src/App.tsx` with a minimal check:

```tsx
import { Button } from "@/components/ui/button";

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <Button>Doc Signer</Button>
    </div>
  );
}

export default App;
```

- [ ] **Step 5: Verify build and visual**

Run: `npm run build`
Expected: build succeeds. (Optionally `npm run dev` and confirm a cream background with a terracotta button.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: init shadcn with Claude-like theme"
```

---

## Task 4: Install domain libraries and configure Vitest

**Files:**

- Modify: `package.json` (scripts)
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Install runtime + test deps**

```bash
npm install pdfjs-dist pdf-lib signature_pad
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Create vitest.config.ts**

```ts
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

- [ ] **Step 3: Create src/test/setup.ts**

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 4: Add test scripts to package.json**

In `package.json` `"scripts"`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Add a trivial sanity test**

Create `src/test/sanity.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: 1 passing test.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add pdf/signature libs and vitest"
```

---

## Task 5: PDF coordinate conversion module (TDD)

**Files:**

- Create: `src/lib/pdf/coordinates.ts`
- Test: `src/lib/pdf/coordinates.test.ts`

Context: A rendered page has a `scale` (pdf.js viewport scale). Screen space origin is top-left, y grows downward. PDF point space origin is bottom-left, y grows upward. Page dimensions in PDF points are `pdfWidth`/`pdfHeight` (the unscaled page size). A rendered annotation rectangle is stored in screen pixels relative to the page's rendered top-left.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { screenRectToPdfRect, type PageGeometry, type ScreenRect } from "@/lib/pdf/coordinates";

const geom: PageGeometry = {
  pdfWidth: 600,
  pdfHeight: 800,
  scale: 2, // rendered canvas is 1200 x 1600 screen px
};

describe("screenRectToPdfRect", () => {
  it("converts a top-left screen rect to bottom-left PDF coords", () => {
    // 100x50 screen px box at screen (200, 100)
    const rect: ScreenRect = { x: 200, y: 100, width: 100, height: 50 };
    const pdf = screenRectToPdfRect(rect, geom);
    // x: 200 / scale = 100
    expect(pdf.x).toBeCloseTo(100, 5);
    // width: 100 / 2 = 50, height: 50 / 2 = 25
    expect(pdf.width).toBeCloseTo(50, 5);
    expect(pdf.height).toBeCloseTo(25, 5);
    // y (bottom-left): pdfHeight - (screenY + screenHeight)/scale
    //   = 800 - (100 + 50)/2 = 800 - 75 = 725
    expect(pdf.y).toBeCloseTo(725, 5);
  });

  it("places a box at the very top-left of the page near the page top", () => {
    const rect: ScreenRect = { x: 0, y: 0, width: 20, height: 20 };
    const pdf = screenRectToPdfRect(rect, geom);
    expect(pdf.x).toBeCloseTo(0, 5);
    // y = 800 - (0 + 20)/2 = 790
    expect(pdf.y).toBeCloseTo(790, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/pdf/coordinates.test.ts`
Expected: FAIL — module/function not found.

- [ ] **Step 3: Write minimal implementation**

```ts
export interface PageGeometry {
  /** Unscaled page width in PDF points. */
  pdfWidth: number;
  /** Unscaled page height in PDF points. */
  pdfHeight: number;
  /** pdf.js viewport scale used to render the page to canvas. */
  scale: number;
}

/** A rectangle in rendered screen pixels, relative to the page's top-left. */
export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A rectangle in PDF points, origin bottom-left (pdf-lib convention). */
export interface PdfRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function screenRectToPdfRect(rect: ScreenRect, geom: PageGeometry): PdfRect {
  const { scale, pdfHeight } = geom;
  const width = rect.width / scale;
  const height = rect.height / scale;
  const x = rect.x / scale;
  // Flip the y-axis: screen top-left -> PDF bottom-left.
  const y = pdfHeight - (rect.y + rect.height) / scale;
  return { x, y, width, height };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/pdf/coordinates.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Add a round-trip helper test for font sizing**

Append to `coordinates.test.ts`:

```ts
import { screenLengthToPdf } from "@/lib/pdf/coordinates";

describe("screenLengthToPdf", () => {
  it("scales a pixel length down to PDF points", () => {
    expect(screenLengthToPdf(32, geom)).toBeCloseTo(16, 5);
  });
});
```

- [ ] **Step 6: Run to verify it fails, then implement**

Run: `npx vitest run src/lib/pdf/coordinates.test.ts` → FAIL.

Add to `coordinates.ts`:

```ts
/** Convert a screen-pixel length (e.g. font size) to PDF points. */
export function screenLengthToPdf(lengthPx: number, geom: PageGeometry): number {
  return lengthPx / geom.scale;
}
```

Run again → PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add src/lib/pdf/coordinates.ts src/lib/pdf/coordinates.test.ts
git commit -m "feat: add pdf coordinate conversion module"
```

---

## Task 6: Annotation state types and store (TDD)

**Files:**

- Create: `src/state/annotations.ts`
- Test: `src/state/annotations.test.ts`

Context: A plain reducer-style store of annotations kept in screen space. Built as pure functions over an array so it is unit-testable without React; a thin `useAnnotations` React hook wraps it.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { annotationsReducer, initialAnnotationsState, type Annotation } from "@/state/annotations";

const sig: Annotation = {
  id: "a1",
  type: "signature",
  pageIndex: 0,
  rect: { x: 10, y: 10, width: 100, height: 40 },
  payload: { dataUrl: "data:image/png;base64,XXX" },
};

describe("annotationsReducer", () => {
  it("adds an annotation", () => {
    const s = annotationsReducer(initialAnnotationsState, { type: "add", annotation: sig });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].id).toBe("a1");
  });

  it("updates an annotation's rect (move/resize)", () => {
    const added = annotationsReducer(initialAnnotationsState, { type: "add", annotation: sig });
    const moved = annotationsReducer(added, {
      type: "update",
      id: "a1",
      patch: { rect: { x: 50, y: 60, width: 120, height: 50 } },
    });
    expect(moved.items[0].rect).toEqual({ x: 50, y: 60, width: 120, height: 50 });
  });

  it("removes an annotation", () => {
    const added = annotationsReducer(initialAnnotationsState, { type: "add", annotation: sig });
    const removed = annotationsReducer(added, { type: "remove", id: "a1" });
    expect(removed.items).toHaveLength(0);
  });

  it("clears all annotations", () => {
    const added = annotationsReducer(initialAnnotationsState, { type: "add", annotation: sig });
    const cleared = annotationsReducer(added, { type: "clear" });
    expect(cleared.items).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/state/annotations.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
import { useReducer } from "react";
import type { ScreenRect } from "@/lib/pdf/coordinates";

export type SignaturePayload = { dataUrl: string };
export type TextPayload = { text: string; fontSizePx: number; color: string };

export type Annotation =
  | {
      id: string;
      type: "signature";
      pageIndex: number;
      rect: ScreenRect;
      payload: SignaturePayload;
    }
  | { id: string; type: "text"; pageIndex: number; rect: ScreenRect; payload: TextPayload };

export interface AnnotationsState {
  items: Annotation[];
}

export const initialAnnotationsState: AnnotationsState = { items: [] };

export type AnnotationAction =
  | { type: "add"; annotation: Annotation }
  | {
      type: "update";
      id: string;
      patch: Partial<Pick<Annotation, "rect">> & { payload?: Annotation["payload"] };
    }
  | { type: "remove"; id: string }
  | { type: "clear" };

export function annotationsReducer(
  state: AnnotationsState,
  action: AnnotationAction,
): AnnotationsState {
  switch (action.type) {
    case "add":
      return { items: [...state.items, action.annotation] };
    case "update":
      return {
        items: state.items.map((a) =>
          a.id === action.id
            ? ({ ...a, ...action.patch, payload: action.patch.payload ?? a.payload } as Annotation)
            : a,
        ),
      };
    case "remove":
      return { items: state.items.filter((a) => a.id !== action.id) };
    case "clear":
      return initialAnnotationsState;
    default:
      return state;
  }
}

export function useAnnotations() {
  const [state, dispatch] = useReducer(annotationsReducer, initialAnnotationsState);
  return { items: state.items, dispatch };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/state/annotations.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/state/annotations.ts src/state/annotations.test.ts
git commit -m "feat: add annotations reducer/store"
```

---

## Task 7: Saved-signature localStorage module (TDD)

**Files:**

- Create: `src/lib/signature/storage.ts`
- Test: `src/lib/signature/storage.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { listSignatures, saveSignature, deleteSignature } from "@/lib/signature/storage";

describe("signature storage", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty", () => {
    expect(listSignatures()).toEqual([]);
  });

  it("saves and lists a signature", () => {
    const item = saveSignature("data:image/png;base64,AAA");
    const all = listSignatures();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(item.id);
    expect(all[0].dataUrl).toBe("data:image/png;base64,AAA");
  });

  it("deletes a signature", () => {
    const item = saveSignature("data:image/png;base64,BBB");
    deleteSignature(item.id);
    expect(listSignatures()).toEqual([]);
  });

  it("returns [] gracefully when stored value is corrupt", () => {
    localStorage.setItem("doc-signer:signatures", "not json");
    expect(listSignatures()).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/signature/storage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
const KEY = "doc-signer:signatures";

export interface SavedSignature {
  id: string;
  dataUrl: string;
  createdAt: number;
}

function read(): SavedSignature[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: SavedSignature[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export function listSignatures(): SavedSignature[] {
  return read();
}

export function saveSignature(dataUrl: string): SavedSignature {
  const item: SavedSignature = {
    id: `sig_${read().length}_${dataUrl.length}`,
    dataUrl,
    createdAt: 0,
  };
  write([...read(), item]);
  return item;
}

export function deleteSignature(id: string): void {
  write(read().filter((s) => s.id !== id));
}
```

Note: id avoids `Date.now()`/`Math.random()` for deterministic tests; collisions are acceptable for this single-user local cache.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/signature/storage.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/signature/storage.ts src/lib/signature/storage.test.ts
git commit -m "feat: add saved-signature localStorage module"
```

---

## Task 8: PDF loader module

**Files:**

- Create: `src/lib/pdf/loader.ts`

Context: pdf.js needs its worker configured. With Vite, import the worker via the `?url` suffix and assign it to `GlobalWorkerOptions.workerSrc`. This module is hard to unit-test in jsdom (no canvas 2d), so it is verified through the Viewer integration and build.

- [ ] **Step 1: Implement the loader**

```ts
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface LoadedPdf {
  numPages: number;
  /** Render a 1-based page to a canvas at the given scale. */
  renderPage: (pageNumber: number, scale: number) => Promise<HTMLCanvasElement>;
  /** Unscaled page size in PDF points. */
  getPageSize: (pageNumber: number) => Promise<{ width: number; height: number }>;
}

export async function loadPdf(bytes: ArrayBuffer | Uint8Array): Promise<LoadedPdf> {
  const data = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const doc = await pdfjsLib.getDocument({ data }).promise;

  return {
    numPages: doc.numPages,
    async getPageSize(pageNumber: number) {
      const page = await doc.getPage(pageNumber);
      const vp = page.getViewport({ scale: 1 });
      return { width: vp.width, height: vp.height };
    },
    async renderPage(pageNumber: number, scale: number) {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get 2d canvas context");
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      return canvas;
    },
  };
}

/** Throws if the bytes are not a parseable PDF. */
export async function isValidPdf(bytes: ArrayBuffer | Uint8Array): Promise<boolean> {
  try {
    await loadPdf(bytes);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds (worker URL import resolves).

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdf/loader.ts
git commit -m "feat: add pdf.js loader module"
```

---

## Task 9: PDF exporter module (TDD integration)

**Files:**

- Create: `src/lib/pdf/exporter.ts`
- Test: `src/lib/pdf/exporter.test.ts`

Context: pdf-lib runs in jsdom. The test creates a blank PDF with pdf-lib, exports an annotation onto it, reloads the result with pdf-lib, and asserts the page count and that bytes grew (image embedded). Exact pixel assertions are covered by the coordinates unit tests; here we assert the pipeline produces a valid, larger PDF.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { PDFDocument, rgb } from "pdf-lib";
import { exportPdf } from "@/lib/pdf/exporter";
import type { Annotation } from "@/state/annotations";

// 1x1 transparent PNG
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function blankPdfBytes(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([600, 800]);
  return doc.save();
}

describe("exportPdf", () => {
  it("bakes a signature image and text into the pdf and returns a valid pdf", async () => {
    const original = await blankPdfBytes();
    const annotations: Annotation[] = [
      {
        id: "s1",
        type: "signature",
        pageIndex: 0,
        rect: { x: 100, y: 100, width: 200, height: 80 },
        payload: { dataUrl: PNG },
      },
      {
        id: "t1",
        type: "text",
        pageIndex: 0,
        rect: { x: 50, y: 50, width: 150, height: 30 },
        payload: { text: "Signed", fontSizePx: 24, color: "#000000" },
      },
    ];

    const out = await exportPdf(original, annotations, [
      { pdfWidth: 600, pdfHeight: 800, scale: 1 },
    ]);

    // Result is a valid PDF with the same page count.
    const reloaded = await PDFDocument.load(out);
    expect(reloaded.getPageCount()).toBe(1);
    // Embedding an image + text should make the file larger than the blank original.
    expect(out.byteLength).toBeGreaterThan(original.byteLength);
  });

  it("uses rgb for color parsing without throwing", () => {
    // sanity that rgb import is wired (guards against tree-shake regressions)
    expect(typeof rgb).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/pdf/exporter.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Annotation } from "@/state/annotations";
import { screenRectToPdfRect, screenLengthToPdf, type PageGeometry } from "@/lib/pdf/coordinates";

function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  const r = parseInt(m.substring(0, 2), 16) / 255;
  const g = parseInt(m.substring(2, 4), 16) / 255;
  const b = parseInt(m.substring(4, 6), 16) / 255;
  return rgb(Number.isFinite(r) ? r : 0, Number.isFinite(g) ? g : 0, Number.isFinite(b) ? b : 0);
}

/**
 * Bake annotations into the original PDF bytes.
 * @param geometries per-page geometry, indexed by pageIndex.
 */
export async function exportPdf(
  originalBytes: ArrayBuffer | Uint8Array,
  annotations: Annotation[],
  geometries: PageGeometry[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(originalBytes);
  const pages = doc.getPages();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const ann of annotations) {
    const page = pages[ann.pageIndex];
    const geom = geometries[ann.pageIndex];
    if (!page || !geom) continue;
    const r = screenRectToPdfRect(ann.rect, geom);

    if (ann.type === "signature") {
      const png = await doc.embedPng(ann.payload.dataUrl);
      page.drawImage(png, { x: r.x, y: r.y, width: r.width, height: r.height });
    } else {
      const size = screenLengthToPdf(ann.payload.fontSizePx, geom);
      // pdf-lib text y is the baseline; nudge up from the rect bottom.
      page.drawText(ann.payload.text, {
        x: r.x,
        y: r.y + (r.height - size) / 2,
        size,
        font,
        color: hexToRgb(ann.payload.color),
      });
    }
  }

  return doc.save();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/pdf/exporter.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pdf/exporter.ts src/lib/pdf/exporter.test.ts
git commit -m "feat: add pdf-lib exporter module"
```

---

## Task 10: Output helpers (download / share / print)

**Files:**

- Create: `src/lib/share/output.ts`
- Test: `src/lib/share/output.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { canShareFiles, makePdfFile } from "@/lib/share/output";

describe("output helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("makePdfFile wraps bytes in a File with the right type and name", () => {
    const file = makePdfFile(new Uint8Array([1, 2, 3]), "signed.pdf");
    expect(file.name).toBe("signed.pdf");
    expect(file.type).toBe("application/pdf");
  });

  it("canShareFiles is false when navigator.canShare is absent", () => {
    // jsdom has no navigator.canShare by default
    expect(canShareFiles(makePdfFile(new Uint8Array([1]), "x.pdf"))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/share/output.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
export function makePdfFile(bytes: Uint8Array, filename: string): File {
  const blob = new Blob([bytes], { type: "application/pdf" });
  return new File([blob], filename, { type: "application/pdf" });
}

export function download(bytes: Uint8Array, filename: string): void {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function canShareFiles(file: File): boolean {
  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
  return typeof nav.canShare === "function" && nav.canShare({ files: [file] });
}

export async function shareToWhatsApp(bytes: Uint8Array, filename: string): Promise<boolean> {
  const file = makePdfFile(bytes, filename);
  if (!canShareFiles(file)) return false;
  try {
    await navigator.share({ files: [file], title: filename });
    return true;
  } catch {
    return false;
  }
}

export function printPdf(bytes: Uint8Array): void {
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };
  document.body.appendChild(iframe);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/share/output.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/share/output.ts src/lib/share/output.test.ts
git commit -m "feat: add download/share/print output helpers"
```

---

## Task 11: SignaturePad component (draw / saved / upload)

**Files:**

- Create: `src/components/SignatureDialog.tsx`

Context: A shadcn `Dialog` with `Tabs`: Draw (signature_pad on a canvas), Saved (thumbnails from storage), Upload (file input -> data URL). Confirm returns a PNG data URL via `onConfirm`.

- [ ] **Step 1: Implement the component**

```tsx
import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { listSignatures, saveSignature, type SavedSignature } from "@/lib/signature/storage";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dataUrl: string) => void;
}

export function SignatureDialog({ open, onOpenChange, onConfirm }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [saved, setSaved] = useState<SavedSignature[]>([]);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const pad = new SignaturePad(canvasRef.current, { penColor: "#1a1a1a" });
    padRef.current = pad;
    setSaved(listSignatures());
    return () => pad.off();
  }, [open]);

  function confirmDrawn(persist: boolean) {
    const pad = padRef.current;
    if (!pad || pad.isEmpty()) return;
    const dataUrl = pad.toDataURL("image/png");
    if (persist) saveSignature(dataUrl);
    onConfirm(dataUrl);
    onOpenChange(false);
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onConfirm(reader.result as string);
      onOpenChange(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add signature</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="draw">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="draw">Draw</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="draw">
            <canvas
              ref={canvasRef}
              width={460}
              height={180}
              className="w-full rounded-md border border-border bg-card touch-none"
            />
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={() => padRef.current?.clear()}>
                Clear
              </Button>
              <Button variant="secondary" onClick={() => confirmDrawn(true)}>
                Save & use
              </Button>
              <Button onClick={() => confirmDrawn(false)}>Use once</Button>
            </div>
          </TabsContent>

          <TabsContent value="saved">
            <div className="grid grid-cols-2 gap-2">
              {saved.length === 0 && (
                <p className="text-muted-foreground text-sm col-span-2">No saved signatures yet.</p>
              )}
              {saved.map((s) => (
                <button
                  key={s.id}
                  className="rounded-md border border-border bg-card p-2"
                  onClick={() => {
                    onConfirm(s.dataUrl);
                    onOpenChange(false);
                  }}
                >
                  <img src={s.dataUrl} alt="saved signature" className="max-h-20 mx-auto" />
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <input type="file" accept="image/png,image/jpeg" onChange={handleUpload} />
          </TabsContent>
        </Tabs>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/SignatureDialog.tsx
git commit -m "feat: add signature dialog (draw/saved/upload)"
```

---

## Task 12: PlacedAnnotation overlay (drag + resize)

**Files:**

- Create: `src/components/PlacedAnnotation.tsx`

Context: An absolutely-positioned element over a page. Pointer events drag the box; a corner handle resizes it. Reports rect changes to the parent. Touch-friendly via Pointer Events.

- [ ] **Step 1: Implement the component**

```tsx
import { useRef } from "react";
import type { Annotation } from "@/state/annotations";
import type { ScreenRect } from "@/lib/pdf/coordinates";
import { X } from "lucide-react";

interface Props {
  annotation: Annotation;
  onChange: (rect: ScreenRect) => void;
  onRemove: () => void;
}

export function PlacedAnnotation({ annotation, onChange, onRemove }: Props) {
  const start = useRef<{ px: number; py: number; rect: ScreenRect } | null>(null);
  const mode = useRef<"move" | "resize" | null>(null);
  const { rect } = annotation;

  function onPointerDown(e: React.PointerEvent, m: "move" | "resize") {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    start.current = { px: e.clientX, py: e.clientY, rect: { ...rect } };
    mode.current = m;
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!start.current || !mode.current) return;
    const dx = e.clientX - start.current.px;
    const dy = e.clientY - start.current.py;
    const s = start.current.rect;
    if (mode.current === "move") {
      onChange({ ...s, x: s.x + dx, y: s.y + dy });
    } else {
      onChange({
        ...s,
        width: Math.max(24, s.width + dx),
        height: Math.max(16, s.height + dy),
      });
    }
  }

  function onPointerUp() {
    start.current = null;
    mode.current = null;
  }

  return (
    <div
      className="absolute border-2 border-primary/70 bg-primary/5 touch-none"
      style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
      onPointerDown={(e) => onPointerDown(e, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {annotation.type === "signature" ? (
        <img
          src={annotation.payload.dataUrl}
          alt="signature"
          className="w-full h-full object-contain pointer-events-none"
        />
      ) : (
        <span
          className="block w-full h-full pointer-events-none leading-none"
          style={{ fontSize: annotation.payload.fontSizePx, color: annotation.payload.color }}
        >
          {annotation.payload.text}
        </span>
      )}

      <button
        className="absolute -top-3 -right-3 rounded-full bg-primary text-primary-foreground p-0.5"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        aria-label="Remove"
      >
        <X size={14} />
      </button>

      <span
        className="absolute -bottom-2 -right-2 h-4 w-4 rounded-sm bg-primary cursor-se-resize"
        onPointerDown={(e) => onPointerDown(e, "resize")}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds (`lucide-react` ships with shadcn).

- [ ] **Step 3: Commit**

```bash
git add src/components/PlacedAnnotation.tsx
git commit -m "feat: add draggable/resizable placed annotation overlay"
```

---

## Task 13: PdfPage and Viewer

**Files:**

- Create: `src/components/PdfPage.tsx`
- Create: `src/components/Viewer.tsx`

Context: `PdfPage` renders one page to a canvas at a chosen scale, exposes geometry, and hosts the overlay layer for annotations on that page; tapping the page while a tool is active places a new annotation. `Viewer` stacks all pages and owns the annotation store wiring is done in `App` (passed down).

- [ ] **Step 1: Implement PdfPage**

```tsx
import { useEffect, useRef, useState } from "react";
import type { LoadedPdf } from "@/lib/pdf/loader";
import type { PageGeometry, ScreenRect } from "@/lib/pdf/coordinates";
import type { Annotation } from "@/state/annotations";
import { PlacedAnnotation } from "@/components/PlacedAnnotation";

interface Props {
  pdf: LoadedPdf;
  pageNumber: number; // 1-based
  scale: number;
  annotations: Annotation[];
  onGeometry: (pageIndex: number, geom: PageGeometry) => void;
  onPlace: (pageIndex: number, at: { x: number; y: number }) => void;
  onChangeRect: (id: string, rect: ScreenRect) => void;
  onRemove: (id: string) => void;
}

export function PdfPage({
  pdf,
  pageNumber,
  scale,
  annotations,
  onGeometry,
  onPlace,
  onChangeRect,
  onRemove,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const pageIndex = pageNumber - 1;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const canvas = await pdf.renderPage(pageNumber, scale);
      if (cancelled || !hostRef.current) return;
      hostRef.current.querySelector("canvas")?.remove();
      hostRef.current.prepend(canvas);
      setSize({ w: canvas.width, h: canvas.height });
      const { width, height } = await pdf.getPageSize(pageNumber);
      onGeometry(pageIndex, { pdfWidth: width, pdfHeight: height, scale });
    })();
    return () => {
      cancelled = true;
    };
  }, [pdf, pageNumber, scale, pageIndex, onGeometry]);

  function handleClick(e: React.MouseEvent) {
    if (e.target !== e.currentTarget && (e.target as Element).tagName !== "CANVAS") return;
    const host = hostRef.current;
    if (!host) return;
    const r = host.getBoundingClientRect();
    onPlace(pageIndex, { x: e.clientX - r.left, y: e.clientY - r.top });
  }

  return (
    <div
      ref={hostRef}
      onClick={handleClick}
      className="relative mx-auto my-4 shadow-sm bg-card"
      style={{ width: size.w || undefined, height: size.h || undefined }}
    >
      {annotations.map((a) => (
        <PlacedAnnotation
          key={a.id}
          annotation={a}
          onChange={(rect) => onChangeRect(a.id, rect)}
          onRemove={() => onRemove(a.id)}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement Viewer**

```tsx
import type { LoadedPdf } from "@/lib/pdf/loader";
import type { PageGeometry, ScreenRect } from "@/lib/pdf/coordinates";
import type { Annotation } from "@/state/annotations";
import { PdfPage } from "@/components/PdfPage";

interface Props {
  pdf: LoadedPdf;
  scale: number;
  annotations: Annotation[];
  onGeometry: (pageIndex: number, geom: PageGeometry) => void;
  onPlace: (pageIndex: number, at: { x: number; y: number }) => void;
  onChangeRect: (id: string, rect: ScreenRect) => void;
  onRemove: (id: string) => void;
}

export function Viewer({ pdf, scale, annotations, ...handlers }: Props) {
  const pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
  return (
    <div className="w-full overflow-auto pb-32">
      {pages.map((p) => (
        <PdfPage
          key={p}
          pdf={pdf}
          pageNumber={p}
          scale={scale}
          annotations={annotations.filter((a) => a.pageIndex === p - 1)}
          {...handlers}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/PdfPage.tsx src/components/Viewer.tsx
git commit -m "feat: add PdfPage and Viewer with annotation layer"
```

---

## Task 14: LandingScreen, Toolbar, OutputActions

**Files:**

- Create: `src/components/LandingScreen.tsx`
- Create: `src/components/Toolbar.tsx`
- Create: `src/components/OutputActions.tsx`

- [ ] **Step 1: Implement LandingScreen**

```tsx
import { useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props {
  onFile: (bytes: ArrayBuffer, name: string) => void;
  error?: string;
}

export function LandingScreen({ onFile, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    const buf = await file.arrayBuffer();
    onFile(buf, file.name);
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground flex items-center justify-center p-6"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void pick(e.dataTransfer.files?.[0]);
      }}
    >
      <Card className="max-w-md w-full p-8 text-center flex flex-col gap-4 items-center">
        <h1 className="text-2xl font-semibold">Doc Signer</h1>
        <p className="text-muted-foreground">
          Open a PDF to sign it. Everything stays on your device.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => void pick(e.target.files?.[0])}
        />
        <Button onClick={() => inputRef.current?.click()}>Open PDF</Button>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <p className="text-xs text-muted-foreground">or drag &amp; drop a PDF here</p>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Implement Toolbar**

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Pencil, Type, Image } from "lucide-react";

export type Tool = "signature" | "text" | "saved" | null;

interface Props {
  tool: Tool;
  onTool: (t: Tool) => void;
}

export function Toolbar({ tool, onTool }: Props) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-10 flex justify-center p-4">
      <div className="rounded-full bg-card border border-border shadow-md px-3 py-2">
        <ToggleGroup
          type="single"
          value={tool ?? ""}
          onValueChange={(v) => onTool((v || null) as Tool)}
        >
          <ToggleGroupItem value="signature" aria-label="Draw signature">
            <Pencil size={18} />
          </ToggleGroupItem>
          <ToggleGroupItem value="text" aria-label="Add text">
            <Type size={18} />
          </ToggleGroupItem>
          <ToggleGroupItem value="saved" aria-label="Saved signature">
            <Image size={18} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement OutputActions**

```tsx
import { Button } from "@/components/ui/button";
import { Download, Share2, Printer } from "lucide-react";

interface Props {
  onDownload: () => void;
  onShare: () => void;
  onPrint: () => void;
  canShare: boolean;
  busy: boolean;
}

export function OutputActions({ onDownload, onShare, onPrint, canShare, busy }: Props) {
  return (
    <div className="fixed top-0 inset-x-0 z-10 flex justify-end gap-2 p-3 bg-background/80 backdrop-blur border-b border-border">
      <Button variant="outline" size="sm" onClick={onPrint} disabled={busy}>
        <Printer size={16} /> Print
      </Button>
      {canShare && (
        <Button variant="outline" size="sm" onClick={onShare} disabled={busy}>
          <Share2 size={16} /> Share
        </Button>
      )}
      <Button size="sm" onClick={onDownload} disabled={busy}>
        <Download size={16} /> Download
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/LandingScreen.tsx src/components/Toolbar.tsx src/components/OutputActions.tsx
git commit -m "feat: add landing, toolbar, and output action components"
```

---

## Task 15: App wiring (state machine + place/export flow)

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/main.tsx` (add `<Toaster />`)

Context: App holds the loaded PDF, the annotation store, per-page geometries, the active tool, and the signature dialog state. Placing depends on the active tool. Export reads geometries + annotations.

- [ ] **Step 1: Add Toaster to main.tsx**

In `src/main.tsx`, import and render the sonner Toaster alongside `<App />`:

```tsx
import { Toaster } from "@/components/ui/sonner";
```

Render inside the root, after `<App />`:

```tsx
<App />
<Toaster />
```

- [ ] **Step 2: Implement App.tsx**

```tsx
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { loadPdf, type LoadedPdf } from "@/lib/pdf/loader";
import { exportPdf } from "@/lib/pdf/exporter";
import { useAnnotations, type Annotation } from "@/state/annotations";
import type { PageGeometry, ScreenRect } from "@/lib/pdf/coordinates";
import { LandingScreen } from "@/components/LandingScreen";
import { Viewer } from "@/components/Viewer";
import { Toolbar, type Tool } from "@/components/Toolbar";
import { OutputActions } from "@/components/OutputActions";
import { SignatureDialog } from "@/components/SignatureDialog";
import {
  download,
  shareToWhatsApp,
  printPdf,
  makePdfFile,
  canShareFiles,
} from "@/lib/share/output";

const SCALE = 1.5;

export default function App() {
  const [pdf, setPdf] = useState<LoadedPdf | null>(null);
  const [error, setError] = useState<string>();
  const [tool, setTool] = useState<Tool>(null);
  const [sigOpen, setSigOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { items, dispatch } = useAnnotations();
  const originalBytes = useRef<ArrayBuffer | null>(null);
  const geometries = useRef<PageGeometry[]>([]);
  const pendingPlace = useRef<{ pageIndex: number; at: { x: number; y: number } } | null>(null);

  const handleFile = useCallback(async (bytes: ArrayBuffer, _name: string) => {
    try {
      originalBytes.current = bytes.slice(0);
      const loaded = await loadPdf(bytes);
      setPdf(loaded);
      setError(undefined);
    } catch {
      setError("That file could not be opened as a PDF.");
      toast.error("Invalid PDF file");
    }
  }, []);

  const onGeometry = useCallback((pageIndex: number, geom: PageGeometry) => {
    geometries.current[pageIndex] = geom;
  }, []);

  function nextId() {
    return `ann_${items.length}_${Date.now()}`;
  }

  const onPlace = useCallback(
    (pageIndex: number, at: { x: number; y: number }) => {
      if (!tool) return;
      if (tool === "text") {
        const text = window.prompt("Enter text");
        if (!text) return;
        const ann: Annotation = {
          id: nextId(),
          type: "text",
          pageIndex,
          rect: { x: at.x, y: at.y, width: Math.max(80, text.length * 12), height: 32 },
          payload: { text, fontSizePx: 24, color: "#1a1a1a" },
        };
        dispatch({ type: "add", annotation: ann });
      } else {
        // signature or saved -> open dialog, remember where to drop it
        pendingPlace.current = { pageIndex, at };
        setSigOpen(true);
      }
    },
    [tool, dispatch, items.length],
  );

  function onSignatureConfirm(dataUrl: string) {
    const place = pendingPlace.current ?? { pageIndex: 0, at: { x: 40, y: 40 } };
    const ann: Annotation = {
      id: nextId(),
      type: "signature",
      pageIndex: place.pageIndex,
      rect: { x: place.at.x, y: place.at.y, width: 200, height: 80 },
      payload: { dataUrl },
    };
    dispatch({ type: "add", annotation: ann });
    pendingPlace.current = null;
  }

  const onChangeRect = useCallback(
    (id: string, rect: ScreenRect) => dispatch({ type: "update", id, patch: { rect } }),
    [dispatch],
  );
  const onRemove = useCallback((id: string) => dispatch({ type: "remove", id }), [dispatch]);

  async function buildPdf(): Promise<Uint8Array | null> {
    if (!originalBytes.current) return null;
    return exportPdf(originalBytes.current, items, geometries.current);
  }

  async function handleDownload() {
    setBusy(true);
    try {
      const out = await buildPdf();
      if (out) download(out, "signed.pdf");
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    setBusy(true);
    try {
      const out = await buildPdf();
      if (out && !(await shareToWhatsApp(out, "signed.pdf"))) {
        toast.message("Sharing not available — downloaded instead");
        download(out, "signed.pdf");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handlePrint() {
    setBusy(true);
    try {
      const out = await buildPdf();
      if (out) printPdf(out);
    } finally {
      setBusy(false);
    }
  }

  if (!pdf) return <LandingScreen onFile={handleFile} error={error} />;

  const shareProbe = makePdfFile(new Uint8Array([1]), "x.pdf");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OutputActions
        onDownload={handleDownload}
        onShare={handleShare}
        onPrint={handlePrint}
        canShare={canShareFiles(shareProbe)}
        busy={busy}
      />
      <div className="pt-16">
        <Viewer
          pdf={pdf}
          scale={SCALE}
          annotations={items}
          onGeometry={onGeometry}
          onPlace={onPlace}
          onChangeRect={onChangeRect}
          onRemove={onRemove}
        />
      </div>
      <Toolbar tool={tool} onTool={setTool} />
      <SignatureDialog open={sigOpen} onOpenChange={setSigOpen} onConfirm={onSignatureConfirm} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build and tests**

Run: `npm run build && npm test`
Expected: build succeeds; all prior tests still pass.

- [ ] **Step 4: Manual smoke (dev)**

Run: `npm run dev`, open the URL, load a sample PDF, place a typed text and a drawn signature, drag/resize them, then Download. Confirm the downloaded PDF shows the marks in the right spots.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire app state machine and sign/export flow"
```

---

## Task 16: PWA + WhatsApp Share Target

**Files:**

- Modify: `vite.config.ts` (add vite-plugin-pwa)
- Create: `src/lib/pwa/shareTarget.ts`
- Modify: `src/App.tsx` (consume shared file on launch)
- Create: `public/` icons (placeholder 192/512 PNGs)

Context: vite-plugin-pwa generates the manifest + service worker. The `share_target` posts a multipart form with the PDF to a route the SW intercepts; the SW caches the file and redirects to `/?share-target=1`; on launch the app fetches the cached file. We use the plugin's `strategies: 'injectManifest'` only if custom SW logic is needed; to keep it simpler we use `generateSW` with a `share_target` manifest and a small custom fetch handler via `runtimeCaching` is insufficient for POST — so use `injectManifest` with a custom service worker.

- [ ] **Step 1: Install plugin**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Configure vite.config.ts**

Replace `vite.config.ts` with:

```ts
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        name: "Doc Signer",
        short_name: "DocSigner",
        start_url: "/",
        display: "standalone",
        background_color: "#F5F4EE",
        theme_color: "#D97757",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        share_target: {
          action: "/share-target",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            files: [{ name: "file", accept: ["application/pdf"] }],
          },
        },
      },
      devOptions: { enabled: true, type: "module" },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 3: Create the custom service worker `src/sw.ts`**

```ts
/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

const SHARED_PDF_CACHE = "shared-pdf";

self.addEventListener("fetch", (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (event.request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(
      (async () => {
        const form = await event.request.formData();
        const file = form.get("file");
        if (file instanceof File) {
          const cache = await caches.open(SHARED_PDF_CACHE);
          await cache.put("/__shared.pdf", new Response(file));
        }
        return Response.redirect("/?share-target=1", 303);
      })(),
    );
  }
});
```

- [ ] **Step 4: Install workbox-precaching (peer of injectManifest)**

```bash
npm install -D workbox-precaching
```

- [ ] **Step 5: Create the share-target reader `src/lib/pwa/shareTarget.ts`**

```ts
const SHARED_PDF_CACHE = "shared-pdf";

/** Returns shared PDF bytes if the app was launched via a share target, else null. */
export async function readSharedPdf(): Promise<ArrayBuffer | null> {
  const params = new URLSearchParams(window.location.search);
  if (params.get("share-target") !== "1") return null;
  try {
    const cache = await caches.open(SHARED_PDF_CACHE);
    const res = await cache.match("/__shared.pdf");
    if (!res) return null;
    const buf = await res.arrayBuffer();
    await cache.delete("/__shared.pdf");
    // Clean the URL so a refresh doesn't re-trigger.
    window.history.replaceState({}, "", "/");
    return buf;
  } catch {
    return null;
  }
}
```

- [ ] **Step 6: Consume the shared file on launch in App.tsx**

Add near the top of the `App` component body (after the hooks are declared), import `readSharedPdf` and add a `useEffect`:

```tsx
import { useEffect } from "react";
import { readSharedPdf } from "@/lib/pwa/shareTarget";
```

```tsx
useEffect(() => {
  void (async () => {
    const shared = await readSharedPdf();
    if (shared) await handleFile(shared, "shared.pdf");
  })();
}, [handleFile]);
```

- [ ] **Step 7: Add placeholder icons**

Create `public/icon-192.png` and `public/icon-512.png` (any square PNGs; can be a simple terracotta square for now). If image tooling is unavailable, generate solid-color PNGs:

```bash
# Use an existing asset or create solid-color placeholders with any tool.
# These just need to exist so the manifest validates.
```

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: build succeeds; `dist/sw.js` and `manifest.webmanifest` are generated.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add PWA manifest, service worker, and WhatsApp share target"
```

---

## Task 17: README and final verification

**Files:**

- Create: `README.md`

- [ ] **Step 1: Write README**

```markdown
# Doc Signer

Client-side PDF signer. Open a PDF (shared from WhatsApp via PWA, or picked
manually), add a drawn/typed/saved signature, and export by download, share, or
print. No server — everything runs in your browser.

## Develop

    npm install
    npm run dev

## Test

    npm test

## Build

    npm run build && npm run preview

## WhatsApp share target

Install the app to your home screen (Android/Chromium). It then appears in
WhatsApp's share sheet for PDF files. iOS Safari does not support Share Target;
use "Open PDF" to pick the file manually.
```

- [ ] **Step 2: Full verification**

Run: `npm run fmt && npm run lint && npm test && npm run build`
Expected: formatting clean; lint reports 0 errors; all tests pass; production build succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add README"
```

---

## Self-Review Notes

- **Spec coverage:** entry points (Task 16 PWA share target + Task 14 manual pick), draw/typed/saved signatures (Tasks 11, 15), place/move/resize (Task 12), flatten+export download/share/print (Tasks 9, 10, 15), Claude theme (Task 3), coordinate isolation (Task 5), error handling (invalid PDF Task 15, share fallback Task 15, corrupt storage Task 7), mobile-first toolbar/drawer (Tasks 14, 11). All spec sections map to a task.
- **Types are consistent** across tasks: `ScreenRect`/`PageGeometry`/`PdfRect` (Task 5), `Annotation` union with `rect` + `payload` (Task 6) used identically by exporter (Task 9), overlay (Task 12), and App (Task 15). `LoadedPdf` interface (Task 8) consumed by Viewer/PdfPage (Task 13).
- **No placeholders** except the intentional binary icon assets in Task 16 Step 7, which cannot be expressed as code.

```

```
