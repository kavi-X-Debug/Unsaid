"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import type { AppUser, Poll, Question } from "../../../lib/types";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Input } from "../../../components/ui/input";
import { ReactionBar } from "../../../components/questions/reaction-bar";
import { StaggerContainer } from "../../../components/ui/motion";
import { db } from "../../../lib/firebase";

type PollDraftType = "yes_no" | "multiple_choice";

type ProfileStats = {
  totalQuestions: number;
  totalAnswered: number;
  totalPolls: number;
  totalViews: number;
};

type Props = {
  username: string;
  user: AppUser;
  stats: ProfileStats;
  questions: Question[];
  polls: Poll[];
};

const formatTime = (timestamp: any) => {
  if (!timestamp?.toDate) {
    return "";
  }
  const date = timestamp.toDate() as Date;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export function ProfilePageClient(props: Props) {
  const [questionText, setQuestionText] = useState("");
  const [pollType, setPollType] = useState<PollDraftType>("yes_no");
  const [pollQuestion, setPollQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollVotes, setPollVotes] = useState<Record<string, number | null>>({});
  const [questions, setQuestions] = useState<Question[]>(props.questions);
  const [polls, setPolls] = useState<Poll[]>(props.polls);

  const searchParams = useSearchParams();
  const chatToken = searchParams?.get("chat") ?? "";

  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.18;

  const [copied, setCopied] = useState(false);

  const profileTitle = useMemo(() => {
    return `@${props.user.username}`;
  }, [props.user.username]);

  const displayBio = useMemo(() => {
    if (!props.user.bio) {
      return "";
    }
    const trimmed = props.user.bio.trim();
    if (trimmed.length <= 160) {
      return trimmed;
    }
    return `${trimmed.slice(0, 157)}...`;
  }, [props.user.bio]);

  const avatarLetter = useMemo(() => {
    const username = props.user.username || props.username;
    if (!username) {
      return "U";
    }
    return username.charAt(0).toUpperCase();
  }, [props.user.username, props.username]);

  const handleShareProfile = async () => {
    setCopied(false);
    try {
      const href =
        typeof window !== "undefined" && window.location
          ? window.location.href
          : `https://unsaid.app/profile/${props.username}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(href);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch {
    }
  };

  useEffect(() => {
    const next: Record<string, number | null> = {};
    try {
      props.polls.forEach(poll => {
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
    }
    setPollVotes(next);
  }, [props.polls]);

  useEffect(() => {
    const questionsQuery = query(
      collection(db, "questions"),
      where("toUserId", "==", props.user.uid)
    );
    const unsubscribeQuestions = onSnapshot(questionsQuery, snapshot => {
      const answered: Question[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Omit<Question, "id">;
        if (data.isAnswered && !data.isReported) {
          answered.push({ id: docSnap.id, ...data });
        }
      });
      answered.sort((a, b) => {
        const aDate = a.createdAt?.toMillis?.() ?? 0;
        const bDate = b.createdAt?.toMillis?.() ?? 0;
        return bDate - aDate;
      });
      setQuestions(answered);
    });

    const pollsQuery = query(
      collection(db, "polls"),
      where("toUserId", "==", props.user.uid)
    );
    const unsubscribePolls = onSnapshot(pollsQuery, snapshot => {
      const published: Poll[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Omit<Poll, "id">;
        if (data.isPublished && !data.isReported) {
          published.push({ id: docSnap.id, ...data });
        }
      });
      published.sort((a, b) => {
        const aDate = a.createdAt?.toMillis?.() ?? 0;
        const bDate = b.createdAt?.toMillis?.() ?? 0;
        return bDate - aDate;
      });
      setPolls(published);
    });

    return () => {
      unsubscribeQuestions();
      unsubscribePolls();
    };
  }, [props.user.uid]);

  const handleAsk = async () => {
    setError(null);
    if (!chatToken) {
      setError("Use a valid shared link to send messages.");
      return;
    }
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
          toUserId: props.user.uid,
          questionText: questionText.trim(),
          chatToken
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
    if (!chatToken) {
      setError("Use a valid shared link to send polls.");
      return;
    }
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
          toUserId: props.user.uid,
          pollType,
          questionText: pollQuestion.trim(),
          options: trimmedOptions,
          chatToken
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
        <motion.header
          className="space-y-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration, ease: "easeOut" }}
        >
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-sky-500/10 border border-sky-500 flex items-center justify-center text-lg font-semibold text-sky-600 dark:text-sky-300 overflow-hidden shadow-md shadow-sky-500/20">
              {props.user.avatarUrl ? (
                <Image
                  src={props.user.avatarUrl}
                  alt={profileTitle}
                  fill
                  className="object-cover"
                />
              ) : (
                avatarLetter
              )}
            </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">{profileTitle}</h1>
                {displayBio && (
                  <motion.p
                  className="text-sm text-slate-700 dark:text-slate-300"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration,
                    ease: "easeOut",
                    delay: prefersReducedMotion ? 0 : 0.05
                    }}
                  >
                    {displayBio}
                  </motion.p>
                )}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/70 dark:text-slate-200 dark:border-slate-700">
                  Anonymous mode
                  </span>
                  <span className="text-[11px] text-slate-500">
                  Privacy-first Q&A profile
                  </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 mt-10 sm:mt-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleShareProfile}
              className="text-xs px-3 py-1 h-auto"
            >
              {copied ? "Link copied" : "Share profile"}
            </Button>
          </div>
        </motion.header>

        <Card className="p-4 hover:shadow-lg hover:shadow-sky-500/20 transition-shadow">
          <div className="grid grid-cols-3 gap-4 text-xs sm:text-sm">
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-400">Questions received</p>
              <p className="text-lg font-semibold">
                {props.stats.totalQuestions.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-400">Questions answered</p>
              <p className="text-lg font-semibold">
                {props.stats.totalAnswered.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 dark:text-slate-400">Polls published</p>
              <p className="text-lg font-semibold">
                {props.stats.totalPolls.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <Card className="p-4 space-y-3 hover:shadow-lg hover:shadow-sky-500/20 transition-shadow">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Ask a question
            </h2>
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

          <Card className="p-4 space-y-3 hover:shadow-lg hover:shadow-sky-500/20 transition-shadow">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Send a poll
            </h2>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPollType("yes_no")}
                className={`flex-1 rounded-full px-3 py-1 border text-xs ${
                  pollType === "yes_no"
                    ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                    : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                Yes / No
              </button>
              <button
                type="button"
                onClick={() => setPollType("multiple_choice")}
                className={`flex-1 rounded-full px-3 py-1 border text-xs ${
                  pollType === "multiple_choice"
                    ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                    : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
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

        <motion.section
          className="space-y-3"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration, ease: "easeOut" }}
        >
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Answered questions
          </h2>
          {questions.length === 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-500">
              No answered questions yet.
            </p>
          )}
          <StaggerContainer>
            {questions.map(question => (
              <Card
                key={question.id}
                className="p-4 space-y-3 hover:shadow-lg hover:shadow-sky-500/20 transition-shadow"
              >
                <div className="space-y-2">
                  <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                    {question.questionText}
                  </p>
                  {question.answerText && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {question.answerText}
                    </p>
                  )}
                  {(formatTime(question.createdAt) || formatTime((question as any).answeredAt)) && (
                    <div className="flex justify-end text-[11px] text-slate-500 dark:text-slate-500">
                      <span>
                        {formatTime(question.createdAt) &&
                          `Sent ${formatTime(question.createdAt)}`}
                        {formatTime(question.createdAt) &&
                          formatTime((question as any).answeredAt) &&
                          " • "}
                        {formatTime((question as any).answeredAt) &&
                          `Replied ${formatTime((question as any).answeredAt)}`}
                      </span>
                    </div>
                  )}
                </div>
                <ReactionBar
                  questionId={question.id}
                  initialCounts={question.reactionCounts}
                />
              </Card>
            ))}
          </StaggerContainer>
        </motion.section>

        <motion.section
          className="space-y-3"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration, ease: "easeOut" }}
        >
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Published polls
          </h2>
          {polls.length === 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-500">No polls yet.</p>
          )}
          <StaggerContainer>
            {polls.map(poll => (
              <Card
                key={poll.id}
                className="p-4 space-y-3 hover:shadow-lg hover:shadow-sky-500/20 transition-shadow"
              >
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {poll.questionText ?? "Poll"}
                </p>
                <div className="space-y-2">
                  {poll.options.map((option, index) => {
                    const hasVoted = pollVotes[poll.id] != null;
                    const isChosen = pollVotes[poll.id] === index;
                    const ownerChosen =
                      typeof poll.ownerSelection === "number" &&
                      poll.ownerSelection === index;
                    const optionTextClass = ownerChosen
                      ? "text-sky-700 font-semibold dark:text-sky-300"
                      : isChosen
                        ? "text-emerald-400 font-medium dark:text-emerald-300"
                        : "text-slate-800 dark:text-slate-200";
                    return (
                      <button
                        key={option.optionText}
                        type="button"
                        disabled={hasVoted}
                        onClick={() => handleVote(poll.id, index)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={optionTextClass}>{option.optionText}</span>
                          {ownerChosen && (
                            <span className="ml-1 text-[10px] text-sky-400">
                              Owner&apos;s choice
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </StaggerContainer>
        </motion.section>
      </div>
    </main>
  );
}
