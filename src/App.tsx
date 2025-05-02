// src/App.tsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import HomePage         from './pages/HomePage'
import RangePage        from './pages/RangePage'
import QuizPage         from './pages/QuizPage'
import ResultPage       from './pages/ResultPage'
import FlaggedRangePage from './pages/FlaggedRangePage'
import { getReviewWords } from './utils/db'

export default function App() {
  // — 通知権限のリクエスト —
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // — 復習リストに応じた通知スケジュール —
  useEffect(() => {
    const intervals = [1, 3, 7, 28].map(d => d * 24 * 60 * 60 * 1000)
    getReviewWords().then(words => {
      words.forEach(({ id, english, japanese, /* added */ }) => {
        const added = (words.find(w => w.id === id) as any).added as number
        intervals.forEach(ms => {
          const delay = added + ms - Date.now()
          if (delay > 0) {
            setTimeout(() => {
              new Notification('復習の時間です！', {
                body: `${english} — ${japanese}`,
              })
            }, delay)
          }
        })
      })
    })
  }, [])

  return (
    <BrowserRouter>
      {/* 画面中央・左右余白・最大幅をレスポンシブに調整 */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-md sm:max-w-lg lg:max-w-xl mx-auto">
        <Routes>
          <Route path="/"       element={<HomePage />}        />
          <Route path="/range"  element={<RangePage />}       />
          <Route path="/quiz"   element={<QuizPage />}        />
          <Route path="/result" element={<ResultPage />}      />
          <Route path="/flags"  element={<FlaggedRangePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}