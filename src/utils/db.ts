// src/utils/db.ts
import { openDB, DBSchema } from 'idb';
import type { Word } from './csvLoader';

interface QuizDB extends DBSchema {
  review: {
    key: string;
    value: { id: string; word: Word; added: number };
  };
  flagged: {
    key: string;
    value: { id: string; word: Word; flaggedAt: number };
  };
}

export const dbPromise = openDB<QuizDB>('quiz-db', 3, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      db.createObjectStore('review', { keyPath: 'id' });
      db.createObjectStore('flagged', { keyPath: 'id' });
    }
  },
});

/* ─── Review ───────────────────────── */
export async function addReview(word: Word) {
  const db = await dbPromise;
  await db.put('review', { id: word.id, word, added: Date.now() });
}
export async function removeReview(id: string) {
  const db = await dbPromise;
  await db.delete('review', id);
}
export async function getReviewWords(): Promise<Word[]> {
  const db = await dbPromise;
  const all = await db.getAll('review');
  return all.map(r => r.word);
}
export async function clearReview() {
  const db = await dbPromise;
  await db.clear('review');
}

/* ─── Flagged ─────────────────────── */
export async function addFlag(word: Word) {
  const db = await dbPromise;
  await db.put('flagged', { id: word.id, word, flaggedAt: Date.now() });
}
export async function removeFlag(id: string) {
  const db = await dbPromise;
  await db.delete('flagged', id);
}
export async function getFlaggedWords(): Promise<Word[]> {
  const db = await dbPromise;
  const all = await db.getAll('flagged');
  return all.map(r => r.word);
}
export async function clearFlagged() {
  const db = await dbPromise;
  await db.clear('flagged');
}

/**
 * ここから追加
 * Word 全体ではなく ID 一覧がほしいときに使うユーティリティ
 */
export async function getFlaggedIds(): Promise<string[]> {
  const db = await dbPromise;
  const all = await db.getAll('flagged');
  return all.map(r => r.id);
}