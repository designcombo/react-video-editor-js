import { create } from "zustand";

const useStore = create((set) => ({
  size: {
    width: 1080,
    height: 1920,
  },

  timeline: null,
  duration: 1000,
  fps: 30,
  scale: {
    // 1x distance (second 0 to second 5, 5 segments).
    index: 7,
    unit: 300,
    zoom: 1 / 300,
    segments: 5,
  },
  scroll: {
    left: 0,
    top: 0,
  },
  playerRef: null,
  trackItemDetailsMap: {},
  activeIds: [],
  targetIds: [],
  tracks: [],
  trackItemIds: [],
  transitionIds: [],
  transitionsMap: {},
  trackItemsMap: {},
  sceneMoveableRef: null,

  setTimeline: (timeline) =>
    set(() => ({
      timeline: timeline,
    })),
  setScale: (scale) =>
    set(() => ({
      scale: scale,
    })),
  setScroll: (scroll) =>
    set(() => ({
      scroll: scroll,
    })),
  setState: async (state) => {
    return set({ ...state });
  },
  setPlayerRef: (playerRef) => set({ playerRef }),
  setSceneMoveableRef: (ref) => set({ sceneMoveableRef: ref }),
}));

export default useStore;
