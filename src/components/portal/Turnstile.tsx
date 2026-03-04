import React, { useEffect } from 'react';

interface TurnstileProps {
  onVerify: (token: string) => void;
}

export const Turnstile: React.FC<TurnstileProps> = ({ onVerify }) => {
  useEffect(() => {
    // Mock Turnstile verification
    const timer = setTimeout(() => {
      onVerify('mock-turnstile-token-' + Math.random().toString(36).substr(2, 9));
    }, 1000);
    return () => clearTimeout(timer);
  }, [onVerify]);

  return (
    <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg text-center text-xs text-neutral-500 font-mono">
      Turnstile Verification Active...
    </div>
  );
};
