export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md h-[80dvh]">
        <h1 className="text-4xl font-bold mb-4 text-center mb-16">소개</h1>
        <p className="text-gray-700 leading-relaxed mb-6 m-[2em]">
            안녕하세요, 성균관대학교 의과대학 21학번 박유진입니다.<br></br><br></br>

            저는 지난 4년간 과외 선생님으로 활동했습니다. 제가 학생들과 만나기 위해 사용해본 사이트들은 전부 아쉬운 점이 한가지씩 있었습니다. 수수료를 받거나, IB 전문이 아니라서 정보가 부족하거나, 사이트가 사용하기 불편했습니다.<br></br><br></br>

            그래서 IB Master를 만들었습니다. 이 사이트는 "무료 · 편리 · 자유"를 가장 중요한 가치들로 여깁니다. 학생과 선생님이 쉽게 만날 수 있도록 수수료를 받지 않고, 필요한 정보만 게시하며, 사이트가 아닌 카카오톡이나 이메일을 통해 소통하도록 합니다.<br></br><br></br>

            이 사이트의 목표는 누구나 손쉽게 사용할 수 있는 IB 관련 종합 포털이 되는 것입니다.<br></br><br></br>

            모든 학생이 IB Diploma에서 원하는 결과를 받을 수 있도록 조금이나마 도움이 되고자 합니다.​​<br></br><br></br>

            *현재 사이트는 사비로 운영되고 있습니다.<br></br>
            **선생님의 신원은 사용자(학생·학부모)가 검증해야합니다.<br></br><br></br>
                        
            후원 계좌: {process.env.NEXT_PUBLIC_BANK_ACCOUNT} {process.env.NEXT_PUBLIC_BANK_HOLDER}<br></br><br></br>
        </p>
        </div>
    </main>
  );
}
