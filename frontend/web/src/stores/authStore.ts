import { create } from "zustand";

type Division = "security" | "cleaning" | "parking";

interface UserInfo {
  id: number;
  username: string;
  division: Division;
  role: string;
}

interface AuthState {
  token: string | null;
  division: Division | null;
  user: UserInfo | null;
  setAuth: (payload: { token: string; user: UserInfo }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  division: null,
  user: null,
  setAuth: ({ token, user }) =>
    set(() => ({
      token,
      user,
      division: user.division,
    })),
  clear: () => set({ token: null, user: null, division: null }),
}));
