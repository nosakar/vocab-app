// src/utils/csvLoader.ts
import Papa from 'papaparse';

/** CSV 1 行の型 */
export type Word = {
  id: string;
  english: string;
  japanese: string;
};

// 環境変数からシート URL を取得
// import.meta.env.VITE_SHEET_CSV は string | undefined になり得るので
// 必ず存在チェックをします。
const SHEET_CSV_URL = import.meta.env.VITE_SHEET_CSV;
if (!SHEET_CSV_URL) {
  throw new Error('環境変数 VITE_SHEET_CSV が設定されていません。.env.local に記述を確認してください。');
}

/**
 * Google スプレッドシートの公開 CSV を fetch + PapaParse して返す
 */
export async function loadWords(): Promise<Word[]> {
  // ここが変更ポイント
  const text = await fetch(SHEET_CSV_URL)
    .then(res => {
      if (!res.ok) throw new Error(`CSV fetch failed: HTTP ${res.status}`);
      return res.text();
    });

  return new Promise((resolve, reject) => {
    Papa.parse<Word>(text, {
      header: true,
      skipEmptyLines: true,
      complete({ data, errors }) {
        if (errors.length) {
          console.error('CSV parse error', errors);
          reject(errors);
          return;
        }
        // id が空でない、英語・日本語カラムが空でない行だけ返す
        resolve(
          data
            .filter(r => r.id && r.english && r.japanese)
            .map(r => ({ ...r, id: String(r.id) }))
        );
      },
    });
  });
}