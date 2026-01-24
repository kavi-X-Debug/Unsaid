import { DetailedHTMLProps, InputHTMLAttributes, forwardRef } from "react";

type Props = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { className, ...rest } = props;
  const base =
    "w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500";
  const merged = [base, className].filter(Boolean).join(" ");
  return <input ref={ref} className={merged} {...rest} />;
});

Input.displayName = "Input";
