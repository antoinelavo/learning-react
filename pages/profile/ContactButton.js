// pages/profile/ContactButton.js
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui';

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ContactButton({ teacherName, contactInfo }) {
  const [showContact, setShowContact] = useState(false);

  const handleClick = async () => {
    if (!showContact) {
      setShowContact(true);

      // Increment click count (RPC; teachers is not directly writable).
      await supabaseClient.rpc('increment_teacher_click', { p_name: teacherName });
    } else {
      setShowContact(false);
    }
  };

  return (
    <div className="flex flex-col items-start space-y-2">
      <Button
        onClick={handleClick}
        size="sm" className="contact-btn"
      >
        {showContact ? '연락처 숨기기' : '연락처 보기'}
      </Button>

      {showContact && (
        <div className="text-gray-800">
          {contactInfo ?? '정보 없음'}
        </div>
      )}
    </div>
  );
}
