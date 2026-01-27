"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Lovers_Quarrel } from "next/font/google";
import { useAuth } from "../auth/auth-provider";
import { db } from "../../lib/firebase";
import logo from "../../icon.jpg";

const loversFont = Lovers_Quarrel({
  subsets: ["latin"],
  weight: "400"
});

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setInboxCount(0);
      return;
    }
    const qQuery = query(
      collection(db, "questions"),
      where("toUserId", "==", user.uid),
      where("isAnswered", "==", false),
      where("isReported", "==", false)
    );
    const pQuery = query(
      collection(db, "polls"),
      where("toUserId", "==", user.uid),
      where("isPublished", "==", false),
      where("isReported", "==", false)
    );
    const unsubQuestions = onSnapshot(qQuery, snapshot => {
      setInboxCount(previous => {
        const pollsOnly = previous & 0xffff;
        const questionsCount = snapshot.size;
        return (questionsCount << 16) | pollsOnly;
      });
    });
    const unsubPolls = onSnapshot(pQuery, snapshot => {
      setInboxCount(previous => {
        const questionsOnly = previous >> 16;
        const pollsCount = snapshot.size;
        return (questionsOnly << 16) | pollsCount;
      });
    });
    return () => {
      unsubQuestions();
      unsubPolls();
    };
  }, [user?.uid]);

  const totalInboxCount = useMemo(() => {
    const questionsCount = inboxCount >> 16;
    const pollsCount = inboxCount & 0xffff;
    return questionsCount + pollsCount;
  }, [inboxCount]);

  const links = [
    { href: "/", label: "Home" },
    ...(user ? [{ href: "/inbox", label: "Inbox" as const }] : []),
    { href: "/profile", label: "Profile" }
  ];

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-slate-300 dark:border-slate-700">
            <Image src={logo} alt="UnSaid" fill sizes="32px" className="object-cover" />
          </div>
        </Link>
        <div className="flex items-center gap-1 rounded-full bg-slate-100 px-1 py-0.5 text-xs border border-slate-200 dark:bg-slate-900/80 dark:border-slate-800 max-w-full overflow-x-auto">
          {links.map(link => {
            const active =
              pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1 rounded-full transition ${
                  active
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-50"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  <span>{link.label}</span>
                  {link.href === "/inbox" && totalInboxCount > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-semibold text-white">
                      {totalInboxCount > 99 ? "99+" : totalInboxCount}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
        <span
          className={`${loversFont.className} text-3xl sm:text-[2.3rem] font-normal text-slate-800 dark:text-slate-100 leading-none`}
        >
          UnSaid
        </span>
      </div>
    </nav>
  );
}
