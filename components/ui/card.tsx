import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Card(props: Props) {
  const merged = [
    "rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm shadow-sm",
    props.className
  ]
    .filter(Boolean)
    .join(" ");
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.18;
  return (
    <motion.div
      className={merged}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, ease: "easeOut" }}
    >
      {props.children}
    </motion.div>
  );
}
