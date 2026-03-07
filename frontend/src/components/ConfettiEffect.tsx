import React, { useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface ConfettiEffectProps {
  active: boolean;
  onComplete: () => void;
  duration?: number;
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({
  active,
  onComplete,
  duration = 3000,
}) => {
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        onComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, onComplete]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <Confetti
        width={width}
        height={height}
        colors={['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444']}
        recycle={false}
        numberOfPieces={500}
        gravity={0.3}
        initialVelocityY={20}
      />
    </div>
  );
};

// Success message toast component for gift claims
export const SuccessToast: React.FC<{
  message: string;
  visible: boolean;
  onClose: () => void;
}> = ({ message, visible, onClose }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
      <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 max-w-md">
        <span className="text-2xl">🎉</span>
        <div className="flex-1">
          <p className="font-semibold">Gift Claimed!</p>
          <p className="text-sm text-green-100">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-green-100 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
