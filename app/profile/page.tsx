"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-provider";

export default function ProfileRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    const ensureAndRedirect = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      let username: string | null = null;
      if (snap.exists()) {
        const data = snap.data() as { username?: string };
        username = data.username ?? null;
      } else {
        const emailLocal = user.email ? user.email.split("@")[0] : "";
        const namePart = user.displayName ? user.displayName.split(" ")[0] : "";
        const rawBase = (emailLocal || namePart || user.uid.slice(0, 8)).toLowerCase();
        let base = rawBase.replace(/[^a-z0-9_]/g, "");
        if (!base) {
          base = `user_${user.uid.slice(0, 6)}`;
        }
        let candidate = base;
        let suffix = 0;
        for (;;) {
          const existing = await getDocs(
            query(collection(db, "users"), where("username", "==", candidate))
          );
          if (existing.empty) {
            break;
          }
          suffix += 1;
          candidate = `${base}${suffix}`;
        }
        await setDoc(ref, {
          uid: user.uid,
          username: candidate,
          bio: null,
          createdAt: serverTimestamp(),
          settings: {
            positiveOnlyMode: false
          }
        });
        username = candidate;
      }
      if (!username) {
        return;
      }
      router.replace(`/profile/${username.toLowerCase()}`);
    };
    ensureAndRedirect();
  }, [user, loading, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">Loading your profile...</p>
    </main>
  );
}

