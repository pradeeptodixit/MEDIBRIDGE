/**
 * StarRating — Reusable 1–5 star interactive selector
 * MediBridge AI — Hospital Experience Feedback
 */

import React, { useState } from 'react';
import { Star } from 'lucide-react';

const STAR_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Okay',
  4: 'Good',
  5: 'Excellent',
};

interface StarRatingProps {
  value: number | null;
  onChange: (value: 1 | 2 | 3 | 4 | 5) => void;
  label: string;
  error?: boolean;
  id?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({ value, onChange, label, error, id }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const display = hovered !== null ? hovered : (value !== null ? value : 0);

  const handleSelect = (star: 1 | 2 | 3 | 4 | 5, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(star);
    setHovered(null);
  };

  return (
    <div id={id} className="scroll-mt-24 transition-colors">
      <div className="flex items-center justify-between mb-1.5">
        <label className={`text-xs font-bold ${error ? 'text-rose-600' : 'text-slate-800'}`}>
          {label}
          <span className="text-rose-500 ml-0.5">*</span>
        </label>
        {display > 0 && (
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-fade-in">
            {STAR_LABELS[display]} ({display}/5)
          </span>
        )}
      </div>

      <div
        className="flex items-center gap-1.5 p-1 -ml-1 rounded-xl"
        onMouseLeave={() => setHovered(null)}
      >
        {([1, 2, 3, 4, 5] as const).map(star => {
          const isFilled = star <= display;
          return (
            <button
              key={star}
              type="button"
              onClick={(e) => handleSelect(star, e)}
              onMouseEnter={() => setHovered(star)}
              className="p-1.5 rounded-xl transition-all hover:scale-115 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 cursor-pointer"
              aria-label={`${star} star — ${STAR_LABELS[star]}`}
            >
              <Star
                size={28}
                className={`transition-all duration-150 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-500 drop-shadow-xs'
                    : 'fill-slate-100 text-slate-300 hover:text-amber-300 hover:fill-amber-100'
                }`}
              />
            </button>
          );
        })}
      </div>

      {error && (
        <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
          <span>⚠</span> Please select a rating (1 to 5 stars).
        </p>
      )}
    </div>
  );
};