# Fast Visual Image Difference Detector

A browser-based GUI application that compares two images and automatically highlights visual differences with bounding boxes. Built with Preact, Vite, and Tailwind CSS — all processing runs client-side using the Canvas API.

![License](https://img.shields.io/badge/license-MIT-blue)

---

## Table of Contents

- [How to Run](#how-to-run)
- [Docker Deployment](#docker-deployment)
- [Visual Diff Algorithm](#visual-diff-algorithm)
- [Sensitivity Control](#sensitivity-control)
- [Processing Time Measurement](#processing-time-measurement)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Known Limitations](#known-limitations)
- [AI Tools Used](#ai-tools-used)

---

## How to Run

```bash
cd client
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Prerequisites

- **Node.js** ≥ 22
- **pnpm** ≥ 9

---

## Docker Deployment

```bash
cd client
docker compose up -d --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

The production build uses a multi-stage Dockerfile:
1. **Build stage** — Node 22 Alpine with pnpm, runs `tsc` + `vite build`
2. **Serve stage** — Nginx Alpine serving static files with SPA fallback, gzip compression, and long-term asset caching

---

## Visual Diff Algorithm

The diff computation is performed entirely in the browser using the Canvas API. The pipeline:

### 1. Image Loading & Normalization

Both images are drawn onto canvases at `max(width₁, width₂) × max(height₁, height₂)`, handling different dimensions gracefully by scaling each image to fill the common canvas size.

### 2. Pixel-Level Comparison

Each pixel is compared using **Euclidean distance in RGBA space**:

$$d = \sqrt{(r_1 - r_2)^2 + (g_1 - g_2)^2 + (b_1 - b_2)^2 + (a_1 - a_2)^2}$$

The maximum possible distance is ~441.67 (black transparent → white opaque). A threshold derived from the sensitivity setting determines whether a pixel is marked as "changed."

### 3. Noise Filtering

A **3×3 Gaussian blur kernel** `[1,2,1; 2,4,2; 1,2,1]` is applied to the binary diff mask. This effectively removes isolated pixels caused by anti-aliasing, JPEG compression artifacts, or minor noise — only clusters of changed pixels survive.

### 4. Connected Component Labeling

A **Union-Find (Disjoint Set)** data structure groups adjacent changed pixels into regions. Connectivity is checked in 4 directions (right, down, and both diagonals) with path compression and union by rank for performance.

### 5. Bounding Box Extraction

Each connected component is converted to a bounding box with 3px padding. Boxes smaller than `minBoxArea` (sensitivity-driven) are discarded to eliminate false positives.

### 6. Overlap Merging

Bounding boxes within a 5px gap are iteratively merged to avoid fragmented highlights on the same logical difference.

### 7. Result Rendering

The "after" image is drawn with a dark overlay. Each bounding box region is then clipped and redrawn at full brightness with a red stroke, making differences immediately visible.

---

## Sensitivity Control

The sensitivity slider (1–100) controls two parameters:

| Sensitivity | Pixel Threshold | Min Box Area | Effect |
|:-----------:|:---------------:|:------------:|--------|
| **High (100)** | ~5 | ~1px | Detects tiny 5–10px changes, may show noise |
| **Medium (50)** | ~71 | ~10px | Balanced — catches real changes, filters noise |
| **Low (1)** | ~137 | ~20px | Only large, obvious differences |

**Formula:**
- `threshold = ((100 - sensitivity) / 100) × 441.67 × 0.3 + 5`
- `minBoxArea = max(4, round((100 - sensitivity) / 5))`

Lower threshold → more pixels flagged as different. Lower min box area → smaller regions kept.

---

## Processing Time Measurement

Processing time is measured using `performance.now()` around the entire diff pipeline (image loading, pixel comparison, filtering, component labeling, box merging, and result rendering). The result is displayed in milliseconds, rounded to 2 decimal places.

The UI remains responsive because the computation runs synchronously in a single frame after user interaction — for very large images, this may cause a brief freeze but avoids the complexity of Web Workers while keeping the architecture simple.

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **UI Framework** | Preact 10 (with React compat) |
| **Build Tool** | Vite 8 |
| **Language** | TypeScript 6 |
| **Styling** | Tailwind CSS 4 |
| **UI Components** | shadcn/ui pattern (CVA + tailwind-merge) |
| **Forms** | React Hook Form 7 + Zod 4 |
| **State Management** | Zustand 5 (persisted to IndexedDB) |
| **Routing** | React Router DOM 7 |
| **Icons** | Lucide React |
| **Testing** | Playwright |
| **Linting** | ESLint 10 + Prettier |
| **Git Hooks** | Husky + lint-staged |
| **Deployment** | Docker + Nginx |

---

## Project Structure

```
client/
├── e2e/                          # Playwright E2E tests
│   ├── fixtures/                 # Test fixture images
│   └── app.spec.ts
├── src/
│   ├── components/ui/            # shadcn/ui components (Button, Card, Badge, Label, Slider)
│   ├── lib/utils.ts              # cn() helper (clsx + tailwind-merge)
│   ├── pages/
│   │   ├── home.page.tsx         # Landing page
│   │   └── differetiator.page.tsx # Main comparison page
│   ├── stores/files.store.ts     # Zustand store with IndexedDB persistence
│   ├── utils/
│   │   ├── index.ts              # IndexedDB helpers, image compression, logger
│   │   └── diff.ts               # Visual diff algorithm
│   ├── validators/
│   │   └── differentiator.validator.ts  # Zod form schema
│   ├── app.tsx                   # Router setup
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Tailwind CSS theme
├── Dockerfile                    # Multi-stage production build
├── docker-compose.yaml
├── nginx.conf                    # SPA-ready Nginx config
├── playwright.config.ts
├── eslint.config.js
├── .prettierrc
└── package.json
```

---

## Scripts

| Script | Description |
|--------|------------|
| `pnpm dev` | Start development server |
| `pnpm build` | TypeScript check + Vite production build |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | Run ESLint (zero warnings allowed) |
| `pnpm lint:fix` | Auto-fix ESLint issues |
| `pnpm format` | Format all files with Prettier |
| `pnpm format:check` | Check formatting without writing |
| `pnpm test` | Run Playwright E2E tests |

---

## Testing

E2E tests are written with **Playwright** (Chromium). The test suite covers:

1. **Navigation** — Home page renders, "Get Started" navigates to `/diff`
2. **UI Elements** — Upload areas, sensitivity slider, disabled compare button
3. **Full Comparison Flow** — Upload two images → compare → verify processing time, regions, percentage, and diff image appear
4. **Sensitivity Slider** — Value updates on change
5. **Reset** — Clears uploaded images and results
6. **Zoom Controls** — Zoom in/out updates percentage display

```bash
pnpm test
```

---

## Code Quality

**Pre-commit hooks** (Husky + lint-staged) automatically run on every commit:
- `*.{ts,tsx}` → ESLint + Prettier check
- `*.{json,css,md,html}` → Prettier check

ESLint is configured with TypeScript-ESLint recommended rules, React Hooks plugin, and React Refresh plugin. Semicolons are enforced, unused variables (except `_` prefixed) are errors, `console` usage triggers warnings.

---

## Known Limitations

1. **No Web Worker** — Diff computation runs on the main thread; very large images (>4000px) may briefly freeze the UI
2. **Canvas memory** — Two full-resolution canvases are allocated; extremely large images may hit browser memory limits
3. **Same-origin images only** — Images must be loaded from file input (no cross-origin URL support)
4. **Dimension handling** — Images of different sizes are scaled to the larger dimensions, which may introduce slight distortion rather than padding
5. **Color space** — Comparison is done in sRGB; perceptual color differences (CIE Delta E) would be more accurate but slower
6. **Anti-aliasing** — The Gaussian blur filter handles most anti-aliasing noise, but at very high sensitivity some may still appear
7. **No sub-pixel detection** — The algorithm works at pixel level; sub-pixel rendering differences are not detected

---

## AI Tools Used

- **GitHub Copilot** (Claude) — Used for code generation, architecture decisions, component implementation, algorithm design, testing setup, and deployment configuration
