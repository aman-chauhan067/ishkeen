import React, { useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

export interface ScrambleTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  duration?: number; // Optimized snappy duration (default 850ms for instant legibility)
  delay?: number; // Delay in ms before starting decryption
  scrambleSpeed?: number; // Interval in ms per frame (default 28ms for buttery smoothness)
}

/**
 * All character sets requested by user: numbers, symbols, uppercase letters, and lowercase letters.
 */
const SCRAMBLE_CHARS =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`';

export const ScrambleText: React.FC<ScrambleTextProps> = ({
  text,
  className = '',
  as: Component = 'span',
  duration = 850, // Crisp 850ms decryption so content loads fast and readable
  delay = 0,
  scrambleSpeed = 28, // 60-FPS smooth frame interval
}) => {
  const containerRef = useRef<HTMLElement | null>(null);
  // Triggers immediately as soon as element touches viewport
  const isInView = useInView(containerRef, {
    once: true,
    amount: 0.05,
    margin: '0px 0px -10% 0px',
  });
  const [displayText, setDisplayText] = useState<string>(text);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    let timerId: ReturnType<typeof setTimeout>;

    const startDecryption = () => {
      const updateFrame = () => {
        const now = Date.now();
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Calculate how many characters are fully revealed from left to right
        const revealCount = Math.floor(progress * text.length);

        const scrambled = text
          .split('')
          .map((char, index) => {
            // Preserve spaces and whitespace
            if (char === ' ' || char === '\n' || char === '\t') {
              return char;
            }
            // If already revealed, return the real character
            if (index < revealCount) {
              return char;
            }
            // Otherwise return a random character from alphanumeric + symbols
            const randomChar =
              SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
            return randomChar;
          })
          .join('');

        setDisplayText(scrambled);

        if (progress < 1) {
          timerId = setTimeout(updateFrame, scrambleSpeed);
        } else {
          setDisplayText(text);
        }
      };

      updateFrame();
    };

    const delayTimeout = setTimeout(startDecryption, delay);

    return () => {
      clearTimeout(delayTimeout);
      clearTimeout(timerId);
    };
  }, [isInView, text, duration, delay, scrambleSpeed]);

  return React.createElement(
    Component,
    {
      ref: containerRef,
      className: className,
    },
    displayText
  );
};

export default ScrambleText;
