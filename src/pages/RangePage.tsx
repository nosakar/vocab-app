// src/pages/RangePage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { loadWords, Word } from '../utils/csvLoader';
import type { Mode } from './HomePage';

type LocState = {
  num: number;
  mode: Mode;
  preset?: Word[];
  presetType?: 'review' | 'flagged';
};

export default function RangePage() {
  const { state } = useLocation() as { state: LocState };
  const navigate = useNavigate();

  // ★ preset（復習／気になる）で来たときは即クイズへ
  if (state.preset) {
    return (
      <Navigate
        to="/quiz"
        replace
        state={{
          qs: state.preset,
          mode: state.mode,
          presetType: state.presetType,
        }}
      />
    );
  }

  /* 通常モード：CSV 読み込み＆範囲選択画面 */
  const [words, setWords] = useState<Word[]>([]);
  useEffect(() => {
    loadWords().then(setWords).catch(console.error);
  }, []);

  const groups = useMemo<Word[][]>(() => {
    return words.reduce<Word[][]>((acc, w, i) => {
      const idx = Math.floor(i / state.num);
      (acc[idx] ??= []).push(w);
      return acc;
    }, []);
  }, [words, state.num]);

  const goQuiz = (qs: Word[]) =>
    navigate('/quiz', { state: { qs, mode: state.mode } });

  if (!words.length) return <p className="p-6">Loading…</p>;

  // groups を逆順にしてラベルも正しく再計算
  const totalGroups = groups.length;
  const reversed = [...groups].reverse();

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-stretch">
      {/* ① すべてボタンを先頭に */}
      <button
        className="w-full text-center border rounded p-4 col-span-full bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => goQuiz(words)}
      >
        すべて
      </button>

      {/* ② 逆順にした範囲ボタン */}
      {reversed.map((g, revIdx) => {
        const origIdx = totalGroups - 1 - revIdx;
        const start = origIdx * state.num + 1;
        const end   = origIdx * state.num + g.length;
        return (
          <button
            key={origIdx}
            className="w-full text-center border rounded p-4 hover:bg-gray-100"
            onClick={() => goQuiz(g)}
          >
            {`${start}–${end}`}
          </button>
        );
      })}
    </div>
  );
}