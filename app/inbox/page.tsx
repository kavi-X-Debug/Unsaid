"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
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

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }
    const qQuery = query(
      collection(db, "questions"),
      where("toUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const pQuery = query(
      collection(db, "polls"),
      where("toUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
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
    const reported = newest.filter(item => {
      if (item.type === "question") {
        const question = item.data as Question;
        return question.isReported;
      }
      const poll = item.data as Poll;
      return poll.isReported;
    });
    return { newItems, answered, reported };
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
    await updateDoc(doc(db, "polls", id), {
      isPublished: true
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
      const isSelected = selectedIds.has(item.id);
      return (
        <Card key={item.id} className="p-4 space-y-3">
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900"
              checked={isSelected}
              onChange={() => toggleSelect(item.id)}
            />
            <div className="flex-1 space-y-2">
              <p className="text-sm text-slate-200 whitespace-pre-wrap">
                {question.questionText}
              </p>
              {question.isAnswered && question.answerText && (
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {question.answerText}
                </p>
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
      );
    }
    const poll = item.data as Poll;
    const isSelected = selectedIds.has(item.id);
    const questionText = poll.questionText;
    return (
      <Card key={item.id} className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900"
            checked={isSelected}
            onChange={() => toggleSelect(item.id)}
          />
          <div className="flex-1 space-y-2">
            <p className="text-sm text-slate-200 whitespace-pre-wrap">
              {questionText ?? "Poll"}
            </p>
            <ul className="space-y-1 text-xs text-slate-400">
              {poll.options.map(option => (
                <li key={option.optionText}>{option.optionText}</li>
              ))}
            </ul>
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
    );
  };

  const renderTabContent = (key: string) => {
    if (key === "new") {
      if (grouped.newItems.length === 0) {
        return <p className="text-sm text-slate-500">Nothing new yet.</p>;
      }
      return <div className="space-y-3">{grouped.newItems.map(renderItem)}</div>;
    }
    if (key === "answered") {
      if (grouped.answered.length === 0) {
        return <p className="text-sm text-slate-500">No answered items yet.</p>;
      }
      return <div className="space-y-3">{grouped.answered.map(renderItem)}</div>;
    }
    if (grouped.reported.length === 0) {
      return <p className="text-sm text-slate-500">No reported items.</p>;
    }
    return <div className="space-y-3">{grouped.reported.map(renderItem)}</div>;
  };

  if (!user && loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Loading inbox...</p>
      </main>
    );
  }

  if (!user && !loading) {
    return null;
  }

  return (
    <main className="min-h-screen px-4 py-8 flex justify-center">
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Bulk delete items?"
      >
        <p className="mb-4 text-xs text-slate-300">
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
      <div className="w-full max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Smart inbox</h1>
            <p className="text-xs text-slate-500">
              Manage your anonymous questions and polls in one place.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const { signOut } = await import("firebase/auth");
              const { auth } = await import("../../lib/firebase");
              await signOut(auth);
              router.push("/");
            }}
          >
            Log out
          </Button>
        </header>

        <section className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search by keyword"
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">{selectedIds.size} selected</span>
              <Button variant="ghost" type="button" onClick={clearSelection}>
                Clear
              </Button>
              <Button variant="outline" type="button" onClick={bulkDelete}>
                Bulk delete
              </Button>
            </div>
          )}
        </section>

        <Tabs
          tabs={[
            { key: "new", label: "New" },
            { key: "answered", label: "Answered" },
            { key: "reported", label: "Reported" }
          ]}
          initialKey="new"
          renderContent={renderTabContent}
        />
      </div>
    </main>
  );
}
