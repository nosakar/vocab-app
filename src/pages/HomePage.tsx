// src/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getReviewWords,
  clearReview,
  getFlaggedWords,    // ← こちらを使う
  clearFlagged,
} from '../utils/db';

/** 出題形式 */
export type Mode = 'EJ' | 'JE_MCQ' | 'JE_INPUT';

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [num, setNum] = useState(10);
  const [mode, setMode] = useState<Mode>('EJ');

  const [revCnt, setRevCnt]   = useState(0);
  const [flagCnt, setFlagCnt] = useState(0);

  useEffect(() => {
    getReviewWords().then(ws => setRevCnt(ws.length));
    getFlaggedWords().then(ws => setFlagCnt(ws.length));  // ← getFlaggedWords を呼ぶ
  }, [location.pathname]);

  const startNormal = () =>
    navigate('/range', { state: { num, mode } });

  const startReview = async () => {
    const qs = await getReviewWords();
    if (!qs.length) return alert('復習対象がありません');
    navigate('/range', {
      state: { num: qs.length, mode, preset: qs, presetType: 'review' as const },
    });
  };

  const startFlagged = async () => {
    const qs = await getFlaggedWords();
    if (!qs.length) return alert('気になる問題がありません');
    navigate('/range', {
      state: { num: qs.length, mode, preset: qs, presetType: 'flagged' as const },
    });
  };

  const resetReview = async () => {
    if (confirm('復習リストを全削除しますか？')) {
      await clearReview();
      setRevCnt(0);
    }
  };

  const resetFlagged = async () => {
    if (confirm('気になるリストを全削除しますか？')) {
      await clearFlagged();
      setFlagCnt(0);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">英単語クイズ</h1>

      <label className="block">
        問題数
        <select
          value={num}
          onChange={e => setNum(+e.target.value)}
          className="ml-2 border rounded px-2 py-1"
        >
          {[5, 10, 15, 20].map(n => <option key={n}>{n}</option>)}
        </select>
      </label>

      <fieldset className="space-y-1">
        <legend className="font-semibold">出題形式</legend>
        <Radio label="英語 → 日本語（4択）"      value="EJ"       mode={mode} setMode={setMode} />
        <Radio label="日本語 → 英語（4択）"      value="JE_MCQ"   mode={mode} setMode={setMode} />
        <Radio label="日本語 → 英語（記入式）"  value="JE_INPUT" mode={mode} setMode={setMode} />
      </fieldset>

      <button
        onClick={startNormal}
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        通常モード
      </button>

      <button
        onClick={startReview}
        className="w-full py-2 border rounded hover:bg-gray-100 flex justify-between items-center px-3"
      >
        <span>復習モード</span>
        {revCnt > 0 && (
          <span className="text-sm bg-red-600 text-white rounded-full px-2">
            {revCnt}
          </span>
        )}
      </button>

      <button
        onClick={startFlagged}
        className="w-full py-2 border rounded hover:bg-gray-100 flex justify-between items-center px-3"
      >
        <span>気になるモード</span>
        {flagCnt > 0 && (
          <span className="text-sm bg-yellow-600 text-white rounded-full px-2">
            {flagCnt}
          </span>
        )}
      </button>

      <button
        onClick={resetReview}
        className="w-full py-2 text-sm text-gray-500 hover:underline"
      >
        復習リストをクリア
      </button>
      <button
        onClick={resetFlagged}
        className="w-full py-2 text-sm text-gray-500 hover:underline"
      >
        気になるリストをクリア
      </button>
    </div>
  );
}

type RadioProps = {
  label: string;
  value: Mode;
  mode: Mode;
  setMode: (m: Mode) => void;
};
function Radio({ label, value, mode, setMode }: RadioProps) {
  return (
    <label className="block">
      <input
        type="radio"
        value={value}
        checked={mode === value}
        onChange={() => setMode(value)}
        className="mr-1"
      />
      {label}
    </label>
  );
}