'use client';

import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export default function ReviewPage() {
  const [game, setGame] = useState(new Chess());
  const [history, setHistory] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [pgnInput, setPgnInput] = useState('');
  
  const [evaluation, setEvaluation] = useState('0.0');
  const [bestMove, setBestMove] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker('/stockfish.js');
    
    workerRef.current.onmessage = (e) => {
      const line = e.data;

      if (line.includes('score cp')) {
        const parts = line.split(' ');
        const scoreIdx = parts.indexOf('cp');
        if (scoreIdx !== -1 && parts[scoreIdx + 1]) {
          const rawScore = parseInt(parts[scoreIdx + 1], 10) / 100;
          const displayScore = game.turn() === 'b' ? -rawScore : rawScore;
          setEvaluation(displayScore > 0 ? `+${displayScore.toFixed(2)}` : displayScore.toFixed(2));
        }
      } else if (line.includes('score mate')) {
        const parts = line.split(' ');
        const mateIdx = parts.indexOf('mate');
        if (mateIdx !== -1 && parts[mateIdx + 1]) {
          setEvaluation(`M${parts[mateIdx + 1]}`);
        }
      }

      if (line.startsWith('bestmove')) {
        const move = line.split(' ')[1];
        if (move && move !== '(none)') {
          setBestMove(move);
          setIsAnalyzing(false);
        }
      }
    };

    return () => workerRef.current?.terminate();
  }, [game]);

  const analyzePosition = (fen) => {
    if (!workerRef.current) return;
    setIsAnalyzing(true);
    setBestMove('계산 중...');
    
    workerRef.current.postMessage('setoption name Threads value 1');
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage('go depth 12');
  };

  const loadPgn = () => {
    if (!pgnInput.trim()) return;
    const newGame = new Chess();
    try {
      newGame.loadPgn(pgnInput);
      const moves = newGame.history({ verbose: true });
      setHistory(moves);
      
      const startGame = new Chess();
      setGame(startGame);
      setCurrentIdx(-1);
      analyzePosition(startGame.fen());
    } catch (err) {
      alert('올바르지 않은 PGN 기보 형식입니다.');
    }
  };

  const navigateMove = (direction) => {
    let nextIdx = currentIdx + direction;
    if (nextIdx < -1 || nextIdx >= history.length) return;

    const targetGame = new Chess();
    for (let i = 0; i <= nextIdx; i++) {
      targetGame.move(history[i].san);
    }
    
    setGame(targetGame);
    setCurrentIdx(nextIdx);
    analyzePosition(targetGame.fen());
  };

  return (
    <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-start mt-4">
      <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 space-y-4 shadow-xl">
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📋 PGN 기보 붙여넣기</h2>
          <textarea 
            value={pgnInput}
            onChange={(e) => setPgnInput(e.target.value)}
            placeholder="예: 1. e4 e5 2. Nf3 Nc6 ..."
            className="w-full h-28 bg-gray-950 border border-gray-800 rounded-xl p-3 text-xs font-mono text-gray-300 focus:outline-none focus:border-cyan-500 transition resize-none"
          />
          <button onClick={loadPgn} className="w-full mt-2 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-gray-950 font-black text-xs rounded-xl transition">
            기보 분석 시작하기
          </button>
        </div>

        <div className="border-t border-gray-800 pt-4">
          <h3 className="text-xs font-bold text-gray-400 mb-2 font-mono">수 탐색 ({currentIdx + 1} / {history.length})</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigateMove(-1)} disabled={currentIdx <= -1} className="py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-sm font-bold rounded-xl transition">◀ 이전 수</button>
            <button onClick={() => navigateMove(1)} disabled={currentIdx >= history.length - 1} className="py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 text-sm font-bold rounded-xl transition">다음 수 ▶</button>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center">
        <div className="w-full aspect-square max-w-[380px] rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-800 bg-gray-900">
          <Chessboard position={game.fen()} arePiecesDraggable={false} id="reviewBoard" />
        </div>
        {currentIdx >= 0 && (
          <div className="mt-3 bg-gray-900 px-4 py-1.5 rounded-full border border-gray-800 text-xs font-mono text-amber-400">
            마지막 수: <span className="font-bold text-white">{history[currentIdx]?.san}</span>
          </div>
        )}
      </div>

      <div className="bg-gray-900 p-5 rounded-2xl border border-gray-800 h-full flex flex-col justify-between shadow-xl space-y-4">
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📊 실시간 엔진 판정</h2>
          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 text-center mb-4">
            <p className="text-[10px] text-gray-500 font-mono">국면 평가치 (백 기준)</p>
            <p className={`text-4xl font-mono font-black mt-1 ${evaluation.startsWith('+') ? 'text-emerald-400' : evaluation.startsWith('-') ? 'text-rose-400' : 'text-gray-300'}`}>
              {evaluation}
            </p>
          </div>

          <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 font-mono text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">추천 최선의 수:</span>
              <span className="font-bold text-cyan-400 uppercase">{bestMove}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">상태:</span>
              <span className={isAnalyzing ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}>{isAnalyzing ? '⚡ 분석 중...' : '✅ 완료'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
