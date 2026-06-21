'use client';

import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import Link from 'next/link';

export default function ReviewPage() {
  const [game, setGame] = useState(new Chess());
  const [gameHistory, setGameHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [evaluation, setEvaluation] = useState('0.0');
  const [bestMove, setBestMove] = useState('');
  const [isBlunder, setIsBlunder] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]); // 로컬 저장용 오답노트 상태
  
  const workerRef = useRef(null);
  const prevEvalRef = useRef(0);

  useEffect(() => {
    // public/stockfish.js 엔진 로드
    workerRef.current = new Worker('/stockfish.js');
    
    workerRef.current.onmessage = (e) => {
      const line = e.data;
      if (line.startsWith('info depth')) {
        const cpMatch = line.match(/score cp (-?\d+)/);
        const mateMatch = line.match(/score mate (-?\d+)/);
        const pvMatch = line.match(/ pv ([a-h][1-8][a-h][1-8])/);

        let currentEval = 0;
        if (cpMatch) {
          currentEval = parseInt(cpMatch[1]) / 100;
          setEvaluation(currentEval.toFixed(1));
        } else if (mateMatch) {
          setEvaluation(`M${mateMatch[1]}`);
          currentEval = mateMatch[1] > 0 ? 10 : -10; 
        }

        if (pvMatch) setBestMove(pvMatch[1]);

        // 이전 수 대비 형세가 1.5점 이상 떨어지면 Blunder(실수) 배지 활성화
        if (Math.abs(prevEvalRef.current - currentEval) > 1.5) {
          setIsBlunder(true);
        } else {
          setIsBlunder(false);
        }
        prevEvalRef.current = currentEval;
      }
    };

    workerRef.current.postMessage('uci');
    workerRef.current.postMessage('isready');

    return () => workerRef.current?.terminate();
  }, []);

  const loadPgn = (pgnText) => {
    const newGame = new Chess();
    try {
      newGame.loadPgn(pgnText);
      setGame(newGame);
      setGameHistory(newGame.history({ verbose: true }));
      setCurrentMoveIndex(-1);
    } catch {
      alert('올바르지 않은 PGN 형식입니다.');
    }
  };

  const analyzePosition = (fen) => {
    if (!workerRef.current) return;
    setEvaluation('계산 중...');
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage('go depth 15');
  };

  const handleMoveNavigation = (direction) => {
    let nextIndex = currentMoveIndex;
    if (direction === 'next' && currentMoveIndex < gameHistory.length - 1) {
      nextIndex++;
    } else if (direction === 'prev' && currentMoveIndex >= 0) {
      nextIndex--;
    } else {
      return;
    }

    const tempGame = new Chess();
    for (let i = 0; i <= nextIndex; i++) {
      tempGame.move(gameHistory[i].san);
    }

    setCurrentMoveIndex(nextIndex);
    analyzePosition(tempGame.fen());
  };

  const getCurrentFen = () => {
    if (currentMoveIndex === -1) return new Chess().fen();
    const tempGame = new Chess();
    for (let i = 0; i <= currentMoveIndex; i++) {
      tempGame.move(gameHistory[i].san);
    }
    return tempGame.fen();
  };

  // 나만의 오답노트에 현재 실수 국면 저장 (프리미엄 핵심 기능 연결부)
  const saveToMistakeNote = () => {
    const lastMove = gameHistory[currentMoveIndex];
    const userMoveStr = lastMove ? lastMove.san : 'N/A';
    
    const newNote = {
      id: Date.now(),
      fen: getCurrentFen(),
      userMove: userMoveStr,
      bestMove: bestMove,
      evalScore: evaluation
    };

    // 우선은 DB 붙이기 전 브라우저 로컬스토리지/상태값에 임시 저장 (작동 확인용)
    setSavedNotes([newNote, ...savedNotes]);
    alert(`오답노트에 성공적으로 저장되었습니다!\n[둔 수: ${userMoveStr} / 추천 수: ${bestMove}]`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row gap-6">
        
        {/* 왼쪽: 보드 및 실시간 평가바 구역 */}
        <div className="flex gap-4 w-full md:w-[550px]">
          <div className="w-14 bg-gray-900 text-white rounded-xl flex flex-col justify-between items-center py-4 font-mono font-bold text-lg shadow-inner">
            <div className="text-gray-500 text-xs">WHITE</div>
            <div className="text-amber-400">{evaluation}</div>
            <div className="text-gray-500 text-xs">BLACK</div>
          </div>
          <div className="flex-1 rounded-xl overflow-hidden shadow-md">
            <Chessboard position={getCurrentFen()} arePiecesDraggable={false} />
          </div>
        </div>

        {/* 오른쪽: 분석 및 대시보드 컨트롤러 */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black text-gray-800">♟️ ChessNote 복기 모드</h1>
            <Link href="/premium" className="text-xs bg-amber-400 text-gray-900 px-3 py-1.5 rounded-lg font-bold shadow hover:bg-amber-300 transition">👑 프리미엄 멤버십</Link>
          </div>

          <textarea 
            placeholder="체스닷컴이나 리체스의 PGN 기록을 복사해서 붙여넣으세요..."
            className="w-full h-24 p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-800 transition bg-gray-50"
            onChange={(e) => loadPgn(e.target.value)}
          />
          
          <div className="flex gap-3">
            <button className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 active:scale-95 transition shadow" onClick={() => handleMoveNavigation('prev')}>이전 수</button>
            <button className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-700 active:scale-95 transition shadow" onClick={() => handleMoveNavigation('next')}>다음 수</button>
          </div>

          {/* 블런더 감지 시 수동 오답 저장 버튼 노출 */}
          {isBlunder && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-2 animate-fadeIn">
              <div className="flex justify-between items-center">
                <p className="text-red-700 font-bold text-sm">⚠️ 형세가 급격히 떨어진 실책(Blunder) 구간입니다!</p>
                <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded font-black">!]</span>
              </div>
              <button 
                onClick={saveToMistakeNote}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-amber-500 text-white font-black text-xs rounded-lg shadow-md hover:opacity-90 transition"
              >
                💾 이 국면 나만의 프리미엄 오답노트에 저장하기
              </button>
            </div>
          )}

          {/* 대시보드 하단 상태 스펙 판넬 */}
          <div className="mt-auto p-4 bg-gray-950 text-gray-200 rounded-xl font-mono text-xs flex justify-between items-center shadow-lg">
            <div>ENGINE: <span className="text-emerald-400 font-bold">Stockfish 15 (WebWorker)</span></div>
            <div>BEST MOVE: <span className="text-amber-400 font-bold">{bestMove || 'WAITING'}</span></div>
            <div>LIMIT: <span className="text-gray-400">DEPTH 15 (FREE)</span></div>
          </div>
        </div>

      </div>

      {/* 저장된 오답노트 미니 프리뷰 (SaaS 형태 레이아웃 체감용) */}
      {savedNotes.length > 0 && (
        <div className="max-w-6xl mx-auto mt-6 bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-3 text-sm">🗂️ 실시간 수집된 오답 리스트 ({savedNotes.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedNotes.map((note) => (
              <div key={note.id} className="p-3 bg-gray-50 rounded-xl border text-xs flex flex-col gap-1 font-medium text-gray-600">
                <p className="text-gray-400 truncate">FEN: {note.fen}</p>
                <div className="flex justify-between mt-1">
                  <span>내가 둔 수: <b className="text-red-600">{note.userMove}</b></span>
                  <span>최선의 추천 수: <b className="text-emerald-600">{note.bestMove}</b></span>
                  <span className="bg-gray-200 px-1.5 rounded font-mono text-gray-800">{note.evalScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
