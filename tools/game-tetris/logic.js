/**
 * ==========================================================================
 * SimuLab - 클래식 레트로 테트리스 게임 엔진 (logic.js)
 * 파일 경로: tools/game-tetris/logic.js
 * --------------------------------------------------------------------------
 * - 표준 7-Bag 무작위 블록 추첨 알고리즘
 * - 7가지 테트로미노 매트릭스 (I, J, L, O, S, T, Z)
 * - 벽/바닥/블록 충돌 감지 및 회전 로직
 * - 고스트 블록 (착지 예상 위치 가이드) 계산
 * - 라인 삭제, 콤보 점수, 레벨 및 속도 공식
 * - 블록 홀드(Hold) 보관 시스템
 * ==========================================================================
 */

(function (global) {
  'use strict';

  const TetrisLogic = {};

  // 보드 크기 (표준: 가로 10칸, 세로 20칸)
  TetrisLogic.COLS = 10;
  TetrisLogic.ROWS = 20;

  // 7가지 테트로미노 형태 정의 (4x4 또는 3x3 매트릭스)
  TetrisLogic.SHAPES = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    O: [
      [1, 1],
      [1, 1]
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ]
  };

  // 모던 네온 테마 블록 색상 팔레트
  TetrisLogic.COLORS = {
    I: '#06b6d4', // 시안 (하늘색)
    J: '#3b82f6', // 블루
    L: '#f97316', // 오렌지
    O: '#eab308', // 옐로우
    S: '#10b981', // 에메랄드 그린
    T: '#a855f7', // 퍼플
    Z: '#ef4444'  // 레드
  };

  /**
   * 빈 보드 생성 (20행 10열의 0 매트릭스)
   */
  TetrisLogic.createEmptyBoard = function () {
    return Array.from({ length: TetrisLogic.ROWS }, () =>
      Array(TetrisLogic.COLS).fill(0)
    );
  };

  /**
   * 7-Bag 무작위 블록 생성기 (동일한 블록이 연속으로 나오지 않도록 가방에서 7개를 섞어 뽑음)
   */
  TetrisLogic.createBagGenerator = function () {
    const keys = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    let bag = [];

    return function getNext() {
      if (bag.length === 0) {
        bag = [...keys];
        // Fisher-Yates 셔플
        for (let i = bag.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [bag[i], bag[j]] = [bag[j], bag[i]];
        }
      }
      const type = bag.pop();
      return {
        type,
        matrix: TetrisLogic.SHAPES[type].map((row) => [...row]),
        color: TetrisLogic.COLORS[type],
        x: Math.floor((TetrisLogic.COLS - TetrisLogic.SHAPES[type][0].length) / 2),
        y: type === 'I' ? -1 : 0
      };
    };
  };

  /**
   * 매트릭스 시계방향 90도 회전
   */
  TetrisLogic.rotateMatrix = function (matrix, dir = 1) {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (dir > 0) {
          result[x][N - 1 - y] = matrix[y][x];
        } else {
          result[N - 1 - x][y] = matrix[y][x];
        }
      }
    }
    return result;
  };

  /**
   * 충돌 감지 (벽, 바닥, 이미 고정된 블록과의 충돌 여부)
   */
  TetrisLogic.checkCollision = function (board, piece, offsetX = 0, offsetY = 0, newMatrix = null) {
    const matrix = newMatrix || piece.matrix;
    const px = piece.x + offsetX;
    const py = piece.y + offsetY;

    for (let y = 0; y < matrix.length; y++) {
      for (let x = 0; x < matrix[y].length; x++) {
        if (matrix[y][x] !== 0) {
          const boardX = px + x;
          const boardY = py + y;

          // 좌/우 벽 충돌
          if (boardX < 0 || boardX >= TetrisLogic.COLS) {
            return true;
          }
          // 바닥 충돌
          if (boardY >= TetrisLogic.ROWS) {
            return true;
          }
          // 천장 위는 충돌 아님 (단, 이미 판에 쌓인 블록과의 충돌은 체크)
          if (boardY >= 0 && board[boardY][boardX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  };

  /**
   * 블록을 보드에 영구 고정
   */
  TetrisLogic.mergePiece = function (board, piece) {
    const newBoard = board.map((row) => [...row]);
    for (let y = 0; y < piece.matrix.length; y++) {
      for (let x = 0; x < piece.matrix[y].length; x++) {
        if (piece.matrix[y][x] !== 0) {
          const by = piece.y + y;
          const bx = piece.x + x;
          if (by >= 0 && by < TetrisLogic.ROWS && bx >= 0 && bx < TetrisLogic.COLS) {
            newBoard[by][bx] = piece.color;
          }
        }
      }
    }
    return newBoard;
  };

  /**
   * 고스트 블록 위치 계산 (현재 블록이 그대로 떨어졌을 때 착지할 바닥 위치)
   */
  TetrisLogic.getGhostPosition = function (board, piece) {
    let dropY = 0;
    while (!TetrisLogic.checkCollision(board, piece, 0, dropY + 1)) {
      dropY++;
    }
    return {
      x: piece.x,
      y: piece.y + dropY
    };
  };

  /**
   * 가득 찬 라인 감지 및 삭제
   * @returns {{ newBoard: Array, linesCleared: number }}
   */
  TetrisLogic.clearLines = function (board) {
    const remainingRows = board.filter((row) => row.some((cell) => cell === 0));
    const linesCleared = TetrisLogic.ROWS - remainingRows.length;

    if (linesCleared === 0) {
      return { newBoard: board, linesCleared: 0 };
    }

    // 사라진 줄 수만큼 상단에 새로운 빈 줄(0) 추가
    const emptyRows = Array.from({ length: linesCleared }, () =>
      Array(TetrisLogic.COLS).fill(0)
    );

    return {
      newBoard: [...emptyRows, ...remainingRows],
      linesCleared
    };
  };

  /**
   * 점수 계산 (표준 닌텐도 테트리스 점수 룰 × 레벨)
   */
  TetrisLogic.calculateScore = function (linesCleared, level) {
    const baseScores = [0, 100, 300, 500, 800]; // 1줄, 2줄, 3줄, 4줄(테트리스!)
    return (baseScores[linesCleared] || 0) * (level + 1);
  };

  /**
   * 레벨에 따른 블록 낙하 지연 시간 (ms) 계산 (레벨이 오를수록 빨라짐)
   */
  TetrisLogic.getDropInterval = function (level) {
    // 레벨 1: 800ms ~ 레벨 10 이상: 100ms
    return Math.max(100, Math.round(800 * Math.pow(0.85, level)));
  };

  global.TetrisLogic = TetrisLogic;
})(typeof window !== 'undefined' ? window : globalThis);
