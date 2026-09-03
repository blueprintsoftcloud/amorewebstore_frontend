// src/components/PriceRangeSlider.tsx
// Dual-thumb price range slider — two overlapping native <input type="range"> elements
// (the standard no-library technique for a two-handle slider) rather than a single
// range input, since a plain <input type="range"> only ever has one thumb. Each input
// is pointer-events-none except for its own thumb (via CSS below), so they don't fight
// each other for drag events despite occupying the same box.
//
// Controlled purely by [min, max] props — no internal "committed" state — the caller
// (CategoryProductPage.tsx) owns whether changes apply live or are staged behind an
// Apply button.

import React from "react";

interface Props {
  bounds: { min: number; max: number };
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatValue?: (n: number) => string;
}

const defaultFormat = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const PriceRangeSlider: React.FC<Props> = ({ bounds, value, onChange, formatValue = defaultFormat }) => {
  const { min: boundMin, max: boundMax } = bounds;
  const [selectedMin, selectedMax] = value;
  const span = Math.max(boundMax - boundMin, 1);

  const pctMin = ((selectedMin - boundMin) / span) * 100;
  const pctMax = ((selectedMax - boundMin) / span) * 100;

  const handleMinChange = (raw: number) => {
    const next = Math.min(raw, selectedMax);
    onChange([next, selectedMax]);
  };

  const handleMaxChange = (raw: number) => {
    const next = Math.max(raw, selectedMin);
    onChange([selectedMin, next]);
  };

  if (boundMax <= boundMin) return null;

  return (
    <div>
      <div className="relative h-5 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-200" />
        {/* Selected range fill */}
        <div
          className="absolute h-1.5 rounded-full bg-gray-900"
          style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
        />
        <input
          type="range"
          min={boundMin}
          max={boundMax}
          value={selectedMin}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          className="range-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none"
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={boundMin}
          max={boundMax}
          value={selectedMax}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          className="range-thumb absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none"
          aria-label="Maximum price"
        />
      </div>

      <div className="flex items-center justify-between mt-3 text-xs font-semibold text-gray-700">
        <span className="px-2.5 py-1 rounded-lg bg-gray-100">{formatValue(selectedMin)}</span>
        <span className="text-gray-300">to</span>
        <span className="px-2.5 py-1 rounded-lg bg-gray-100">
          {selectedMax >= boundMax ? `${formatValue(selectedMax)}+` : formatValue(selectedMax)}
        </span>
      </div>

      {/* Thumb styling lives here rather than a global stylesheet — it's specific to
          this one component and keeping it colocated avoids a growing global CSS file
          for every one-off widget. Each thumb re-enables pointer-events on itself only,
          so the two overlapping inputs' tracks don't intercept each other's drags. */}
      <style>{`
        .range-thumb::-webkit-slider-thumb {
          appearance: none;
          pointer-events: auto;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #111827;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          cursor: pointer;
          margin-top: 0;
        }
        .range-thumb::-moz-range-thumb {
          pointer-events: auto;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #111827;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          cursor: pointer;
        }
        .range-thumb::-webkit-slider-runnable-track { background: transparent; }
        .range-thumb::-moz-range-track { background: transparent; }
      `}</style>
    </div>
  );
};

export default PriceRangeSlider;
