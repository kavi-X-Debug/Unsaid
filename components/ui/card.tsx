import { ReactNode, useEffect } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useTheme } from "../theme/theme-provider";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Card(props: Props) {
  const { theme } = useTheme();
  const merged = [
    "rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/60",
    props.className
  ]
    .filter(Boolean)
    .join(" ");
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.18;
  const controls = useAnimationControls();

  useEffect(() => {
    if (prefersReducedMotion) {
      controls.set({
        opacity: 1,
        y: 0,
        scale: 1,
        boxShadow: "0 0 0 rgba(0,0,0,0)"
      });
      return;
    }
    controls.start({
      opacity: 1,
      y: 0,
      scale: [1, 1.02, 1],
      boxShadow: [
        "0 0 0 rgba(56,189,248,0)",
        "0 0 24px rgba(56,189,248,0.35)",
        "0 0 0 rgba(56,189,248,0)"
      ],
      transition: {
        duration: 0.45,
        ease: "easeInOut"
      }
    });
  }, [theme, prefersReducedMotion, controls]);

  return (
    <motion.div
      className={merged}
      initial={{ opacity: 0, y: 6, scale: 1 }}
      animate={controls}
      transition={{ duration, ease: "easeOut" }}
    >
      {props.children}
    </motion.div>
  );
}
