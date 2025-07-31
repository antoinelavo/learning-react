'use client';

import { useState, useEffect } from 'react';

export default function FeedbackPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [otherText, setOtherText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 45000); // 45 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleCheckboxChange = (option) => {
    setSelectedOptions(prev => 
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        selectedOptions,
        otherText
      }),
    });

    if (response.ok) {
      alert('의견이 성공적으로 전송되었습니다. 진심으로 감사드립니다!');
      setIsVisible(false);
    } else {
      alert('전송 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  } catch (error) {
    console.error('Submit error:', error);
    alert('전송 중 오류가 발생했습니다. 다시 시도해주세요.');
  }
};

  if (!isVisible) return null;

  const checkboxOptions = [
    '학원비/수강료 정보',
    '강사 자격/경력 정보', 
    '학생 후기/평점',
    '시험 성과/합격률',
    '무료 샘플 수업 가능 여부'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* Popup content */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          aria-label="닫기"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2 pr-8">
            더 나은 서비스를 위해 도움을 주세요!
          </h2>
          <p className="text-gray-600 mb-6">
            학원 선택에 어떤 정보가 더 필요하신가요?
          </p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-3 mb-6">
              {checkboxOptions.map((option) => (
                <label 
                  key={option}
                  className="flex items-center space-x-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option)}
                    onChange={() => handleCheckboxChange(option)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {option}
                  </span>
                </label>
              ))}
            </div>

            {/* Other text input */}
            <div className="mb-6">
              <label htmlFor="other-feedback" className="block text-sm font-medium text-gray-700 mb-2">
                기타 의견:
              </label>
              <textarea
                id="other-feedback"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
                placeholder="추가로 필요한 정보나 의견을 자유롭게 적어주세요..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="3"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              의견 보내기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}