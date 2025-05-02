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

  const groups = useMemo(() => {
    return words.reduce<Word[][]>((acc, w, i) => {
      const idx = Math.floor(i / state.num);
      (acc[idx] ??= []).push(w);
      return acc;
    }, []);
  }, [words, state.num]);

  const goQuiz = (qs: Word[]) =>
    navigate('/quiz', { state: { qs, mode: state.mode } });

  if (!words.length) return <p className="p-6">Loading…</p>;

  return (
    <div className="py-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
      {groups.map((g, i) => (
        <button
          key={i}
          className="border rounded p-4 hover:bg-gray-100"
          onClick={() => goQuiz(g)}
        >
          {`${i * state.num + 1}–${i * state.num + g.length}`}
        </button>
      ))}
      <button
        className="border rounded p-4 col-span-2 bg-blue-600 text-white"
        onClick={() => goQuiz(words)}
      >
        すべて
      </button>
    </div>
  );
}