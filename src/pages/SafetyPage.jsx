import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

export default function SafetyPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const isOcean = currentBg?.hasOceanEffect
  const isLightTheme = backgroundId === 'white' || backgroundId === 'gray'

  // カードスタイル
  const cardBg = isOcean ? 'rgba(255,255,255,0.12)' : isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(30,30,32,0.95)'
  const cardBorder = isOcean ? 'rgba(255,255,255,0.18)' : isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(60,60,62,1)'
  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  const [activeTab, setActiveTab] = useState('roster')
  const [registrations, setRegistrations] = useState([])
  const [trainings, setTrainings] = useState([])
  const [qualifications, setQualifications] = useState([])
  const [healthAlerts, setHealthAlerts] = useState([])
  const [workers, setWorkers] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState('')
  const [showModal, setShowModal] = useState(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetchData()
  }, [selectedProject])

  const fetchData = async () => {
    const [workersRes, projectsRes, alertsRes] = await Promise.all([
      fetch(`${API_BASE}/workers/`),
      fetch(`${API_BASE}/projects`),
      fetch(`${API_BASE}/safety/health-check-alerts`)
    ])
    setWorkers(await workersRes.json())
    setProjects(await projectsRes.json())
    setHealthAlerts(await alertsRes.json())

    const regUrl = selectedProject ? `${API_BASE}/worker-registrations/?project_id=${selectedProject}` : `${API_BASE}/worker-registrations/`
    const trainingUrl = selectedProject ? `${API_BASE}/safety-trainings/?project_id=${selectedProject}` : `${API_BASE}/safety-trainings/`

    const [regRes, trainingRes, qualRes] = await Promise.all([
      fetch(regUrl),
      fetch(trainingUrl),
      fetch(`${API_BASE}/qualifications/expiring`)
    ])
    setRegistrations(await regRes.json())
    setTrainings(await trainingRes.json())
    setQualifications(await qualRes.json())
  }

  const handleAddRegistration = async (e) => {
    e.preventDefault()
    const form = e.target
    const data = {
      worker_id: parseInt(form.worker_id.value),
      project_id: parseInt(form.project_id.value),
      blood_type: form.blood_type.value,
      emergency_contact: form.emergency_contact.value,
      emergency_phone: form.emergency_phone.value,
      health_check_date: form.health_check_date.value || null
    }
    await fetch(`${API_BASE}/worker-registrations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    setShowModal(null)
    fetchData()
    setToast('登録しました')
    setTimeout(() => setToast(''), 2000)
  }

  const handleAddTraining = async (e) => {
    e.preventDefault()
    const form = e.target
    const data = {
      project_id: parseInt(form.project_id.value),
      worker_id: parseInt(form.worker_id.value),
      training_date: form.training_date.value,
      training_type: form.training_type.value,
      trainer: form.trainer.value
    }
    await fetch(`${API_BASE}/safety-trainings/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    setShowModal(null)
    fetchData()
    setToast('教育記録を登録しました')
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: currentBg.bg }}>
      <PageHeader title="安全書類（グリーンファイル）" onBack={() => navigate(-1)} />

      <div className="px-4 space-y-4">
        {/* 案件フィルター */}
        <select
          className="w-full p-3 rounded-lg border-0"
          style={{ background: cardBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        >
          <option value="">全案件</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* アラート */}
        {(healthAlerts.length > 0 || qualifications.length > 0) && (
          <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-lg">
            <div className="text-red-400 font-bold mb-2">⚠️ 期限アラート</div>
            {healthAlerts.map((a, i) => (
              <div key={i} className="text-sm text-red-300">
                {a.worker_name}: 健康診断期限 {a.health_check_date}
              </div>
            ))}
            {qualifications.map((q, i) => (
              <div key={i} className="text-sm text-red-300">
                資格「{q.name}」期限: {q.expiry_date}
              </div>
            ))}
          </div>
        )}

        {/* タブ */}
        <div className="flex rounded-lg p-1 text-sm" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex-1 py-2 rounded-lg ${activeTab === 'roster' ? 'bg-blue-500 text-white' : ''}`}
            style={activeTab !== 'roster' ? { color: currentBg.textLight } : {}}
          >
            作業員名簿
          </button>
          <button
            onClick={() => setActiveTab('training')}
            className={`flex-1 py-2 rounded-lg ${activeTab === 'training' ? 'bg-blue-500 text-white' : ''}`}
            style={activeTab !== 'training' ? { color: currentBg.textLight } : {}}
          >
            安全教育
          </button>
          <button
            onClick={() => setActiveTab('qualification')}
            className={`flex-1 py-2 rounded-lg ${activeTab === 'qualification' ? 'bg-blue-500 text-white' : ''}`}
            style={activeTab !== 'qualification' ? { color: currentBg.textLight } : {}}
          >
            資格証
          </button>
        </div>

        {/* 作業員名簿 */}
        {activeTab === 'roster' && (
          <>
            <button
              onClick={() => setShowModal('registration')}
              className="w-full py-3 bg-blue-500 rounded-lg text-white"
            >
              + 作業員を登録
            </button>

            <div className="space-y-3">
              {registrations.map(reg => (
                <motion.div
                  key={reg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold" style={{ color: currentBg.text }}>{reg.worker_name}</div>
                      <div className="text-sm mt-1" style={{ color: currentBg.textLight }}>
                        血液型: {reg.blood_type || '-'} /
                        健康診断: {reg.health_check_date || '-'}
                      </div>
                      <div className="text-xs mt-1" style={{ color: currentBg.textLight }}>
                        緊急連絡: {reg.emergency_contact || '-'} ({reg.emergency_phone || '-'})
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {registrations.length === 0 && (
                <div className="text-center py-12" style={{ color: currentBg.textLight }}>
                  登録がありません
                </div>
              )}
            </div>
          </>
        )}

        {/* 安全教育 */}
        {activeTab === 'training' && (
          <>
            <button
              onClick={() => setShowModal('training')}
              className="w-full py-3 bg-blue-500 rounded-lg text-white"
            >
              + 教育記録を追加
            </button>

            <div className="space-y-3">
              {trainings.map(t => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs bg-green-500 rounded text-white">
                      {t.training_type}
                    </span>
                  </div>
                  <div className="text-sm mt-2" style={{ color: currentBg.textLight }}>
                    実施日: {t.training_date} / 教育者: {t.trainer || '-'}
                  </div>
                </motion.div>
              ))}

              {trainings.length === 0 && (
                <div className="text-center py-12" style={{ color: currentBg.textLight }}>
                  教育記録がありません
                </div>
              )}
            </div>
          </>
        )}

        {/* 資格証 */}
        {activeTab === 'qualification' && (
          <div className="space-y-3">
            {qualifications.length > 0 ? (
              qualifications.map(q => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}` }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold" style={{ color: currentBg.text }}>{q.name}</div>
                      <div className="text-sm mt-1" style={{ color: currentBg.textLight }}>
                        番号: {q.number || '-'}
                      </div>
                      <div className="text-yellow-400 text-xs mt-1">
                        有効期限: {q.expiry_date}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12" style={{ color: currentBg.textLight }}>
                期限が近い資格はありません
              </div>
            )}
          </div>
        )}
      </div>

      {/* 作業員登録モーダル */}
      {showModal === 'registration' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, backdropFilter: isOcean ? 'blur(10px)' : 'none' }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: currentBg.text }}>作業員登録</h3>
            <form onSubmit={handleAddRegistration} className="space-y-4">
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>作業員</label>
                <select name="worker_id" required className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>案件</label>
                <select name="project_id" required className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>血液型</label>
                <select name="blood_type" className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}>
                  <option value="">-</option>
                  <option value="A">A型</option>
                  <option value="B">B型</option>
                  <option value="O">O型</option>
                  <option value="AB">AB型</option>
                </select>
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>緊急連絡先（氏名）</label>
                <input name="emergency_contact" className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }} />
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>緊急連絡先（電話）</label>
                <input name="emergency_phone" className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }} />
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>健康診断日</label>
                <input type="date" name="health_check_date" className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-3 rounded-lg" style={{ background: inputBg, color: currentBg.text }}>
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

      {/* 教育記録モーダル */}
      {showModal === 'training' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 rounded-xl w-full max-w-md"
            style={{ background: cardBg, border: `1px solid ${cardBorder}`, backdropFilter: isOcean ? 'blur(10px)' : 'none' }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: currentBg.text }}>安全教育記録</h3>
            <form onSubmit={handleAddTraining} className="space-y-4">
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>案件</label>
                <select name="project_id" required className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>作業員</label>
                <select name="worker_id" required className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}>
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>教育種別</label>
                <select name="training_type" required className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }}>
                  <option value="新規入場者教育">新規入場者教育</option>
                  <option value="送り出し教育">送り出し教育</option>
                  <option value="定期安全教育">定期安全教育</option>
                </select>
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>実施日</label>
                <input type="date" name="training_date" required className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }} />
              </div>
              <div>
                <label className="text-sm" style={{ color: currentBg.textLight }}>教育者</label>
                <input name="trainer" className="w-full p-3 rounded-lg" style={{ background: inputBg, color: currentBg.text, border: `1px solid ${cardBorder}` }} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(null)} className="flex-1 py-3 rounded-lg" style={{ background: inputBg, color: currentBg.text }}>
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
