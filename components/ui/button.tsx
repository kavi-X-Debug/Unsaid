import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";
import { motion, useReducedMotion } from "framer-motion";

type BaseButtonProps = Omit<
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
  "onDrag"
>;

type Props = BaseButtonProps & {
  variant?: "primary" | "outline" | "ghost";
  fullWidth?: boolean;
};

export function Button(props: Props) {
  const { className, variant = "primary", fullWidth, ...rest } = props;
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<NonNullable<Props["variant"]>, string> = {
    primary:
      "bg-sky-600 hover:bg-sky-500 text-white dark:bg-sky-500 dark:hover:bg-sky-400",
    outline:
      "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800",
    ghost:
      "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
  };
  const width = fullWidth ? "w-full" : "";
  const merged = [base, variants[variant], width, className].filter(Boolean).join(" ");
  const prefersReducedMotion = useReducedMotion();
  const hoverScale = prefersReducedMotion ? 1 : 1.02;
  const tapScale = prefersReducedMotion ? 1 : 0.97;
  const duration = prefersReducedMotion ? 0 : 0.12;
  return (
    <motion.button
      className={merged}
      whileHover={{ scale: hoverScale }}
      whileTap={{ scale: tapScale }}
      transition={{ duration, ease: "easeOut" }}
      {...(rest as any)}
    />
  );
}
