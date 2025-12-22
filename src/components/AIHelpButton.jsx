import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const helpTopics = [
  { q: '案件を登録するには？', a: 'ホーム画面の「S-BASE」→ 右上の「+」ボタンをタップして、案件情報を入力してください。' },
  { q: '経費を申請するには？', a: 'ホーム画面の「経費精算」→ レシートを撮影 → カテゴリと現場を選択して申請します。' },
  { q: '作業員を配置するには？', a: '「段取りくん」→ 日付を選択 → 現場と作業員をドラッグ&ドロップで配置します。' },
  { q: 'KYを作成するには？', a: '「KY管理」→「新規作成」→ 現場・作業内容・危険予知・対策を入力してサインします。' },
  { q: '車両を登録するには？', a: '「車両管理」→「車検証を撮影」→ AIが自動読み取り → 確認して登録します。' },
  { q: '在庫を管理するには？', a: '「在庫管理」→ 入出庫処理で数量を更新。在庫少アラートで自動通知されます。' },
  { q: '承認待ちを確認するには？', a: 'ホーム画面の「承認待ち」カードをタップ、または「承認センター」から一覧を確認できます。' },
  { q: 'LINE WORKSと連携するには？', a: '「設定」→「LINE WORKS連携」→ Bot ID等を入力して接続テストします。' },
]

export default function AIHelpButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'こんにちは！S-BASEの使い方についてお答えします。下のボタンから質問を選んでください。' }
  ])
  const [inputText, setInputText] = useState('')

  const handleQuestionClick = (topic) => {
    setMessages(prev => [
      ...prev,
      { role: 'user', content: topic.q },
      { role: 'ai', content: topic.a }
    ])
  }

  const handleSend = () => {
    if (!inputText.trim()) return

    const userMessage = inputText.trim()
    setInputText('')

    // 簡易的なキーワードマッチング
    const matchedTopic = helpTopics.find(t =>
      t.q.includes(userMessage) || userMessage.includes(t.q.replace('？', '').replace('には', ''))
    )

    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'ai', content: matchedTopic
        ? matchedTopic.a
        : 'ご質問ありがとうございます。下のボタンから関連する質問を選んでいただくか、「設定」→「ヘルプ」で詳しいマニュアルをご確認ください。'
      }
    ])
  }

  return (
    <>
      {/* フローティングボタン */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full shadow-lg flex items-center justify-center text-2xl z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        💬
      </motion.button>

      {/* チャットウィンドウ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              className="w-full max-w-lg bg-slate-800 rounded-t-2xl overflow-hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxHeight: '80vh' }}
            >
              {/* ヘッダー */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <span className="font-bold">AIヘルプ</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-2xl">×</button>
              </div>

              {/* メッセージエリア */}
              <div className="h-64 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* クイック質問 */}
              <div className="px-4 py-2 border-t border-slate-700">
                <div className="text-xs text-slate-400 mb-2">よくある質問:</div>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {helpTopics.slice(0, 4).map((topic, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuestionClick(topic)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-full text-xs text-slate-300"
                    >
                      {topic.q}
                    </button>
                  ))}
                </div>
              </div>

              {/* 入力エリア */}
              <div className="p-4 border-t border-slate-700 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="質問を入力..."
                  className="flex-1 bg-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-400"
                />
                <button
                  onClick={handleSend}
                  className="px-4 py-2 bg-blue-600 rounded-xl font-bold text-sm"
                >
                  送信
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
