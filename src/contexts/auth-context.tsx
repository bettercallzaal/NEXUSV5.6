"use client";

import { createContext, useContext, ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";

interface AuthContextType {
  isAuthenticated: boolean;
  address: string | undefined;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  address: undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { authenticated, user, ready } = usePrivy();
  
  // Get the first wallet address if available
  const address = user?.wallet?.address;
  
  const value = {
    isAuthenticated: authenticated,
    address,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
