'use client';

export default function PremiumPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">🚀 레이팅 상승 치트키</h1>
        <p className="text-gray-600">틀린 문제를 저장하고 복습하는 유저만이 상위 1%로 올라갑니다.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 max-w-4xl w-full">
        {/* 무료 요금제 */}
        <div className="flex-1 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-gray-800 mb-2">일반 회원</h3>
          <p className="text-gray-400 text-sm mb-4">단순 복기 기능만 필요한 유저</p>
          <div className="text-3xl font-black text-gray-900 mb-6">₩0 <span className="text-sm font-normal text-gray-400">/ 평생 무료</span></div>
          <ul className="text-sm text-gray-600 space-y-3 mb-8📦">
            <li>✅ Stockfish 15 엔진 실시간 복기</li>
            <li>✅ 엔진 탐색 깊이 제한 (Depth 15)</li>
            <li>❌ 악수(Blunder) 자동 추출 오답노트 무제한 저장</li>
            <li>❌ 전술 복습용 인터랙티브 퍼즐 변환 기능</li>
          </ul>
          <button className="w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl mt-auto" disabled>현재 적용 중</button>
        </div>

        {/* 프리미엄 요금제 */}
        <div className="flex-1 bg-gradient-to-b from-gray-950 to-gray-800 p-8 rounded-2xl shadow-xl flex flex-col text-white transform scale-105 border-2 border-amber-400">
          <div className="bg-amber-400 text-gray-900 font-black text-xs px-3 py-1 rounded-full self-start mb-2">PRO CHOICE</div>
          <h3 className="text-xl font-bold mb-2">오답노트 프로 마스터</h3>
          <p className="text-gray-400 text-sm mb-4">확실하게 점수를 올릴 플레이어</p>
          <div className="text-3xl font-black mb-6">₩14,900 <span className="text-sm font-normal text-gray-400">/ 월 구독</span></div>
          <ul className="text-sm text-gray-300 space-y-3 mb-8">
            <li>✅ Stockfish 프로 엔진 정밀 분석 (Depth 22 업그레이드)</li>
            <li>✅ <b>블런더 국면 무제한 오답노트 보관함 개설</b></li>
            <li>✅ <b>내가 틀린 판 기반 맞춤형 전술 퀴즈(퍼즐) 무제한 생성</b></li>
            <li>✅ 기기 제한 없는 클라우드 실시간 동기화</li>
          </ul>
          <button 
            onClick={() => alert('토스페이먼츠 / 포트원 결제창 연동 구역입니다.')}
            className="w-full py-3 bg-amber-400 text-gray-900 font-black rounded-xl hover:bg-amber-300 transition shadow-lg shadow-amber-400/20 mt-auto"
          >
            오답노트 프로 구독하기
          </button>
        </div>
      </div>
    </div>
  );
}
