"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
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
import { auth, db } from "../../lib/firebase";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureUserProfile = async (user: User) => {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return;
    }
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
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const trimmedUsername = username.trim().toLowerCase();
    if (!trimmedUsername.match(/^[a-z0-9_]{3,20}$/)) {
      setError("Choose a username with 3-20 characters: letters, numbers, underscores.");
      return;
    }
    setLoading(true);
    try {
      const existing = await getDocs(
        query(collection(db, "users"), where("username", "==", trimmedUsername))
      );
      if (!existing.empty) {
        setError("That username is already taken.");
        setLoading(false);
        return;
      }
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (credential.user) {
        await updateProfile(credential.user, { displayName: trimmedUsername });
        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          username: trimmedUsername,
          bio: bio.trim() || null,
          createdAt: serverTimestamp(),
          settings: {
            positiveOnlyMode: false
          }
        });
      }
    } catch (err) {
      console.error(err);
      if (err instanceof FirebaseError) {
        if (err.code === "auth/weak-password") {
          setError("Password must be at least 6 characters long.");
        } else if (err.code === "auth/email-already-in-use") {
          setError("An account with this email already exists.");
        } else if (err.code === "auth/invalid-email") {
          setError("Enter a valid email address.");
        } else {
          setError("Could not create account. Please try again.");
        }
      } else {
        setError("Could not create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoadingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      if (credential.user) {
        await ensureUserProfile(credential.user);
      }
    } catch (err) {
      setError("Could not sign in with Google. Try again.");
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-center">
          Create your Unsaid profile
        </h1>
        <Card className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-sm font-medium text-slate-200">Email</label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-sm font-medium text-slate-200">Password</label>
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-sm font-medium text-slate-200">Username</label>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-sm">unsaid.app/u/</span>
                <Input
                  value={username}
                  onChange={event => setUsername(event.target.value)}
                  required
                  placeholder="yourname"
                />
              </div>
              <p className="text-xs text-slate-500">
                3-20 characters. Lowercase letters, numbers, and underscores.
              </p>
            </div>
            <div className="space-y-1 text-left">
              <label className="text-sm font-medium text-slate-200">Bio</label>
              <Textarea
                rows={3}
                value={bio}
                onChange={event => setBio(event.target.value)}
                placeholder="Optional. Say something about yourself."
              />
            </div>
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <Button type="submit" fullWidth disabled={loading}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>
          </form>
          <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
            <div className="h-px flex-1 bg-slate-800" />
            <span>or</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>
          <Button
            type="button"
            variant="outline"
            fullWidth
            disabled={loadingGoogle}
            onClick={handleGoogle}
          >
            {loadingGoogle ? "Connecting to Google..." : "Continue with Google"}
          </Button>
        </Card>
        <p className="text-sm text-center text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-sky-400 hover:text-sky-300">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
