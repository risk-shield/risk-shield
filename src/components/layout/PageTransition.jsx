import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const variants = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -18 },
};

export default function PageTransition({ children }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.18, ease: "easeInOut" }}
        style={{ height: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}