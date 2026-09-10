'use client';

import { useRef } from 'react';

// Deliberately isolated from MessageThread and uncontrolled (no
// value/onChange React state) so that typing only re-renders this leaf
// component — not the entire thread (message list + teacher summary
// card). Re-rendering that whole tree on every keystroke was the likely
// cause of iOS Safari's keyboard losing sync with the input after a few
// characters.
export default function ChatInputBar({ onSend, disabled }) {
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value || disabled) return;
    inputRef.current.value = '';
    onSend(value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-gray-100">
      <input
        ref={inputRef}
        type="text"
        defaultValue=""
        placeholder="메시지를 입력하세요..."
        className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-full bg-blue-500 text-white text-sm font-medium hover:bg-blue-600"
      >
        전송
      </button>
    </form>
  );
}
