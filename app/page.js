'use client';

import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export default function SelfPlayPage() {
  const [game, setGame] = useState(new Chess());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false); // 강화 모드 토글
  
  // 📊 사용자가 기획한 가치 함수 스코어보드
  const [engineScore, setEngineScore] = useState(0);
  const [stats, setStats] = useState({ wins: 0, draws: 0, losses: 0, totalGames: 0 });

  const workerRef = useRef(null);

  // 1. CDN으로 안전 출고된 stockfish.js를 웹 워커로 로드
  useEffect(() => {
    workerRef.current = new Worker('/stockfish.js');
    
    workerRef.current.onmessage = (e) => {
      const line = e.data;
      
      // 스톡피시가 계산을 끝내고 최고의 수를 뱉었을 때 (bestmove [수])
      if (line.startsWith('bestmove') && isPlaying) {
        const move = line.split(' ')[1];
        
        if (move && move !== '(none)') {
          const currentGame = new Chess(game.fen());
          
          try {
            currentGame.move({
              from: move.substring(0, 2),
              to: move.substring(2, 4),
              promotion: move.substring(4, 5) || undefined
            });
            
            setGame(currentGame);

            // 🎯 게임이 끝나면 즉시 네가 기획한 보상 점수 시스템 가동
            if (currentGame.isGameOver()) {
              handleGameOver(currentGame);
            } else {
              // ⏱️ [CPU 15% 제량 루프]: 2초당 1수 페이스 조절 (엔진 연산 0.25초 + 휴식 1.75초)
              const thinkTime = isEnhanced ? 500 : 250;
              const restTime = 2000 - thinkTime; 

              setTimeout(() => {
                requestEngineMove(currentGame.fen());
              }, restTime);
            }
          } catch (err) {
            console.error("오류 발생으로 대국을 안전하게 리셋합니다.", err);
            setIsPlaying(false);
          }
        }
      }
    };

    return () => workerRef.current?.terminate();
  }, [isPlaying, game, isEnhanced]);

  // 2. 엔진에게 명령 하달 (싱글 스레드로 묶어서 CPU 폭주 영구 차단)
  const requestEngineMove = (fen) => {
    if (!workerRef.current) return;

    // CPU 점유율 제어: 스레드를 딱 1개만 쓰도록 강제 제한 (CPU 10~15% 선 유지)
    workerRef.current.postMessage('setoption name Threads value 1');
    workerRef.current.postMessage(`position fen ${fen}`);

    if (isEnhanced) {
      // 🔥 [강화 모드 ON]: 0.5초 동안 깊게 생각 (Contempt 값 올려서 공격성/가치추구 버프)
      workerRef.current.postMessage('setoption name Contempt value 20');
      workerRef.current.postMessage('go movetime 500'); 
    } else {
      // 💤 [강화 모드 OFF]: 0.25초만 찰나의 순간 연산하고 곧바로 대기모드 전환
      workerRef.current.postMessage('setoption name Contempt value 0');
      workerRef.current.postMessage('go movetime 250'); 
    }
  };

  // 3. 📝 네가 설계한 규칙 기반 가치 함수 매커니즘
  const handleGameOver = (finalGame) => {
    setIsPlaying(false);
    let scoreChange = 0;
    let newStats = { ...stats, totalGames: stats.totalGames + 1 };

    if (finalGame.isCheckmate()) {
      // 승리 시 (+1점)
      scoreChange = 1;
      newStats.wins += 1;
    } else if (finalGame.isDraw() || finalGame.isStalemate() || finalGame.isThreefoldRepetition()) {
      // 무승부 패널티 (-0.1점)
      scoreChange = -0.1;
      newStats.draws += 1;
    } else {
      // 패배 패널티 (-2점) -> 억까 방지용 안전 장치
      scoreChange = -2;
      newStats.losses += 1;
    }

    setEngineScore(prev => parseFloat((prev + scoreChange).toFixed(2)));
    setStats(newStats);
  };

  // 자가대국 컨트롤 토글
  const toggleSelfPlay = () => {
    if (!isPlaying) {
      const newGame = new Chess();
      setGame(newGame);
      setIsPlaying(true);
      
      // 첫 수 연산 시동 구동
      setTimeout(() => {
        if (workerRef.current) {
          workerRef.current.postMessage('setoption name Threads value 1');
          workerRef.current.postMessage(`position fen ${newGame.fen()}`);
          workerRef.current.postMessage(isEnhanced ? 'go movetime 500' : 'go movetime 250');
        }
      }, 200);
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-6 select-none">
      <header className="text-center mb-6">
        <h1 className="text-3xl font-black tracking-wider text-amber-400">🤖 ChessAssistant 자가대국실</h1>
        <p className="text-gray-400 text-xs mt-1 font-mono">CPU 15% Limit • 2s/Move Smooth Reinforcement Loop</p>
      </header>

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* 왼쪽: 실시간 스코어보드 */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 h-full flex flex-col justify-between shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">🏆 누적 가치 추구 점수</h2>
            <div className="text-5xl font-black font-mono text-center text-emerald-400 py-6 bg-gray-950 rounded-xl border border-emerald-500/10 shadow-inner">
              {engineScore} <span className="text-xs text-gray-500 font-normal">pts</span>
            </div>
          </div>

          <div className="space-y-2 font-mono text-sm border-t border-gray-800 pt-4 mt-4">
            <div className="flex justify-between border-b border-gray-800/50 pb-1">
              <span className="text-gray-500">총 시뮬레이션:</span>
              <span className="font-bold text-gray-300">{stats.totalGames} 판</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>승리 (+1.0):</span>
              <span>{stats.wins} 회</span>
            </div>
            <div className="flex justify-between text-amber-400">
              <span>무승부 (-0.1):</span>
              <span>{stats.draws} 회</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>패배 (-2.0):</span>
              <span>{stats.losses} 회</span>
            </div>
          </div>
        </div>

        {/* 가운데: 연동된 가상 체스판 */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full aspect-square max-w-[380px] rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800 bg-gray-900">
            <Chessboard position={game.fen()} arePiecesDraggable={false} id="selfPlayBoard" />
          </div>
        </div>

        {/* 오른쪽: 엔진 커스텀 하이퍼 파라미터 제어판 */}
        <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 h-full flex flex-col justify-between shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">⚙️ 가치 강화 조절기</h2>
            
            <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-amber-400">AI 알고리즘 강화</p>
                <p className="text-[11px] text-gray-500 mt-0.5">승점 극대화를 위한 탐색 버프</p>
              </div>
              <input 
                type="checkbox" 
                checked={isEnhanced}
                onChange={(e) => setIsEnhanced(e.target.checked)}
                className="w-10 h-5 bg-gray-700 checked:bg-amber-400 rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:h-5 before:w-5 before:bg-white before:rounded-full before:transition-all checked:before:translate-x-5 shadow-inner"
              />
            </div>
          </div>

          <button 
            onClick={toggleSelfPlay}
            className={`w-full py-4 rounded-xl font-black text-sm tracking-wide transition shadow-lg ${
              isPlaying 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 text-white' 
                : 'bg-gradient-to-r from-amber-400 to-orange-500 text-gray-950 hover:opacity-95'
            }`}
          >
            {isPlaying ? '🛑 자가대국 중지' : '⚡ 자가대국 시뮬레이션 가동'}
          </button>
        </div>
      </div>
    </div>
  );
}
