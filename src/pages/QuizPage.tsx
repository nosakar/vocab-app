// src/pages/QuizPage.tsx ─＋アイコンを左寄せに移動＆問題文をアイコン込みで中央
import { useLocation, useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import type { Word } from '../utils/csvLoader'
import { loadWords } from '../utils/csvLoader'
import { removeReview } from '../utils/db'
import { addFlag, removeFlag, getFlaggedWords } from '../utils/db'
import { Volume2, Star } from 'lucide-react'

const DELAY_MS = 500

type LocState = {
  qs: Word[]
  mode: 'EJ' | 'JE_MCQ' | 'JE_INPUT'
  preset?: Word[]
  presetType?: 'review' | 'flagged'
}

// ─── 共通の speak 関数 ──────────────────────
function speak(text: string) {
  if (!('speechSynthesis' in window)) return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'
  // 利用可能な voice があればセット
  const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith('en'))
  if (voice) u.voice = voice
  speechSynthesis.cancel()
  speechSynthesis.speak(u)
}

export default function QuizPage() {
  const { state } = useLocation() as { state: LocState }
  const navigate = useNavigate()

  const [idx, setIdx]           = useState(0)
  const [score, setScore]       = useState(0)
  const [wrong, setWrong]       = useState<Word[]>([])
  const [chosenId, setChosenId] = useState<string|null>(null)
  const [text, setText]         = useState('')
  const [flaggedIds, setFlaggedIds] = useState<string[]>([])
  const [isFlagged, setIsFlagged]   = useState(false)
  const [allWords, setAllWords]     = useState<Word[]>([])

  const cur = state.qs[idx]
  const progress = ((idx + 1) / state.qs.length) * 100

  // presetType 時は全単語プールをロード
  useEffect(() => {
    if (state.presetType) {
      loadWords().then(setAllWords).catch(console.error)
    }
  }, [state.presetType])

  // フラグ状態をロード
  useEffect(() => {
    getFlaggedWords().then(ws => {
      const ids = ws.map(w => w.id)
      setFlaggedIds(ids)
      setIsFlagged(ids.includes(cur.id))
    })
  }, [cur.id])

  const toggleFlag = () => {
    if (isFlagged) {
      removeFlag(cur.id)
      setIsFlagged(false)
    } else {
      addFlag(cur)
      setIsFlagged(true)
    }
  }

  // ４択プール生成
  const choices = useMemo(() => {
    const pool = state.presetType && allWords.length > 0 ? allWords : state.qs
    const others = shuffle(pool.filter(w => w.id !== cur.id)).slice(0, 3)
    return shuffle([cur, ...others])
  }, [cur, state.qs, state.presetType, allWords])

  // 復習モード時に正解ならリストから削除
  const maybeRemove = (isCorrect: boolean) => {
    if (state.presetType === 'review' && isCorrect) {
      removeReview(cur.id)
    }
  }

  // 次の問題 or 結果へ
  const next = (isCorrect: boolean) => {
    maybeRemove(isCorrect)
    if (!isCorrect) setWrong(ws => [...ws, cur])
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

  // ページ切り替え時に自動発音
  useEffect(() => {
    if (isEJ) {
      speak(cur.english)
    }
  }, [cur.id, isEJ])

  return (
    <div className="py-6 space-y-6">
      {/* プログレスバー */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 進捗テキスト */}
      <p className="text-sm text-gray-500">{idx + 1}/{state.qs.length}</p>

      {/* 質問文 + フラッグ＆発音(左端) */}
      <div className="relative flex items-center justify-start">
        {/* 気になるチェック */}
        <button onClick={toggleFlag} aria-label="気になる切替" className="mr-2">
          <Star
            className={`w-6 h-6 ${
              isFlagged ? 'text-orange-500 fill-current' : 'text-gray-400'
            }`}
          />
        </button>
        {/* 発音ボタン：常に表示して speak() を使う */}
        <button
          type="button"
          onClick={() => speak(cur.english)}
          className="mr-2 p-1 rounded-full hover:bg-gray-100"
          aria-label="発音を聞く"
        >
          <Volume2 className="w-6 h-6 text-gray-600" />
        </button>
        {/* 問題文を絶対配置で中央 */}
        <h2 className="absolute left-1/2 transform -translate-x-1/2 text-3xl font-semibold">
          {isEJ ? cur.english : cur.japanese}
        </h2>
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

// util
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}
function normalize(s: string): string {
  return s.trim().toLowerCase()
}