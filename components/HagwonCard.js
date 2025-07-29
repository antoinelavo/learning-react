'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

function getDeviceType() {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

async function isIncognito() {
  if (typeof navigator.storage?.estimate === 'function') {
    try {
      const { quota } = await navigator.storage.estimate();
      // In incognito mode, quota is usually very small (<120MB)
      return quota < 120 * 1024 * 1024;
    } catch (e) {
      return false;
    }
  }
  return false;
}


async function logContactClick({ hagwonName, contactType }) {
  if (typeof window === 'undefined') return;

  const incognito = await isIncognito();
  if (incognito) {
    console.log('🕵️ Skipping log: user is in incognito mode');
    return;
  }

  // Generate or retrieve session ID (shared across tabs)
  const sessionId = localStorage.getItem('user_session_id') || crypto.randomUUID();
  localStorage.setItem('user_session_id', sessionId);

  // Only log once per session per hagwon+contactType combo
  const clickedKey = `clicked-${hagwonName}-${contactType}`;
  if (localStorage.getItem(clickedKey)) return;
  localStorage.setItem(clickedKey, 'true');

  const { error } = await supabase.from('page_events').insert({
    page: 'hagwons',
    event_type: 'cta_click',
    device_type: getDeviceType(),
    timestamp: new Date().toISOString(),
    user_session_id: sessionId,
    details: {
      action: 'contact_click',
      hagwon_name: hagwonName,
      contact_type: contactType,
    },
  });

  if (error) {
    console.error('❌ Failed to insert page_event:', error);
  } else {
    console.log('✅ Tracked contact click:', { hagwonName, contactType });
  }
}

export default function HagwonCard({ image, name, region, format, lessonType, ia_ee_tok, description, address, url, kakaotalk}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ">
        <div className="flex flex-wrap justify-between flex-row items-start gap-y-[1em] sm:gap-y-[2em]">
          {/* Image */}
          <div className="flex gap-[2em]">
            <a href={url} onClick={() => logContactClick({ hagwonName: name, contactType: 'Website' })}>
              <div className="relative w-[3em] h-[3em] md:w-[3em] md:h-[3em]">
                <img
                  src={image}
                  alt={`${name} 로고`}
                  width={48}
                  height={48}
                  loading="lazy"
                  style={{ borderRadius: '8px' }}
                />
              </div>
            </a>

            {/* Name and Region */}
            <div className="w-fill md:w-[11em]">
              <a href={url} onClick={() => logContactClick({ hagwonName: name, contactType: 'Website' })}>
                <h2 className="text-[1.1em] font-bold mb-2 text-[#111] m-0">{name}</h2>
              </a>
              <p className="text-sm text-gray-600 m-0">📍 {region}</p>
            </div>
          </div>

          {/* Truncated Description */}
          <div className="sm:flex-1 sm:mx-[2em] my-auto">
            {!showDetails && (
              <p className="text-sm text-gray-800 leading-relaxed line-clamp-2 my-auto">
                {description}
              </p>
            )}
          </div>


          {/* Show More Button */}
          <button onClick={() => setShowDetails(prev => !prev)} className="hidden sm:block my-auto" >
            {showDetails ? 
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up-icon lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>
            :
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
            }
          </button>
        </div>

        {showDetails && (
          <div className="pt-4 text-gray-600 w-full mt-[1em]">
            {/* Subjects */}
            <div className="gap-2 w-[20em] flex flex-wrap">
              {[...format, ...lessonType].map((tag, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1.5 bg-[#e9f3ff] text-[#216eb3] rounded-full leading-none"
                >
                  {tag}
                </span>
              ))}
              {ia_ee_tok && ['IA', 'EE', 'TOK'].map((tag, i) => (
                <span
                  key={`core-${i}`}
                  className="text-xs px-2 py-1.5 bg-[#ffe9ff] text-[#b321b1] rounded-full leading-none"
                >
                  {tag}
                </span>
              ))}
            </div>
            
            {/* Description */}
            <p className="my-4 text-sm leading-[1.8em]">{description}</p>

            {/* Address */}
            <p className="mb-4 text-sm leading-[1.8em]">주소: {address}</p>

            {/* Contact Buttons */}
            <div className="flex gap-3 flex-wrap">
              <a className="cursor-pointer px-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-900 flex items-center gap-2 hover:bg-gray-100 hover:border-gray-400"
              onClick={() => logContactClick({ hagwonName: name, contactType: 'KakaoTalk' })}
              href={kakaotalk}>
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12.003 2C6.478 2 2 5.858 2 10.527c0 2.486 1.379 4.693 3.548 6.197l-1.13 3.7a.5.5 0 0 0 .702.599l4.285-2.104a12.24 12.24 0 0 0 2.598.278c5.523 0 10.003-3.858 10.003-8.527S17.526 2 12.003 2Z"/></svg>
                카카오톡
              </a>
              <a target="_blank" rel="noopener noreferrer" className="cursor-pointer px-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-100 hover:border-gray-400"
              onClick={() => logContactClick({ hagwonName: name, contactType: 'Website' })}
              href={url}>
                홈페이지
              </a>
            </div>
          </div>
        )}

          {/* Show More Button Mobile */}
          <button onClick={() => setShowDetails(prev => !prev)} className="block sm:hidden mt-[1em] mx-auto" >
            {showDetails ? 
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-up-icon lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>
            :
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-down-icon lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>
            }
          </button>
      </div>
  );
}