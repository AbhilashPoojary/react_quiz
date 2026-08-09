const OUTPUT_SIZE = 512;

const createImage = (imageSrc) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
    image.setAttribute("crossOrigin", "anonymous");
    image.src = imageSrc;
  });

const getRadianAngle = (degreeValue) => (degreeValue * Math.PI) / 180;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeAdjustments = (adjustments = {}) => ({
  brightness: adjustments.brightness ?? 100,
  contrast: adjustments.contrast ?? 100,
  saturation: adjustments.saturation ?? 100,
  sharpness: adjustments.sharpness ?? 0,
  grayscale: Boolean(adjustments.grayscale),
});

const applySharpness = (imageData, amount) => {
  if (!amount) {
    return imageData;
  }

  const strength = clamp(amount / 100, 0, 1.5);
  const side = imageData.width;
  const height = imageData.height;
  const source = imageData.data;
  const output = new Uint8ClampedArray(source);
  const centerWeight = 1 + 4 * strength;
  const adjacentWeight = -strength;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < side - 1; x += 1) {
      const index = (y * side + x) * 4;

      for (let channel = 0; channel < 3; channel += 1) {
        const value =
          source[index + channel] * centerWeight +
          source[index - 4 + channel] * adjacentWeight +
          source[index + 4 + channel] * adjacentWeight +
          source[index - side * 4 + channel] * adjacentWeight +
          source[index + side * 4 + channel] * adjacentWeight;

        output[index + channel] = clamp(value, 0, 255);
      }
    }
  }

  return new ImageData(output, imageData.width, imageData.height);
};

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Unable to process profile image"));
        }
      },
      type,
      quality
    );
  });

export async function processProfileImage({
  imageSrc,
  cropPixels,
  rotation = 0,
  adjustments,
  outputType = "image/webp",
  quality = 0.88,
}) {
  const image = await createImage(imageSrc);
  const crop = cropPixels || {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  };
  const normalizedAdjustments = normalizeAdjustments(adjustments);
  const safeArea = Math.max(image.width, image.height) * 2;
  const radians = getRadianAngle(rotation);
  const transformCanvas = document.createElement("canvas");
  const transformContext = transformCanvas.getContext("2d");

  transformCanvas.width = safeArea;
  transformCanvas.height = safeArea;
  transformContext.translate(safeArea / 2, safeArea / 2);
  transformContext.rotate(radians);
  transformContext.translate(-image.width / 2, -image.height / 2);
  transformContext.drawImage(image, 0, 0);

  const outputCanvas = document.createElement("canvas");
  const outputContext = outputCanvas.getContext("2d");
  outputCanvas.width = OUTPUT_SIZE;
  outputCanvas.height = OUTPUT_SIZE;
  outputContext.filter = `brightness(${normalizedAdjustments.brightness}%) contrast(${normalizedAdjustments.contrast}%) saturate(${normalizedAdjustments.saturation}%) grayscale(${
    normalizedAdjustments.grayscale ? 100 : 0
  }%)`;
  outputContext.drawImage(
    transformCanvas,
    safeArea / 2 - image.width / 2 + crop.x,
    safeArea / 2 - image.height / 2 + crop.y,
    crop.width,
    crop.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE
  );

  if (normalizedAdjustments.sharpness > 0) {
    const imageData = outputContext.getImageData(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    outputContext.putImageData(
      applySharpness(imageData, normalizedAdjustments.sharpness),
      0,
      0
    );
  }

  const blob = await canvasToBlob(outputCanvas, outputType, quality);
  const extension = outputType === "image/png" ? "png" : "webp";

  return new File([blob], `profile-image.${extension}`, {
    type: outputType,
    lastModified: Date.now(),
  });
}

export function createCircularPreview(imageSrc) {
  return imageSrc;
}
