// Client-side image compression for listing photos.
// Goal: keep visual quality high (real estate listings) while staying under the
// server-side 8 MB limit. Handles large iPhone/Android photos transparently.

const MAX_BYTES = 8 * 1024 * 1024;
const TARGET_BYTES = 7.5 * 1024 * 1024; // small safety margin
const MAX_DIMENSION_STEPS = [3200, 2560, 2048, 1600];
const QUALITY_STEPS = [0.9, 0.82, 0.75, 0.68];

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function drawToCanvas(img: HTMLImageElement, maxDim: number): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D indisponible");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
}

/**
 * If `file` is already under the limit, returns it unchanged.
 * Otherwise attempts to re-encode as JPEG, progressively reducing max dimension
 * then quality until under the limit. Returns the original file when the input
 * is not a decodable image (server will validate anyway).
 */
export async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= MAX_BYTES) return file;

  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    // Format non décodable côté navigateur (ex. HEIC). Laisse le serveur trancher.
    return file;
  }

  let best: Blob | null = null;
  for (const maxDim of MAX_DIMENSION_STEPS) {
    const canvas = drawToCanvas(img, maxDim);
    for (const q of QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, q);
      if (!blob) continue;
      if (blob.size <= TARGET_BYTES) {
        best = blob;
        break;
      }
      if (!best || blob.size < best.size) best = blob;
    }
    if (best && best.size <= TARGET_BYTES) break;
  }

  if (!best) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([best], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
