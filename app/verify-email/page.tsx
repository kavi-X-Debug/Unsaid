"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reload, sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../components/auth/auth-provider";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export default function VerifyEmailPage() {
  const { user, loading, isVerified } = useAuth();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (user && isVerified) {
      router.push("/inbox");
    }
  }, [user, isVerified, loading, router]);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user || isVerified) {
      return;
    }
    let cancelled = false;
    const intervalId = setInterval(async () => {
      try {
        await reload(user);
        if (!cancelled && user.emailVerified) {
          setMessage("Email verified. Redirecting to your inbox...");
          router.push("/inbox");
        }
      } catch {
      }
    }, 5000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [user, isVerified, loading, router]);

  const handleResend = async () => {
    if (!user || sending) {
      return;
    }
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      await sendEmailVerification(user);
      setMessage("Verification email resent. Please check your inbox and spam folder.");
    } catch {
      setError("Could not resend verification email. Please try again later.");
    } finally {
      setSending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const email = user?.email ?? "";

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-center">Verify your email</h1>
        <Card className="p-6 space-y-4">
          {user ? (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                We sent a verification email to
                <span className="font-medium"> {email}</span>. Click the link in that email to
                activate your account. If you do not see it, check your spam folder.
              </p>
              <Button type="button" fullWidth disabled={sending} onClick={handleResend}>
                {sending ? "Sending..." : "Resend verification email"}
              </Button>
              {error && <p className="text-sm text-rose-400">{error}</p>}
              {message && <p className="text-sm text-emerald-400">{message}</p>}
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-500">
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={handleSignOut}
                >
                  Log out
                </button>
                <Link href="/signup" className="underline underline-offset-4">
                  Use a different email
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                You are not signed in. Log in with your email and password, and we&apos;ll send you
                a verification link if needed.
              </p>
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-500">
                <Link href="/login" className="underline underline-offset-4">
                  Log in
                </Link>
                <Link href="/signup" className="underline underline-offset-4">
                  Create an account
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
