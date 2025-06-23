// app/profile/[...name]/ContactButton.client.jsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client in the browser
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ContactButton({ teacherName }) {
  const [showContact, setShowContact] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const router = useRouter();

  const handleClick = async () => {
    // Check auth state
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    if (!showContact) {
      setShowContact(true);

      // Fetch and display the actual contact info
      const { data: fetched, error: fetchErr } = await supabase
        .from('teachers')
        .select('contact_information')
        .eq('name', teacherName)
        .single();

      if (!fetchErr && fetched?.contact_information) {
        setContactInfo(fetched.contact_information);
      }

      // Increment click count
      const { data: record, error: countErr } = await supabase
        .from('teachers')
        .select('click_count')
        .eq('name', teacherName)
        .single();

      if (!countErr && record) {
        const newCount = (record.click_count || 0) + 1;
        await supabase
          .from('teachers')
          .update({ click_count: newCount })
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
