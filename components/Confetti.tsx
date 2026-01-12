
import React, { useEffect, useState } from 'react';

const COLORS = ['#10b981', '#3b82f6', '#fbbf24', '#f472b6', '#a855f7', '#6366f1'];

const ConfettiParticle: React.FC<{ delay: number }> = ({ delay }) => {
  const [style] = useState(() => ({
    left: `${Math.random() * 100}%`,
    backgroundColor: COLORS[Math.floor(Math.random() * COLORS.length)],
    width: `${Math.random() * 10 + 5}px`,
    height: `${Math.random() * 10 + 5}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    animationDelay: `${delay}s`,
    transform: `rotate(${Math.random() * 360}deg)`,
  }));

  return <div className="confetti-particle absolute top-[-20px] opacity-0" style={style} />;
};

export const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 80 }, (_, i) => i));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((i) => (
        <ConfettiParticle key={i} delay={Math.random() * 3} />
      ))}
      <style>{`
        .confetti-particle {
          animation: fall 4s ease-out infinite;
        }
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
