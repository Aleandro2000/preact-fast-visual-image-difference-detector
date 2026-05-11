import type { BoundingBox, DiffResult } from "@/stores/files.store";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function getImageData(img: HTMLImageElement, width: number, height: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

function pixelDiff(
  r1: number,
  g1: number,
  b1: number,
  a1: number,
  r2: number,
  g2: number,
  b2: number,
  a2: number,
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  const da = a1 - a2;
  return Math.sqrt(dr * dr + dg * dg + db * db + da * da);
}

function unionFind(n: number) {
  const parent = new Int32Array(n);
  const rank = new Int32Array(n);
  for (let i = 0; i < n; i++) parent[i] = i;

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  }

  function unite(a: number, b: number) {
    const ra = find(a);
    const rb = find(b);
    if (ra === rb) return;
    if (rank[ra] < rank[rb]) {
      parent[ra] = rb;
    } else if (rank[ra] > rank[rb]) {
      parent[rb] = ra;
    } else {
      parent[rb] = ra;
      rank[ra]++;
    }
  }

  return { find, unite };
}

function findBoundingBoxes(
  diffMask: Uint8Array,
  width: number,
  height: number,
  minBoxArea: number,
): BoundingBox[] {
  const uf = unionFind(width * height);
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [-1, 1],
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!diffMask[idx]) continue;
      for (const [dy, dx] of dirs) {
        const ny = y + dy;
        const nx = x + dx;
        if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
          const nIdx = ny * width + nx;
          if (diffMask[nIdx]) {
            uf.unite(idx, nIdx);
          }
        }
      }
    }
  }

  const groups = new Map<number, { minX: number; minY: number; maxX: number; maxY: number }>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!diffMask[idx]) continue;
      const root = uf.find(idx);
      const g = groups.get(root);
      if (g) {
        g.minX = Math.min(g.minX, x);
        g.minY = Math.min(g.minY, y);
        g.maxX = Math.max(g.maxX, x);
        g.maxY = Math.max(g.maxY, y);
      } else {
        groups.set(root, { minX: x, minY: y, maxX: x, maxY: y });
      }
    }
  }

  const boxes: BoundingBox[] = [];
  const padding = 3;

  for (const g of groups.values()) {
    const w = g.maxX - g.minX + 1;
    const h = g.maxY - g.minY + 1;
    if (w * h < minBoxArea) continue;
    boxes.push({
      x: Math.max(0, g.minX - padding),
      y: Math.max(0, g.minY - padding),
      width: Math.min(width - Math.max(0, g.minX - padding), w + padding * 2),
      height: Math.min(height - Math.max(0, g.minY - padding), h + padding * 2),
    });
  }

  return mergeOverlapping(boxes);
}

function mergeOverlapping(boxes: BoundingBox[]): BoundingBox[] {
  if (boxes.length <= 1) return boxes;

  let merged = true;
  let result = [...boxes];

  while (merged) {
    merged = false;
    const next: BoundingBox[] = [];
    const used = new Set<number>();

    for (let i = 0; i < result.length; i++) {
      if (used.has(i)) continue;
      let current = { ...result[i] };

      for (let j = i + 1; j < result.length; j++) {
        if (used.has(j)) continue;
        if (overlaps(current, result[j])) {
          current = mergeTwoBoxes(current, result[j]);
          used.add(j);
          merged = true;
        }
      }
      next.push(current);
    }
    result = next;
  }

  return result;
}

function overlaps(a: BoundingBox, b: BoundingBox): boolean {
  const gap = 5;
  return !(
    a.x + a.width + gap < b.x ||
    b.x + b.width + gap < a.x ||
    a.y + a.height + gap < b.y ||
    b.y + b.height + gap < a.y
  );
}

function mergeTwoBoxes(a: BoundingBox, b: BoundingBox): BoundingBox {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

function applyGaussianBlur(mask: Uint8Array, width: number, height: number): Uint8Array {
  const out = new Uint8Array(width * height);
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kSum = 16;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          sum += mask[(y + ky) * width + (x + kx)] * kernel[(ky + 1) * 3 + (kx + 1)];
        }
      }
      out[y * width + x] = sum / kSum > 0.5 ? 1 : 0;
    }
  }
  return out;
}

export async function computeDiff(
  beforeSrc: string,
  afterSrc: string,
  sensitivity: number,
): Promise<DiffResult> {
  const start = performance.now();

  const [beforeImg, afterImg] = await Promise.all([loadImage(beforeSrc), loadImage(afterSrc)]);

  const width = Math.max(beforeImg.naturalWidth, afterImg.naturalWidth);
  const height = Math.max(beforeImg.naturalHeight, afterImg.naturalHeight);

  const beforeData = getImageData(beforeImg, width, height);
  const afterData = getImageData(afterImg, width, height);

  const threshold = ((100 - sensitivity) / 100) * 441.67 * 0.3 + 5;
  const minBoxArea = Math.max(4, Math.round((100 - sensitivity) / 5));

  const diffMask = new Uint8Array(width * height);
  let totalDiffPixels = 0;
  const bd = beforeData.data;
  const ad = afterData.data;
  const totalPixels = width * height;

  for (let i = 0; i < totalPixels; i++) {
    const off = i * 4;
    const d = pixelDiff(
      bd[off],
      bd[off + 1],
      bd[off + 2],
      bd[off + 3],
      ad[off],
      ad[off + 1],
      ad[off + 2],
      ad[off + 3],
    );
    if (d > threshold) {
      diffMask[i] = 1;
      totalDiffPixels++;
    }
  }

  const filtered = applyGaussianBlur(diffMask, width, height);
  const boundingBoxes = findBoundingBoxes(filtered, width, height, minBoxArea);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(afterImg, 0, 0, width, height);

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, width, height);

  for (const box of boundingBoxes) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.width, box.height);
    ctx.clip();
    ctx.drawImage(afterImg, 0, 0, width, height);
    ctx.restore();

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = Math.max(2, Math.round(Math.min(width, height) / 400));
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  }

  const processingTimeMs = Math.round((performance.now() - start) * 100) / 100;

  return {
    diffImageDataURL: canvas.toDataURL("image/png"),
    boundingBoxes,
    processingTimeMs,
    totalDiffPixels,
    diffPercentage: Math.round((totalDiffPixels / totalPixels) * 10000) / 100,
  };
}
