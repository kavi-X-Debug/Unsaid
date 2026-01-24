import { ButtonHTMLAttributes, DetailedHTMLProps } from "react";

type Props = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  fullWidth?: boolean;
};

export function Button(props: Props) {
  const { className, variant = "primary", fullWidth, ...rest } = props;
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: Record<NonNullable<Props["variant"]>, string> = {
    primary: "bg-sky-500 hover:bg-sky-400 text-white",
    outline: "border border-slate-700 hover:bg-slate-900 text-slate-50",
    ghost: "text-slate-300 hover:bg-slate-900"
  };
  const width = fullWidth ? "w-full" : "";
  const merged = [base, variants[variant], width, className].filter(Boolean).join(" ");
  return <button className={merged} {...rest} />;
}
