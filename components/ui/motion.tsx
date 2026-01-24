import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type PageTransitionProps = {
  children: ReactNode;
};

export function PageTransition(props: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.18;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration, ease: "easeOut" }}
      >
        {props.children}
      </motion.div>
    </AnimatePresence>
  );
}

type StaggerContainerProps = {
  children: ReactNode;
  delayStep?: number;
};

export function StaggerContainer(props: StaggerContainerProps) {
  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : 0.18;
  const delayStep = prefersReducedMotion ? 0 : props.delayStep ?? 0.04;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: delayStep
          }
        }
      }}
    >
      {Array.isArray(props.children)
        ? props.children.map((child, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration, ease: "easeOut" }}
            >
              {child}
            </motion.div>
          ))
        : props.children}
    </motion.div>
  );
}

