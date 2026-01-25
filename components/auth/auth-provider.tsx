"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isVerified: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function AuthProvider(props: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, next => {
      setUser(next);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const isVerified = !!user?.emailVerified;

  return (
    <AuthContext.Provider value={{ user, loading, isVerified }}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
