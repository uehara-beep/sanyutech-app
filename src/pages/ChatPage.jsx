import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../components/common'
import { API_BASE } from '../config/api'

export default function ChatPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const [messages, setMessages] = useState([])
  const [project, setProject] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)
  const currentUser = { id: 'user1', name: 'ユーザー' }

  useEffect(() => {
    if (projectId) {
      fetchProject()
      fetchMessages()
      const interval = setInterval(fetchMessages, 5000) // ポーリング
      return () => clearInterval(interval)
    }
  }, [projectId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchProject = async () => {
    const res = await fetch(`${API_BASE}/projects`)
    const projects = await res.json()
    setProject(projects.find(p => p.id === parseInt(projectId)))
  }

  const fetchMessages = async () => {
    const res = await fetch(`${API_BASE}/messages/?project_id=${projectId}`)
    setMessages(await res.json())
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!newMessage.trim()) return

    await fetch(`${API_BASE}/messages/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: parseInt(projectId),
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        content: newMessage
      })
    })
    setNewMessage('')
    fetchMessages()
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <PageHeader
        title={project?.name || 'チャット'}
        onBack={() => navigate(-1)}
      />

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === currentUser.id
          const showDate = index === 0 ||
            formatDate(msg.sent_at) !== formatDate(messages[index - 1]?.sent_at)

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center text-gray-500 text-xs py-4">
                  {formatDate(msg.sent_at)}
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-sm mr-2">
                    {msg.sender_name?.[0] || '?'}
                  </div>
                )}
                <div className={`max-w-[70%] ${isMe ? 'text-right' : ''}`}>
                  {!isMe && (
                    <div className="text-xs text-gray-400 mb-1">{msg.sender_name}</div>
                  )}
                  <div className={`inline-block p-3 rounded-2xl ${
                    isMe
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : 'bg-card text-white rounded-bl-sm'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.attachment_path && (
                      <div className="mt-2 text-sm text-blue-200">📎 添付ファイル</div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatTime(msg.sent_at)}
                  </div>
                </div>
              </motion.div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="bg-card border-t border-gray-700 p-4 pb-24">
        <div className="flex gap-2">
          <button className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
            📎
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力..."
            className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-white"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              newMessage.trim() ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-500'
            }`}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}

// チャット一覧ページ
export function ChatListPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [unreadCounts, setUnreadCounts] = useState({})

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    const res = await fetch(`${API_BASE}/projects`)
    const data = await res.json()
    setProjects(data.filter(p => ['施工中', '受注確定'].includes(p.status)))

    // 各案件の未読数を取得
    const counts = {}
    for (const p of data) {
      const countRes = await fetch(`${API_BASE}/messages/unread-count?project_id=${p.id}`)
      const countData = await countRes.json()
      counts[p.id] = countData.count
    }
    setUnreadCounts(counts)
  }

  return (
    <div className="min-h-screen bg-app-bg pb-20">
      <PageHeader title="案件チャット" onBack={() => navigate(-1)} />

      <div className="px-4 space-y-3">
        {projects.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate(`/chat/${p.id}`)}
            className="bg-card p-4 rounded-lg flex items-center gap-3 cursor-pointer active:bg-gray-700"
          >
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-2xl">
              🏗️
            </div>
            <div className="flex-1">
              <div className="text-white font-bold">{p.name}</div>
              <div className="text-gray-400 text-sm">{p.client}</div>
            </div>
            {unreadCounts[p.id] > 0 && (
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                {unreadCounts[p.id]}
              </div>
            )}
          </motion.div>
        ))}

        {projects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            進行中の案件がありません
          </div>
        )}
      </div>
    </div>
  )
}
