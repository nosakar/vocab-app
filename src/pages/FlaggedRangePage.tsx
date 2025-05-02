import { useEffect, useMemo, useState } from 'react';
import { loadWords, Word } from '../utils/csvLoader';
import { getFlaggedIds } from '../utils/db';
import { useNavigate } from 'react-router-dom';

export default function FlaggedRangePage() {
  const navigate = useNavigate();
  const [allWords, setAll] = useState<Word[]>([]);
  const [flagIds, setIds]  = useState<string[]>([]);

  useEffect(() => {
    getFlaggedIds().then(setIds);
    loadWords().then(setAll).catch(console.error);
  }, []);

  // flaggedIds が変わったらフィルタ
  const words = useMemo(
    () => allWords.filter(w => flagIds.includes(w.id)),
    [allWords, flagIds]
  );

  if (!allWords.length) return <p className="p-6">Loading…</p>;
  if (!words.length)    return <p className="p-6">気になる問題がありません。</p>;

  return (
    <div className="p-6 grid gap-4 grid-cols-2">
      {words.map((w, i) => (
        <button
          key={w.id}
          className="border rounded p-4 hover:bg-gray-100"
          onClick={() =>
            navigate('/quiz', { state: { qs: [w], mode: 'EJ', preset: words } })
          }
        >
          {w.japanese}
        </button>
      ))}
    </div>
  );
}