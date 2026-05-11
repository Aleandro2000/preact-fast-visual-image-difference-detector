import { Link } from "react-router-dom";
import logoSvg from "@/assets/logo.svg";
import { Scan, Zap, Target } from "lucide-react";

export default function HomePage() {
  return (
    <div class="min-h-screen relative overflow-hidden grid-bg">
      <div class="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />
      <div class="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[100px] pointer-events-none" />

      <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        <div class="animate-fade-in-up text-center max-w-3xl mx-auto space-y-8">
          <div class="animate-float inline-block mb-4">
            <div class="relative">
              <img src={logoSvg} alt="Logo" class="w-20 h-20 mx-auto drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
              <div class="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-purple-500/20 blur-xl" />
            </div>
          </div>

          <h1 class="text-6xl sm:text-7xl font-bold tracking-tight leading-[1.1]">
            <span class="text-gradient">Visual Diff</span>
            <br />
            <span class="text-foreground/90">Detector</span>
          </h1>

          <p class="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Upload two images and instantly detect visual differences with pixel-precision bounding boxes and adjustable sensitivity.
          </p>

          <Link
            to="/diff"
            class="group relative inline-flex items-center justify-center h-12 px-10 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold text-base shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] transition-all duration-300 hover:scale-105"
          >
            <Zap class="w-4 h-4 mr-2" />
            Launch Detector
          </Link>
        </div>

        <div class="mt-20 animate-fade-in-up grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full" style={{ animationDelay: "0.2s" }}>
          <div class="glass rounded-2xl p-6 text-center glow-purple hover:scale-105 transition-transform duration-300">
            <Zap class="w-8 h-8 mx-auto mb-3 text-purple-400" />
            <h3 class="font-semibold text-sm text-foreground/90">Blazing Fast</h3>
            <p class="text-xs text-muted-foreground mt-1">Real-time pixel analysis in milliseconds</p>
          </div>
          <div class="glass rounded-2xl p-6 text-center glow-purple hover:scale-105 transition-transform duration-300">
            <Target class="w-8 h-8 mx-auto mb-3 text-cyan-400" />
            <h3 class="font-semibold text-sm text-foreground/90">Precision Boxes</h3>
            <p class="text-xs text-muted-foreground mt-1">Union-Find powered bounding box detection</p>
          </div>
          <div class="glass rounded-2xl p-6 text-center glow-purple hover:scale-105 transition-transform duration-300">
            <Scan class="w-8 h-8 mx-auto mb-3 text-purple-300" />
            <h3 class="font-semibold text-sm text-foreground/90">Smart Filtering</h3>
            <p class="text-xs text-muted-foreground mt-1">Gaussian noise reduction and sensitivity control</p>
          </div>
        </div>

        <p class="mt-12 text-xs text-muted-foreground/50 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          100% client-side · No uploads to servers · Canvas API powered
        </p>
      </div>
    </div>
  );
}
