// src/pages/RangePage.tsx ─ 問題範囲を逆順に表示
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import { loadWords, Word } from '../utils/csvLoader'
import type { Mode } from './HomePage'

type LocState = {
  num: number
  mode: Mode
  preset?: Word[]
  presetType?: 'review' | 'flagged'
}

export default function RangePage() {
  const { state } = useLocation() as { state: LocState }
  const navigate = useNavigate()

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
    )
  }

  // ── CSV から全単語をロード
  const [words, setWords] = useState<Word[]>([])
  useEffect(() => {
    loadWords().then(setWords).catch(console.error)
  }, [])

  // ── 選択した件数ごとにグループ分け
  const groups = useMemo<Word[][]>(() => {
    return words.reduce<Word[][]>((acc, w, i) => {
      const idx = Math.floor(i / state.num)
      ;(acc[idx] ??= []).push(w)
      return acc
    }, [])
  }, [words, state.num])

  const goQuiz = (qs: Word[]) =>
    navigate('/quiz', { state: { qs, mode: state.mode, presetType: state.presetType } })

  if (!words.length) return <p className="p-6">Loading…</p>

  // ── 逆順に並べたグループと、元インデックスの計算準備
  const total = groups.length
  const reversed = [...groups].reverse()

  return (
    <div className="py-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
      {reversed.map((g, revIdx) => {
        const origIdx = total - 1 - revIdx
        const start = origIdx * state.num + 1
        const end = origIdx * state.num + g.length

        return (
          <button
            key={origIdx}
            className="border rounded p-4 hover:bg-gray-100"
            onClick={() => goQuiz(g)}
          >
            {`${start}–${end}`}
          </button>
        )
      })}

      {/* 全問ボタン */}
      <button
        className="border rounded p-4 col-span-2 bg-blue-600 text-white"
        onClick={() => goQuiz(words)}
      >
        すべて
      </button>
    </div>
  )
}