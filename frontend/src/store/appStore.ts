import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Campaign, UserProfile, Vote } from '@/types/domain';

interface AppState {
  // Auth
  deptCode: string | null;
  user: UserProfile | null;
  
  // Current session
  currentCampaignId: string | null;
  votes: Vote[];
  superLikeUsed: boolean;
  
  // Actions
  setDeptCode: (code: string) => void;
  setUser: (user: UserProfile) => void;
  setCurrentCampaign: (id: string) => void;
  addVote: (vote: Vote) => void;
  useSuperLike: () => void;
  resetVoting: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      deptCode: null,
      user: null,
      currentCampaignId: null,
      votes: [],
      superLikeUsed: false,

      setDeptCode: (code) => set({ deptCode: code }),
      
      setUser: (user) => set({ user }),
      
      setCurrentCampaign: (id) => set({ currentCampaignId: id }),
      
      addVote: (vote) => set((state) => ({ 
        votes: [...state.votes, vote],
        superLikeUsed: vote.is_super_like ? true : state.superLikeUsed,
      })),
      
      useSuperLike: () => set({ superLikeUsed: true }),
      
      resetVoting: () => set({ votes: [], superLikeUsed: false }),
      
      logout: () => set({ 
        deptCode: null, 
        user: null, 
        currentCampaignId: null,
        votes: [],
        superLikeUsed: false,
      }),
    }),
    {
      name: 'eventhorizon-storage',
    }
  )
);
