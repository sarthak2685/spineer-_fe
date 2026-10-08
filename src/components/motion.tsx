import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function Rise({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}

export function Lift({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.4, ease: 'easeOut' }}>
      {children}
    </motion.div>
  );
}
