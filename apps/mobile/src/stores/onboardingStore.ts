import { create } from 'zustand';

export type Currency = 'HUF' | 'EUR' | 'USD';

export interface OnboardingResponses {
  mainChallenges: string[];
  incomeRange: string | null;
  topCategory: string | null;
  impulseFrequency: string | null;
  locationEnabled: boolean | null;
  notificationsEnabled: boolean | null;
  aiProfile: string | null;
}

interface OnboardingState {
  responses: OnboardingResponses;
  setResponses: (updates: Partial<OnboardingResponses>) => void;
  resetResponses: () => void;
}

const initialResponses: OnboardingResponses = {
  mainChallenges: [],
  incomeRange: null,
  topCategory: null,
  impulseFrequency: null,
  locationEnabled: null,
  notificationsEnabled: null,
  aiProfile: null,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  responses: initialResponses,
  setResponses: (updates) =>
    set((state) => ({
      responses: { ...state.responses, ...updates },
    })),
  resetResponses: () => set({ responses: initialResponses }),
}));
