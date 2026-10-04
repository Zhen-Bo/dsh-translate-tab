import clsx from 'clsx';
import {useRef, type CSSProperties} from 'react';

import type {EffortOption} from '../model-selection';

const THUMB_WIDTH_PX = 14;
const THUMB_INSET_PX = 3;
const TRACK_EDGE_INSET_PX = THUMB_WIDTH_PX / 2 + THUMB_INSET_PX;
const STEPS_BY_KEY: Record<string, number> = {
  ArrowLeft: -1,
  ArrowDown: -1,
  ArrowRight: 1,
  ArrowUp: 1,
  Home: -Infinity,
  End: Infinity,
};

interface SteppedSliderProps {
  options: EffortOption[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}

export function SteppedSlider({
  options,
  value,
  onChange,
  label,
}: SteppedSliderProps) {
  const track = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const lastIndex = options.length - 1;
  const index = Math.max(
    0,
    options.findIndex(option => option.id === value),
  );
  const positionOf = (i: number) => (lastIndex === 0 ? 0 : i / lastIndex);

  const choose = (i: number) => {
    const clamped = Math.min(lastIndex, Math.max(0, i));
    if (options[clamped].id !== value) {
      onChange(options[clamped].id);
    }
  };
  const chooseNearest = (clientX: number) => {
    if (!track.current || lastIndex === 0) {
      return;
    }
    const rect = track.current.getBoundingClientRect();
    const usableWidth = rect.width - TRACK_EDGE_INSET_PX * 2;
    const ratio = (clientX - rect.left - TRACK_EDGE_INSET_PX) / usableWidth;
    choose(Math.round(ratio * lastIndex));
  };
  const stopDragging = () => {
    dragging.current = false;
  };

  return (
    <div className="dtt-effort">
      <div className="dtt-effort-head">
        <span>{label}</span>
        <span key={value} className="dtt-effort-value">
          {options[index]?.label}
        </span>
      </div>
      <div
        ref={track}
        className="dtt-slider"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={lastIndex}
        aria-valuenow={index}
        aria-valuetext={options[index]?.label}
        style={
          {
            '--p': positionOf(index),
            '--thumb': `${THUMB_WIDTH_PX}px`,
            '--inset': `${THUMB_INSET_PX}px`,
          } as CSSProperties
        }
        onPointerDown={event => {
          dragging.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          chooseNearest(event.clientX);
        }}
        onPointerMove={event => {
          if (dragging.current) {
            chooseNearest(event.clientX);
          }
        }}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onKeyDown={event => {
          if (!(event.key in STEPS_BY_KEY)) {
            return;
          }
          // Inside a menu these keys would also move focus between items.
          event.preventDefault();
          event.stopPropagation();
          choose(index + STEPS_BY_KEY[event.key]);
        }}
      >
        <span className="dtt-slider-fill" aria-hidden="true" />
        {options.map((option, i) => (
          <span
            key={option.id}
            className={clsx('dtt-slider-dot', i <= index && 'is-past')}
            style={{'--d': positionOf(i)} as CSSProperties}
            aria-hidden="true"
          />
        ))}
        <span className="dtt-slider-thumb" aria-hidden="true" />
      </div>
      <div className="dtt-slider-ends" aria-hidden="true">
        <span>{options[0]?.label}</span>
        <span>{options[lastIndex]?.label}</span>
      </div>
    </div>
  );
}
