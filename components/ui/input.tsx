import { DetailedHTMLProps, InputHTMLAttributes, forwardRef } from "react";

type Props = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { className, ...rest } = props;
  const base =
    "w-full rounded-xl border px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-500 border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:bg-slate-900/60 dark:text-slate-50 dark:placeholder:text-slate-500 dark:border-slate-700";
  const merged = [base, className].filter(Boolean).join(" ");
  return <input ref={ref} className={merged} {...rest} />;
});

Input.displayName = "Input";
