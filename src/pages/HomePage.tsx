// src/pages/HomePage.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  getReviewWords, clearReview,
  getFlaggedWords, clearFlagged,
} from '../utils/db';

/* ==== 出題形式 ==== */
export type Mode = 'EJ' | 'JE_MCQ' | 'JE_INPUT';

/** localStorage キー */
const MODE_KEY = 'quiz:lastMode';

export default function HomePage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  /* ---------------- フォーム state ---------------- */
  const [num,  setNum ] = useState(10);

  // ⬇ 初期値を localStorage から取得（なければ 'EJ'）
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem(MODE_KEY) as Mode | null;
    return saved ?? 'EJ';
  });

  /* ラジオを切り替えたら localStorage に保存 */
  const changeMode = (m: Mode) => {
    setMode(m);
    localStorage.setItem(MODE_KEY, m);
  };

  /* ---------------- バッジ用 ---------------- */
  const [revCnt,   setRevCnt]   = useState(0);
  const [flagCnt,  setFlagCnt]  = useState(0);

  /* トップページに戻って来るたび件数を読み直す */
  useEffect(() => {
    getReviewWords().then(ws  => setRevCnt(ws.length));
    getFlaggedWords().then(ws => setFlagCnt(ws.length));
  }, [location.pathname]);

  /* ---------------- 画面遷移 ---------------- */
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

  const resetReview  = async () => {
    if (confirm('復習リストを全削除しますか？')) {
      await clearReview();  setRevCnt(0);
    }
  };
  const resetFlagged = async () => {
    if (confirm('気になるリストを全削除しますか？')) {
      await clearFlagged(); setFlagCnt(0);
    }
  };

  /* ---------------- 画面 ---------------- */
  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center">英単語クイズ</h1>

      {/* 問題数セレクト */}
      <label className="block">
        問題数
        <select
          value={num}
          onChange={e => setNum(+e.target.value)}
          className="ml-2 border rounded px-2 py-1"
        >
          {[5,10,15,20].map(n => <option key={n}>{n}</option>)}
        </select>
      </label>

      {/* 出題形式ラジオ */}
      <fieldset className="space-y-1">
        <legend className="font-semibold">出題形式</legend>

        <Radio label="英語 → 日本語（4択）"
               value="EJ"        mode={mode} setMode={changeMode}/>
        <Radio label="日本語 → 英語（4択）"
               value="JE_MCQ"    mode={mode} setMode={changeMode}/>
        <Radio label="日本語 → 英語（記入式）"
               value="JE_INPUT"  mode={mode} setMode={changeMode}/>
      </fieldset>

      {/* ===== ボタン群 ===== */}
      <button onClick={startNormal}
              className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        通常モード
      </button>

      <button onClick={startReview}
              className="w-full py-2 border rounded hover:bg-gray-100 flex justify-between items-center px-3">
        <span>復習モード</span>
        {revCnt > 0 && (
          <span className="text-sm bg-red-600 text-white rounded-full px-2">
            {revCnt}
          </span>
        )}
      </button>

      <button onClick={startFlagged}
              className="w-full py-2 border rounded hover:bg-gray-100 flex justify-between items-center px-3">
        <span>気になるモード</span>
        {flagCnt > 0 && (
          <span className="text-sm bg-yellow-600 text-white rounded-full px-2">
            {flagCnt}
          </span>
        )}
      </button>

      {/* リセット */}
      <button onClick={resetReview}
              className="w-full py-2 text-sm text-gray-500 hover:underline">
        復習リストをクリア
      </button>
      <button onClick={resetFlagged}
              className="w-full py-2 text-sm text-gray-500 hover:underline">
        気になるリストをクリア
      </button>
    </div>
  );
}

/* ------ 共通ラジオコンポーネント ------ */
type RadioProps = { label: string; value: Mode;
                    mode: Mode; setMode: (m: Mode)=>void }
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