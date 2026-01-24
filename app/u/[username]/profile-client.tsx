"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import type { AppUser, Poll, Question } from "../../../lib/types";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Input } from "../../../components/ui/input";
import { ReactionBar } from "../../../components/questions/reaction-bar";

type Props = {
  username: string;
};

type PollDraftType = "yes_no" | "multiple_choice";

export function ProfilePageClient(props: Props) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [pollType, setPollType] = useState<PollDraftType>("yes_no");
  const [pollQuestion, setPollQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollVotes, setPollVotes] = useState<Record<string, number | null>>({});

  useEffect(() => {
    const userQuery = query(
      collection(db, "users"),
      where("username", "==", props.username)
    );
    const unsub = onSnapshot(userQuery, snapshot => {
      if (snapshot.empty) {
        setUser(null);
      } else {
        const docData = snapshot.docs[0];
        setUser(docData.data() as AppUser);
      }
      setLoadingUser(false);
    });
    return () => unsub();
  }, [props.username]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }
    const qQuery = query(
      collection(db, "questions"),
      where("toUserId", "==", user.uid),
      where("isAnswered", "==", true),
      where("isReported", "==", false),
      orderBy("createdAt", "desc")
    );
    const pQuery = query(
      collection(db, "polls"),
      where("toUserId", "==", user.uid),
      where("isPublished", "==", true),
      orderBy("createdAt", "desc")
    );
    const unsubQuestions = onSnapshot(qQuery, snapshot => {
      const list: Question[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Question, "id">) });
      });
      setQuestions(list);
    });
    const unsubPolls = onSnapshot(pQuery, snapshot => {
      const list: Poll[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Poll, "id">) });
      });
      setPolls(list);
    });
    return () => {
      unsubQuestions();
      unsubPolls();
    };
  }, [user?.uid]);

  useEffect(() => {
    const next: Record<string, number | null> = {};
    try {
      polls.forEach(poll => {
        const key = `unsaid_poll_vote_${poll.id}`;
        const stored = window.localStorage.getItem(key);
        if (stored !== null) {
          const index = Number.parseInt(stored, 10);
          if (Number.isFinite(index)) {
            next[poll.id] = index;
          }
        }
      });
    } catch {
      // ignore
    }
    setPollVotes(next);
  }, [polls]);

  const profileTitle = useMemo(() => {
    if (!user) {
      return `@${props.username}`;
    }
    return `@${user.username}`;
  }, [user, props.username]);

  if (loadingUser) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Loading profile...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400">Profile not found.</p>
      </main>
    );
  }

  const handleAsk = async () => {
    setError(null);
    if (!questionText.trim()) {
      setError("Write a question first.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/u/${props.username}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toUserId: user.uid,
          questionText: questionText.trim()
        })
      });
      if (!response.ok) {
        setError("Could not send your question right now.");
      } else {
        setQuestionText("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePoll = async () => {
    setError(null);
    if (!pollQuestion.trim()) {
      setError("Write a poll question first.");
      return;
    }
    const trimmedOptions = options.map(option => option.trim()).filter(option => !!option);
    if (pollType === "multiple_choice" && trimmedOptions.length < 2) {
      setError("Add at least two options.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/u/${props.username}/polls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toUserId: user.uid,
          pollType,
          questionText: pollQuestion.trim(),
          options: trimmedOptions
        })
      });
      if (!response.ok) {
        setError("Could not submit your poll right now.");
      } else {
        setPollQuestion("");
        setOptions(["", ""]);
        setPollType("yes_no");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (pollVotes[pollId] != null) {
      return;
    }
    setError(null);
    setPollVotes(previous => ({ ...previous, [pollId]: optionIndex }));
    try {
      const response = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ optionIndex })
      });
      if (!response.ok) {
        throw new Error("Vote failed");
      }
      try {
        const key = `unsaid_poll_vote_${pollId}`;
        window.localStorage.setItem(key, String(optionIndex));
      } catch {
        // ignore
      }
    } catch {
      setPollVotes(previous => {
        const next = { ...previous };
        next[pollId] = null;
        return next;
      });
      setError("Could not submit your vote. Try again.");
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">{profileTitle}</h1>
          {user.bio && <p className="text-slate-300">{user.bio}</p>}
          <p className="text-xs text-slate-500">
            Send an anonymous question or poll. Your identity is never stored.
          </p>
        </header>

        <section className="space-y-4">
          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-200">Ask a question</h2>
            <Textarea
              rows={3}
              value={questionText}
              onChange={event => setQuestionText(event.target.value)}
              placeholder="What's on your mind?"
            />
            <Button onClick={handleAsk} disabled={submitting} fullWidth>
              {submitting ? "Sending..." : "Send anonymously"}
            </Button>
          </Card>

          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-semibold text-slate-200">Send a poll</h2>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPollType("yes_no")}
                className={`flex-1 rounded-full px-3 py-1 border ${
                  pollType === "yes_no"
                    ? "border-sky-500 bg-sky-500/10 text-sky-300"
                    : "border-slate-700 text-slate-300"
                }`}
              >
                Yes / No
              </button>
              <button
                type="button"
                onClick={() => setPollType("multiple_choice")}
                className={`flex-1 rounded-full px-3 py-1 border ${
                  pollType === "multiple_choice"
                    ? "border-sky-500 bg-sky-500/10 text-sky-300"
                    : "border-slate-700 text-slate-300"
                }`}
              >
                Multiple choice
              </button>
            </div>
            <Textarea
              rows={2}
              value={pollQuestion}
              onChange={event => setPollQuestion(event.target.value)}
              placeholder="Ask something they can vote on."
            />
            {pollType === "multiple_choice" && (
              <div className="space-y-2">
                {options.map((option, index) => (
                  <Input
                    key={index}
                    value={option}
                    onChange={event => {
                      const next = [...options];
                      next[index] = event.target.value;
                      setOptions(next);
                    }}
                    placeholder={`Option ${index + 1}`}
                  />
                ))}
                {options.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setOptions([...options, ""])}
                    className="text-xs text-sky-400 hover:text-sky-300"
                  >
                    Add option
                  </button>
                )}
              </div>
            )}
            <Button onClick={handleCreatePoll} disabled={submitting} fullWidth>
              {submitting ? "Submitting..." : "Send poll anonymously"}
            </Button>
          </Card>
          {error && <p className="text-sm text-rose-400">{error}</p>}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">Answered questions</h2>
          {questions.length === 0 && (
            <p className="text-sm text-slate-500">No answered questions yet.</p>
          )}
          <div className="space-y-3">
            {questions.map(question => (
              <Card key={question.id} className="p-4 space-y-3">
                <div className="space-y-2">
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">
                    {question.questionText}
                  </p>
                  {question.answerText && (
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {question.answerText}
                    </p>
                  )}
                </div>
                <ReactionBar
                  questionId={question.id}
                  initialCounts={question.reactionCounts}
                />
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">Published polls</h2>
          {polls.length === 0 && <p className="text-sm text-slate-500">No polls yet.</p>}
          <div className="space-y-3">
            {polls.map(poll => (
              <Card key={poll.id} className="p-4 space-y-3">
                <p className="text-sm text-slate-200 whitespace-pre-wrap">
                  {poll.questionText ?? "Poll"}
                </p>
                <div className="space-y-2">
                  {poll.options.map((option, index) => {
                    const totalVotes = poll.options.reduce(
                      (total, nextOption) => total + (nextOption.voteCount ?? 0),
                      0
                    );
                    const percentage =
                      totalVotes === 0
                        ? 0
                        : Math.round(((option.voteCount ?? 0) / totalVotes) * 100);
                    const hasVoted = pollVotes[poll.id] != null;
                    const isChosen = pollVotes[poll.id] === index;
                    return (
                      <button
                        key={option.optionText}
                        type="button"
                        disabled={hasVoted}
                        onClick={() => handleVote(poll.id, index)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span
                            className={
                              isChosen ? "text-sky-300 font-medium" : "text-slate-200"
                            }
                          >
                            {option.optionText}
                          </span>
                          <span className="text-slate-400">
                            {option.voteCount ?? 0}·{percentage}%
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isChosen ? "bg-sky-500" : "bg-slate-600"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
