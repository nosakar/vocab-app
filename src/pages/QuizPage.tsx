// src/pages/QuizPage.tsx ─＋「気になる」チェックを追加＋getFlaggedWords対応
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import type { Word } from '../utils/csvLoader'
import { removeReview } from '../utils/db'
import { addFlag, removeFlag, getFlaggedWords } from '../utils/db'

const DELAY_MS = 500

type LocState = {
  qs: Word[]
  mode: 'EJ' | 'JE_MCQ' | 'JE_INPUT'
  preset?: Word[]
  presetType?: 'review' | 'flagged'
}

export default function QuizPage() {
  const { state } = useLocation() as { state: LocState }
  const navigate = useNavigate()

  const [idx, setIdx]           = useState(0)
  const [score, setScore]       = useState(0)
  const [wrong, setWrong]       = useState<Word[]>([])
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [text, setText]         = useState('')
  const [flaggedIds, setFlaggedIds] = useState<string[]>([])
  const [isFlagged, setIsFlagged]   = useState(false)

  const cur = state.qs[idx]

  // ◇ 現在の「気になる」状態をロード
  useEffect(() => {
    getFlaggedWords().then(words => {
      const ids = words.map(w => w.id)
      setFlaggedIds(ids)
      setIsFlagged(ids.includes(cur.id))
    })
  }, [cur.id])

  // ◇ トグルで「気になる」を追加／削除
  const toggleFlag = () => {
    if (isFlagged) {
      removeFlag(cur.id)
      setIsFlagged(false)
    } else {
      addFlag(cur)      // Word 全体を渡す
      setIsFlagged(true)
    }
  }

  // ◇ 4択の選択肢（正解＋ダミー3つ）をシャッフル
  const choices = useMemo(() => {
    const dummies = state.qs.filter(w => w.id !== cur.id).slice(0, 3)
    return shuffle([cur, ...dummies])
  }, [cur, state.qs])

  // ◇ 「復習モード」で来て、かつ正解なら復習リストから削除
  const maybeRemove = (isCorrect: boolean) => {
    if (state.presetType === 'review' && isCorrect) {
      removeReview(cur.id)
    }
  }

  // ◇ 次へ or 結果へ
  const next = (isCorrect: boolean) => {
    maybeRemove(isCorrect)
    if (!isCorrect) {
      setWrong(ws => [...ws, cur])
    }
    setScore(s => s + (isCorrect ? 1 : 0))

    setTimeout(() => {
      setChosenId(null)
      setText('')
      if (idx + 1 < state.qs.length) {
        setIdx(i => i + 1)
      } else {
        navigate('/result', {
          state: {
            total: state.qs.length,
            correct: isCorrect ? score + 1 : score,
            wrongWords: isCorrect ? wrong : [...wrong, cur],
          },
        })
      }
    }, DELAY_MS)
  }

  // ◇ ユーザーアクション
  const choose = (w: Word) => {
    if (!chosenId) {
      setChosenId(w.id)
      next(w.id === cur.id)
    }
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    next(normalize(text) === normalize(cur.english))
  }

  const isEJ     = state.mode === 'EJ'
  const isJE_MCQ = state.mode === 'JE_MCQ'
  const isJE_IN  = state.mode === 'JE_INPUT'

  // ◇ 英語→日本語モードで自動発音
  useEffect(() => {
    if (isEJ) {
      const u = new SpeechSynthesisUtterance(cur.english)
      u.lang = 'en-US'
      speechSynthesis.cancel()
      speechSynthesis.speak(u)
    }
  }, [cur.id, isEJ])

  return (
    <div className="py-6 space-y-6">
      {/* 進捗 */}
      <p className="text-sm text-gray-500">
        {idx + 1}/{state.qs.length}
      </p>

      {/* 質問文＋発音＋気になるチェック */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex-1">
          {isEJ ? cur.english : cur.japanese}
        </h2>
        {/* 発音ボタン */}
        {isEJ && (
          <button
            type="button"
            onClick={() => {
              const u = new SpeechSynthesisUtterance(cur.english)
              u.lang = 'en-US'
              speechSynthesis.cancel()
              speechSynthesis.speak(u)
            }}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="発音を聞く"
          >
            🔊
          </button>
        )}
        {/* 気になるチェック */}
        <button
          onClick={toggleFlag}
          aria-label="気になる切替"
          className="text-2xl ml-2"
        >
          {isFlagged ? '★' : '☆'}
        </button>
      </div>

      {/* 4択 (EJ / JE_MCQ) */}
      {(isEJ || isJE_MCQ) && (
        <div className="grid gap-3">
          {choices.map(c => {
            const label = isEJ ? c.japanese : c.english
            let cls = 'border rounded p-3'
            if (chosenId) {
              if (c.id === cur.id)        cls += ' bg-green-300'
              else if (c.id === chosenId) cls += ' bg-red-300'
              else                        cls += ' opacity-60'
            } else {
              cls += ' hover:bg-gray-100'
            }
            return (
              <button
                key={c.id}
                className={cls}
                onClick={() => choose(c)}
                disabled={!!chosenId}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* 記入式 (JE_INPUT) */}
      {isJE_IN && (
        <form onSubmit={submit} className="space-y-3">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            className="border rounded px-3 py-2 w-full"
            placeholder="英単語を入力"
            autoFocus
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-full py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 hover:bg-blue-700"
          >
            チェック
          </button>
        </form>
      )}
    </div>
  )
}

/* ── util ── */
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}
function normalize(s: string): string {
  return s.trim().toLowerCase()
}