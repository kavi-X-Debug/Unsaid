import { ReactNode } from "react";

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
  return <div className={merged}>{props.children}</div>;
}
