// pages/profile/ContactButton.js
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ContactButton({ teacherName, contactInfo }) {
  const [showContact, setShowContact] = useState(false);

  const handleClick = async () => {
    if (!showContact) {
      setShowContact(true);

      // Increment click count
      const { data: record, error: countErr } = await supabaseClient
        .from('teachers')
        .select('click_count')
        .eq('name', teacherName)
        .single();

      if (!countErr && record) {
        await supabaseClient
          .from('teachers')
          .update({ click_count: (record.click_count || 0) + 1 })
          .eq('name', teacherName);
      }
    } else {
      setShowContact(false);
    }
  };

  return (
    <div className="flex flex-col items-start space-y-2">
      <button
        onClick={handleClick}
        className="contact-btn px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        {showContact ? '연락처 숨기기' : '연락처 보기'}
      </button>

      {showContact && (
        <div className="text-gray-800">
          {contactInfo ?? '정보 없음'}
        </div>
      )}
    </div>
  );
}
