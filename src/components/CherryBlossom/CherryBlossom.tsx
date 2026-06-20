import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Petal {
  id: number;
  x: number;
  drift: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
  opacity: number;
}

function createPetal(): Petal {
  return {
    id: Date.now() + Math.random(),
    x: Math.random() * 100,
    drift: (Math.random() - 0.5) * 15,
    delay: Math.random() * 3,
    duration: 8 + Math.random() * 8,
    size: 6 + Math.random() * 10,
    rotation: Math.random() * 360,
    opacity: 0.08 + Math.random() * 0.14,
  };
}

export function CherryBlossom() {
  const [petals, setPetals] = useState<Petal[]>(() =>
    Array.from({ length: 5 }, createPetal)
  );
  const idRef = useRef(0);

  const spawnPetal = useCallback(() => {
    idRef.current += 1;
    setPetals(prev => {
      const next = prev.length >= 7 ? prev.slice(1) : [...prev];
      return [...next, { ...createPetal(), id: idRef.current }];
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(spawnPetal, 4000);
    return () => clearInterval(interval);
  }, [spawnPetal]);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      <AnimatePresence>
        {petals.map(petal => (
          <motion.div
            key={petal.id}
            initial={{
              x: `${petal.x}vw`,
              y: -20,
              rotate: petal.rotation,
              opacity: 0,
            }}
            animate={{
              y: '110vh',
              x: `${petal.x + petal.drift}vw`,
              rotate: petal.rotation + 540,
              opacity: [0, petal.opacity, petal.opacity, 0],
            }}
            transition={{
              duration: petal.duration,
              delay: petal.delay,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              width: petal.size,
              height: petal.size,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse
                cx="12"
                cy="12"
                rx="4"
                ry="9"
                fill="var(--accent)"
                opacity="0.6"
                transform="rotate(25 12 12)"
              />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
