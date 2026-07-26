import React, { useState, useEffect } from 'react';

/**
 * Exact natural typographic advance widths in em units for Playfair Display uppercase characters.
 * Using a fixed-width outer slot per letter completely eliminates layout shift / horizontal jitter
 * when a character transforms into an avant-garde font, while maintaining natural editorial kerning.
 */
const WORDMARK_SLOTS = [
  { letter: 'I', widthEm: 0.38 },
  { letter: 'S', widthEm: 0.62 },
  { letter: 'H', widthEm: 0.78 },
  { letter: 'K', widthEm: 0.76 },
  { letter: 'E', widthEm: 0.65 },
  { letter: 'E', widthEm: 0.65 },
  { letter: 'N', widthEm: 0.78 },
];

/**
 * Curated avant-garde typeface collection with visual normalization transforms
 * so every font fits inside its fixed slot without clipping or pushing adjacent characters:
 * - Ancient (Roman lapidary & 16th century Alchemical Blackletter)
 * - Thin line (Ultra-delicate Bodoni Moda hairline)
 * - Handdrawn (Expressive calligraphic ink signature)
 * - Modern Quirky (Bauhaus experimental geometric & art-direction display)
 */
const AVANT_GARDE_FONTS = [
  {
    name: 'Editorial Luxury Serif',
    className: "font-['Playfair_Display',_serif]",
    scaleClass: 'scale-100',
  },
  {
    name: 'Ancient Roman Lapidary Marble Inscription',
    className: "font-['Cinzel_Decorative',_serif]",
    scaleClass: 'scale-[0.94]', // Normalizes ornate inscription flourishes
  },
  {
    name: 'Ancient 16th Century Alchemical Blackletter',
    className: "font-['UnifrakturMaguntia',_serif]",
    scaleClass: 'scale-[0.92]', // Crisp medieval Gothic proportions
  },
  {
    name: 'Thin-Line Ultra-Delicate Hairline Serif',
    className: "font-['Bodoni_Moda',_serif]",
    scaleClass: 'scale-100', // Haute couture hairline matches standard serif
  },
  {
    name: 'Modern Quirky Bauhaus Experimental Thin-Line',
    className: "font-['Megrim',_sans-serif]",
    scaleClass: 'scale-[0.95]', // Bauhaus geometric thin display
  },
  {
    name: 'Handdrawn Expressive Calligraphic Ink Script',
    className: "font-['Windsong',_cursive]",
    scaleClass: 'scale-[1.18] -translate-y-3', // Calligraphic script scaled for clear legibility
  },
  {
    name: 'Avant-Garde Modernist Art-Direction Display',
    className: "font-['Syne',_sans-serif]",
    scaleClass: 'scale-[0.96]', // Experimental display proportions
  },
];

export const HeroKineticTitle: React.FC = () => {
  const [flickerState, setFlickerState] = useState<{
    letterIdx: number;
    fontIdx: number;
    isAccent: boolean;
  } | null>(null);

  // Periodic random letter typographic flicker across avant-garde typefaces
  useEffect(() => {
    const triggerFlicker = () => {
      const randomIdx = Math.floor(Math.random() * WORDMARK_SLOTS.length);
      // Pick a random avant-garde font (exclude 0 so it always shifts to ancient/handdrawn/thin-line/quirky)
      const randomFontIdx = 1 + Math.floor(Math.random() * (AVANT_GARDE_FONTS.length - 1));

      setFlickerState({
        letterIdx: randomIdx,
        fontIdx: randomFontIdx,
        isAccent: Math.random() > 0.35, // 65% chance to highlight in Swiss Copper
      });

      // Quick 240ms typographic flicker duration
      const resetTimeout = setTimeout(() => {
        setFlickerState(null);
      }, 240);

      return () => clearTimeout(resetTimeout);
    };

    const intervalId = setInterval(() => {
      triggerFlicker();
    }, 1600);

    return () => clearInterval(intervalId);
  }, []);

  // Interactive hover cascade across ancient, handdrawn, thin-line, and quirky fonts
  const handleMouseEnter = () => {
    [0, 2, 4, 6].forEach((idx, i) => {
      setTimeout(() => {
        const randomFontIdx = 1 + ((idx + i) % (AVANT_GARDE_FONTS.length - 1));
        setFlickerState({
          letterIdx: idx,
          fontIdx: randomFontIdx,
          isAccent: true,
        });
        setTimeout(() => {
          setFlickerState((prev) => (prev?.letterIdx === idx ? null : prev));
        }, 180);
      }, i * 110);
    });
  };

  return (
    <h1
      onMouseEnter={handleMouseEnter}
      className="w-full text-center tracking-normal leading-[0.95] select-none text-[clamp(5rem,18vw,220px)] mb-6 cursor-default flex items-center justify-center"
      aria-label="ISHKEEN"
    >
      {WORDMARK_SLOTS.map((slot, idx) => {
        const isFlickering = flickerState?.letterIdx === idx;
        const fontConfig = isFlickering && flickerState
          ? AVANT_GARDE_FONTS[flickerState.fontIdx]
          : AVANT_GARDE_FONTS[0];

        const colorClass = isFlickering && flickerState?.isAccent
          ? 'text-[#C67C5A] drop-shadow-sm'
          : 'text-[#26384B] hover:text-[#C67C5A]';

        return (
          /* Fixed-width slot guarantees zero horizontal layout shift / neighbor pushing */
          <span
            key={idx}
            style={{ width: `${slot.widthEm}em` }}
            className="inline-flex items-center justify-center relative select-none overflow-visible shrink-0"
          >
            <span
              className={`inline-block transition-all duration-[140ms] ease-out ${fontConfig.className} ${fontConfig.scaleClass} ${colorClass}`}
            >
              {slot.letter}
            </span>
          </span>
        );
      })}
    </h1>
  );
};

export default HeroKineticTitle;
