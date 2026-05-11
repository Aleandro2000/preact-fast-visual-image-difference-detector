import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <div class="min-h-screen flex items-center justify-center bg-background">
      <div class="text-center space-y-6 p-8">
        <h1 class="text-5xl font-bold tracking-tight">Fast Visual Diff Detector</h1>
        <p class="text-xl text-muted-foreground max-w-xl mx-auto">
          Upload two images and instantly detect visual differences with adjustable sensitivity and
          bounding box highlighting.
        </p>
        <Link
          to="/diff"
          class="inline-flex items-center justify-center h-11 px-8 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
