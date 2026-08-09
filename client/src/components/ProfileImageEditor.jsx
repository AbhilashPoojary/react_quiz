import React, { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { ImagePlus, RotateCcw, RotateCw, X } from "lucide-react";
import { processProfileImage } from "../utils/processProfileImage";

const defaultAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sharpness: 0,
  grayscale: false,
};

const adjustmentControls = [
  { key: "brightness", label: "Brightness", min: 50, max: 150 },
  { key: "contrast", label: "Contrast", min: 50, max: 150 },
  { key: "saturation", label: "Saturation", min: 0, max: 180 },
  { key: "sharpness", label: "Sharpness", min: 0, max: 100 },
];

export default function ProfileImageEditor({
  imageSrc,
  onApply,
  onCancel,
  onReplaceImage,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [adjustments, setAdjustments] = useState(defaultAdjustments);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewMode, setPreviewMode] = useState("edited");
  const [isApplying, setIsApplying] = useState(false);
  const previewUrlRef = useRef("");
  const fileInputRef = useRef(null);

  const filterStyle = {
    filter: `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%) grayscale(${
      adjustments.grayscale ? 100 : 0
    }%)`,
  };

  const resetEditorState = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setAdjustments({ ...defaultAdjustments });
    setPreviewMode("edited");
  };

  useEffect(() => {
    resetEditorState();
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
      setPreviewUrl("");
    }
  }, [imageSrc]);

  useEffect(() => {
    if (!imageSrc || !croppedAreaPixels) {
      return undefined;
    }

    let isActive = true;
    const timeout = window.setTimeout(async () => {
      try {
        const previewFile = await processProfileImage({
          imageSrc,
          cropPixels: croppedAreaPixels,
          rotation,
          adjustments,
          quality: 0.75,
        });
        const nextPreviewUrl = URL.createObjectURL(previewFile);

        if (!isActive) {
          URL.revokeObjectURL(nextPreviewUrl);
          return;
        }

        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
        }

        previewUrlRef.current = nextPreviewUrl;
        setPreviewUrl(nextPreviewUrl);
      } catch (error) {
        console.error(error);
      }
    }, 180);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
    };
  }, [adjustments, croppedAreaPixels, imageSrc, rotation]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    },
    []
  );

  const updateAdjustment = (key, value) => {
    setAdjustments((prev) => ({
      ...prev,
      [key]: Number(value),
    }));
  };

  const handleReset = () => resetEditorState();

  const handleReplaceImage = (event) => {
    const nextFile = event.target.files?.[0];
    event.target.value = "";

    if (nextFile && onReplaceImage) {
      onReplaceImage(nextFile);
    }
  };

  const handleApply = async () => {
    if (!croppedAreaPixels || isApplying) {
      return;
    }

    try {
      setIsApplying(true);
      const processedFile = await processProfileImage({
        imageSrc,
        cropPixels: croppedAreaPixels,
        rotation,
        adjustments,
      });
      await onApply(processedFile);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center">
      <div
        className="confirm-card max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-lg p-4 shadow-xl sm:p-5"
        style={{ background: "var(--app-surface)" }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="app-strong-text text-lg font-semibold">
              Edit Profile Image
            </h3>
            <p className="app-muted-text text-sm">
              Crop, rotate, and tune the image before upload.
            </p>
          </div>
          <button
            aria-label="Close editor"
            className="rounded p-2 text-gray-500 transition hover:text-red-600"
            disabled={isApplying}
            type="button"
            onClick={onCancel}
          >
            <X size={20} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          type="file"
          onChange={handleReplaceImage}
        />

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            <div className="profile-image-cropper relative h-[340px] overflow-hidden rounded border sm:h-[430px]">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="rect"
                showGrid
                objectFit="contain"
                style={{
                  mediaStyle: filterStyle,
                }}
                onCropChange={setCrop}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                onRotationChange={setRotation}
                onZoomChange={setZoom}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <label className="app-label font-medium">Zoom</label>
                  <span className="app-muted-text">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>
                <input
                  className="w-full accent-red-600"
                  max="3"
                  min="1"
                  step="0.01"
                  type="range"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <label className="app-label font-medium">Rotation</label>
                  <span className="app-muted-text">
                    {Math.round(rotation)}
                    {"\u00b0"}
                  </span>
                </div>
                <input
                  className="w-full accent-red-600"
                  max="360"
                  min="0"
                  step="1"
                  type="range"
                  value={rotation}
                  onChange={(event) => setRotation(Number(event.target.value))}
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm transition hover:text-red-600"
                type="button"
                onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)}
              >
                <RotateCcw size={16} />
                Rotate Left 90{"\u00b0"}
              </button>
              <button
                className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm transition hover:text-red-600"
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
              >
                <RotateCw size={16} />
                Rotate Right 90{"\u00b0"}
              </button>
              {onReplaceImage && (
                <button
                  className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm transition hover:text-red-600"
                  disabled={isApplying}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus size={16} />
                  Replace Image
                </button>
              )}
            </div>
          </div>

          <aside className="min-w-0 space-y-4">
            <div className="profile-chart-panel rounded border p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="app-strong-text text-sm font-semibold">
                  Profile Preview
                </p>
                <div className="flex rounded border p-0.5 text-xs">
                  {["edited", "original"].map((mode) => (
                    <button
                      key={mode}
                      className={`rounded px-2 py-1 font-medium capitalize transition ${
                        previewMode === mode
                          ? "bg-red-600 text-white"
                          : "app-muted-text hover:text-red-600"
                      }`}
                      type="button"
                      onClick={() => setPreviewMode(mode)}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-red-600 bg-gray-100 shadow-sm sm:h-44 sm:w-44">
                  {previewMode === "original" ? (
                    <img
                      alt="Original profile preview"
                      className="h-full w-full object-cover"
                      src={imageSrc}
                    />
                  ) : (
                    previewUrl && (
                      <img
                        alt="Circular profile preview"
                        className="h-full w-full object-cover"
                        src={previewUrl}
                      />
                    )
                  )}
                </div>
                <p className="app-muted-text text-center text-xs">
                  {previewMode === "original"
                    ? "Original image before edits"
                    : "Edited image that will be uploaded"}
                </p>
              </div>
            </div>

            <div className="profile-chart-panel rounded border p-4">
              <p className="app-strong-text mb-3 text-sm font-semibold">
                Adjustments
              </p>
              <div className="space-y-3">
                {adjustmentControls.map((control) => (
                  <div key={control.key}>
                    <div className="mb-1 flex justify-between gap-2 text-sm">
                      <label className="app-label font-medium">
                        {control.label}
                      </label>
                      <span className="app-muted-text">
                        {adjustments[control.key]}
                      </span>
                    </div>
                    <input
                      className="w-full accent-red-600"
                      max={control.max}
                      min={control.min}
                      type="range"
                      value={adjustments[control.key]}
                      onChange={(event) =>
                        updateAdjustment(control.key, event.target.value)
                      }
                    />
                  </div>
                ))}
                <label className="app-label flex items-center gap-2 text-sm font-medium">
                  <input
                    checked={adjustments.grayscale}
                    className="accent-red-600"
                    type="checkbox"
                    onChange={(event) =>
                      setAdjustments((prev) => ({
                        ...prev,
                        grayscale: event.target.checked,
                      }))
                    }
                  />
                  Grayscale
                </label>
              </div>
            </div>
          </aside>
        </div>

        <div
          className="sticky bottom-0 -mx-4 mt-5 flex flex-col gap-3 border-t px-4 py-3 backdrop-blur sm:-mx-5 sm:flex-row sm:justify-between sm:px-5"
          style={{
            background: "var(--app-surface)",
            borderColor: "var(--app-border)",
          }}
        >
          <button
            className="rounded border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            disabled={isApplying}
            type="button"
            onClick={handleReset}
          >
            Reset All
          </button>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              className="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-300"
              disabled={isApplying}
              type="button"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-70"
              disabled={isApplying || !croppedAreaPixels}
              type="button"
              onClick={handleApply}
            >
              {isApplying ? "Processing..." : "Apply Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
