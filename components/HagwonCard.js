'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function getDeviceType() {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'mobile';
  if (/tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

async function logImpression(hagwonName) {
  if (typeof window === 'undefined') return;

  // Session ID
  const sessionId = localStorage.getItem('user_session_id') || crypto.randomUUID();
  localStorage.setItem('user_session_id', sessionId);

  // Only log once per hagwon
  const impressionKey = `impression-${hagwonName}`;
  if (localStorage.getItem(impressionKey)) return;
  localStorage.setItem(impressionKey, 'true');

  const { error } = await supabase.from('page_events').insert({
    page: 'hagwons',
    event_type: 'hagwon_impression',
    device_type: getDeviceType(),
    timestamp: new Date().toISOString(),
    user_session_id: sessionId,
    details: {
      action: 'card_impression',
      hagwon_name: hagwonName,
    },
  });

  if (error) {
    console.error('❌ Failed to insert impression event:', error);
  } else {
    console.log('👁️ Logged impression for:', hagwonName);
  }
}



async function logContactClick({ hagwonName, contactType }) {
  if (typeof window === 'undefined') return;


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

export default function HagwonCard({ image, name, region, format, lessonType, ia_ee_tok, description, address, url, kakaotalk, isFeatured, featuredReason, featuredPitch, youtubeId, courses, programs}) {
  const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect(); // Only trigger once
          await logImpression(name);
        }
      },
      { threshold: 0.4 } // Customize: % of card visible before logging
    );

    const cardElement = document.querySelector(`[data-hagwon-name="${name}"]`);
    if (cardElement) {
      observer.observe(cardElement);
    }

    return () => observer.disconnect();
  }, [name]);


  return (
      <div className={`bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 ${isFeatured ? 'border-2 border-blue-400 ring-1 ring-blue-100' : 'border border-gray-200'}`}
      data-hagwon-name = {name}
      >
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
              <div className="flex items-center gap-2">
                <a href={url} onClick={() => logContactClick({ hagwonName: name, contactType: 'Website' })}>
                  <h2 className="text-[1.1em] font-bold mb-2 text-[#111] m-0">{name}</h2>
                </a>
                {isFeatured && (
                  <span className="text-[0.65em] font-semibold px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full whitespace-nowrap mb-1.5">추천</span>
                )}
              </div>
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

            {/* Programs Timeline */}
            {programs && programs.length > 0 && (
              <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-gray-800 mb-3">수업 안내</h3>
                <div className="flex items-center gap-3">
                  {programs.map((program, i) => (
                    <div key={i} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-1 text-center rounded-lg border border-gray-200 bg-white p-3">
                        <p className="text-base font-bold text-gray-900 m-0 mb-1">{program.label}</p>
                        <p className="text-[0.7em] text-gray-500 m-0">{program.schedule}</p>
                      </div>
                      {i < programs.length - 1 && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="m9 18 6-6-6-6"/></svg>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Pitch */}
            {featuredPitch && (
              <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm font-bold text-gray-900 m-0 mb-2">{featuredPitch.hook}</p>
                <p className="text-sm text-gray-600 m-0 mb-2">{featuredPitch.body}</p>
                <ul className="list-disc pl-5 mb-2 space-y-1">
                  {featuredPitch.painPoints.map((point, i) => (
                    <li key={i} className="text-sm text-gray-600">{point}</li>
                  ))}
                </ul>
                <p className="text-sm font-semibold text-gray-800 m-0">{featuredPitch.conclusion}</p>
              </div>
            )}

            {/* YouTube Sample Lesson */}
            {youtubeId && (
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-800 mb-2">샘플 수업</h3>
                <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="샘플 수업"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Address */}
            <p className="mb-4 text-sm leading-[1.8em]">주소: {address}</p>

            {/* Contact Buttons */}
            <div className="flex gap-3 flex-wrap">
              <a className="cursor-pointer px-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-900 flex items-center gap-2 hover:bg-gray-100 hover:border-gray-400"
              onClick={() => logContactClick({ hagwonName: name, contactType: 'KakaoTalk' })}
              href="/hagwon-requests/new">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12.003 2C6.478 2 2 5.858 2 10.527c0 2.486 1.379 4.693 3.548 6.197l-1.13 3.7a.5.5 0 0 0 .702.599l4.285-2.104a12.24 12.24 0 0 0 2.598.278c5.523 0 10.003-3.858 10.003-8.527S17.526 2 12.003 2Z"/></svg>
                무료 상담하기
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