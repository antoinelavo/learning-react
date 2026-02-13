'use client';

import { useEffect, useState } from 'react';
import { supabase, getUserRole, getTeacherStatus } from '@/lib/supabase';
import Link from 'next/link';
import HagwonNewsletterPopup from '@/components/HagwonNewsletterPopup';

export default function HagwonRequestsPageClient() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [role, setRole] = useState(null);
  const [teacherStatus, setTeacherStatus] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [newStatus, setNewStatus] = useState('OPEN');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showFeedbackQuestion, setShowFeedbackQuestion] = useState(false);
  const [viewedListings, setViewedListings] = useState(new Set());
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    async function loadRequests() {
      setLoading(true);
      setError('');

      const { data, error: dbError } = await supabase
        .from('hagwon_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Sort OPEN listings before CLOSED, then by creation date
      const sortedData = data?.sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === 'OPEN' ? -1 : 1;
      });

      if (dbError) {
        console.error('Error loading hagwon requests:', dbError);
        setError('학원 요청을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
        return;
      }

      setRequests(sortedData || []);
      setLoading(false);
    }

    loadRequests();
  }, []);

  useEffect(() => {
    async function loadRole() {
      try {
        const userRole = await getUserRole();
        setRole(userRole);

        if (userRole === 'teacher') {
          const status = await getTeacherStatus();
          setTeacherStatus(status);
        }
      } catch (err) {
        console.error('Error checking user role:', err);
        setRole(null);
        setTeacherStatus(null);
      }
    }

    loadRole();
  }, []);

  const toggleRequestExpansion = async (requestId) => {
    const willExpand = expandedRequestId !== requestId;
    setExpandedRequestId(willExpand ? requestId : null);

    // Track view if expanding and user is approved teacher and hasn't viewed this listing yet
    if (willExpand && role === 'teacher' && teacherStatus === 'approved' && !viewedListings.has(requestId)) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error: viewError } = await supabase
          .from('hagwon_request_views')
          .insert({
            hagwon_request_id: requestId,
            teacher_user_id: user.id,
          });

        if (!viewError || viewError.code === '23505') {
          if (!viewError) {
            await supabase.rpc('increment_hagwon_views_count', { request_id: requestId });
          }
          setViewedListings(prev => new Set(prev).add(requestId));
        }
      } catch (err) {
        console.error('Error tracking view:', err);
      }
    }
  };

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function handleVerifyPassword() {
    if (!passwordInput.trim()) {
      setModalError('비밀번호를 입력해 주세요.');
      return;
    }

    const request = requests.find(r => r.id === editingRequestId);
    if (!request || !request.edit_password_hash) {
      setModalError('비밀번호를 확인할 수 없습니다.');
      return;
    }

    const enteredHash = await hashPassword(passwordInput.trim());

    if (enteredHash !== request.edit_password_hash) {
      setModalError('비밀번호가 올바르지 않습니다.');
      return;
    }

    setPasswordVerified(true);
    setNewStatus(request.status);
    setModalError('');
  }

  async function handleSaveStatus() {
    setSaving(true);
    setModalError('');

    const request = requests.find(r => r.id === editingRequestId);
    const isChangingToClosed = request?.status === 'OPEN' && newStatus === 'CLOSED';

    try {
      const { error: updateError } = await supabase
        .from('hagwon_requests')
        .update({ status: newStatus })
        .eq('id', editingRequestId);

      if (updateError) {
        console.error('Error updating status:', updateError);
        setModalError('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        setSaving(false);
        return;
      }

      setRequests(prev =>
        prev.map(r => r.id === editingRequestId ? { ...r, status: newStatus } : r)
      );

      setSaving(false);

      if (isChangingToClosed) {
        setPasswordVerified(false);
        setShowFeedbackQuestion(true);
      } else {
        closeModal();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setModalError('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setSaving(false);
    }
  }

  async function handleFeedbackSubmit(answer) {
    try {
      const { error: updateError } = await supabase
        .from('hagwon_requests')
        .update({ found_hagwon_through_platform: answer })
        .eq('id', editingRequestId);

      if (updateError) {
        console.error('Error saving feedback:', updateError);
      }

      setRequests(prev =>
        prev.map(r => r.id === editingRequestId ? { ...r, found_hagwon_through_platform: answer } : r)
      );
    } catch (err) {
      console.error('Error saving feedback:', err);
    }

    closeModal();
  }

  function closeModal() {
    setShowPasswordModal(false);
    setPasswordInput('');
    setEditingRequestId(null);
    setPasswordVerified(false);
    setNewStatus('OPEN');
    setModalError('');
    setShowFeedbackQuestion(false);
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-8 mb-[50dvh]">
      <section className="bg-white border border-gray-200 rounded-xl shadow-md p-4 sm:p-6 mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1">학원 요청 게시판</h1>
          <p className="text-sm text-gray-600">
            학생/학부모님께서 올린 학원 요청글을 확인하고, 직접 연락해 보세요.
          </p>
          <p className="text-sm text-gray-400">
            ( 오래된 게시글은 자동 삭제됩니다 )
          </p>
        </div>
        <div className="shrink-0">
          <Link
            href="/hagwon-requests/new"
            className="inline-flex items-center px-4 py-2 rounded-md text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            학원 요청글 작성하기
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold">최근 학원 요청</h2>
          <span className="text-xs text-gray-500">총 {requests.length}건</span>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 mb-3">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-gray-600">학원 요청을 불러오는 중입니다…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-600">
            아직 등록된 학원 요청이 없습니다. 상단의 &quot;요청하기&quot; 버튼을 눌러 첫 번째 글을 올려보세요!
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map(request => {
              const isExpanded = expandedRequestId === request.id;
              const isApprovedTeacher = role === 'teacher' && teacherStatus === 'approved';
              const canViewContact = isApprovedTeacher && request.status === 'OPEN';

              // Parse program types
              const programTypes = Array.isArray(request.program_type)
                ? request.program_type
                : [];

              return (
                <div
                  key={request.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden transition-shadow hover:shadow-md"
                >
                  <button
                    onClick={() => toggleRequestExpansion(request.id)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm sm:text-base font-semibold line-clamp-1">
                        {Array.isArray(request.title) ? request.title.join(' · ') : request.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        {request.status === 'OPEN' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-700 border border-green-300 animate-pulse shadow-sm shadow-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            모집중
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                            마감
                          </span>
                        )}
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {/* Program type pills */}
                      {programTypes.map((type, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-purple-50 text-purple-700 border border-purple-100"
                        >
                          {type === 'both' ? 'IB + SAT' : type}
                        </span>
                      ))}

                      {/* Subject pills */}
                      {request.ib_subjects && request.ib_subjects.split(', ').map((subj, idx) => (
                        <span
                          key={`ib-${idx}`}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-100"
                        >
                          {subj}
                        </span>
                      ))}

                      {request.sat_subjects && request.sat_subjects.split(', ').map((subj, idx) => (
                        <span
                          key={`sat-${idx}`}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-orange-50 text-orange-700 border border-orange-100"
                        >
                          SAT {subj}
                        </span>
                      ))}

                      {/* Level pill */}
                      {request.level && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-gray-50 text-gray-700 border border-gray-200">
                          {request.level}
                        </span>
                      )}

                      {/* Hourly rate pill */}
                      {request.hourly_rate_min && request.hourly_rate_max && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-100">
                          {request.hourly_rate_min}-{request.hourly_rate_max}만원/1달
                        </span>
                      )}

                      {/* Format pill */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-gray-50 text-gray-700 border border-gray-200">
                        {request.format === 'online'
                          ? '온라인'
                          : request.format === 'offline'
                          ? `대면${request.region ? ` · ${request.region}` : ''}`
                          : `대면/온라인${request.region ? ` · ${request.region}` : ''}`}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold mb-1">요청 내용</h4>
                        <p className="whitespace-pre-wrap text-sm text-gray-500">
                          {request.description}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-1">수업 방식</h4>
                        <p className="text-sm text-gray-500">
                          {request.format === 'online'
                            ? '온라인'
                            : request.format === 'offline'
                            ? '대면'
                            : '대면/온라인 모두 가능'}
                          {request.region && (request.format === 'offline' || request.format === 'either') && (
                            <span className="text-gray-500"> · {request.region}</span>
                          )}
                        </p>
                      </div>

                      {request.hourly_rate_min && request.hourly_rate_max && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">희망 수업료</h4>
                          <p className="text-sm text-gray-500">
                            {request.hourly_rate_min}만원 ~ {request.hourly_rate_max}만원/1달
                          </p>
                        </div>
                      )}

                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-semibold mb-2">학생 연락처</h4>
                        {!canViewContact ? (
                          <div className="bg-white border border-dashed border-gray-300 rounded-md px-4 py-3">
                            <p className="text-sm text-gray-600 text-center mb-0">
                              {request.status === 'CLOSED' ? (
                                <>
                                  이 요청은 <span className="font-bold text-gray-700">마감되었습니다</span>. 마감된 요청의 연락처는 확인할 수 없습니다.
                                </>
                              ) : !isApprovedTeacher ? (
                                <>
                                  학생의 연락처는{' '}
                                  <span className="font-bold text-blue-700">프로필이 검증된 학원 관계자분만</span> 확인할 수 있습니다.
                                </>
                              ) : null}
                            </p>
                            {request.status !== 'CLOSED' && !isApprovedTeacher && (
                              <button
                                onClick={() => setShowContactModal(true)}
                                className="block w-full text-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors mt-3"
                              >
                                학원 관계자 등록하기
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1 text-sm text-gray-800 rounded-md p-3">
                            <p>
                              <span className="font-medium">이메일:</span>{' '}
                              <a href={`mailto:${request.email}`} className="text-blue-600 hover:underline">
                                {request.email}
                              </a>
                            </p>
                            {request.kakao_contact && (
                              <p>
                                <span className="font-medium">카카오톡:</span>{' '}
                                <a
                                  href={request.kakao_contact.startsWith('http') ? request.kakao_contact : undefined}
                                  className="text-blue-600 hover:underline break-all"
                                >
                                  {request.kakao_contact}
                                </a>
                              </p>
                            )}
                            <p className="text-xs text-gray-500 pt-1">
                              위 연락처는 학생이 직접 입력한 정보이며, 연락 시 예의를 지켜주시고 스팸/광고성 메시지는 자제해 주세요. 학생분께서 신고시, 계정 이용에 제한이 있을 수 있습니다.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Edit button */}
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRequestId(request.id);
                            setShowPasswordModal(true);
                          }}
                          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition"
                        >
                          이 글 편집하기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {showFeedbackQuestion ? (
              /* Feedback Question Step */
              <>
                <h3 className="text-lg font-semibold mb-4">학원을 찾으셨나요?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  저희 플랫폼을 통해 학원을 찾으셨다면 알려주세요!
                </p>

                <div className="space-y-2 mb-4">
                  <button
                    type="button"
                    onClick={() => handleFeedbackSubmit(true)}
                    className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <span className="font-medium">네, 찾았어요!</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeedbackSubmit(false)}
                    className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition"
                  >
                    <span className="font-medium">아니요</span>
                  </button>
                </div>

                <button
                  onClick={closeModal}
                  className="w-full px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  건너뛰기
                </button>
              </>
            ) : !passwordVerified ? (
              /* Password Entry Step */
              <>
                <h3 className="text-lg font-semibold mb-4">비밀번호 입력</h3>
                <p className="text-sm text-gray-600 mb-4">
                  이 글을 수정하려면 작성 시 설정한 비밀번호를 입력해주세요.
                </p>

                {modalError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 mb-3">
                    {modalError}
                  </p>
                )}

                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="비밀번호"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyPassword();
                    }
                  }}
                />

                <div className="flex gap-2">
                  <button
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleVerifyPassword}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    확인
                  </button>
                </div>
              </>
            ) : (
              /* Status Edit Step */
              <>
                <h3 className="text-lg font-semibold mb-4">상태 변경</h3>

                {modalError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2 mb-3">
                    {modalError}
                  </p>
                )}

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">모집 상태를 변경하세요:</p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setNewStatus('OPEN')}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                        newStatus === 'OPEN'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          newStatus === 'OPEN' ? 'border-green-500' : 'border-gray-300'
                        }`}>
                          {newStatus === 'OPEN' && (
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                          )}
                        </div>
                        <span className="font-medium">모집중</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewStatus('CLOSED')}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                        newStatus === 'CLOSED'
                          ? 'border-gray-500 bg-gray-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          newStatus === 'CLOSED' ? 'border-gray-500' : 'border-gray-300'
                        }`}>
                          {newStatus === 'CLOSED' && (
                            <div className="w-2 h-2 rounded-full bg-gray-500" />
                          )}
                        </div>
                        <span className="font-medium">마감</span>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={closeModal}
                    disabled={saving}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveStatus}
                    disabled={saving}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? '저장 중...' : '저장하기'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowContactModal(false)}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-auto">
            {/* Close button */}
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-semibold mb-4">학원 관계자 등록</h3>
            <p className="text-sm text-gray-600 mb-4">
              학원 관계자 등록을 원하시면 아래 이메일로 연락해 주세요.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
              <a
                href="mailto:eugenepark912@gmail.com"
                className="text-blue-600 hover:text-blue-700 font-medium text-base"
              >
                eugenepark912@gmail.com
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Hagwon Newsletter Popup */}
      <HagwonNewsletterPopup />
    </main>
  );
}
