import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/common'
import { API_BASE } from '../config/api'

export default function InspectionsPage() {
  const navigate = useNavigate()
  const [inspections, setInspections] = useState([])
  const [corrections, setCorrections] = useState([])
  const [projects, setProjects] = useState([])
  const [activeTab, setActiveTab] = useState('inspections')
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetchProjects()
    fetchInspections()
    fetchCorrections()
  }, [])

  const fetchProjects = async () => {
    const res = await fetch(`${API_BASE}/projects`)
    setProjects(await res.json())
  }

  const fetchInspections = async () => {
    const res = await fetch(`${API_BASE}/inspections/`)
    setInspections(await res.json())
  }

  const fetchCorrections = async () => {
    const res = await fetch(`${API_BASE}/corrections/`)
    setCorrections(await res.json())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target
    const data = {
      project_id: parseInt(form.project_id.value),
      type: form.type.value,
      scheduled_date: form.scheduled_date.value,
      inspector: form.inspector.value,
      note: form.note.value
    }
    await fetch(`${API_BASE}/inspections/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    setShowModal(false)
    fetchInspections()
    setToast('検査を登録しました')
    setTimeout(() => setToast(''), 2000)
  }

  const getStatusColor = (result) => {
    switch (result) {
      case 'pass': return 'bg-green-500'
      case 'fail': return 'bg-red-500'
      default: return 'bg-yellow-500'
    }
  }

  const getStatusText = (result) => {
    switch (result) {
      case 'pass': return '合格'
      case 'fail': return '不合格'
      default: return '未検査'
    }
  }

  return (
    <div className="min-h-screen bg-app-bg pb-20">
      <PageHeader title="検査・是正管理" onBack={() => navigate(-1)} />

      <div className="px-4 space-y-4">
        {/* タブ */}
        <div className="flex bg-card rounded-lg p-1">
          <button
            onClick={() => setActiveTab('inspections')}
            className={`flex-1 py-2 rounded-lg ${activeTab === 'inspections' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
          >
            検査一覧
          </button>
          <button
            onClick={() => setActiveTab('corrections')}
            className={`flex-1 py-2 rounded-lg ${activeTab === 'corrections' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}
          >
            是正指示
          </button>
        </div>

        {activeTab === 'inspections' && (
          <>
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-3 bg-blue-500 rounded-lg text-white"
            >
              + 検査予定を追加
            </button>

            <div className="space-y-3">
              {inspections.map(ins => (
                <motion.div
                  key={ins.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card p-4 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(ins.result)} text-white`}>
                          {getStatusText(ins.result)}
                        </span>
                        <span className="text-white font-bold">{ins.type}</span>
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        予定日: {ins.scheduled_date}
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        検査者: {ins.inspector || '-'}
                      </div>
                    </div>
                    <button className="text-blue-400 text-sm">詳細</button>
                  </div>
                </motion.div>
              ))}

              {inspections.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  検査予定がありません
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'corrections' && (
          <div className="space-y-3">
            {corrections.map(cor => (
              <motion.div
                key={cor.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card p-4 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        cor.status === 'completed' ? 'bg-green-500' :
                        cor.status === 'in_progress' ? 'bg-yellow-500' : 'bg-red-500'
                      } text-white`}>
                        {cor.status === 'completed' ? '完了' :
                         cor.status === 'in_progress' ? '対応中' : '未対応'}
                      </span>
                    </div>
                    <div className="text-white mt-2">{cor.description}</div>
                    <div className="text-gray-500 text-xs mt-2">
                      期限: {cor.due_date || '-'} / 担当: {cor.assigned_to || '-'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {corrections.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                是正指示がありません
              </div>
            )}
          </div>
        )}
      </div>

      {/* 検査登録モーダル */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card p-6 rounded-xl w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-white mb-4">検査予定登録</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">案件</label>
                <select name="project_id" required className="w-full p-3 bg-gray-800 rounded-lg text-white">
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">検査種別</label>
                <select name="type" required className="w-full p-3 bg-gray-800 rounded-lg text-white">
                  <option value="自主検査">自主検査</option>
                  <option value="中間検査">中間検査</option>
                  <option value="完了検査">完了検査</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">予定日</label>
                <input type="date" name="scheduled_date" required className="w-full p-3 bg-gray-800 rounded-lg text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400">検査者</label>
                <input name="inspector" className="w-full p-3 bg-gray-800 rounded-lg text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400">備考</label>
                <textarea name="note" rows={3} className="w-full p-3 bg-gray-800 rounded-lg text-white" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-700 rounded-lg">
                  キャンセル
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-500 rounded-lg text-white">
                  登録
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
