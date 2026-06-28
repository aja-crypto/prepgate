import { useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

const SUBJECTS = [
  { abbr: 'DSA', color: '#8B5CF6', orbit: 140, speed: 35, offset: 0 },
  { abbr: 'OS', color: '#22C55E', orbit: 155, speed: 42, offset: 40 },
  { abbr: 'DBMS', color: '#F59E0B', orbit: 130, speed: 30, offset: 80 },
  { abbr: 'CN', color: '#06B6D4', orbit: 165, speed: 48, offset: 120 },
  { abbr: 'TOC', color: '#A855F7', orbit: 145, speed: 38, offset: 160 },
  { abbr: 'CD', color: '#EC4899', orbit: 150, speed: 40, offset: 200 },
  { abbr: 'DL', color: '#84CC16', orbit: 135, speed: 32, offset: 240 },
  { abbr: 'EM', color: '#10B981', orbit: 160, speed: 44, offset: 280 },
  { abbr: 'Algo', color: '#3B82F6', orbit: 148, speed: 36, offset: 320 },
];

function HexIcon({ abbr, color }) {
  return (
    <div
      className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white/90"
      style={{
        background: `linear-gradient(135deg, ${color}22, ${color}08)`,
        border: `1px solid ${color}35`,
        borderRadius: '12px',
        boxShadow: `0 0 16px ${color}18, 0 0 32px ${color}08`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {abbr}
    </div>
  );
}

export default function FloatingSubjects({ mouseX = 0, mouseY = 0 }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none hidden lg:block"
      style={{ zIndex: 5 }}
    >
      {SUBJECTS.map((s, i) => {
        const parallaxX = mouseX * (4 + i * 1.2);
        const parallaxY = mouseY * (3 + i * 0.9);

        return (
          <motion.div
            key={s.abbr}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 + i * 0.06, type: 'spring', stiffness: 180 }}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: 0,
              height: 0,
              animation: `orbit-${i} ${s.speed}s linear infinite`,
              animationDelay: `${s.offset / 360 * -s.speed}s`,
            }}
          >
            <div
              style={{
                transform: `translate(${parallaxX}px, ${parallaxY}px)`,
                transition: 'transform 0.3s ease-out',
              }}
            >
              <HexIcon abbr={s.abbr} color={s.color} />
            </div>
          </motion.div>
        );
      })}

      <style>{SUBJECTS.map((s, i) => `
        @keyframes orbit-${i} {
          0% {
            transform: rotate(${s.offset}deg) translateX(${s.orbit}px) rotate(-${s.offset}deg);
          }
          100% {
            transform: rotate(${s.offset + 360}deg) translateX(${s.orbit}px) rotate(-${s.offset + 360}deg);
          }
        }
      `).join('\n')}</style>
    </div>
  );
}
