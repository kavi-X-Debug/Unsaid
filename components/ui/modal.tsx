import { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Modal(props: ModalProps) {
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.18;

  return (
    <AnimatePresence>
      {props.open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease: "easeOut" }}
          aria-modal="true"
          role="dialog"
          onClick={props.onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-4 shadow-xl"
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration, ease: "easeOut" }}
            onClick={event => event.stopPropagation()}
          >
            {props.title && (
              <h2 className="text-sm font-semibold mb-2 text-slate-100">{props.title}</h2>
            )}
            <div className="text-sm text-slate-200">{props.children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

