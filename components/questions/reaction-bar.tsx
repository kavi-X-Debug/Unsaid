"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactionCounts } from "../../lib/types";

type Props = {
  questionId: string;
  initialCounts?: ReactionCounts;
};

type ReactionKey = "heart" | "laugh" | "wow";

const reactionConfig: { key: ReactionKey; label: string; icon: string }[] = [
  { key: "heart", label: "Love", icon: "❤️" },
  { key: "laugh", label: "Funny", icon: "😂" },
  { key: "wow", label: "Wow", icon: "😮" }
];

export function ReactionBar(props: Props) {
  const [counts, setCounts] = useState<ReactionCounts>(() => ({
    heart: props.initialCounts?.heart ?? 0,
    laugh: props.initialCounts?.laugh ?? 0,
    wow: props.initialCounts?.wow ?? 0
  }));
  const [current, setCurrent] = useState<ReactionKey | null>(null);
  const [hasReacted, setHasReacted] = useState(false);
  const storageKey = `unsaid_reaction_${props.questionId}`;
  const prefersReducedMotion = useReducedMotion();
  const tapScale = prefersReducedMotion ? 1 : 1.1;
  const duration = prefersReducedMotion ? 0 : 0.15;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "heart" || stored === "laugh" || stored === "wow") {
        setCurrent(stored);
        setHasReacted(true);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const handleReact = async (reaction: ReactionKey) => {
    if (hasReacted) {
      return;
    }
    setHasReacted(true);
    setCurrent(reaction);
    setCounts(previous => ({
      ...previous,
      [reaction]: previous[reaction] + 1
    }));
    try {
      const response = await fetch(`/api/questions/${props.questionId}/react`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reactionType: reaction })
      });
      if (!response.ok) {
        throw new Error("Failed");
      }
      try {
        window.localStorage.setItem(storageKey, reaction);
      } catch {
        // ignore
      }
    } catch {
      setCounts(previous => ({
        ...previous,
        [reaction]: Math.max(0, previous[reaction] - 1)
      }));
      setHasReacted(false);
      setCurrent(null);
    }
  };

  const total = counts.heart + counts.laugh + counts.wow;
  if (total === 0) {
    return (
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span>React:</span>
        <div className="flex gap-2">
          {reactionConfig.map(reaction => (
            <motion.button
              key={reaction.key}
              type="button"
              onClick={() => handleReact(reaction.key)}
              disabled={hasReacted}
              whileTap={{ scale: tapScale }}
              transition={{ duration, ease: "easeOut" }}
              className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-slate-300 hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-default"
            >
              <span>{reaction.icon}</span>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between text-xs text-slate-400">
      <div className="flex items-center gap-3">
        {reactionConfig.map(reaction => {
          const value = counts[reaction.key];
          if (!value) {
            return null;
          }
          const isActive = current === reaction.key;
          return (
            <motion.button
              key={reaction.key}
              type="button"
              onClick={() => handleReact(reaction.key)}
              disabled={hasReacted}
              whileTap={{ scale: tapScale }}
              transition={{ duration, ease: "easeOut" }}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 transition ${
                isActive
                  ? "bg-sky-500/10 text-sky-300"
                  : "bg-slate-900/80 text-slate-300 hover:bg-slate-800"
              } disabled:opacity-60 disabled:cursor-default`}
            >
              <span>{reaction.icon}</span>
              <span>{value}</span>
            </motion.button>
          );
        })}
      </div>
      <span>{total} reactions</span>
    </div>
  );
}
