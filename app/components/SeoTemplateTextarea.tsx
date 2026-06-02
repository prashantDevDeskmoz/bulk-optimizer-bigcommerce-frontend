"use client";

import {
  useCallback,
  useRef,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
  type TextareaHTMLAttributes,
} from "react";

const TOKEN_PATTERN = /\[\[[^\]]+\]\]/g;

type TokenRange = {
  start: number;
  end: number;
  token: string;
};

function getTokenRanges(text: string): TokenRange[] {
  return [...text.matchAll(TOKEN_PATTERN)].map((match) => ({
    start: match.index ?? 0,
    end: (match.index ?? 0) + match[0].length,
    token: match[0],
  }));
}

function getInteriorToken(text: string, index: number): TokenRange | null {
  for (const range of getTokenRanges(text)) {
    if (index > range.start && index < range.end) {
      return range;
    }
  }
  return null;
}

function snapPosition(text: string, index: number): number {
  const interior = getInteriorToken(text, index);
  if (!interior) return index;

  const toStart = index - interior.start;
  const toEnd = interior.end - index;
  return toStart <= toEnd ? interior.start : interior.end;
}

function snapSelection(el: HTMLTextAreaElement, text: string) {
  const start = snapPosition(text, el.selectionStart ?? 0);
  const end = snapPosition(text, el.selectionEnd ?? 0);
  if (start !== el.selectionStart || end !== el.selectionEnd) {
    el.setSelectionRange(start, end);
  }
}

function removeToken(text: string, range: TokenRange): string {
  return text.slice(0, range.start) + text.slice(range.end);
}

function editPreservesTokens(previous: string, next: string): boolean {
  const previousTokens = getTokenRanges(previous);

  for (const { token } of previousTokens) {
    if (next.includes(token)) continue;

    const inner = token.slice(2, -2);
    if (inner && next.includes(inner)) {
      return false;
    }
  }

  for (const match of next.matchAll(/\[\[/g)) {
    const from = match.index ?? 0;
    const slice = next.slice(from);
    const full = slice.match(/^\[\[[^\]]+\]\]/);
    if (!full) {
      return false;
    }
  }

  return true;
}

type SeoTemplateTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  placeholder?: string;
  className?: string;
} & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange" | "ref" | "className" | "placeholder" | "rows"
>;

export default function SeoTemplateTextarea({
  value,
  onChange,
  textareaRef,
  placeholder,
  className = "",
  ...rest
}: SeoTemplateTextareaProps) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = textareaRef ?? localRef;

  const applySelectionSnap = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    snapSelection(el, value);
  }, [inputRef, value]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const next = event.target.value;
      if (next === value) return;

      if (!editPreservesTokens(value, next)) {
        event.target.value = value;
        requestAnimationFrame(() => {
          const el = inputRef.current;
          if (!el) return;
          snapSelection(el, value);
        });
        return;
      }

      onChange(next);
    },
    [inputRef, onChange, value],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      const el = inputRef.current;
      if (!el) return;

      const selectionStart = el.selectionStart ?? 0;
      const selectionEnd = el.selectionEnd ?? 0;
      const hasSelection = selectionStart !== selectionEnd;

      if (hasSelection) {
        if (event.key === "Backspace" || event.key === "Delete") {
          for (const range of getTokenRanges(value)) {
            const overlaps =
              selectionStart < range.end && selectionEnd > range.start;
            const partial =
              overlaps &&
              (selectionStart > range.start || selectionEnd < range.end);
            if (partial) {
              event.preventDefault();
              onChange(removeToken(value, range));
              requestAnimationFrame(() => {
                el.focus();
                el.setSelectionRange(range.start, range.start);
              });
              return;
            }
          }
        }
        return;
      }

      const cursor = selectionStart;
      const interior = getInteriorToken(value, cursor);

      if (event.key === "Backspace") {
        for (const range of getTokenRanges(value)) {
          if (
            cursor === range.end ||
            (cursor > range.start && cursor < range.end)
          ) {
            event.preventDefault();
            onChange(removeToken(value, range));
            requestAnimationFrame(() => {
              el.focus();
              el.setSelectionRange(range.start, range.start);
            });
            return;
          }
        }
        return;
      }

      if (event.key === "Delete") {
        for (const range of getTokenRanges(value)) {
          if (
            cursor === range.start ||
            (cursor > range.start && cursor < range.end)
          ) {
            event.preventDefault();
            onChange(removeToken(value, range));
            requestAnimationFrame(() => {
              el.focus();
              el.setSelectionRange(range.start, range.start);
            });
            return;
          }
        }
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        if (interior) {
          event.preventDefault();
          const nextPos =
            event.key === "ArrowLeft" ? interior.start : interior.end;
          el.setSelectionRange(nextPos, nextPos);
        }
        return;
      }

      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (interior) {
          event.preventDefault();
          applySelectionSnap();
        }
      }
    },
    [applySelectionSnap, inputRef, onChange, value],
  );

  const handlePointerUp = useCallback(
    (event: MouseEvent<HTMLTextAreaElement>) => {
      requestAnimationFrame(() => snapSelection(event.currentTarget, value));
    },
    [value],
  );

  return (
    <textarea
      ref={inputRef}
      value={value}
      spellCheck={false}
      placeholder={placeholder}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onClick={handlePointerUp}
      onSelect={applySelectionSnap}
      onKeyUp={applySelectionSnap}
      className={`form-control bg-[#FDFDFD] border-[#8A8A8A] h-[80px] w-full`}
      {...rest}
    />
  );
}
