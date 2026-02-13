'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if user has already dismissed or subscribed
    const isDismissed = localStorage.getItem('newsletterDismissed');
    const hasSubscribed = localStorage.getItem('newsletterSubscribed');

    if (!isDismissed && !hasSubscribed) {
      // Show popup after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  async function handleSubscribe(e) {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('이메일을 입력해주세요.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('유효한 이메일 주소를 입력해주세요.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .insert({ email: email.trim().toLowerCase() });

      if (error) {
        // Check if email already exists
        if (error.code === '23505') {
          setErrorMessage('이미 구독 중인 이메일입니다.');
        } else {
          setErrorMessage('오류가 발생했습니다. 다시 시도해주세요.');
        }
        setStatus('error');
        return;
      }

      setStatus('success');
      localStorage.setItem('newsletterSubscribed', 'true');

      // Hide after 2 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      setErrorMessage('오류가 발생했습니다. 다시 시도해주세요.');
      setStatus('error');
    }
  }

  function handleDismiss() {
    setIsVisible(false);
    localStorage.setItem('newsletterDismissed', Date.now().toString());
  }

  if (!isVisible) return null;

  return (
    <>
      {/* Popup - Full width bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-white border-t border-gray-200 shadow-2xl">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 transition"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {status === 'success' ? (
              <div className="text-center py-2">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">구독 완료!</h3>
                    <p className="text-sm text-gray-600">새 학생 요청이 올라오면 이메일로 알려드릴게요.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-3">
                {/* Left side - Text */}
                <div className="flex-shrink-0 pr-8 sm:pr-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                    새 학생 요청 알림 받기
                  </h3>
                  <p className="text-sm text-gray-600">
                    하루에 한 번, 새로운 학생 요청글을 이메일로 알려드립니다.
                  </p>
                </div>

                {/* Right side - Form */}
                <form onSubmit={handleSubscribe} className="flex-1 flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일 주소 입력"
                      disabled={status === 'loading'}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    />
                    {errorMessage && (
                      <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {status === 'loading' ? '구독 중...' : '구독하기'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
