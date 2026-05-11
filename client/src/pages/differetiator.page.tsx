import { useFilesStore } from "@/stores/files.store";
import { computeDiff } from "@/lib/diff";
import {
  differentiatorSchema,
  type DifferentiatorFormData,
} from "@/validators/differentiator.validator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState, useCallback } from "preact/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2, ZoomIn, ZoomOut, Timer, Box } from "lucide-react";

export default function DifferentiatorPage() {
  const store = useFilesStore();
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);
  const [zoom, setZoom] = useState(100);

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DifferentiatorFormData>({
    resolver: zodResolver(differentiatorSchema),
    defaultValues: { sensitivity: store.sensitivity },
  });

  const sensitivity = watch("sensitivity");

  const handleFileSelect = useCallback(
    (field: "beforeImage" | "afterImage") => (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setValue(field, file, { shouldValidate: true });
      const url = URL.createObjectURL(file);
      if (field === "beforeImage") store.setBeforeImage(url);
      else store.setAfterImage(url);
    },
    [setValue, store],
  );

  const onSubmit = useCallback(
    async (data: DifferentiatorFormData) => {
      if (!store.beforeImageURL || !store.afterImageURL) return;
      store.setIsProcessing(true);
      store.setSensitivity(data.sensitivity);
      try {
        const result = await computeDiff(
          store.beforeImageURL,
          store.afterImageURL,
          data.sensitivity,
        );
        store.setDiffResult(result);
      } finally {
        store.setIsProcessing(false);
      }
    },
    [store],
  );

  const handleReset = useCallback(() => {
    store.reset();
    setZoom(100);
    if (beforeInputRef.current) beforeInputRef.current.value = "";
    if (afterInputRef.current) afterInputRef.current.value = "";
  }, [store]);

  return (
    <div class="min-h-screen bg-background">
      <div class="max-w-7xl mx-auto p-4 space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-tight">Visual Diff Detector</h1>
            <p class="text-muted-foreground">Upload two images and detect visual differences</p>
          </div>
          <Button variant="outline" onClick={handleReset}>
            <Trash2 class="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardHeader>
                <CardTitle>Before Image</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  class="hidden"
                  onChange={handleFileSelect("beforeImage")}
                />
                {store.beforeImageURL ? (
                  <div class="relative group">
                    <img
                      src={store.beforeImageURL}
                      alt="Before"
                      class="w-full rounded-lg border object-contain max-h-[400px]"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => beforeInputRef.current?.click()}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    class="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => beforeInputRef.current?.click()}
                  >
                    <Upload class="w-8 h-8 text-muted-foreground" />
                    <span class="text-sm text-muted-foreground">Click to upload before image</span>
                  </button>
                )}
                {errors.beforeImage && (
                  <p class="text-sm text-destructive mt-2">{errors.beforeImage.message}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>After Image</CardTitle>
              </CardHeader>
              <CardContent>
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*"
                  class="hidden"
                  onChange={handleFileSelect("afterImage")}
                />
                {store.afterImageURL ? (
                  <div class="relative group">
                    <img
                      src={store.afterImageURL}
                      alt="After"
                      class="w-full rounded-lg border object-contain max-h-[400px]"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => afterInputRef.current?.click()}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    class="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => afterInputRef.current?.click()}
                  >
                    <Upload class="w-8 h-8 text-muted-foreground" />
                    <span class="text-sm text-muted-foreground">Click to upload after image</span>
                  </button>
                )}
                {errors.afterImage && (
                  <p class="text-sm text-destructive mt-2">{errors.afterImage.message}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card class="mb-4">
            <CardContent class="pt-6">
              <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div class="flex-1 w-full">
                  <Label>Sensitivity: {sensitivity}</Label>
                  <p class="text-xs text-muted-foreground mb-2">
                    Higher = detects smaller differences. Lower = ignores noise.
                  </p>
                  <Slider
                    min={1}
                    max={100}
                    step={1}
                    value={sensitivity}
                    onChange={(v) => setValue("sensitivity", v)}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  class="w-full sm:w-auto"
                  disabled={!store.beforeImageURL || !store.afterImageURL || store.isProcessing}
                >
                  {store.isProcessing ? "Processing..." : "Compare Images"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {store.diffResult && (
          <div class="space-y-4">
            <div class="flex flex-wrap gap-3">
              <Badge variant="outline" class="gap-1.5 py-1">
                <Timer class="w-3.5 h-3.5" />
                {store.diffResult.processingTimeMs} ms
              </Badge>
              <Badge variant="outline" class="gap-1.5 py-1">
                <Box class="w-3.5 h-3.5" />
                {store.diffResult.boundingBoxes.length} region
                {store.diffResult.boundingBoxes.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="secondary" class="gap-1.5 py-1">
                {store.diffResult.diffPercentage}% changed
              </Badge>
              <Badge variant="secondary" class="gap-1.5 py-1">
                {store.diffResult.totalDiffPixels.toLocaleString()} diff pixels
              </Badge>
              <div class="ml-auto flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoom((z) => Math.max(25, z - 25))}
                >
                  <ZoomOut class="w-4 h-4" />
                </Button>
                <span class="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                >
                  <ZoomIn class="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detected Differences</CardTitle>
              </CardHeader>
              <CardContent>
                <div class="overflow-auto rounded-lg border">
                  <img
                    src={store.diffResult.diffImageDataURL}
                    alt="Diff result"
                    style={{ width: `${zoom}%`, maxWidth: "none" }}
                    class="block"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
