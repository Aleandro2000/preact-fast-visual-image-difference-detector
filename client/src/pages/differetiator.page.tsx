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
import { Upload, Trash2, ZoomIn, ZoomOut, Timer, Box, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import logoSvg from "@/assets/logo.svg";

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
    <div class="min-h-screen relative grid-bg">
      <div class="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
      <div class="absolute bottom-[-200px] left-[-100px] w-[400px] h-[400px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />

      <nav class="sticky top-0 z-50 glass-strong border-b border-white/5">
        <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Link to="/" class="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft class="w-4 h-4" />
            </Link>
            <div class="w-px h-5 bg-white/10" />
            <img src={logoSvg} alt="Logo" class="w-6 h-6 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]" />
            <span class="text-sm font-semibold text-gradient">Visual Diff</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} class="text-muted-foreground hover:text-red-400 gap-1.5">
            <Trash2 class="w-3.5 h-3.5" />
            Reset
          </Button>
        </div>
      </nav>

      <div class="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <div class="animate-fade-in-up">
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">
            <span class="text-gradient">Analyze</span>
            <span class="text-foreground/80"> Differences</span>
          </h1>
          <p class="text-sm text-muted-foreground mt-1">Upload two images to detect visual changes with pixel-level precision</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <Card class="glass rounded-2xl glow-purple overflow-hidden">
              <CardHeader class="pb-3">
                <CardTitle class="text-sm font-medium flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                  Before Image
                </CardTitle>
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
                  <div class="relative group rounded-xl overflow-hidden">
                    <img
                      src={store.beforeImageURL}
                      alt="Before"
                      class="w-full rounded-xl object-contain max-h-[400px] border border-white/5"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 glass rounded-lg"
                      onClick={() => beforeInputRef.current?.click()}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    class="upload-zone w-full h-48 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer bg-white/[0.02] transition-all duration-300"
                    onClick={() => beforeInputRef.current?.click()}
                  >
                    <div class="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Upload class="w-5 h-5 text-purple-400" />
                    </div>
                    <div class="text-center">
                      <span class="text-sm text-foreground/70 block">Drop or click to upload</span>
                      <span class="text-xs text-muted-foreground">PNG, JPG, GIF, WebP — max 50MB</span>
                    </div>
                  </button>
                )}
                {errors.beforeImage && (
                  <p class="text-xs text-destructive mt-2">{errors.beforeImage.message}</p>
                )}
              </CardContent>
            </Card>

            <Card class="glass rounded-2xl glow-cyan overflow-hidden">
              <CardHeader class="pb-3">
                <CardTitle class="text-sm font-medium flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                  After Image
                </CardTitle>
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
                  <div class="relative group rounded-xl overflow-hidden">
                    <img
                      src={store.afterImageURL}
                      alt="After"
                      class="w-full rounded-xl object-contain max-h-[400px] border border-white/5"
                    />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 glass rounded-lg"
                      onClick={() => afterInputRef.current?.click()}
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    class="upload-zone w-full h-48 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer bg-white/[0.02] transition-all duration-300"
                    onClick={() => afterInputRef.current?.click()}
                  >
                    <div class="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <Upload class="w-5 h-5 text-cyan-400" />
                    </div>
                    <div class="text-center">
                      <span class="text-sm text-foreground/70 block">Drop or click to upload</span>
                      <span class="text-xs text-muted-foreground">PNG, JPG, GIF, WebP — max 50MB</span>
                    </div>
                  </button>
                )}
                {errors.afterImage && (
                  <p class="text-xs text-destructive mt-2">{errors.afterImage.message}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div class="glass rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div class="flex-1 w-full space-y-3">
                <div class="flex items-center justify-between">
                  <Label class="text-sm">Sensitivity</Label>
                  <span class="text-xs font-mono px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {sensitivity}
                  </span>
                </div>
                <Slider
                  min={1}
                  max={100}
                  step={1}
                  value={sensitivity}
                  onChange={(v) => setValue("sensitivity", v)}
                />
                <p class="text-xs text-muted-foreground">
                  Higher values detect smaller changes · Lower values filter noise
                </p>
              </div>
              <Button
                type="submit"
                size="lg"
                class="w-full sm:w-auto rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white border-0 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:scale-[1.02] transition-all duration-300 gap-2"
                disabled={!store.beforeImageURL || !store.afterImageURL || store.isProcessing}
              >
                {store.isProcessing ? (
                  <>
                    <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles class="w-4 h-4" />
                    Compare
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {store.diffResult && (
          <div class="space-y-4 animate-fade-in-up">
            <div class="flex flex-wrap gap-2">
              <Badge variant="outline" class="gap-1.5 py-1.5 px-3 rounded-full glass border-purple-500/20 text-purple-300">
                <Timer class="w-3.5 h-3.5" />
                {store.diffResult.processingTimeMs} ms
              </Badge>
              <Badge variant="outline" class="gap-1.5 py-1.5 px-3 rounded-full glass border-cyan-500/20 text-cyan-300">
                <Box class="w-3.5 h-3.5" />
                {store.diffResult.boundingBoxes.length} region
                {store.diffResult.boundingBoxes.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="secondary" class="gap-1.5 py-1.5 px-3 rounded-full bg-white/5 text-foreground/70">
                {store.diffResult.diffPercentage}% changed
              </Badge>
              <Badge variant="secondary" class="gap-1.5 py-1.5 px-3 rounded-full bg-white/5 text-foreground/70">
                {store.diffResult.totalDiffPixels.toLocaleString()} px
              </Badge>
              <div class="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  class="rounded-full w-8 h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setZoom((z) => Math.max(25, z - 25))}
                >
                  <ZoomOut class="w-3.5 h-3.5" />
                </Button>
                <span class="text-xs font-mono text-muted-foreground w-10 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="rounded-full w-8 h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                >
                  <ZoomIn class="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <Card class="glass rounded-2xl overflow-hidden glow-purple">
              <CardHeader class="pb-3">
                <CardTitle class="text-sm font-medium flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                  Detected Differences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div class="overflow-auto rounded-xl border border-white/5 scan-effect">
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
