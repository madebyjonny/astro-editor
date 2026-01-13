import { create } from "zustand";

interface UIState {
  // State
  showNewFileModal: boolean;

  // Actions
  openNewFileModal: () => void;
  closeNewFileModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  showNewFileModal: false,

  openNewFileModal: () => set({ showNewFileModal: true }),
  closeNewFileModal: () => set({ showNewFileModal: false }),
}));
