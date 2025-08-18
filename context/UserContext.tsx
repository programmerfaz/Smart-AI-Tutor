import React, { createContext, useState, ReactNode } from "react";

export type SupabaseUser = {
  user_email: string;
  user_name: string;
  user_age?: number;
  profile_image?: string;
};

type UserContextType = {
  user: SupabaseUser | null;
  setUser: (user: SupabaseUser | null) => void;
};

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
