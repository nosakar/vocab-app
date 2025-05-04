// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';          // ← これが無いと Tailwind が効かない

// ─── ここから追加 ───
// ブラウザが対応していれば声リストの初期ロードをトリガー
if ('speechSynthesis' in window) {
  // 声が登録されるたびに getVoices() を呼ぶ
  speechSynthesis.onvoiceschanged = () => {
    const voices = speechSynthesis.getVoices()
    console.log('利用可能な音声:', voices.map(v => `${v.name} (${v.lang})`))
  }
  // すぐに一度呼び出しておく
  speechSynthesis.getVoices()
}
// ─── ここまで追加 ───

ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);