"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth/auth-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [bioDraft, setBioDraft] = useState("");
  const [avatarUrlDraft, setAvatarUrlDraft] = useState("");
  const [joinedText, setJoinedText] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    const loadProfile = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      let nextUsername: string | null = null;
      if (snap.exists()) {
        const data = snap.data() as {
          username?: string;
          bio?: string;
          avatarUrl?: string;
          createdAt?: any;
        };
        nextUsername = data.username ?? null;
        setBioDraft(data.bio ?? "");
        setAvatarUrlDraft(data.avatarUrl ?? "");
        if (data.createdAt?.toDate) {
          const date = data.createdAt.toDate() as Date;
          setJoinedText(date.toLocaleDateString());
        }
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
          avatarUrl: null,
          createdAt: serverTimestamp(),
          settings: {
            positiveOnlyMode: false
          }
        });
        nextUsername = candidate;
      }
      setUsername(nextUsername);
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "";
      if (origin && nextUsername) {
        setShareUrl(`${origin}/profile/${nextUsername.toLowerCase()}`);
      }
      setInitializing(false);
    };
    loadProfile();
  }, [user, loading, router]);

  const profileTitle = useMemo(() => {
    if (!username) {
      return "";
    }
    return `@${username}`;
  }, [username]);

  const handleSave = async () => {
    if (!user?.uid) {
      return;
    }
    const trimmedBio = bioDraft.trim().slice(0, 160);
    const trimmedAvatar = avatarUrlDraft.trim();
    setSaving(true);
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        bio: trimmedBio || null,
        avatarUrl: trimmedAvatar || null
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
    }
  };

  if (loading || initializing) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading your profile...</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen px-4 py-10 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Account settings</h1>
          <p className="text-xs text-slate-600 dark:text-slate-500">
            Manage how your public profile looks on Unsaid.
          </p>
        </header>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Profile overview
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Username:{" "}
            <span className="font-mono text-slate-800 dark:text-slate-200">{profileTitle}</span>
          </p>
          {joinedText && (
            <p className="text-xs text-slate-600 dark:text-slate-400">Joined {joinedText}</p>
          )}
          {shareUrl && (
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-600 dark:text-slate-400 break-all">
                Public link:{" "}
                <span className="text-slate-800 dark:text-slate-200">{shareUrl}</span>
              </div>
              <Button type="button" variant="outline" onClick={handleCopyLink}>
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Public profile
          </h2>
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Short bio shown on your public profile. Max 160 characters.
            </p>
            <Textarea
              rows={3}
              value={bioDraft}
              onChange={event => setBioDraft(event.target.value)}
              maxLength={160}
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-500">
              Optional avatar image URL used on your public profile.
            </p>
            <Input
              type="url"
              placeholder="https://example.com/avatar.png"
              value={avatarUrlDraft}
              onChange={event => setAvatarUrlDraft(event.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

