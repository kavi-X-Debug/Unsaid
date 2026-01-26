"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { db } from "../../lib/firebase";
import { useAuth } from "../../components/auth/auth-provider";
import type { Poll, Question } from "../../lib/types";
import { Tabs } from "../../components/ui/tabs";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Textarea } from "../../components/ui/textarea";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";
import loadingAnimationData from "../../loading.json";

function LoadingAnimation() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animation: any;
    let cancelled = false;

    const load = async () => {
      if (!containerRef.current) {
        return;
      }
      const lottie = await import("lottie-web");
      if (cancelled || !containerRef.current) {
        return;
      }
      const instance = lottie.default ?? lottie;
      animation = instance.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: loadingAnimationData
      });
    };

    load();

    return () => {
      cancelled = true;
      if (animation) {
        animation.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-40 h-40"
      aria-label="Loading"
      role="status"
    />
  );
}

type InboxItemType = "question" | "poll";

type InboxItem = {
  id: string;
  type: InboxItemType;
  data: Question | Poll;
};

export default function InboxPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [pollSelections, setPollSelections] = useState<Record<string, number | null>>({});

  useEffect(() => {
    if (loading) {
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    if (!user.emailVerified) {
      router.push("/verify-email");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }
    const qQuery = query(collection(db, "questions"), where("toUserId", "==", user.uid));
    const pQuery = query(collection(db, "polls"), where("toUserId", "==", user.uid));
    const unsubscribeQuestions = onSnapshot(qQuery, snapshot => {
      const list: InboxItem[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Question;
        list.push({
          id: docSnap.id,
          type: "question",
          data: { ...data, id: docSnap.id }
        });
      });
      setItems(previous => {
        const pollsOnly = previous.filter(item => item.type === "poll");
        return [...list, ...pollsOnly];
      });
    });
    const unsubscribePolls = onSnapshot(pQuery, snapshot => {
      const list: InboxItem[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Poll;
        list.push({
          id: docSnap.id,
          type: "poll",
          data: { ...data, id: docSnap.id }
        });
      });
      setItems(previous => {
        const questionsOnly = previous.filter(item => item.type === "question");
        return [...questionsOnly, ...list];
      });
    });
    return () => {
      unsubscribeQuestions();
      unsubscribePolls();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }
    const loadProfile = async () => {
      try {
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
        const origin =
          typeof window !== "undefined" && window.location.origin
            ? window.location.origin
            : "";
        if (!origin || !username) {
          return;
        }
        setShareUrl(`${origin}/profile/${username.toLowerCase()}`);
      } catch {
        setShareUrl(null);
      }
    };
    loadProfile();
  }, [user]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) {
      return items;
    }
    return items.filter(item => {
      if (item.type === "question") {
        const question = item.data as Question;
        return (
          question.questionText.toLowerCase().includes(term) ||
          (question.answerText ?? "").toLowerCase().includes(term)
        );
      }
      const poll = item.data as Poll;
      const inQuestion = (poll.questionText ?? "").toLowerCase().includes(term);
      const inOptions = poll.options.some(option =>
        option.optionText.toLowerCase().includes(term)
      );
      return inQuestion || inOptions;
    });
  }, [items, search]);

  const grouped = useMemo(() => {
    const newest = filtered.slice().sort((a, b) => {
      const aDate = (a.data as any).createdAt?.toMillis?.() ?? 0;
      const bDate = (b.data as any).createdAt?.toMillis?.() ?? 0;
      return bDate - aDate;
    });
    const newItems = newest.filter(item => {
      if (item.type === "question") {
        const question = item.data as Question;
        return !question.isAnswered && !question.isReported;
      }
      const poll = item.data as Poll;
      return !poll.isPublished && !poll.isReported;
    });
    const answered = newest.filter(item => {
      if (item.type === "question") {
        const question = item.data as Question;
        return question.isAnswered && !question.isReported;
      }
      const poll = item.data as Poll;
      return poll.isPublished && !poll.isReported;
    });
    return { newItems, answered };
  }, [filtered]);

  const toggleSelect = (id: string) => {
    setSelectedIds(previous => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const performBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(
      ids.map(id => {
        const item = items.find(candidate => candidate.id === id);
        if (!item) {
          return Promise.resolve();
        }
        const path = item.type === "question" ? "questions" : "polls";
        return deleteDoc(doc(db, path, id));
      })
    );
    clearSelection();
  };

  const bulkDelete = () => {
    if (!selectedIds.size) {
      return;
    }
    setConfirmOpen(true);
  };

  const answerQuestion = async (id: string) => {
    const answer = answerDrafts[id]?.trim();
    if (!answer) {
      return;
    }
    await updateDoc(doc(db, "questions", id), {
      answerText: answer,
      isAnswered: true
    });
    setAnswerDrafts(previous => {
      const next = { ...previous };
      delete next[id];
      return next;
    });
  };

  const publishPoll = async (id: string) => {
    const selectedIndex = pollSelections[id] ?? null;
    await updateDoc(doc(db, "polls", id), {
      isPublished: true,
      ownerSelection: selectedIndex
    });
  };

  const reportItem = async (item: InboxItem) => {
    const path = item.type === "question" ? "questions" : "polls";
    await updateDoc(doc(db, path, item.id), {
      isReported: true
    });
  };

  const renderItem = (item: InboxItem) => {
    if (item.type === "question") {
      const question = item.data as Question;
      const reactionCounts = question.reactionCounts ?? {
        heart: 0,
        laugh: 0,
        wow: 0
      };
      const hasAnyReactions =
        reactionCounts.heart > 0 || reactionCounts.laugh > 0 || reactionCounts.wow > 0;
      const isSelected = selectedIds.has(item.id);
      return (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          whileHover={{ y: -2 }}
        >
          <Card className="p-4 space-y-3 border border-slate-200 bg-white hover:border-sky-500/60 hover:bg-slate-50 transition-colors dark:border-slate-800/70 dark:bg-slate-900/50 dark:hover:border-sky-500/70 dark:hover:bg-slate-900/90">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
                checked={isSelected}
                onChange={() => toggleSelect(item.id)}
              />
              <div className="flex-1 space-y-2">
                <p className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                  {question.questionText}
                </p>
                {question.isAnswered && question.answerText && (
                  <p className="text-sm text-slate-800 dark:text-slate-300 whitespace-pre-wrap">
                    {question.answerText}
                  </p>
                )}
                {question.isAnswered && hasAnyReactions && (
                  <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-400">
                    <span>Reactions:</span>
                    <div className="flex gap-1 flex-wrap">
                      {reactionCounts.heart > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700">
                          <span>❤️</span>
                          <span>{reactionCounts.heart}</span>
                        </span>
                      )}
                      {reactionCounts.laugh > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700">
                          <span>😂</span>
                          <span>{reactionCounts.laugh}</span>
                        </span>
                      )}
                      {reactionCounts.wow > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700">
                          <span>😮</span>
                          <span>{reactionCounts.wow}</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {!question.isAnswered && (
                  <div className="space-y-2">
                    <Textarea
                      rows={2}
                      value={answerDrafts[item.id] ?? ""}
                      onChange={event =>
                        setAnswerDrafts(previous => ({
                          ...previous,
                          [item.id]: event.target.value
                        }))
                      }
                      placeholder="Write your answer..."
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        type="button"
                        onClick={() => reportItem(item)}
                      >
                        Report
                      </Button>
                      <Button type="button" onClick={() => answerQuestion(item.id)}>
                        Answer and publish
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      );
    }
    const poll = item.data as Poll;
    const isSelected = selectedIds.has(item.id);
    const questionText = poll.questionText;
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        whileHover={{ y: -2 }}
      >
        <Card className="p-4 space-y-3 border border-slate-200 bg-white hover:border-sky-500/60 hover:bg-slate-50 transition-colors dark:border-slate-800/70 dark:bg-slate-900/50 dark:hover:border-sky-500/70 dark:hover:bg-slate-900/90">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900"
              checked={isSelected}
              onChange={() => toggleSelect(item.id)}
            />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                {questionText ?? "Poll"}
              </p>
              <div className="space-y-1 text-xs">
                {poll.options.map((option, index) => {
                  const selectedIndex = pollSelections[item.id] ?? null;
                  const isSelectedOption = selectedIndex === index;
                  return (
                    <button
                      key={option.optionText}
                      type="button"
                      onClick={() =>
                        setPollSelections(previous => ({
                          ...previous,
                          [item.id]: index
                        }))
                      }
                      className={`w-full text-left rounded-full px-3 py-1 text-xs font-medium transition-colors duration-150 ${
                        isSelectedOption
                          ? "bg-sky-100 text-slate-900 border border-sky-500/70 dark:bg-sky-500/15 dark:text-sky-300"
                          : "bg-slate-100 text-slate-800 border border-slate-300 hover:border-sky-500/60 hover:text-sky-700 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700/70 dark:hover:border-sky-500/60 dark:hover:text-sky-300"
                      }`}
                    >
                      {option.optionText}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" type="button" onClick={() => reportItem(item)}>
                  Report
                </Button>
                {!poll.isPublished && (
                  <Button type="button" onClick={() => publishPoll(item.id)}>
                    Publish poll
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  const renderTabContent = (key: string) => {
    if (key === "new") {
      if (grouped.newItems.length === 0) {
        return (
          <Card className="p-4 text-sm text-slate-900 border border-dashed border-slate-300 bg-white flex items-center justify-center dark:text-slate-300 dark:border-slate-700/70 dark:bg-slate-900/40">
            Nothing new yet.
          </Card>
        );
      }
      return <div className="space-y-3">{grouped.newItems.map(renderItem)}</div>;
    }
    if (key === "answered") {
      if (grouped.answered.length === 0) {
        return (
          <Card className="p-4 text-sm text-slate-900 border border-dashed border-slate-300 bg-white flex items-center justify-center dark:text-slate-300 dark:border-slate-700/70 dark:bg-slate-900/40">
            No answered items yet.
          </Card>
        );
      }
      return <div className="space-y-3">{grouped.answered.map(renderItem)}</div>;
    }
    return null;
  };

  if (!user && loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingAnimation />
          <p className="text-slate-900 dark:text-slate-400">Loading inbox...</p>
        </div>
      </main>
    );
  }

  if (!user && !loading) {
    return null;
  }

  return (
    <main className="min-h-screen px-4 py-8 flex justify-center bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-950 dark:to-black">
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Bulk delete items?"
      >
        <p className="mb-4 text-xs text-slate-700 dark:text-slate-300">
          This will permanently remove the selected questions and polls from your inbox.
        </p>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              await performBulkDelete();
              setConfirmOpen(false);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
      <div className="w-full max-w-3xl space-y-6 rounded-2xl border border-slate-200 bg-white/95 px-5 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.15)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60 dark:shadow-[0_18px_45px_rgba(15,23,42,0.85)]">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-sky-400/80 mb-1">
              Inbox
            </p>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Smart inbox
            </h1>
            <p className="mt-1 text-xs text-slate-700 dark:text-slate-400">
              Manage your anonymous questions and polls in one place.
            </p>
            <p className="mt-1 text-[11px] text-slate-700 dark:text-slate-500">
              You can customize your profile from the Profile page.
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-3 border border-sky-200 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10">
            <p className="text-[11px] uppercase tracking-wide text-sky-700 dark:text-sky-200">
              New
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-sky-50">
              {grouped.newItems.length}
            </p>
          </Card>
          <Card className="p-3 border border-violet-200 bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/10">
            <p className="text-[11px] uppercase tracking-wide text-violet-700 dark:text-violet-200">
              Answered
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-violet-50">
              {grouped.answered.length}
            </p>
          </Card>
        </section>

        {shareUrl && (
          <section>
            <Card className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-slate-200 bg-white dark:border-slate-800/70 dark:bg-slate-900/60">
              <div className="text-xs text-slate-700 dark:text-slate-400">
                Share this link so people can send you anonymous messages:
                <p className="mt-1 text-slate-900 dark:text-slate-100 break-all">
                  {shareUrl}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareUrl);
                      setCopyMessage("Link copied ");
                      setTimeout(() => {
                        setCopyMessage(null);
                      }, 1800);
                    } catch {}
                  }}
                >
                  Copy link
                </Button>
                {copyMessage && (
                  <p className="text-[11px] text-emerald-500 dark:text-emerald-400">
                    {copyMessage}
                  </p>
                )}
              </div>
            </Card>
          </section>
        )}

        <section>
          <Card className="flex flex-col gap-3 p-3 border border-slate-200 bg-white sm:flex-row sm:items-center sm:justify-between dark:border-slate-800/70 dark:bg-slate-900/60">
            <Input
              placeholder="Search by keyword"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs sm:justify-end">
                <span className="text-slate-900 dark:text-slate-300">
                  {selectedIds.size} selected
                </span>
                <Button variant="ghost" type="button" onClick={clearSelection}>
                  Clear
                </Button>
                <Button variant="outline" type="button" onClick={bulkDelete}>
                  Delete
                </Button>
              </div>
            )}
          </Card>
        </section>

        <Tabs
          tabs={[
            { key: "new", label: "New" },
            { key: "answered", label: "Answered" }
          ]}
          initialKey="new"
          renderContent={renderTabContent}
        />
      </div>
    </main>
  );
}
