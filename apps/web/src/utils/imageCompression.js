import {
  PROFILE_IMAGE_MAX_BYTES,
  PROFILE_IMAGE_SOURCE_MAX_BYTES,
  PROFILE_IMAGE_TYPES,
} from "./uploadRules";

export const IMAGE_UPLOAD_TARGETS = {
  avatar: { maxWidth: 512, maxHeight: 512, quality: 0.82 },
  cardProfile: { maxWidth: 512, maxHeight: 512, quality: 0.82 },
  cover: { maxWidth: 1024, maxHeight: 576, quality: 0.8 },
  gallery: { maxWidth: 1200, maxHeight: 1200, quality: 0.78 },
};

function fileBaseName(file) {
  return String(file?.name || "image")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "image";
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

function extensionForType(type) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      image: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close?.(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read this image."));
    };
    image.src = objectUrl;
  });
}

export async function prepareImageForUpload(file, target = IMAGE_UPLOAD_TARGETS.avatar) {
  if (!file) {
    throw new Error("Choose an image to upload.");
  }

  if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Upload a JPG, PNG, or WebP image.");
  }

  if (Number(file.size || 0) > PROFILE_IMAGE_SOURCE_MAX_BYTES) {
    throw new Error("Use an image that is 8MB or smaller.");
  }

  const options = { ...IMAGE_UPLOAD_TARGETS.avatar, ...target };
  const decoded = await decodeImage(file);

  try {
    const scale = Math.min(
      1,
      options.maxWidth / decoded.width,
      options.maxHeight / decoded.height,
    );
    const width = Math.max(1, Math.round(decoded.width * scale));
    const height = Math.max(1, Math.round(decoded.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to optimize this image.");
    }

    context.drawImage(decoded.image, 0, 0, width, height);

    let blob = null;
    for (const type of ["image/webp", "image/jpeg"]) {
      for (const quality of [options.quality, 0.74, 0.66, 0.58]) {
        const candidate = await canvasToBlob(canvas, type, quality);
        if (!candidate || !PROFILE_IMAGE_TYPES.includes(candidate.type)) {
          continue;
        }

        blob = candidate;
        if (candidate.size <= PROFILE_IMAGE_MAX_BYTES) {
          break;
        }
      }

      if (blob && blob.size <= PROFILE_IMAGE_MAX_BYTES) {
        break;
      }
    }

    if (!blob) {
      throw new Error("Unable to optimize this image.");
    }

    if (blob.size > PROFILE_IMAGE_MAX_BYTES) {
      throw new Error("Use a smaller image or crop it before uploading.");
    }

    const optimizedFile = new File([blob], `${fileBaseName(file)}.${extensionForType(blob.type)}`, {
      type: blob.type,
      lastModified: Date.now(),
    });

    return {
      file: optimizedFile,
      previewUrl: URL.createObjectURL(optimizedFile),
      originalBytes: file.size,
      compressedBytes: optimizedFile.size,
      width,
      height,
    };
  } finally {
    decoded.cleanup();
  }
}
