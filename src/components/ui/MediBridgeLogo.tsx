/**
 * MediBridgeLogo — Official MediBridge AI Brand Mark
 *
 * Uses the official custom MediBridge AI logo mark:
 * Stylized "M" with bridge arch and integrated white medical cross
 * with fluid teal/cyan to deep navy gradient.
 */

import React from 'react';

interface MediBridgeLogoProps {
  /** Size in pixels (height). Defaults to responsive navbar sizing (approx 36px mobile, 40px desktop) */
  size?: number | string;
  className?: string;
  /** 'mark' renders the emblem icon only; 'full' renders the logo + wordmark */
  variant?: 'mark' | 'full';
  /** Optional interactive hover scale effect */
  animated?: boolean;
  /** Unused dark prop kept for backward compatibility with Footer */
  dark?: boolean;
}

export const MediBridgeLogo: React.FC<MediBridgeLogoProps> = ({
  size,
  className = '',
  variant = 'mark',
  animated = false,
}) => {
  const isFull = variant === 'full';
  const src = isFull ? '/assets/medibridge-logo-full.png' : '/assets/medibridge-logo-mark.png';

  const style = size ? { height: size, width: 'auto' } : undefined;
  const sizeClasses = size ? '' : isFull ? 'h-9 sm:h-10 w-auto' : 'h-9 sm:h-10 w-auto';

  return (
    <img
      src={src}
      alt="MediBridge AI"
      className={`shrink-0 object-contain select-none ${sizeClasses} ${className} ${
        animated ? 'transition-transform duration-200 group-hover:scale-105' : ''
      }`}
      style={style}
      loading="eager"
      decoding="async"
    />
  );
};
