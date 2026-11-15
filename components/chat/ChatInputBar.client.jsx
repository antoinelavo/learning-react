'use client';

import { useRef } from 'react';
import { Input, Button } from '@/components/ui';

// Deliberately isolated from MessageThread and uncontrolled (no
// value/onChange React state) so that typing only re-renders this leaf
// component — not the entire thread (message list + teacher summary
// card). Re-rendering that whole tree on every keystroke was the likely
// cause of iOS Safari's keyboard losing sync with the input after a few
// characters.
export default function ChatInputBar({ onSend, disabled }) {
  const inputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const input = inputRef.current;
    const value = input?.value.trim();
    if (!value || disabled) return;
    input.value = '';
    const ok = await onSend(value);
    // Put the text back on failure, unless the user already typed again.
    if (!ok && inputRef.current && !inputRef.current.value) {
      inputRef.current.value = value;
    }
  };

  // Korean (and other IME) input: the Enter that commits a composed syllable
  // must not also submit, or the message goes out early and the leftover
  // syllable is sent again as a second message (Chrome). Only isComposing is
  // checked, not keyCode 229: Safari (incl. iOS) reports 229 on the
  // committing Enter with isComposing false, and blocking it there would make
  // the send key look broken.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.nativeEvent.isComposing) {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-gray-100">
      <Input
        ref={inputRef}
        type="text"
        defaultValue=""
        placeholder="메시지를 입력하세요..."
        onKeyDown={handleKeyDown}
        enterKeyHint="send"
        // text-base (16px), not text-sm (14px): iOS Safari auto-zooms the
        // whole page on focusing any input with a font-size under 16px —
        // that zoom is what revealed background content and shifted the
        // 전송 button, not an actual layout bug.
        className="flex-1 min-w-0"
      />
      <Button type="submit" disabled={disabled}>
        전송
      </Button>
    </form>
  );
}
