// app/review/page.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

export default function ReviewPage() {
  const [game, setGame] = useState(new Chess());
  const [gameHistory, setGameHistory] = useState([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [evaluation, setEvaluation] = useState('0.0');
  const [bestMove, setBestMove] = useState('');
  
  const workerRef = useRef(null);

  // 1. 웹 워커로 Stockfish 엔진 초기화 (서버 부하 0%)
  useEffect(() => {
    // public 폴더에 stockfish.js 가 있어야 합니다.
    workerRef.current = new Worker('/stockfish.js');
    
    workerRef.current.onmessage = (e) => {
      const line = e.data;
      
      // Stockfish가 보내는 분석 데이터 중 평가점수(cp)와 최선의 수(pv) 추출
      if (line.startsWith('info depth')) {
        const cpMatch = line.match(/score cp (-?\d+)/);
        const mateMatch = line.match(/score mate (-?\d+)/);
        const pvMatch = line.match(/ pv ([a-h][1-8][a-h][1-8])/);

        if (cpMatch) {
          // 센티폰(cp) 단위를 일반 체스 점수로 변환 (예: 150cp -> +1.5)
          const score = (parseInt(cpMatch[1]) / 100).toFixed(1);
          setEvaluation(score);
        } else if (mateMatch) {
          setEvaluation(`M${mateMatch[1]}`); // 체크메이트까지 남은 수
        }

        if (pvMatch) {
          setBestMove(pvMatch[1]);
        }
      }
    };

    // 엔진 초기 설정 설정
    workerRef.current.postMessage('uci');
    workerRef.current.postMessage('isready');

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // 2. PGN 로드 함수 (체스닷컴 등에서 복사한 텍스트 입력)
  const loadPgn = (pgnText) => {
    const newGame = new Chess();
    try {
      newGame.loadPgn(pgnText);
      setGame(newGame);
      setGameHistory(newGame.history({ verbose: true }));
      setCurrentMoveIndex(-1); // 시작 지점으로 초기화
    } catch (error) {
      alert('올바르지 않은 PGN 형식입니다.');
    }
  };

  // 3. 특정 수(Move)로 이동할 때마다 Stockfish에 분석 요청
  const analyzePosition = (fen) => {
    if (!workerRef.current) return;
    setEvaluation('계산 중...');
    workerRef.current.postMessage(`position fen ${fen}`);
    workerRef.current.postMessage('go depth 15'); // 탐색 깊이 15 (무료 플랜용 적정 스펙)
  };

  // 4. 앞/뒤 이동 네비게이션
  const handleMoveNavigation = (direction) => {
    let nextIndex = currentMoveIndex;
    if (direction === 'next' && currentMoveIndex < gameHistory.length - 1) {
      nextIndex++;
    } else if (direction === 'prev' && currentMoveIndex >= 0) {
      nextIndex--;
    } else {
      return;
    }

    // 처음부터 해당 인덱스까지 가상으로 기물을 움직여 FEN 생성
    const tempGame = new Chess();
    for (let i = 0; i <= nextIndex; i++) {
      tempGame.move(gameHistory[i].san);
    }

    setCurrentMoveIndex(nextIndex);
    analyzePosition(tempGame.fen());
  };

  // 현재 보드에 표시할 FEN 계산
  const getCurrentFen = () => {
    if (currentMoveIndex === -1) return new Chess().fen(); // 초기 배열
    const tempGame = new Chess();
    for (let i = 0; i <= currentMoveIndex; i++) {
      tempGame.move(gameHistory[i].san);
    }
    return tempGame.fen();
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 max-w-6xl mx-auto">
      {/* 왼쪽: 체스판 및 평가바 UI */}
      <div className="flex gap-4 w-full md:w-[600px]">
        {/* 평가바 시각화 (단순 텍스트를 나중에 게이지 바로 변경) */}
        <div className="w-12 bg-gray-200 rounded flex flex-col justify-end items-center p-2 font-bold text-sm">
          {evaluation}
        </div>
        <div className="flex-1">
          <Chessboard position={getCurrentFen()} arePiecesDraggable={false} />
        </div>
      </div>

      {/* 오른쪽: 컨트롤러 및 PGN 입력창 */}
      <div className="flex-1 flex flex-col gap-4 bg-gray-50 p-4 rounded-xl border">
        <textarea 
          placeholder="이곳에 PGN 데이터를 붙여넣으세요..."
          className="w-full h-32 p-3 border rounded text-sm"
          onChange={(e) => loadPgn(e.target.value)}
        />
        
        <div className="flex gap-2">
          <button 
            className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
            onClick={() => handleMoveNavigation('prev')}
          >
            이전 수
          </button>
          <button 
            className="flex-1 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
            onClick={() => handleMoveNavigation('next')}
          >
            다음 수
          </button>
        </div>

        <div className="mt-4 p-4 bg-white rounded border">
          <h3 className="font-bold text-gray-700 mb-2">엔진 분석 결과</h3>
          <p className="text-sm">현재 국면 점수: <span className="font-semibold">{evaluation}</span></p>
          <p className="text-sm">컴퓨터 추천 수: <span className="font-semibold text-green-600">{bestMove || '없음'}</span></p>
          <p className="text-xs text-gray-400 mt-2">※ 무료 플랜은 Depth 15 고정으로 분석됩니다.</p>
        </div>
      </div>
    </div>
  );
}
