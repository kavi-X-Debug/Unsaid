import { ReactNode, useState } from "react";

export type TabKey = string;

export type Tab = {
  key: TabKey;
  label: string;
};

type Props = {
  tabs: Tab[];
  initialKey: TabKey;
  onChange?: (key: TabKey) => void;
  renderContent: (activeKey: TabKey) => ReactNode;
};

export function Tabs(props: Props) {
  const [active, setActive] = useState<TabKey>(props.initialKey);

  const handleChange = (key: TabKey) => {
    setActive(key);
    if (props.onChange) {
      props.onChange(key);
    }
  };

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-full bg-slate-900/80 p-1 border border-slate-800">
        {props.tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => handleChange(tab.key)}
            className={`px-4 py-1.5 text-xs rounded-full transition ${
              active === tab.key
                ? "bg-slate-800 text-slate-50"
                : "text-slate-400 hover:text-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{props.renderContent(active)}</div>
    </div>
  );
}
