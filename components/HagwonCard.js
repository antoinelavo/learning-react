import Image from 'next/image';
import { useState } from 'react';

export default function HagwonCard({ image, name, region, format, lessonType, ia_ee_tok, description, address, url, priority = false }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
        <div className="flex flex-wrap justify-between flex-row items-start">
          <div className="flex gap-[2em]">
            <div className="relative w-[3em] h-[3em]">
              {/* <Image
                src={image}
                alt={`${name} 로고`}
                width={48}
                height={48}
                priority={priority}
                className="rounded-lg shadow"
                style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
              /> */}
            </div>
            <div className="w-[11em]">
              <div className="text-[1.1em] font-bold mb-2 text-[#111]">{name}</div>
              <div className="text-sm text-gray-600">📍 {region}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-[20em]">
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

          <button
            className="border w-[6em] l-[2em] py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-semibold text-sm"
            onClick={() => setShowDetails(prev => !prev)}
          >
            {showDetails ? '접기' : '더보기'}
          </button>
        </div>

        {showDetails && (
          <div className="border-t pt-4 text-gray-600 w-full mt-[1em]">
            <p className="my-4 text-sm leading-[1.8em]">{description}</p>
            <p className="mb-4 text-sm leading-[1.8em]">주소: {address}</p>
            <div className="flex gap-3 flex-wrap">
              <button className="contact-btn px-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-900 flex items-center gap-2 hover:bg-gray-100 hover:border-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="icon" width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12.003 2C6.478 2 2 5.858 2 10.527c0 2.486 1.379 4.693 3.548 6.197l-1.13 3.7a.5.5 0 0 0 .702.599l4.285-2.104a12.24 12.24 0 0 0 2.598.278c5.523 0 10.003-3.858 10.003-8.527S17.526 2 12.003 2Z"/></svg>
                카카오톡
              </button>
              <a target="_blank" rel="noopener noreferrer" className="contact-btn px-4 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-900 hover:bg-gray-100 hover:border-gray-400">
                홈페이지
              </a>
            </div>
          </div>
        )}
      </div>
  );
}