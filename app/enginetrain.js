'use client';

import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export default function EngineTrain() {
  const [game, setGame] = useState(new Chess());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  
  const [engineScore, setEngineScore] = useState(0);
  const [stats, setStats] = useState({ wins: 0, draws: 0, losses: 0, totalGames: 0 });

  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker('/stockfish.js');
    
    workerRef.current.onmessage = (e) => {
      const line = e.data;
      
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

            if (currentGame.isGameOver()) {
              handleGameOver(currentGame);
            } else {
              const thinkTime = isEnhanced ? 500 : 250;
              const restTime = 2000 - thinkTime; 

              setTimeout(() => {
                requestEngineMove(currentGame.fen());
              }, restTime);
            }
          } catch (err) {
            setIsPlaying(false);
          }
        }
      }
    };

    return () => workerRef.current?.terminate();
  }, [isPlaying, game, isEnhanced]);

  const requestEngineMove = (fen) => {
    if (!workerRef.current) return;
    workerRef.current.postMessage('setoption name Threads value 1');
    workerRef.current.postMessage(`position fen ${fen}`);

    if (isEnhanced) {
      workerRef.current.postMessage('setoption name Contempt value 20');
      workerRef.current.postMessage('go movetime 500'); 
    } else {
      workerRef.current.postMessage('setoption name Contempt value 0');
      workerRef.current.postMessage('go movetime 250'); 
    }
  };

  const handleGameOver = (finalGame) => {
    setIsPlaying(false);
    let scoreChange = 0;
    let newStats = { ...stats, totalGames: stats.totalGames + 1 };

    if (finalGame.isCheckmate()) {
      scoreChange = 1;
      newStats.wins += 1;
    } else if (finalGame.isDraw() || finalGame.isStalemate()) {
      scoreChange = -0.1;
      newStats.draws += 1;
    } else {
      scoreChange = -2;
      newStats.losses += 1;
    }

    setEngineScore(prev => parseFloat((prev + scoreChange).toFixed(2)));
    setStats(newStats);
  };

  const toggleSelfPlay = () => {
    if (!isPlaying) {
      const newGame = new Chess();
      setGame(newGame);
      setIsPlaying(true);
      
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
    <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-center mt-4">
      <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 h-full flex flex-col justify-between shadow-xl">
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">🏆 누적 가치 추구 점수</h2>
          <div className="text-5xl font-black font-mono text-center text-emerald-400 py-6 bg-gray-950 rounded-xl border border-emerald-500/10">
            {engineScore} <span className="text-xs text-gray-500 font-normal">pts</span>
          </div>
        </div>

        <div className="space-y-2 font-mono text-sm border-t border-gray-800 pt-4 mt-4 text-gray-300">
          <div className="flex justify-between border-b border-gray-800/50 pb-1">
            <span>총 시뮬레이션:</span>
            <span className="font-bold">{stats.totalGames} 판</span>
          </div>
          <div className="flex justify-between text-emerald-400"><span>승리 (+1.0):</span><span>{stats.wins} 회</span></div>
          <div className="flex justify-between text-amber-400"><span>무승부 (-0.1):</span><span>{stats.draws} 회</span></div>
          <div className="flex justify-between text-red-500"><span>패배 (-2.0):</span><span>{stats.losses} 회</span></div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="w-full aspect-square max-w-[380px] rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800 bg-gray-900">
          <Chessboard position={game.fen()} arePiecesDraggable={false} id="selfPlayBoard" />
        </div>
      </div>

      <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 h-full flex flex-col justify-between shadow-xl">
        <div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">⚙️ 가치 강화 조절기</h2>
          <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-400">AI 알고리즘 강화</p>
              <p className="text-[11px] text-gray-500 mt-0.5">승점 극대화를 위한 탐색 버프</p>
            </div>
            <input 
              type="checkbox" 
              checked={isEnhanced}
              onChange={(e) => setIsEnhanced(e.target.checked)}
              className="w-10 h-5 bg-gray-700 checked:bg-amber-400 rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:h-5 before:w-5 before:bg-white before:rounded-full before:transition-all checked:before:translate-x-5"
            />
          </div>
        </div>

        <button onClick={toggleSelfPlay} className={`w-full py-4 rounded-xl font-black text-sm tracking-wide transition shadow-lg mt-4 ${isPlaying ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-gray-950'}`}>
          {isPlaying ? '🛑 자가대국 중지' : '⚡ 자가대국 시뮬레이션 가동'}
        </button>
      </div>
    </div>
  );
}
