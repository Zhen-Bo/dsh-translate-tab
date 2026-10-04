import {useEffect, useRef, useState} from 'react';

const MIN_CHARS_PER_FRAME = 2;
const BACKLOG_SHARE_PER_FRAME = 1 / 8;

const isHighSurrogate = (code: number) => code >= 0xd800 && code <= 0xdbff;

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** Providers reply in a few big bursts, so ease toward the text instead. */
export function useTypewriterReveal(text: string) {
  const [revealedLength, setRevealedLength] = useState(text.length);
  const previousText = useRef(text);
  const revealed = useRef(text.length);

  useEffect(() => {
    const isAppend = text.startsWith(
      previousText.current.slice(0, revealed.current),
    );
    if (!isAppend || prefersReducedMotion()) {
      revealed.current = text.length;
    }
    previousText.current = text;
    if (revealed.current >= text.length) {
      revealed.current = text.length;
      setRevealedLength(text.length);
      return;
    }

    let frame = 0;
    const revealNextChunk = () => {
      const backlog = text.length - revealed.current;
      if (backlog <= 0) {
        return;
      }
      const step = Math.max(
        MIN_CHARS_PER_FRAME,
        Math.ceil(backlog * BACKLOG_SHARE_PER_FRAME),
      );
      let next = revealed.current + step;
      if (isHighSurrogate(text.charCodeAt(next - 1))) {
        next++;
      }
      revealed.current = Math.min(next, text.length);
      setRevealedLength(revealed.current);
      frame = requestAnimationFrame(revealNextChunk);
    };
    frame = requestAnimationFrame(revealNextChunk);
    return () => cancelAnimationFrame(frame);
  }, [text]);

  return text.slice(0, Math.min(revealedLength, text.length));
}
