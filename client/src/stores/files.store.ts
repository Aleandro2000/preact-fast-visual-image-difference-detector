import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { indexedDBStorage } from "@/lib/utils";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiffResult {
  diffImageDataURL: string;
  boundingBoxes: BoundingBox[];
  processingTimeMs: number;
  totalDiffPixels: number;
  diffPercentage: number;
}

interface FilesState {
  beforeImageURL: string | null;
  afterImageURL: string | null;
  sensitivity: number;
  diffResult: DiffResult | null;
  isProcessing: boolean;

  setBeforeImage: (url: string | null) => void;
  setAfterImage: (url: string | null) => void;
  setSensitivity: (value: number) => void;
  setDiffResult: (result: DiffResult | null) => void;
  setIsProcessing: (value: boolean) => void;
  reset: () => void;
}

export const useFilesStore = create<FilesState>()(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (persist as any)(
    (set: (partial: Partial<FilesState>) => void) => ({
      beforeImageURL: null,
      afterImageURL: null,
      sensitivity: 30,
      diffResult: null,
      isProcessing: false,

      setBeforeImage: (url: string | null) => set({ beforeImageURL: url, diffResult: null }),
      setAfterImage: (url: string | null) => set({ afterImageURL: url, diffResult: null }),
      setSensitivity: (value: number) => set({ sensitivity: value }),
      setDiffResult: (result: DiffResult | null) => set({ diffResult: result }),
      setIsProcessing: (value: boolean) => set({ isProcessing: value }),
      reset: () =>
        set({
          beforeImageURL: null,
          afterImageURL: null,
          sensitivity: 30,
          diffResult: null,
          isProcessing: false,
        }),
    }),
    {
      name: "files-store",
      storage: createJSONStorage(() => indexedDBStorage),
    },
  ),
);
