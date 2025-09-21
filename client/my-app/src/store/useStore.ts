import {create} from 'zustand'
import {persist, createJSONStorage} from 'zustand/middleware'

export interface PoliticalSpectrumScores {
    economic: number;
    social: number;
    foreignPolicy: number;
    governance: number;
    cultural: number;
}

export interface QuizResults {
    spectrum?: PoliticalSpectrumScores;
    answers?: unknown;
    completedAt?: string;
}

export interface UserData {
    fullName: string;
    username: string;
    email: string;
    age?: number | null;
    quizCompleted: boolean;
    quizResults?: QuizResults;
    signupDate?: string | null;
    overall_affiliation?: number | null;
    politicalLean?: string | null;
}

type SetUserDataInput = UserData | null | ((prev: UserData | null) => UserData | null);

type StoreState = {
    userId: string | null;
    setUserId: (id: string | null) => void;
    userData: UserData | null;
    setUserData: (updater: SetUserDataInput) => void;
    clearSession: () => void;
}

const useStore = create(
  persist<StoreState>(
    (set) => ({
      userId: null,
      setUserId: (id) => set({ userId: id }),
      userData: null,
      setUserData: (updater) => set((state) => ({
        userData: typeof updater === 'function'
          ? (updater as (prev: UserData | null) => UserData | null)(state.userData)
          : updater,
      })),
      clearSession: () => set({ userId: null, userData: null }),
    }),
    {
      name: 'bridge-user-store',
      storage: createJSONStorage(() => {
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
            clear: () => undefined,
            key: () => null,
            length: 0,
          } as Storage;
        }
        return window.sessionStorage;
      }),
    }
  )
);
export default useStore
