import { create } from "zustand";
import { produce } from "immer";

interface WidgetState {
  isOpen: boolean;
  isRead: boolean;
  isAnimating: boolean;
  toggleOpen: () => void;
  markAsRead: () => void;
  setAnimating: (animating: boolean) => void;
}

export const useWidgetStore = create<WidgetState>((set) => ({
  isOpen: true,
  isRead: false,
  isAnimating: false,
  
  toggleOpen: () => set(produce((state: WidgetState) => {
    state.isOpen = !state.isOpen;
  })),
  
  markAsRead: () => set(produce((state: WidgetState) => {
    state.isRead = true;
  })),
  
  setAnimating: (animating: boolean) => set(produce((state: WidgetState) => {
    state.isAnimating = animating;
  })),
}));
