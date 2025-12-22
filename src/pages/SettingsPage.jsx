import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/common'

const API_BASE = '/api'

export default function SettingsPage() {
  const navigate = useNavigate()

  const menuItems = [
    { icon: '👥', label: 'ユーザー管理', path: '/settings/users' },
    { icon: '🔐', label: '権限設定', path: '/settings/permissions' },
    { icon: '🔗', label: '外部連携', path: '/settings/integrations' },
    { icon: '📤', label: 'データ出力', path: '/settings/export' },
    { icon: '📱', label: 'LINE WORKS', path: '/settings/lineworks' },
    { icon: '🏢', label: '会社情報', path: '/settings/company' },
  ]

  return (
    <div className="min-h-screen bg-app-bg pb-20">
      <PageHeader title="設定" onBack={() => navigate(-1)} />

      <div className="px-4 space-y-3">
        {menuItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(item.path)}
            className="bg-card p-4 rounded-lg flex items-center gap-4 cursor-pointer active:bg-gray-700"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-white flex-1">{item.label}</span>
            <span className="text-gray-500">›</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ユーザー管理ページ
export function UsersPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const res = await fetch(`${API_BASE}/users/`)
    setUsers(await res.json())
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target
    await fetch(`${API_BASE}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email.value,
        name: form.name.value,
        role: form.role.value,
        department: form.department.value
      })
    })
    setShowModal(false)
    fetchUsers()
    setToast('ユーザーを追加しました')
    setTimeout(() => setToast(''), 2000)
  }

  const roleLabels = {
    admin: '管理者',
    manager: 'マネージャー',
    worker: '作業員',
    viewer: '閲覧者'
  }

  return (
    <div className="min-h-screen bg-app-bg pb-20">
      <PageHeader title="ユーザー管理" onBack={() => navigate(-1)} />

      <div className="px-4 space-y-4">
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3 bg-blue-500 rounded-lg text-white"
        >
          + ユーザーを追加
        </button>

        <div className="space-y-3">
          {users.map(user => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card p-4 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-white font-bold">{user.name}</div>
                  <div className="text-gray-400 text-sm">{user.email}</div>
                  <div className="flex gap-2 mt-2">
                    <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">
                      {roleLabels[user.role] || user.role}
                    </span>
                    {user.department && (
                      <span className="px-2 py-0.5 text-xs bg-gray-600 text-gray-300 rounded">
                        {user.department}
                      </span>
                    )}
                  </div>
                </div>
                {!user.is_active && (
                  <span className="text-xs text-red-400">無効</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card p-6 rounded-xl w-full max-w-md"
          >
            <h3 className="text-lg font-bold text-white mb-4">ユーザー追加</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">氏名</label>
                <input name="name" required className="w-full p-3 bg-gray-800 rounded-lg text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400">メールアドレス</label>
                <input name="email" type="email" required className="w-full p-3 bg-gray-800 rounded-lg text-white" />
              </div>
              <div>
                <label className="text-sm text-gray-400">役割</label>
                <select name="role" required className="w-full p-3 bg-gray-800 rounded-lg text-white">
                  <option value="worker">作業員</option>
                  <option value="manager">マネージャー</option>
                  <option value="admin">管理者</option>
                  <option value="viewer">閲覧者</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400">部署</label>
                <input name="department" className="w-full p-3 bg-gray-800 rounded-lg text-white" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-700 rounded-lg">
                  キャンセル
                </button>
                <button type="submit" className="flex-1 py-3 bg-blue-500 rounded-lg text-white">
                  追加
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

// 外部連携ページ
export function IntegrationsPage() {
  const navigate = useNavigate()
  const [integrations, setIntegrations] = useState([])
  const [toast, setToast] = useState('')

  const services = [
    { id: 'line', name: 'LINE Notify', icon: '💬', desc: '通知をLINEに送信' },
    { id: 'google_calendar', name: 'Googleカレンダー', icon: '📅', desc: '工程をカレンダーに同期' },
    { id: 'yayoi', name: '弥生会計', icon: '📊', desc: '仕訳データを出力' },
    { id: 'freee', name: 'freee', icon: '💰', desc: '仕訳データを出力' },
    { id: 'moneyforward', name: 'マネーフォワード', icon: '💳', desc: '仕訳データを出力' },
  ]

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    const res = await fetch(`${API_BASE}/integrations/`)
    setIntegrations(await res.json())
  }

  const isActive = (serviceId) => {
    return integrations.find(i => i.service === serviceId)?.is_active || false
  }

  const handleToggle = async (serviceId) => {
    const current = integrations.find(i => i.service === serviceId)
    await fetch(`${API_BASE}/integrations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: serviceId,
        is_active: !current?.is_active
      })
    })
    fetchIntegrations()
    setToast(current?.is_active ? '無効にしました' : '有効にしました')
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <div className="min-h-screen bg-app-bg pb-20">
      <PageHeader title="外部連携" onBack={() => navigate(-1)} />

      <div className="px-4 space-y-3">
        {services.map(s => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card p-4 rounded-lg"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{s.icon}</span>
              <div className="flex-1">
                <div className="text-white font-bold">{s.name}</div>
                <div className="text-gray-400 text-sm">{s.desc}</div>
              </div>
              <button
                onClick={() => handleToggle(s.id)}
                className={`w-12 h-6 rounded-full relative ${
                  isActive(s.id) ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                  isActive(s.id) ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

// データ出力ページ
export function ExportPage() {
  const navigate = useNavigate()
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7))
  const [toast, setToast] = useState('')

  const handleExport = async (format) => {
    window.open(`${API_BASE}/export/${format}?year_month=${yearMonth}`, '_blank')
    setToast(`${format}形式でダウンロード中...`)
    setTimeout(() => setToast(''), 2000)
  }

  return (
    <div className="min-h-screen bg-app-bg pb-20">
      <PageHeader title="データ出力" onBack={() => navigate(-1)} />

      <div className="px-4 space-y-6">
        <div>
          <label className="text-sm text-gray-400">対象年月</label>
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="w-full p-3 bg-card rounded-lg text-white mt-1"
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-gray-400 font-bold">会計ソフト用CSV</h3>

          <button
            onClick={() => handleExport('yayoi')}
            className="w-full py-4 bg-card rounded-lg text-white flex items-center gap-4"
          >
            <span className="text-2xl">📊</span>
            <div className="text-left">
              <div className="font-bold">弥生会計フォーマット</div>
              <div className="text-sm text-gray-400">仕訳日記帳形式</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('freee')}
            className="w-full py-4 bg-card rounded-lg text-white flex items-center gap-4"
          >
            <span className="text-2xl">💰</span>
            <div className="text-left">
              <div className="font-bold">freeeフォーマット</div>
              <div className="text-sm text-gray-400">取引インポート形式</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('moneyforward')}
            className="w-full py-4 bg-card rounded-lg text-white flex items-center gap-4"
          >
            <span className="text-2xl">💳</span>
            <div className="text-left">
              <div className="font-bold">マネーフォワードフォーマット</div>
              <div className="text-sm text-gray-400">仕訳インポート形式</div>
            </div>
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

// LINE WORKS設定ページ
export function LineWorksPage() {
  const navigate = useNavigate()

  const steps = [
    {
      title: 'LINE WORKS Developer Consoleにアクセス',
      url: 'https://developers.worksmobile.com/',
      desc: 'Developer Consoleにログインします'
    },
    {
      title: 'APIアプリを作成',
      desc: '「Console」→「API」でアプリを作成し、Client IDとClient Secretを取得。OAuth Scopesで「bot」にチェック'
    },
    {
      title: 'Botを登録',
      desc: '「Console」→「Bot」でBotを登録。Bot名: サンユウテック通知Bot、Callback URL: https://your-domain.com/api/lineworks/webhook'
    },
    {
      title: 'Service Accountを作成',
      desc: '「Console」→「Service Account」でPrivate Keyをダウンロード'
    },
    {
      title: '管理者画面でBotを公開',
      desc: 'LINE WORKS管理画面 → Bot → Botを追加'
    },
    {
      title: 'S-BASEで設定を入力',
      desc: '上記の情報を入力し、接続テストを実行'
    },
    {
      title: 'ユーザーにBotを追加',
      desc: 'LINE WORKSアプリ → 連絡先 → Bot → 追加'
    }
  ]

  return (
    <div className="min-h-screen bg-app-bg pb-20">
      <PageHeader title="LINE WORKS導入ガイド" onBack={() => navigate(-1)} />

      <div className="px-4 space-y-4">
        <div className="bg-blue-500/20 border border-blue-500/50 p-4 rounded-lg">
          <div className="text-blue-400 font-bold">📱 LINE WORKS Bot連携</div>
          <div className="text-gray-300 text-sm mt-1">
            S-BASEからの通知をLINE WORKSで受け取れます
          </div>
        </div>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-4 rounded-lg"
            >
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold">{step.title}</div>
                  <div className="text-gray-400 text-sm mt-1">{step.desc}</div>
                  {step.url && (
                    <a
                      href={step.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-sm mt-2 inline-block"
                    >
                      🔗 {step.url}
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <button
          onClick={() => navigate('/settings/integrations')}
          className="w-full py-3 bg-blue-500 rounded-lg text-white mt-6"
        >
          連携設定へ進む
        </button>
      </div>
    </div>
  )
}

// 会社設定ページ
export function CompanySettingsPage() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState({
    company_name: '',
    postal_code: '',
    address: '',
    phone: '',
    fax: '',
    email: '',
    invoice_number: '',
    bank_name: '',
    bank_branch: '',
    account_type: '普通',
    account_number: '',
    account_name: '',
    fiscal_year_start: 4,
    annual_target: 0
  })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/company-settings/`)
      const data = await res.json()
      if (data) setSettings(prev => ({ ...prev, ...data }))
    } catch (e) {
      console.error('Settings load error:', e)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch(`${API_BASE}/company-settings/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      setToast('保存しました')
      setTimeout(() => setToast(''), 2000)
    } catch (e) {
      setToast('保存に失敗しました')
    }
    setSaving(false)
  }

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const formatAmount = (value) => {
    if (!value) return ''
    return Number(value).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-app-bg pb-20">
      <PageHeader title="会社情報" onBack={() => navigate(-1)} />

      <form onSubmit={handleSubmit} className="px-4 space-y-6">
        {/* 基本情報 */}
        <div className="bg-card p-4 rounded-lg space-y-4">
          <h3 className="text-white font-bold border-b border-gray-700 pb-2">基本情報</h3>

          <div>
            <label className="text-sm text-gray-400">会社名</label>
            <input
              value={settings.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
              placeholder="株式会社サンユウテック"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400">郵便番号</label>
              <input
                value={settings.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
                placeholder="000-0000"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">期首月</label>
              <select
                value={settings.fiscal_year_start}
                onChange={(e) => handleChange('fiscal_year_start', parseInt(e.target.value))}
                className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
              >
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">住所</label>
            <input
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
              placeholder="福岡県福岡市..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400">電話番号</label>
              <input
                value={settings.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
                placeholder="000-000-0000"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">FAX</label>
              <input
                value={settings.fax}
                onChange={(e) => handleChange('fax', e.target.value)}
                className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
                placeholder="000-000-0000"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">メールアドレス</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
              placeholder="info@example.com"
            />
          </div>
        </div>

        {/* インボイス */}
        <div className="bg-card p-4 rounded-lg space-y-4">
          <h3 className="text-white font-bold border-b border-gray-700 pb-2">インボイス制度</h3>

          <div>
            <label className="text-sm text-gray-400">適格請求書発行事業者登録番号</label>
            <input
              value={settings.invoice_number}
              onChange={(e) => handleChange('invoice_number', e.target.value)}
              className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
              placeholder="T1234567890123"
            />
            <p className="text-xs text-gray-500 mt-1">13桁の登録番号（Tで始まる）</p>
          </div>
        </div>

        {/* 振込先 */}
        <div className="bg-card p-4 rounded-lg space-y-4">
          <h3 className="text-white font-bold border-b border-gray-700 pb-2">振込先口座</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400">銀行名</label>
              <input
                value={settings.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
                placeholder="〇〇銀行"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">支店名</label>
              <input
                value={settings.bank_branch}
                onChange={(e) => handleChange('bank_branch', e.target.value)}
                className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
                placeholder="〇〇支店"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400">口座種別</label>
              <select
                value={settings.account_type}
                onChange={(e) => handleChange('account_type', e.target.value)}
                className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
              >
                <option value="普通">普通</option>
                <option value="当座">当座</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">口座番号</label>
              <input
                value={settings.account_number}
                onChange={(e) => handleChange('account_number', e.target.value)}
                className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
                placeholder="1234567"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">口座名義</label>
            <input
              value={settings.account_name}
              onChange={(e) => handleChange('account_name', e.target.value)}
              className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1"
              placeholder="カ）サンユウテック"
            />
          </div>
        </div>

        {/* 年間目標 */}
        <div className="bg-card p-4 rounded-lg space-y-4">
          <h3 className="text-white font-bold border-b border-gray-700 pb-2">経営目標</h3>

          <div>
            <label className="text-sm text-gray-400">年間売上目標（円）</label>
            <div className="relative">
              <input
                type="number"
                value={settings.annual_target || ''}
                onChange={(e) => handleChange('annual_target', parseFloat(e.target.value) || 0)}
                className="w-full p-3 bg-gray-800 rounded-lg text-white mt-1 pr-12"
                placeholder="100000000"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">円</span>
            </div>
            {settings.annual_target > 0 && (
              <p className="text-sm text-blue-400 mt-1">
                = {formatAmount(settings.annual_target)}円
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-blue-500 rounded-lg text-white font-bold disabled:bg-blue-500/50"
        >
          {saving ? '保存中...' : '設定を保存'}
        </button>
      </form>

      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg ${
          toast.includes('失敗') ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {toast}
        </div>
      )}
    </div>
  )
}
