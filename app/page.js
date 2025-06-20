import Link from 'next/link';
import Image from 'next/image';


export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div
          id="heroSection"
          className="flex flex-row justify-center mx-auto bg-gradient-to-b from-[#32ade61a] to-gray-50 h-[60dvh]"
        >
          <div className="flex flex-col justify-center text-left px-6 text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2 text-balance leading-relaxed">IB 과외 무료 매칭 플랫폼</h1>
            <p className="text-l font-normal text-gray-500 leading-[2em] mb-6 text-balance">
              국내 유일 수수료 0원 과외 플랫폼
            </p>
            <div className="flex gap-4 justify-center md:justify-start">
              <Link href="/find" className="bg-blue-500 text-white px-2 sm:px-6 py-2 rounded-lg hover:bg-blue-600 transition">
                과외 찾기
              </Link>
              <Link href="/apply" className="border border-blue-500 text-blue-500 px-2 sm:px-6 py-2 rounded-lg bg-white hover:bg-blue-100 transition">
                선생님 등록하기
              </Link>
            </div>
          </div>

          <div
            id="heroSampleProfile"
            className="relative w-[600px] h-[500px] my-auto hidden md:block"
          >
              <Image
                src="/images/SampleProfiles.svg"
                alt="샘플 프로필"
                fill
                priority={false}
                placeholder="blur" 
                blurDataURL="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOs2fv/PwAHLgM5yEquVgAAAABJRU5ErkJggg=="
              />
          </div>
        </div>


      {/* Problem Quote */}
      <section id="problemQuote" className="max-w-4xl mx-auto px-4 py-32 text-left space-y-28">
          <p className="text-2xl font-bold leading-relaxed max-w-[22em] text-balance">
            비싼 과외비를 내면 좋은 수업을 받을 줄 알았는데,
            알고 보니 <span className="text-blue-500">수업료의 25%가 플랫폼</span>으로 간다고?
          </p>

        
          <p className="text-2xl font-bold text-right leading-relaxed text-balance">
            <span className="text-blue-500">플랫폼 수수료</span>를 내야하니,
            <span className="text-blue-500">수업료</span>를 더 받을까?
          </p>
        

        
          <p className="text-2xl font-bold text-left leading-relaxed text-balance">
            아무리 생각해도 수수료는 <span className="text-blue-500">부당해</span>!
          </p>
        
      </section>


      {/* Comparison Section */}
      <section id="comparison" className="pt-32">
        <p className="text-center text-gray-400 text-lg font-normal mb-[0.25em]">이러한 생각에서 시작된</p>
        <p className="text-center text-black text-2xl font-bold px-8 text-balance leading-relaxed">선생님이 만든, 선생님과 학생을 위한 플랫폼</p>
        <div id="comparisonBlocks" className="mt-16 flex flex-col md:flex-row justify-center gap-20 max-w-5xl mx-auto">
          {/* 타 플랫폼 */}
            <div className="flex flex-col gap-12 rounded-[2em] sm:rounded-[50px] p-8 shadow-[0_0_30px_rgba(0,0,0,0.1)] text-center mx-[10dvw] md:mx-0">
              <p className="text-[25px] font-bold text-gray-500">타 플랫폼</p>
              {[
                "수업료의 일부분을 플랫폼이 가져감",
                "등록 비용, 견적서 등 선생님에게 비용 발생",
                "IB 전문이 아님"
              ].map((id) => (
                <div key={id} className="flex flex-row gap-4 items-center text-left justify-start">
                  <svg width="40" height="40" className="flex-none">
                    <circle cx="20" cy="20" r="18" fill="#FF605D" fillOpacity="0.17" />
                    <line x1="12" y1="12" x2="28" y2="28" stroke="#FF605D" strokeWidth="3" strokeLinecap="round" />
                    <line x1="28" y1="12" x2="12" y2="28" stroke="#FF605D" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <p className="font-bold text-black md:max-w-[10em]">{text}</p>
                </div>
              ))}
            </div>

            {/* IB Master */}
            <div className="flex flex-col gap-12 rounded-[50px] p-8 shadow-[0_0_30px_rgba(0,0,0,0.1)] text-center mx-[10dvw] md:mx-0">
              <p className="text-[25px] font-bold text-black">
                <span>IB </span>
                <span className="text-blue-500">Master</span>
              </p>
              {[
                "수업료에서 중간 비용이 발생하지 않음",
                "그 어떤 비용도 없음",
                "IB 전문"
              ].map((text, i) => (
                <div key={i} className="flex flex-row gap-4 items-center text-left justify-start">
                  <svg width="40" height="40" className="flex-none">
                    <circle cx="20" cy="20" r="18" fill="#28A745" fillOpacity="0.17" />
                    <polyline
                      points="10,20 18,28 30,14"
                      stroke="#28A745"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                  <p className="font-bold text-black md:max-w-[10em]">{text}</p>
                </div>
              ))}
            </div>

        </div>
      </section>
      {/* FAQ Section */}
      <section className="max-w-3xl mx-auto my-[10dvh] px-4 py-24">
        <h2 className="text-3xl font-bold text-center text-black mb-10">FAQ</h2>

        <div className="space-y-4">
          <details className="group bg-gray-50 p-6 rounded-lg shadow-md">
            <summary className="cursor-pointer text-lg font-normal text-black group-open:text-blue-600 transition">
              프로필 게시 비용이 있나요?
            </summary>
            <p className="mt-2 text-gray-700 leading-relaxed">
              없습니다! <strong>IB Master</strong>는 100% 수수료, 이용료 0원 사이트입니다.
            </p>
          </details>

          <details className="group bg-gray-50 p-6 rounded-lg shadow-md">
            <summary className="cursor-pointer text-lg font-normal text-black group-open:text-blue-600 transition">
              IB 학원은 어떻게 찾나요?
            </summary>
            <p className="mt-2 text-gray-700 leading-relaxed">
              좋은 IB 전문 학원을 찾으려면 고급 정보를 가지고 많은 학원들을 비교해야 합니다.<br />
              <strong>IB Master</strong>는 국내 유수의 IB 학원을 한눈에 볼 수 있게 정리해 두었으니,{" "}
              <a href="/hagwons" className="text-blue-500 underline hover:text-blue-600">
                IB 학원 추천 페이지
              </a>
              에서 확인해 보세요.
            </p>
          </details>

          <details className="group bg-gray-50 p-6 rounded-lg shadow-md">
            <summary className="cursor-pointer text-lg font-normal text-black group-open:text-blue-600 transition">
              학생들에게 제 연락처를 공유해도 되나요?
            </summary>
            <p className="mt-2 text-gray-700 leading-relaxed">
              네! 선생님 프로필 하단에 <strong>연락처 입력란</strong>이 있습니다!
            </p>
          </details>
        </div>
      </section>

      {/* Text */}
      
      <section className="max-w-4xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-black mb-8">IB 과외란?</h2>
        <div className="space-y-6 text-m leading-8 text-gray-500">
          <p>
            IB 과외는 <strong>International Baccalaureate(IB)</strong> 과정을 이수하는 학생들을 위한 전문 수업입니다.
            일반 고등학교와는 다른 평가 체계, 프로젝트 기반 과제, 전 세계 공통 기준을 바탕으로 한 IB 커리큘럼은 고유한 학습 전략을 요구합니다.
          </p>
          <p>
            IB 과목마다 <strong>SL(Standard Level)</strong>과 <strong>HL(Higher Level)</strong>으로 나뉘어 있어 난이도와 범위가 다릅니다.
            이에 따라 과목별 맞춤 전략과 시험 대비법이 중요하며, 일반적인 과외보다는 <strong>IB 전문 과외</strong>가 요구됩니다.
          </p>
          <p>
            <strong>IB Master</strong>는 국내 유일의 <span className="text-blue-500 font-semibold">100% 수수료 없는 IB 과외 매칭 플랫폼</span>으로,
            IB 졸업생을 포함한 전문 선생님들과 학생들을 직접 연결합니다.
            각종 플랫폼의 수수료가 부당하다고 느껴 한 과외 선생님이 직접 만든 플랫폼으로,
            모든 학생과 과외 선생님이 비용 없이 만날 수 있는 미래를 실천합니다.
          </p>
        </div>
      </section>
      
      
      
      <section className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-black mb-8">IB 과외가 필요한 이유</h2>
        <div className="space-y-6 text-m leading-8 text-gray-500">
          <p>
            IB 커리큘럼은 일반 고등학교 수업과 다르게, 자체적인 평가 방식과 과제 중심 학습이 특징입니다.
            IA, EE, TOK 등 요소들이 성적에 큰 영향을 주며, 과목별로 HL/SL 난이도 구분이 있어 효과적인 대비가 필요합니다.
          </p>
          <p>
            따라서 일반적인 과외가 아닌, IB에 특화된 선생님이 제공하는 맞춤형 과외가 필수입니다.
            시험 대비는 물론, Internal Assessment, Extended Essay 작성까지 지원하는 과외를 통해 더 나은 성적을 기대할 수 있습니다.
          </p>
          <div className="text-center pt-4">
            <a
              href="/blog/about-ib"
              className="inline-block text-blue-500 hover:underline text-[15px] font-medium"
            >
              IB 교육과정에 대해 더보기 →
            </a>
          </div>
        </div>
      </section>
      

      
      <section className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-black mb-8">IB 과외 시급은 얼마인가요?</h2>
        <div className="space-y-6 text-m leading-8 text-gray-500">
          <p>
            IB 과외 시급은 선생님의 경력, 과목 난이도, 수업 방식(온라인/오프라인), 지역에 따라 다르지만,
            평균적으로 시간당 <strong>4만 원에서 10만 원 사이</strong>로 형성되어 있습니다.
            특히 HL 과목이나 영어 네이티브 수업은 시급이 더 높을 수 있습니다.
          </p>
          <p>
            <strong>IB Master</strong>에서는 중개 수수료가 없기 때문에,
            다른 플랫폼과 달리 <strong>숨은 비용이 발생하지 않습니다.</strong>
            선생님과 학생이 직접 소통하고 조건을 조율할 수 있어,
            더 합리적인 시급으로 고퀄리티 과외를 받을 수 있습니다.
          </p>
          <div className="text-center pt-4">
            <a
              href="/blog/private-lesson-cost"
              className="inline-block text-blue-500 hover:underline text-[15px] font-medium"
            >
              시급에 대해 더보기 →
            </a>
          </div>
        </div>
      </section>
      



      {/* Registration CTA */}
      <section className="flex flex-col sm:flex-row justify-center items-center gap-8 px-4 py-20 bg-gradient-to-t from-[#32ade61a] to-gray-50 h-[60dvh]">
        <Link href="/login" className="no-underline">
          <div className="w-[80dvw] h-[10em] sm:w-[15em] sm:h-[15em] bg-blue-300/80 rounded-2xl flex flex-col items-center justify-center text-center transform transition-transform duration-300 hover:scale-105">
            <p className="text-base text-black">회원 가입하고</p>
            <p className="text-2xl font-bold text-black">과외 선생님 찾기</p>
          </div>
        </Link>
        <Link href="/apply" className="no-underline">
          <div className="w-[80dvw] h-[10em] sm:w-[15em] sm:h-[15em] bg-blue-300/30 rounded-2xl flex flex-col items-center justify-center text-center transform transition-transform duration-300 hover:scale-105">
            <p className="text-base text-black">프로필 작성하고</p>
            <p className="text-2xl font-bold text-black">선생님 등록하기</p>
          </div>
        </Link>
      </section>
    </div>
  );
}