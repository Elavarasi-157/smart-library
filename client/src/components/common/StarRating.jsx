import React, { useState } from 'react';
import { Star } from 'lucide-react';

export function StarRating({ rating = 0, totalStars = 5, size = 'sm', interactive = false, onRatingChange, showScore = false, reviewCount = null }) {
  const [hoverRating, setHoverRating] = useState(0);

  const starSizes = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const currentScore = hoverRating || rating || 0;

  return (
    <div className="inline-flex items-center gap-1">
      {showScore && (
        <span className="text-xs font-bold text-amber-500 dark:text-amber-400 mr-0.5">
          {Number(rating).toFixed(1)}
        </span>
      )}

      <div className="flex items-center">
        {[...Array(totalStars)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= currentScore;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRatingChange && onRatingChange(starValue)}
              onMouseEnter={() => interactive && setHoverRating(starValue)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform p-0.5' : 'cursor-default'} text-slate-300 dark:text-slate-600 focus:outline-none`}
            >
              <Star
                className={`${starSizes[size] || starSizes.sm} ${
                  isFilled ? 'fill-amber-500 text-amber-500' : 'fill-slate-200 dark:fill-slate-700 text-slate-300 dark:text-slate-600'
                }`}
              />
            </button>
          );
        })}
      </div>

      {reviewCount !== null && (
        <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1">
          ({reviewCount} reviews)
        </span>
      )}
    </div>
  );
}
