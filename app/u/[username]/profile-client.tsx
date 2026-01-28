"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import type { AppUser, Poll, Question } from "../../../lib/types";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Input } from "../../../components/ui/input";
import { StaggerContainer } from "../../../components/ui/motion";
import { Tabs } from "../../../components/ui/tabs";
import { db } from "../../../lib/firebase";
import { ReactionBar } from "../../../components/questions/reaction-bar";

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
  const [pendingVotes, setPendingVotes] = useState<Record<string, number | null>>({});
  const [polls, setPolls] = useState<Poll[]>(props.polls);
  const [chatQuestions, setChatQuestions] = useState<Question[]>([]);
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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

  useEffect(() => {
    try {
      const key = `unsaid_anon_session_${props.user.uid}`;
      let existing = "";
      if (typeof window !== "undefined" && window.localStorage) {
        existing = window.localStorage.getItem(key) ?? "";
      }
      if (existing) {
        setAnonymousSessionId(existing);
        return;
      }
      const generated =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, generated);
      }
      setAnonymousSessionId(generated);
    } catch {
      setAnonymousSessionId(null);
    }
  }, [props.user.uid]);

  const handleShareProfile = async () => {
    setCopied(false);
    try {
      const href =
        typeof window !== "undefined" && window.location
          ? window.location.href
          : `https://unsaid.app/u/${props.username.toLowerCase()}`;
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
    if (!anonymousSessionId) {
      setPolls([]);
      return;
    }
    const chatId = `${props.user.uid}_${anonymousSessionId}`;
    const pollsQuery = query(
      collection(db, "polls"),
      where("chatId", "==", chatId)
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
      unsubscribePolls();
    };
  }, [props.user.uid, anonymousSessionId]);

  useEffect(() => {
    if (!anonymousSessionId) {
      setChatQuestions([]);
      return;
    }
    const chatId = `${props.user.uid}_${anonymousSessionId}`;
    const questionsQuery = query(
      collection(db, "questions"),
      where("chatId", "==", chatId)
    );
    const unsubscribeQuestions = onSnapshot(questionsQuery, snapshot => {
      const items: Question[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Omit<Question, "id">;
        items.push({ id: docSnap.id, ...data });
      });
      items.sort((a, b) => {
        const aDate = a.createdAt?.toMillis?.() ?? 0;
        const bDate = b.createdAt?.toMillis?.() ?? 0;
        return bDate - aDate;
      });
      setChatQuestions(items);
    });
    return () => {
      unsubscribeQuestions();
    };
  }, [anonymousSessionId, props.user.uid]);

  const handleAsk = async () => {
    setError(null);
    if (!anonymousSessionId) {
      setError("Could not start an anonymous session. Try again.");
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
          anonymousSessionId
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
    if (!anonymousSessionId) {
      setError("Could not start an anonymous session. Try again.");
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
          anonymousSessionId
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

  const getMillis = (timestamp: any) => timestamp?.toMillis?.() ?? 0;
  const latestQuestion = chatQuestions.length > 0 ? chatQuestions[0] : null;
  const latestPoll = polls.length > 0 ? polls[0] : null;
  const latestItemIsQuestion =
    !!latestQuestion &&
    (!latestPoll || getMillis((latestQuestion as any).createdAt) >= getMillis((latestPoll as any).createdAt));
  const latestItemIsPoll =
    !!latestPoll &&
    (!latestQuestion || getMillis((latestPoll as any).createdAt) > getMillis((latestQuestion as any).createdAt));

  return (
    <main className="min-h-screen px-4 py-10 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <motion.header
          className="space-y-4 flex flex-col items-center"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration, ease: "easeOut" }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-24 w-24 rounded-full bg-sky-500/10 border border-sky-500 flex items-center justify-center text-lg font-semibold text-sky-600 dark:text-sky-300 overflow-hidden shadow-md shadow-sky-500/20">
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
            <div className="space-y-1 text-center">
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
              <div className="flex flex-col items-center gap-1 mt-2">
                <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/70 dark:text-slate-200 dark:border-slate-700">
                  Anonymous mode
                </span>
                <span className="text-[11px] text-slate-500">
                  Privacy-first Q&A profile
                </span>
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleShareProfile}
            className="text-xs px-3 py-1 h-auto"
          >
            {copied ? "Link copied" : "Share profile"}
          </Button>
        </motion.header>

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

        {anonymousSessionId && (latestItemIsQuestion || latestItemIsPoll) && (
          <Card className="p-4 space-y-3 hover:shadow-lg hover:shadow-sky-500/20 transition-shadow">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Latest message or poll
            </h2>
            {latestItemIsQuestion && latestQuestion && (
              <div className="space-y-2">
                {(() => {
                  const sentTime = formatTime((latestQuestion as any).createdAt);
                  const repliedTime = formatTime((latestQuestion as any).answeredAt);
                  return (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-900/60">
                      <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                        {latestQuestion.questionText}
                      </p>
                      {latestQuestion.isAnswered && latestQuestion.answerText && (
                        <div className="space-y-2">
                          <div className="rounded-lg bg-white border border-slate-200 p-2 text-sm text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                            {latestQuestion.answerText}
                          </div>
                          <ReactionBar
                            questionId={latestQuestion.id}
                            initialCounts={
                              latestQuestion.reactionCounts ?? {
                                heart: 0,
                                laugh: 0,
                                wow: 0
                              }
                            }
                          />
                        </div>
                      )}
                      {(sentTime || repliedTime) && (
                        <div className="flex justify-end text-[11px] text-slate-500 dark:text-slate-500">
                          <span>
                            {sentTime && `Sent ${sentTime}`}
                            {sentTime && repliedTime && " • "}
                            {repliedTime && `Replied ${repliedTime}`}
                          </span>
                        </div>
                      )}
                      {!latestQuestion.isAnswered && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Waiting for a reply
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            {latestItemIsPoll && latestPoll && (
              <div className="space-y-3">
                <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {latestPoll.questionText ?? "Poll"}
                </p>
                {latestPoll.pollType === "yes_no" ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {latestPoll.options.map((option, index) => {
                        const hasVoted = pollVotes[latestPoll.id] != null;
                        const isChosen = pollVotes[latestPoll.id] === index;
                        const isPending =
                          pendingVotes[latestPoll.id] != null &&
                          pendingVotes[latestPoll.id] === index;
                        const ownerChosen =
                          typeof latestPoll.ownerSelection === "number" &&
                          latestPoll.ownerSelection === index;
                        const optionTextClass = ownerChosen
                          ? "text-sky-700 font-semibold dark:text-sky-300"
                          : isChosen
                            ? "text-emerald-400 font-medium dark:text-emerald-300"
                            : isPending
                              ? "text-slate-900 font-medium dark:text-slate-100"
                              : "text-slate-800 dark:text-slate-200";
                        return (
                          <button
                            key={option.optionText}
                            type="button"
                            disabled={hasVoted}
                            onClick={() => {
                              if (hasVoted) {
                                return;
                              }
                              setPendingVotes(previous => ({
                                ...previous,
                                [latestPoll.id]: index
                              }));
                            }}
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
                    {pollVotes[latestPoll.id] == null && (
                      <Button
                        type="button"
                        disabled={pendingVotes[latestPoll.id] == null}
                        onClick={() => {
                          const pendingIndex = pendingVotes[latestPoll.id];
                          if (pendingIndex == null) {
                            return;
                          }
                          handleVote(latestPoll.id, pendingIndex);
                        }}
                        fullWidth
                      >
                        Confirm vote
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {latestPoll.options.map((option, index) => {
                        const hasVoted = pollVotes[latestPoll.id] != null;
                        const isChosen = pollVotes[latestPoll.id] === index;
                        const isPending =
                          pendingVotes[latestPoll.id] != null &&
                          pendingVotes[latestPoll.id] === index;
                        const ownerChosen =
                          typeof latestPoll.ownerSelection === "number" &&
                          latestPoll.ownerSelection === index;
                        const optionTextClass = ownerChosen
                          ? "text-sky-700 font-semibold dark:text-sky-300"
                          : isChosen
                            ? "text-emerald-400 font-medium dark:text-emerald-300"
                            : isPending
                              ? "text-slate-900 font-medium dark:text-slate-100"
                              : "text-slate-800 dark:text-slate-200";
                        return (
                          <button
                            key={option.optionText}
                            type="button"
                            disabled={hasVoted}
                            onClick={() => {
                              if (hasVoted) {
                                return;
                              }
                              setPendingVotes(previous => ({
                                ...previous,
                                [latestPoll.id]: index
                              }));
                            }}
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
                    {pollVotes[latestPoll.id] == null && (
                      <Button
                        type="button"
                        disabled={pendingVotes[latestPoll.id] == null}
                        onClick={() => {
                          const pendingIndex = pendingVotes[latestPoll.id];
                          if (pendingIndex == null) {
                            return;
                          }
                          handleVote(latestPoll.id, pendingIndex);
                        }}
                        fullWidth
                      >
                        Confirm vote
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {anonymousSessionId && (
          <motion.section
            className="space-y-3"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration, ease: "easeOut" }}
          >
            <Card className="p-4 space-y-4 hover:shadow-lg hover:shadow-sky-500/20 transition-shadow">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Previous messages
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  className="text-xs px-3 py-1 h-auto"
                  onClick={() => setShowHistory(previous => !previous)}
                >
                  {showHistory ? "Hide" : "See previous messages"}
                </Button>
              </div>
              {showHistory && (
                <Tabs
                  tabs={[
                    { key: "messages", label: "Messages" },
                    { key: "polls", label: "Polls" }
                  ]}
                  initialKey="messages"
                  renderContent={activeKey => {
                    if (activeKey === "messages") {
                      const items =
                        latestItemIsQuestion && latestQuestion
                          ? chatQuestions.slice(1)
                          : chatQuestions;
                      if (items.length === 0) {
                        return (
                          <p className="text-sm text-slate-600 dark:text-slate-500">
                            Your messages and replies will appear here.
                          </p>
                        );
                      }
                      return (
                        <div className="space-y-3">
                          {items.map(question => {
                            const sentTime = formatTime(question.createdAt);
                            const repliedTime = formatTime(
                              (question as any).answeredAt
                            );
                            return (
                              <div
                                key={question.id}
                                className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 dark:border-slate-800 dark:bg-slate-900/60"
                              >
                                <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                                  {question.questionText}
                                </p>
                                {question.isAnswered && question.answerText && (
                                  <div className="space-y-2">
                                    <div className="rounded-lg bg-white border border-slate-200 p-2 text-sm text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
                                      {question.answerText}
                                    </div>
                                    <ReactionBar
                                      questionId={question.id}
                                      initialCounts={
                                        question.reactionCounts ?? {
                                          heart: 0,
                                          laugh: 0,
                                          wow: 0
                                        }
                                      }
                                    />
                                  </div>
                                )}
                                {(sentTime || repliedTime) && (
                                  <div className="flex justify-end text-[11px] text-slate-500 dark:text-slate-500">
                                    <span>
                                      {sentTime && `Sent ${sentTime}`}
                                      {sentTime && repliedTime && " • "}
                                      {repliedTime && `Replied ${repliedTime}`}
                                    </span>
                                  </div>
                                )}
                                {!question.isAnswered && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Waiting for a reply
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    const pollItems =
                      latestItemIsPoll && latestPoll ? polls.slice(1) : polls;
                    if (pollItems.length === 0) {
                      return (
                        <p className="text-sm text-slate-600 dark:text-slate-500">
                          No polls yet.
                        </p>
                      );
                    }
                    return (
                      <StaggerContainer>
                        {pollItems.map(poll => (
                          <Card
                            key={poll.id}
                            className="p-4 space-y-3 hover:shadow-lg hover:shadow-sky-500/20 transition-shadow"
                          >
                            <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                              {poll.questionText ?? "Poll"}
                            </p>
                            {poll.pollType === "yes_no" ? (
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  {poll.options.map((option, index) => {
                                    const hasVoted = pollVotes[poll.id] != null;
                                    const isChosen = pollVotes[poll.id] === index;
                                    const isPending =
                                      pendingVotes[poll.id] != null &&
                                      pendingVotes[poll.id] === index;
                                    const ownerChosen =
                                      typeof poll.ownerSelection === "number" &&
                                      poll.ownerSelection === index;
                                    const optionTextClass = ownerChosen
                                      ? "text-sky-700 font-semibold dark:text-sky-300"
                                      : isChosen
                                        ? "text-emerald-400 font-medium dark:text-emerald-300"
                                        : isPending
                                          ? "text-slate-900 font-medium dark:text-slate-100"
                                          : "text-slate-800 dark:text-slate-200";
                                    return (
                                      <button
                                        key={option.optionText}
                                        type="button"
                                        disabled={hasVoted}
                                        onClick={() => {
                                          if (hasVoted) {
                                            return;
                                          }
                                          setPendingVotes(previous => ({
                                            ...previous,
                                            [poll.id]: index
                                          }));
                                        }}
                                        className="w-full text-left"
                                      >
                                        <div className="flex items-center justify-between text-xs mb-1">
                                          <span className={optionTextClass}>
                                            {option.optionText}
                                          </span>
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
                                {pollVotes[poll.id] == null && (
                                  <Button
                                    type="button"
                                    disabled={pendingVotes[poll.id] == null}
                                    onClick={() => {
                                      const pendingIndex = pendingVotes[poll.id];
                                      if (pendingIndex == null) {
                                        return;
                                      }
                                      handleVote(poll.id, pendingIndex);
                                    }}
                                    fullWidth
                                  >
                                    Confirm vote
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  {poll.options.map((option, index) => {
                                    const hasVoted = pollVotes[poll.id] != null;
                                    const isChosen = pollVotes[poll.id] === index;
                                    const isPending =
                                      pendingVotes[poll.id] != null &&
                                      pendingVotes[poll.id] === index;
                                    const ownerChosen =
                                      typeof poll.ownerSelection === "number" &&
                                      poll.ownerSelection === index;
                                    const optionTextClass = ownerChosen
                                      ? "text-sky-700 font-semibold dark:text-sky-300"
                                      : isChosen
                                        ? "text-emerald-400 font-medium dark:text-emerald-300"
                                        : isPending
                                          ? "text-slate-900 font-medium dark:text-slate-100"
                                          : "text-slate-800 dark:text-slate-200";
                                    return (
                                      <button
                                        key={option.optionText}
                                        type="button"
                                        disabled={hasVoted}
                                        onClick={() => {
                                          if (hasVoted) {
                                            return;
                                          }
                                          setPendingVotes(previous => ({
                                            ...previous,
                                            [poll.id]: index
                                          }));
                                        }}
                                        className="w-full text-left"
                                      >
                                        <div className="flex items-center justify-between text-xs mb-1">
                                          <span className={optionTextClass}>
                                            {option.optionText}
                                          </span>
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
                                {pollVotes[poll.id] == null && (
                                  <Button
                                    type="button"
                                    disabled={pendingVotes[poll.id] == null}
                                    onClick={() => {
                                      const pendingIndex = pendingVotes[poll.id];
                                      if (pendingIndex == null) {
                                        return;
                                      }
                                      handleVote(poll.id, pendingIndex);
                                    }}
                                    fullWidth
                                  >
                                    Confirm vote
                                  </Button>
                                )}
                              </div>
                            )}
                          </Card>
                        ))}
                      </StaggerContainer>
                    );
                  }}
                />
              )}
            </Card>
          </motion.section>
        )}
      </div>
    </main>
  );
}
