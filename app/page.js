'use client';

import { useState } from 'react';
import ReviewPage from './reviewpage';
import EngineTrain from './enginetrain';

export default function Home() {
  const [currentMenu, setCurrentMenu] = useState('홈');

  const menus = [
    { id: 'review-with-engine', name: '엔진과 복기' },
    { id: 'review-alone', name: '혼자서 복기' },
    { id: 'class', name: '클래스' },
    { id: 'engine-training', name: '엔진 트레이닝' },
    { id: 'premium', name: '어시스턴트 프리미엄' }
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white select-none">
      {/* 🌐 상단 네비게이션 바 */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentMenu('홈')}>
          <span className="text-2xl">👑</span>
          <span className="text-xl font-black tracking-wider text-cyan-400 font-mono">ChessAssistant</span>
        </div>
        
        <div className="flex space-x-1">
          {menus.map((menu) => (
            <button
              key={menu.id}
              onClick={() => setCurrentMenu(menu.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                currentMenu === menu.id
                  ? 'bg-cyan-500 text-gray-950 shadow-lg font-black'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {menu.name}
            </button>
          ))}
        </div>
      </nav>

      {/* 🖥️ 선택한 메뉴에 따른 동적 컨텐츠 렌더링 구역 */}
      <main className="p-6 max-w-6xl mx-auto">
        {currentMenu === '홈' && (
          <div className="text-center py-20 space-y-4">
            <h2 className="text-4xl font-black text-gray-100">체스 실력 향상의 지름길</h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              ChessAssistant에 오신 것을 환영합니다. 상단 메뉴를 선택하여 정밀 엔진 분석 및 자가대국 훈련을 시작하세요.
            </p>
            <div className="pt-6 grid grid-cols-2 md:grid-cols-5 gap-3 max-w-3xl mx-auto">
              {menus.map((menu) => (
                <div 
                  key={menu.id} 
                  onClick={() => setCurrentMenu(menu.id)}
                  className="bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-cyan-500/50 cursor-pointer transition text-center space-y-2"
                >
                  <div className="text-lg">⚡</div>
                  <div className="text-xs font-bold">{menu.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 메뉴 연동 분기 */}
        {currentMenu === 'review-with-engine' && <ReviewPage />}
        {currentMenu === 'engine-training' && <EngineTrain />}

        {/* 미구현 탭들 더미 플레이스홀더 */}
        {currentMenu === 'review-alone' && (
          <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold text-amber-400">♟️ 혼자서 복기 모드</h3>
            <p className="text-gray-400 text-xs mt-2">엔진 도움 없이 기보를 넘기며 스스로 최선의 수를 찾아보는 공간입니다.</p>
          </div>
        )}

        {currentMenu === 'class' && (
          <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold text-amber-400">📚 체스 클래스</h3>
            <p className="text-gray-400 text-xs mt-2">체스 전술 및 오프닝 강의, 포지션별 퀴즈를 푸는 공간입니다.</p>
          </div>
        )}

        {currentMenu === 'premium' && (
          <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold text-amber-400">💎 어시스턴트 프리미엄</h3>
            <p className="text-gray-400 text-xs mt-2">더 깊은 엔진 분석 depth 및 초정밀 NNUE 버전을 제공하는 구독 안내 페이지입니다.</p>
          </div>
        )}
      </main>
    </div>
  );
}
