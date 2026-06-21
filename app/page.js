'use client';

import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export default function SelfPlayPage() {
  const [game, setGame] = useState(new Chess());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false); // 강화 옵션 토글
  
  // 📊 실시간 강화학습 승점 스코어 보드
  const [engineScore, setEngineScore] = useState(0);
  const [stats, setStats] = useState({ wins: 0, draws: 0, losses: 0, totalGames: 0 });

  const workerRef = useRef(null);

  // 1. 깃허브 액션이 구워준 수제 스톡피시 로드
  useEffect(() => {
    workerRef.current = new Worker('/stockfish.js');
    
    workerRef.current.onmessage = (e) => {
      const line = e.data;
      
      if (line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        if (move && move !== '(none)' && isPlaying) {
          const currentGame = new Chess(game.fen());
          
          try {
            currentGame.move({
              from: move.substring(0, 2),
              to: move.substring(2, 4),
              promotion: move.substring(4, 5) || undefined
            });
            
            setGame(currentGame);

            // 게임이 끝났는지 확인 -> 끝났으면 보상 점수 계산
            if (currentGame.isGameOver()) {
              handleGameOver(currentGame);
            } else {
              // 게임이 안 끝났으면 다음 턴 엔진에게 전달 (0.2초 딜레이로 시각 효과)
              setTimeout(() => {
                requestEngineMove(currentGame.fen());
              }, 200);
            }
          } catch (err) {
            console.error("오류 발생, 대국을 리셋합니다.", err);
            setIsPlaying(false);
          }
        }
      }
    };

    return () => workerRef.current?.terminate();
  }, [isPlaying, game, isEnhanced]);

  // 2. 엔진에게 다음 수 요청 (강화 옵션 반영)
  const requestEngineMove = (fen) => {
    if (!workerRef.current) return;

    workerRef.current.postMessage(`position fen ${fen}`);

    if (isEnhanced) {
      // 🔥 [강화 옵션 ON]: 공격성을 극대화하고 더 깊은 수(Depth)를 보게 세팅
      workerRef.current.postMessage('setoption name Contempt value 20'); // 무승부 기피, 승리 추구
      workerRef.current.postMessage('setoption name Skill Level value 20'); // 마스터 레벨
      workerRef.current.postMessage('go depth 12'); // 탐색 깊이 버프
    } else {
      // 💤 [강화 옵션 OFF]: 일반 경량화 모드 (빠른 연산)
      workerRef.current.postMessage('setoption name Contempt value 0');
      workerRef.current.postMessage('setoption name Skill Level value 5'); 
      workerRef.current.postMessage('go movetime 150'); // 0.15초만 생각
    }
  };

  // 3. 🎯 사용자가 설계한 규칙대로 승점 계산하는 로직
  const handleGameOver = (finalGame) => {
    setIsPlaying(false);
    let scoreChange = 0;
    let newStats = { ...stats, totalGames: stats.totalGames + 1 };

    if (finalGame.isCheckmate()) {
      // 누군가 이김 (마지막에 수를 둔 진영이 승리)
      scoreChange = 1;
      newStats.wins += 1;
    } else if (finalGame.isDraw() || finalGame.isStalemate() || finalGame.isThreefoldRepetition()) {
      // 비김 (무승부 패널티 -0.1)
      scoreChange = -0.1;
      newStats.draws += 1;
    } else {
      // 기물 부족이나 기타 패배 상황 가정 (패배 패널티 -2)
      scoreChange = -2;
      newStats.losses += 1;
    }

    setEngineScore(prev => parseFloat((prev + scoreChange).toFixed(2)));
    setStats(newStats);
  };

  // 자가대국 시작 버튼 클릭
  const toggleSelfPlay = () => {
    if (!isPlaying) {
      const newGame = new Chess(); // 새 게임 시작
      setGame(newGame);
      setIsPlaying(true);
      
      // 첫 수 트리거 구동
      setTimeout(() => {
        if (workerRef.current) {
          workerRef.current.postMessage(`position fen ${newGame.fen()}`);
          workerRef.current.postMessage('go movetime 150');
        }
      }, 100);
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-6">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-black text-amber-400">🤖 커스텀 스톡피시 자가대국실</h1>
        <p className="text-gray-400 text-sm mt-1">내가 설계한 보상 규칙 시스템 기반 강화 루프</p>
      </header>

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 왼쪽 패널: 스코어보드 */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-300 mb-4">🏆 누적 강화 점수</h2>
            <div className="text-5xl font-black font-mono text-center text-emerald-400 my-6 bg-gray-950 py-4 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              {engineScore} <span className="text-xs text-gray-500 font-normal">pts</span>
            </div>
          </div>

          <div className="space-y-2 font-mono text-sm border-t border-gray-800 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-400">총 대국 수:</span>
              <span className="font-bold">{stats.totalGames} 판</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>승리 (+1.0):</span>
              <span>{stats.wins} 회</span>
            </div>
            <div className="flex justify-between text-amber-400">
              <span>무승부 (-0.1):</span>
              <span>{stats.draws} 회</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>패배 (-2.0):</span>
              <span>{stats.losses} 회</span>
            </div>
          </div>
        </div>

        {/* 가운데 패널: 체스판 */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full aspect-square max-w-[400px] rounded-xl overflow-hidden shadow-2xl border-4 border-gray-800">
            <Chessboard position={game.fen()} arePiecesDraggable={false} />
          </div>
        </div>

        {/* 오른쪽 패널: 엔진 컨트롤 제어판 */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-300 mb-4">⚙️ 제어 인디케이터</h2>
            
            {/* 강화 모드 스위치 */}
            <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-amber-400">AI 알고리즘 강화</p>
                <p className="text-[11px] text-gray-500 mt-0.5">ON 시 연산력 및 가치 추구 증폭</p>
              </div>
              <input 
                type="checkbox" 
                checked={isEnhanced}
                onChange={(e) => setIsEnhanced(e.target.checked)}
                className="w-10 h-5 bg-gray-700 checked:bg-amber-400 rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:h-5 before:w-5 before:bg-white before:rounded-full before:transition-all checked:before:translate-x-5"
              />
            </div>
          </div>

          <button 
            onClick={toggleSelfPlay}
            className={`w-full py-4 rounded-xl font-black text-sm tracking-wide transition shadow-md ${
              isPlaying 
                ? 'bg-red-600 hover:bg-red-500 text-white' 
                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-gray-950 hover:opacity-90'
            }`}
          >
            {isPlaying ? '🛑 자가대국 중지하기' : '⚡ 자가대국 강화 시뮬레이션 시작'}
          </button>
        </div>
      </div>
    </div>
  );
}
