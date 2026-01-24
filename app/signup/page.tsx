"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  collection,
  doc,
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
  const [error, setError] = useState<string | null>(null);

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
      setError("Could not create account. Check your details and try again.");
    } finally {
      setLoading(false);
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
