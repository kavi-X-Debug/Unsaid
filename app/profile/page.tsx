"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
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
  const [joinedText, setJoinedText] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

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
          createdAt?: any;
          profileViews?: number;
        };
        nextUsername = data.username ?? null;
        setBioDraft(data.bio ?? "");
        if (typeof data.profileViews === "number") {
          setViewCount(data.profileViews);
        } else {
          setViewCount(0);
        }
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
          profileViews: 0,
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
    setSaving(true);
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        bio: trimmedBio || null
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

  const canChangePassword = useMemo(() => {
    if (!user) {
      return false;
    }
    return user.providerData.some(provider => provider.providerId === "password");
  }, [user]);

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordMessage(null);
    if (!user?.email) {
      setPasswordError("Password change is not available for this account.");
      return;
    }
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError("Fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      setPasswordError("Could not update password. Check your current password and try again.");
    } finally {
      setPasswordSaving(false);
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
          {viewCount != null && (
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Profile views: {viewCount.toLocaleString()}
            </p>
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
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </Card>

        <Card className="p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Change password
          </h2>
          {canChangePassword ? (
            <>
              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Current password
                </label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={event => setCurrentPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  New password
                </label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={event => setNewPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Confirm new password
                </label>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirmNewPassword}
                  onChange={event => setConfirmNewPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </div>
              {passwordError && (
                <p className="text-xs text-rose-400">{passwordError}</p>
              )}
              {passwordMessage && (
                <p className="text-xs text-emerald-400">{passwordMessage}</p>
              )}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleChangePassword}
                  disabled={passwordSaving}
                >
                  {passwordSaving ? "Updating..." : "Update password"}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-500">
              This account is signed in with a provider that does not use a password.
              Use your sign-in provider to manage security settings.
            </p>
          )}
        </Card>
      </div>
    </main>
  );
}
