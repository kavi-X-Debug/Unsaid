"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
import { Modal } from "@/components/ui/modal";
import Avatar1 from "../../Images/Gemini_Generated_Image_1uzn0a1uzn0a1uzn (1).png";
import Avatar2 from "../../Images/Gemini_Generated_Image_4mkak64mkak64mka (1).png";
import Avatar3 from "../../Images/Gemini_Generated_Image_avzbkdavzbkdavzb (1).png";
import Avatar4 from "../../Images/Gemini_Generated_Image_gjadqvgjadqvgjad (1).png";
import Avatar5 from "../../Images/Gemini_Generated_Image_i968xni968xni968 (1).png";
import Avatar6 from "../../Images/Gemini_Generated_Image_mw8kbmmw8kbmmw8k (1).png";
import Avatar7 from "../../Images/Gemini_Generated_Image_w2jdqew2jdqew2jd (1).png";
import Avatar8 from "../../Images/Gemini_Generated_Image_wocmn5wocmn5wocm (1).png";

const avatarOptions = [Avatar1, Avatar2, Avatar3, Avatar4, Avatar5, Avatar6, Avatar7, Avatar8];

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [bioDraft, setBioDraft] = useState("");
  const [savedBio, setSavedBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarDraft, setAvatarDraft] = useState<string | null>(null);
  const [joinedText, setJoinedText] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

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
          profileViews?: number;
        };
        nextUsername = data.username ?? null;
        const initialBio = (data.bio as string | null) ?? "";
        setBioDraft(initialBio);
        setSavedBio(initialBio);
        const initialAvatar = (data.avatarUrl as string | null) ?? null;
        setAvatarUrl(initialAvatar);
        setAvatarDraft(initialAvatar);
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
        setBioDraft("");
        setSavedBio("");
        setAvatarUrl(null);
        setAvatarDraft(null);
      }
      setUsername(nextUsername);
      setUsernameDraft(nextUsername ?? "");
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

  const displayBio = useMemo(() => {
    const trimmed = bioDraft.trim();
    if (!trimmed) {
      return "";
    }
    if (trimmed.length <= 160) {
      return trimmed;
    }
    return trimmed.slice(0, 160);
  }, [bioDraft]);

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [bioMessage, setBioMessage] = useState<string | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user?.uid) {
      return;
    }
    const trimmedBio = bioDraft.trim().slice(0, 160);
    setBioMessage(null);
    setSaving(true);
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        bio: trimmedBio || null
      });
      setSavedBio(trimmedBio);
      setBioDraft(trimmedBio);
      setIsEditingBio(false);
      setBioMessage("Bio is changend Successfully");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (!user?.uid) {
      return;
    }
    setAvatarMessage(null);
    setAvatarSaving(true);
    try {
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        avatarUrl: avatarDraft ?? null
      });
      setAvatarUrl(avatarDraft ?? null);
      setAvatarMessage("Profile Image Changed Successfully");
    } finally {
      setAvatarSaving(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!user?.uid) {
      return;
    }
    const trimmed = usernameDraft.trim().toLowerCase();
    const cleaned = trimmed.replace(/[^a-z0-9_]/g, "");
    setUsernameError(null);
    setUsernameMessage(null);
    if (!cleaned) {
      setUsernameError("Enter a username.");
      return;
    }
    if (cleaned.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      return;
    }
    if (cleaned.length > 24) {
      setUsernameError("Username must be at most 24 characters.");
      return;
    }
    if (cleaned === username) {
      setUsernameError("This is already your username.");
      return;
    }
    setUsernameSaving(true);
    try {
      const existing = await getDocs(
        query(collection(db, "users"), where("username", "==", cleaned))
      );
      let takenByOther = false;
      existing.forEach(docSnap => {
        if (docSnap.id !== user.uid) {
          takenByOther = true;
        }
      });
      if (takenByOther) {
        setUsernameError("That username is already taken.");
        return;
      }
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        username: cleaned
      });
      setUsername(cleaned);
      setUsernameDraft(cleaned);
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "";
      if (origin) {
        setShareUrl(`${origin}/profile/${cleaned}`);
      }
      setIsEditingUsername(false);
      setUsernameMessage("Username changed successfully");
    } finally {
      setUsernameSaving(false);
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
    if (!currentPassword || !newPassword) {
      setPasswordError("Fill in both password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    setPasswordSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordMessage("Password Changed Successfully");
      setCurrentPassword("");
      setNewPassword("");
      setIsEditingPassword(false);
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
      <Modal
        open={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        title="Log out?"
      >
        <p className="text-xs text-slate-700 dark:text-slate-300">
          Are you sure you want to log out of your account?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmLogoutOpen(false)}
          >
            No
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const { signOut } = await import("firebase/auth");
              const { auth } = await import("../../lib/firebase");
              await signOut(auth);
              setConfirmLogoutOpen(false);
              router.push("/");
            }}
          >
            Yes
          </Button>
        </div>
      </Modal>
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
          {avatarUrl && (
            <div className="flex items-center gap-3 pt-1">
              <div className="h-10 w-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                <Image
                  src={avatarUrl}
                  alt="Profile image"
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Current profile image</p>
            </div>
          )}
          {!isEditingUsername ? (
            <>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Username:{" "}
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {profileTitle}
                </span>
              </p>
              <div className="flex justify-end pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUsernameError(null);
                    setUsernameMessage(null);
                    setIsEditingUsername(true);
                  }}
                  disabled={usernameSaving || !username}
                >
                  Change username
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1 pt-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  New username
                </label>
                <Input
                  type="text"
                  value={usernameDraft}
                  onChange={event => setUsernameDraft(event.target.value)}
                  autoComplete="off"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-500">
                  Use 3–24 characters: letters, numbers, and underscores only.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setUsernameDraft(username ?? "");
                    setUsernameError(null);
                    setIsEditingUsername(false);
                  }}
                  disabled={usernameSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveUsername}
                  disabled={usernameSaving}
                >
                  {usernameSaving ? "Saving..." : "Save username"}
                </Button>
              </div>
            </>
          )}
          {usernameError && (
            <p className="text-xs text-rose-400">{usernameError}</p>
          )}
          {usernameMessage && (
            <p className="text-xs text-emerald-400">{usernameMessage}</p>
          )}
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
            {!isEditingBio ? (
              <>
                <div className="min-h-[52px] rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                  {displayBio || "No bio yet. Click Change bio to add one."}
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setBioMessage(null);
                      setIsEditingBio(true);
                    }}
                    disabled={saving}
                  >
                    Change bio
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Textarea
                  rows={3}
                  value={bioDraft}
                  onChange={event => setBioDraft(event.target.value)}
                  maxLength={160}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setBioDraft(savedBio);
                      setIsEditingBio(false);
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button type="button" variant="outline" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save bio"}
                  </Button>
                </div>
              </>
            )}
          </div>
          {bioMessage && (
            <p className="text-xs text-emerald-400">{bioMessage}</p>
          )}
        </Card>

        <Card className="p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Profile image
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Choose an image to use as your profile picture.
          </p>
          {!isEditingAvatar ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAvatarMessage(null);
                  setIsEditingAvatar(true);
                }}
              >
                Change the Profile Image
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3">
                {avatarOptions.map((image, index) => {
                  const isSelected = avatarDraft === image.src;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setAvatarDraft(image.src)}
                      className={`relative flex items-center justify-center rounded-full border p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                        isSelected
                          ? "border-sky-500 ring-1 ring-sky-400"
                          : "border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"
                      }`}
                    >
                      <Image
                        src={image}
                        alt="Profile choice"
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setAvatarDraft(avatarUrl);
                    setIsEditingAvatar(false);
                  }}
                  disabled={avatarSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await handleSaveAvatar();
                    setIsEditingAvatar(false);
                  }}
                  disabled={avatarSaving || avatarDraft === avatarUrl}
                >
                  {avatarSaving ? "Saving..." : "Save the Profile image"}
                </Button>
              </div>
            </>
          )}
          {avatarMessage && (
            <p className="text-xs text-emerald-400">{avatarMessage}</p>
          )}
        </Card>

        <Card className="p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Change password
          </h2>
          {canChangePassword ? (
            <>
              {!isEditingPassword ? (
                <div className="space-y-3 text-left">
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    For your security, we need your current password before you set a new one.
                  </p>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setPasswordError(null);
                        setPasswordMessage(null);
                        setCurrentPassword("");
                        setNewPassword("");
                        setIsEditingPassword(true);
                      }}
                    >
                      Change password
                    </Button>
                  </div>
                </div>
              ) : (
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
                  {passwordError && (
                    <p className="text-xs text-rose-400">{passwordError}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsEditingPassword(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setPasswordError(null);
                      }}
                      disabled={passwordSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleChangePassword}
                      disabled={passwordSaving}
                    >
                      {passwordSaving ? "Updating..." : "Save new password"}
                    </Button>
                  </div>
                </>
              )}
              {passwordMessage && (
                <p className="text-xs text-emerald-400">{passwordMessage}</p>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-500">
              This account is signed in with a provider that does not use a password.
              Use your sign-in provider to manage security settings.
            </p>
          )}
        </Card>
        <section className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmLogoutOpen(true)}
          >
            Log out
          </Button>
        </section>
      </div>
      {copied && (
        <div className="fixed inset-x-0 bottom-6 flex justify-center z-50 pointer-events-none">
          <div className="rounded-full bg-slate-900/95 text-slate-50 px-4 py-2 text-xs shadow-lg shadow-sky-500/30 border border-slate-700">
            Link copied
          </div>
        </div>
      )}
    </main>
  );
}
