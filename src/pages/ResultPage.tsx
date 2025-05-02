/* 結果表示 + IndexedDB 保存 */
import { useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import type { Word } from '../utils/csvLoader';
import { addReview } from '../utils/db';

type State = {
  total: number;
  correct: number;
  wrongWords: Word[];
};

export default function ResultPage() {
  const { state } = useLocation() as { state: State };

  /* ---- IndexedDB に復習単語を保存 ---- */
  useEffect(() => {
    console.log('保存する wrongWords', state.wrongWords);
    state.wrongWords.forEach(w => {
      console.log('addReview =>', w);     // ★ 追跡
      addReview(w);
    });
  }, [state.wrongWords]);

  const rate = Math.round((state.correct / state.total) * 100);

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center">結果</h1>

      <p className="text-xl text-center">
        正答率：<span className="font-bold">{rate}%</span>（
        {state.correct}/{state.total}）
      </p>

      {state.wrongWords.length ? (
        <>
          <h2 className="font-semibold mt-4">復習が必要な単語</h2>
          <ul className="list-disc ml-6 space-y-1">
            {state.wrongWords.map(w => (
              <li key={w.id}>
                <span className="font-medium">{w.english}</span> — {w.japanese}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-center text-green-600">全問正解！おめでとう 🎉</p>
      )}

      <Link
        to="/"
        className="block w-full text-center bg-blue-600 text-white py-2 rounded mt-6 hover:bg-blue-700"
      >
        トップへ戻る
      </Link>
    </div>
  );
}