'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import RequestBoardHeader from '@/components/RequestBoardHeader';
import HagwonNewsletterPopup from '@/components/HagwonNewsletterPopup';
import { Input, Button, choiceClasses, cardClasses, Badge, Notice } from '@/components/ui';

export default function HagwonRequestsPageClient() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const { user, role } = useAuth();
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

  // role now comes from useAuth() context

  const toggleRequestExpansion = async (requestId) => {
    const willExpand = expandedRequestId !== requestId;
    setExpandedRequestId(willExpand ? requestId : null);

    // Track view if expanding and user is a hagwon account and hasn't viewed this listing yet
    if (willExpand && role === 'hagwon' && !viewedListings.has(requestId)) {
      try {
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
      <RequestBoardHeader
        title="학원 요청 게시판"
        description="학생/학부모님께서 올린 학원 요청글을 확인하고 직접 연락해 보세요."
        writeHref="/hagwon-requests/new"
        writeLabel="학원 요청글 작성하기"
      />

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-semibold">최근 학원 요청</h2>
          <span className="text-xs text-gray-500">오래된 글은 자동 삭제 · 총 {requests.length}건</span>
        </div>

        {error && (
          <Notice color="red" compact className="mb-3">
            {error}
          </Notice>
        )}

        {loading ? (
          <p className="text-sm text-gray-600">학원 요청을 불러오는 중입니다…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-600">
            아직 등록된 학원 요청이 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map(request => {
              const isExpanded = expandedRequestId === request.id;
              const isHagwon = role === 'hagwon';
              const canViewContact = isHagwon && request.status === 'OPEN';

              // Parse program types
              const programTypes = Array.isArray(request.program_type)
                ? request.program_type
                : [];

              return (
                <div
                  key={request.id}
                  className={cardClasses({ className: 'overflow-hidden transition-shadow hover:shadow-md' })}
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
                          <Badge color="green" className="animate-pulse shadow-sm shadow-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            모집중
                          </Badge>
                        ) : (
                          <Badge color="gray">
                            마감
                          </Badge>
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
                        <Badge color="purple" key={idx}>
                          {type === 'both' ? 'IB + SAT' : type}
                        </Badge>
                      ))}

                      {/* Subject pills */}
                      {request.ib_subjects && request.ib_subjects.split(', ').map((subj, idx) => (
                        <Badge color="blue" key={`ib-${idx}`}>
                          {subj}
                        </Badge>
                      ))}

                      {request.sat_subjects && request.sat_subjects.split(', ').map((subj, idx) => (
                        <Badge color="orange" key={`sat-${idx}`}>
                          SAT {subj}
                        </Badge>
                      ))}

                      {/* Level pill */}
                      {request.level && (
                        <Badge color="gray">
                          {request.level}
                        </Badge>
                      )}

                      {/* Hourly rate pill */}
                      {request.hourly_rate_min && request.hourly_rate_max && (
                        <Badge color="blue">
                          {request.hourly_rate_min}-{request.hourly_rate_max}만원/1달
                        </Badge>
                      )}

                      {/* Format pill */}
                      <Badge color="gray">
                        {request.format === 'online'
                          ? '온라인'
                          : request.format === 'offline'
                          ? `대면${request.region ? ` · ${request.region}` : ''}`
                          : `대면/온라인${request.region ? ` · ${request.region}` : ''}`}
                      </Badge>
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
                              ) : !isHagwon ? (
                                <>
                                  학생의 연락처는{' '}
                                  <span className="font-bold text-blue-700">등록된 학원 계정만</span> 확인할 수 있습니다.
                                </>
                              ) : null}
                            </p>
                            {request.status !== 'CLOSED' && !isHagwon && (
                              <Button
                                onClick={() => setShowContactModal(true)}
                                fullWidth className="mt-3"
                              >
                                학원 관계자 등록하기
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3 text-sm text-gray-800 rounded-md p-3">
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
                            {request.created_at && (
                              <p>
                                <span className="font-medium">작성일:</span>{' '}
                                <span className="text-gray-600">
                                  {new Date(request.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
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
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRequestId(request.id);
                            setShowPasswordModal(true);
                          }}
                          variant="secondary" fullWidth
                        >
                          이 글 편집하기
                        </Button>
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
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
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
                    className={choiceClasses({ className: 'w-full px-4 py-3 hover:border-blue-500 hover:bg-blue-50' })}
                  >
                    <span className="font-medium">네, 찾았어요!</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFeedbackSubmit(false)}
                    className={choiceClasses({ className: 'w-full px-4 py-3' })}
                  >
                    <span className="font-medium">아니요</span>
                  </button>
                </div>

                <Button
                  onClick={closeModal}
                  variant="ghost" fullWidth
                >
                  건너뛰기
                </Button>
              </>
            ) : !passwordVerified ? (
              /* Password Entry Step */
              <>
                <h3 className="text-lg font-semibold mb-4">비밀번호 입력</h3>
                <p className="text-sm text-gray-600 mb-4">
                  이 글을 수정하려면 작성 시 설정한 비밀번호를 입력해주세요.
                </p>

                {modalError && (
                  <Notice color="red" compact className="mb-3">
                    {modalError}
                  </Notice>
                )}

                <Input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="비밀번호"
                  className="mb-4"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyPassword();
                    }
                  }}
                />

                <div className="flex gap-2">
                  <Button
                    onClick={closeModal}
                    variant="secondary" className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleVerifyPassword}
                    className="flex-1"
                  >
                    확인
                  </Button>
                </div>
              </>
            ) : (
              /* Status Edit Step */
              <>
                <h3 className="text-lg font-semibold mb-4">상태 변경</h3>

                {modalError && (
                  <Notice color="red" compact className="mb-3">
                    {modalError}
                  </Notice>
                )}

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">모집 상태를 변경하세요:</p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setNewStatus('OPEN')}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition ${
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
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition ${
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
                  <Button
                    onClick={closeModal}
                    disabled={saving}
                    variant="secondary" className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSaveStatus}
                    disabled={saving}
                    className="flex-1"
                  >
                    {saving ? '저장 중...' : '저장하기'}
                  </Button>
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
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto">
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
            <Notice color="blue" className="text-center">
              <a
                href="mailto:eugenepark912@gmail.com"
                className="text-blue-600 hover:text-blue-700 font-medium text-base"
              >
                eugenepark912@gmail.com
              </a>
            </Notice>
          </div>
        </div>
      )}

      {/* Hagwon Newsletter Popup */}
      <HagwonNewsletterPopup />
    </main>
  );
}
