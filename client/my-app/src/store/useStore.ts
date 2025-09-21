import {create} from 'zustand'

export interface UserData {
    fullName: string;
    username: string;
    email: string;
    age: number;
    password: string;
    quizCompleted: boolean;
    quizResults?: {
        politicalLean: string;
        spectrum: {
            economic: number;
            social: number;
            foreignPolicy: number;
            governance: number;
            cultural: number;
        };
    };
    signupDate: string;
    overall_affiliation?: number;
}

type StoreState = {
    userId: string;
    setUserId: (id: string) => void;
    userData: UserData | null;
    setUserData: (data: UserData | null) => void;
}

const useStore = create<StoreState>((set) => ({
    userId: '',
    setUserId: (id: string) => set({ userId: id }),
    userData: null,
    setUserData: (data: UserData | null) => set({ userData: data }),
}))

export default useStore
