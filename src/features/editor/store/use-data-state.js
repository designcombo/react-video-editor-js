import { create } from "zustand";

const useDataState = create((set) => ({
  fonts: [],
  compactFonts: [],
  setFonts: (fonts) => set({ fonts }),
  setCompactFonts: (compactFonts) => set({ compactFonts }),
}));

export default useDataState;
