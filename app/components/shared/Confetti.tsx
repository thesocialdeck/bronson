/**
 * Confetti Celebration Component
 *
 * Displays celebratory confetti animation when tasks are completed.
 * Lightweight, CSS-based animation for performance.
 */

import { useEffect, useState } from 'react';

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export const Confetti = ({ trigger, onComplete }: ConfettiProps) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (!isActive) return null;

  // Generate random confetti pieces
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random(),
    color: ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#f97316'][
      Math.floor(Math.random() * 6)
    ],
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 opacity-0"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            backgroundColor: piece.color,
            animation: `confetti-fall ${piece.duration}s ease-in forwards`,
            animationDelay: `${piece.delay}s`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
};

interface CelebrationProps {
  trigger: boolean;
  message?: string;
  emoji?: string;
}

/**
 * Full celebration component with confetti + message
 */
export const Celebration = ({
  trigger,
  message = '🎉 Great job!',
  emoji = '✨',
}: CelebrationProps) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);
      const timer = setTimeout(() => setIsActive(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!isActive) return null;

  return (
    <>
      <Confetti trigger={isActive} />
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
        <div
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 animate-bounce"
          style={{
            animation: 'celebration-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
          }}
        >
          <div className="text-6xl mb-2 animate-pulse">{emoji}</div>
          <p className="text-xl font-bold text-gray-800">{message}</p>
        </div>
      </div>
      <style>{`
        @keyframes celebration-pop {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
