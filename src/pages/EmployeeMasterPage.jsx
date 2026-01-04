import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// 社員マスタは /settings/users に統合されました
export default function EmployeeMasterPage() {
  const navigate = useNavigate()

  useEffect(() => {
    // ユーザー管理ページにリダイレクト
    navigate('/settings/users', { replace: true })
  }, [navigate])

  return null
}

// 以下は参照用に残しますが使用されません
function EmployeeMasterPageLegacy() {
  const navigate = useNavigate()

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/workers/`)
      if (res.ok) {
        setEmployees(await res.json())
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  // LINE WORKSインポート
  const handleImportFile = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!token) {
      showToast('ログインが必要です')
      return
    }

    setImporting(true)
    setImportResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/workers/import-lineworks`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })

      const data = await res.json()

      if (res.ok) {
        setImportResult({
          success: true,
          imported: data.imported,
          updated: data.updated,
          errors: data.errors
        })
        fetchEmployees()
      } else {
        setImportResult({
          success: false,
          error: `${res.status}: ${data.detail || JSON.stringify(data)}`
        })
      }
    } catch (e) {
      setImportResult({
        success: false,
        error: `エラー: ${e.message}`
      })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 社員削除
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/workers/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        showToast('削除しました')
        fetchEmployees()
      } else {
        showToast('削除に失敗しました')
      }
    } catch (e) {
      showToast('エラーが発生しました')
    }
    setShowDeleteConfirm(null)
  }

  // 現場作業員フラグ切り替え
  const toggleFieldWorker = async (employee) => {
    try {
      const res = await fetch(`${API_BASE}/workers/${employee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...employee,
          is_field_worker: !employee.is_field_worker
        })
      })
      if (res.ok) {
        showToast(employee.is_field_worker ? '現場作業員から外しました' : '現場作業員に設定しました')
        fetchEmployees()
      }
    } catch (e) {
      showToast('エラーが発生しました')
    }
  }

  // 部署リスト取得
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))]

  const filteredEmployees = employees.filter(e => {
    if (filter && !e.name.includes(filter) && !e.department?.includes(filter) && !e.position?.includes(filter)) return false
    if (deptFilter !== 'all' && e.department !== deptFilter) return false
    return true
  })

  const activeEmployees = filteredEmployees.filter(e => e.is_active !== false)
  const inactiveEmployees = filteredEmployees.filter(e => e.is_active === false)

  const inputBg = isOcean ? 'rgba(255,255,255,0.1)' : isLightTheme ? 'rgba(0,0,0,0.05)' : '#1f1f1f'

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="社員マスタ"
        icon="👥"
        gradient="from-indigo-700 to-indigo-500"
        onBack={() => navigate(-1)}
        action={
          <button
            onClick={() => { setEditingEmployee(null); setShowAddModal(true) }}
            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg"
          >
            +
          </button>
        }
      />

      <div className="px-5 py-4 space-y-4">
        {/* 検索・フィルター */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: currentBg.text }} />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="名前・部署・役職で検索..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl"
              style={{ background: inputBg, color: currentBg.text, border: `1px solid ${currentBg.border}` }}
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl"
            style={{ background: inputBg, color: currentBg.text, border: `1px solid ${currentBg.border}` }}
          >
            <option value="all">全部署</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* 集計 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-indigo-400">{activeEmployees.length}</div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>全社員</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-emerald-400">
              {employees.filter(e => e.is_field_worker && e.is_active !== false).length}
            </div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>現場作業員</div>
          </Card>
          <Card className="text-center py-3">
            <div className="text-2xl font-bold text-green-400">
              {employees.filter(e => e.lineworks_id && e.is_active !== false).length}
            </div>
            <div className="text-xs" style={{ color: currentBg.textLight }}>LINE連携</div>
          </Card>
        </div>

        {/* LINE WORKSインポート（管理者のみ） */}
        {user?.role === 'admin' && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <Users size={20} className="text-green-500" />
                </div>
                <div>
                  <div className="font-medium text-sm" style={{ color: currentBg.text }}>LINE WORKSインポート</div>
                  <div className="text-xs" style={{ color: currentBg.textLight }}>CSVから社員を一括登録</div>
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #00C73C, #00B136)',
                  color: 'white',
                  opacity: importing ? 0.7 : 1
                }}
              >
                <Upload size={16} />
                {importing ? 'インポート中...' : 'CSV選択'}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportFile}
              className="hidden"
            />

            <AnimatePresence>
              {importResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-3 rounded-xl"
                  style={{ background: importResult.success ? '#10b98120' : '#ef444420' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.success ? (
                      <CheckCircle size={18} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={18} className="text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${importResult.success ? 'text-emerald-500' : 'text-red-500'}`}>
                      {importResult.success ? 'インポート完了' : 'インポート失敗'}
                    </span>
                  </div>
                  {importResult.success ? (
                    <div className="text-xs space-y-1" style={{ color: currentBg.text }}>
                      <p>新規登録: {importResult.imported}名</p>
                      <p>更新: {importResult.updated}名</p>
                      {importResult.errors?.length > 0 && (
                        <p className="text-amber-500">エラー: {importResult.errors.length}件</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-red-400">{importResult.error}</p>
                  )}
                  <button
                    onClick={() => setImportResult(null)}
                    className="mt-2 text-xs underline"
                    style={{ color: currentBg.textLight }}
                  >
                    閉じる
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )}

        {/* 社員リスト */}
        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : (
          <>
            <div className="text-sm font-bold" style={{ color: currentBg.text }}>
              社員一覧（{activeEmployees.length}名）
            </div>
            {activeEmployees.length === 0 ? (
              <Card className="text-center py-6" style={{ color: currentBg.textLight }}>
                <div className="text-2xl mb-2">📭</div>
                <div className="text-sm">社員がいません</div>
              </Card>
            ) : (
              activeEmployees.map((employee, i) => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <Card className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                        employee.is_field_worker ? 'bg-emerald-500/20' : 'bg-indigo-500/20'
                      }`}>
                        {employee.is_field_worker ? '👷' : '👤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium" style={{ color: currentBg.text }}>{employee.name}</span>
                          {employee.position && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-400">
                              {employee.position}
                            </span>
                          )}
                          {employee.is_field_worker && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 flex items-center gap-0.5">
                              <HardHat size={10} /> 現場
                            </span>
                          )}
                        </div>
                        <div className="text-xs" style={{ color: currentBg.textLight }}>
                          {employee.department || '未配属'} / {employee.employment_type || '社員'}
                        </div>
                        {employee.lineworks_id && (
                          <div className="text-[10px] mt-0.5" style={{ color: currentBg.textLight }}>
                            <span className="text-green-500">●</span> LINE WORKS連携済
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => toggleFieldWorker(employee)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                            employee.is_field_worker ? 'bg-emerald-500/20' : 'bg-gray-500/20'
                          }`}
                          title={employee.is_field_worker ? '現場作業員から外す' : '現場作業員に設定'}
                        >
                          <HardHat size={16} className={employee.is_field_worker ? 'text-emerald-500' : 'text-gray-400'} />
                        </button>
                        <button
                          onClick={() => { setEditingEmployee(employee); setShowAddModal(true) }}
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{ background: inputBg }}
                        >
                          <Edit2 size={16} style={{ color: currentBg.textLight }} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(employee)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/20"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}

            {inactiveEmployees.length > 0 && (
              <>
                <div className="text-sm font-bold mt-6" style={{ color: currentBg.textLight }}>
                  非稼働（{inactiveEmployees.length}名）
                </div>
                {inactiveEmployees.map((employee) => (
                  <Card key={employee.id} className="p-3 opacity-50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-gray-500/20">
                        👤
                      </div>
                      <div className="flex-1">
                        <div className="font-medium" style={{ color: currentBg.text }}>{employee.name}</div>
                        <div className="text-xs" style={{ color: currentBg.textLight }}>
                          {employee.department || '未配属'}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </>
        )}

        <Button block onClick={() => { setEditingEmployee(null); setShowAddModal(true) }}>+ 社員を追加</Button>
      </div>

      <EmployeeModal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setEditingEmployee(null) }}
        onSuccess={fetchEmployees}
        showToast={showToast}
        employee={editingEmployee}
        token={token}
      />

      {/* 削除確認モーダル */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="rounded-2xl p-6 max-w-sm w-full"
              style={{ background: currentBg.cardBg || currentBg.bg }}
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2" style={{ color: currentBg.text }}>削除確認</h3>
              <p className="text-sm mb-4" style={{ color: currentBg.textLight }}>
                「{showDeleteConfirm.name}」を削除しますか？
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} className="flex-1">
                  キャンセル
                </Button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm.id)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium"
                >
                  削除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}

function EmployeeModal({ isOpen, onClose, onSuccess, showToast, employee, token }) {
  const [form, setForm] = useState({
    name: '',
    department: '',
    position: '',
    team: '',
    employment_type: '社員',
    phone: '',
    email: '',
    lineworks_id: '',
    daily_rate: '',
    is_field_worker: false,
    is_active: true,
  })

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || '',
        department: employee.department || '',
        position: employee.position || '',
        team: employee.team || '',
        employment_type: employee.employment_type || '社員',
        phone: employee.phone || '',
        email: employee.email || '',
        lineworks_id: employee.lineworks_id || '',
        daily_rate: employee.daily_rate || '',
        is_field_worker: employee.is_field_worker || false,
        is_active: employee.is_active !== false,
      })
    } else {
      setForm({
        name: '',
        department: '',
        position: '',
        team: '',
        employment_type: '社員',
        phone: '',
        email: '',
        lineworks_id: '',
        daily_rate: '',
        is_field_worker: false,
        is_active: true,
      })
    }
  }, [employee, isOpen])

  const handleSubmit = async () => {
    if (!form.name) {
      showToast('名前を入力してください')
      return
    }

    try {
      const url = employee ? `${API_BASE}/workers/${employee.id}` : `${API_BASE}/workers/`
      const method = employee ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...form,
          daily_rate: form.daily_rate ? parseInt(form.daily_rate) : null,
        }),
      })

      if (res.ok) {
        showToast(employee ? '更新しました' : '社員を追加しました')
        onClose()
        onSuccess()
      } else {
        showToast('エラーが発生しました')
      }
    } catch (error) {
      showToast('エラーが発生しました')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? '👤 社員を編集' : '👤 社員を追加'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">{employee ? '更新' : '登録'}</Button>
        </>
      }
    >
      <Input
        label="名前 *"
        placeholder="例: 田中太郎"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <Input
        label="部署"
        placeholder="例: 工務部"
        value={form.department}
        onChange={(e) => setForm({ ...form, department: e.target.value })}
      />
      <Input
        label="役職"
        placeholder="例: 課長"
        value={form.position}
        onChange={(e) => setForm({ ...form, position: e.target.value })}
      />
      <Select
        label="班（現場配置用）"
        value={form.team}
        onChange={(e) => setForm({ ...form, team: e.target.value })}
        options={[
          { value: '', label: '選択してください' },
          { value: '舗装班', label: '舗装班' },
          { value: '高速班', label: '高速班' },
          { value: '土木班', label: '土木班' },
        ]}
      />
      <Select
        label="雇用形態"
        value={form.employment_type}
        onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
        options={[
          { value: '社員', label: '社員' },
          { value: '契約', label: '契約' },
          { value: '外注', label: '外注' },
        ]}
      />
      <Input
        label="電話番号"
        placeholder="例: 090-1234-5678"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <Input
        label="メールアドレス"
        type="email"
        placeholder="例: tanaka@example.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label="LINE WORKS ID"
        placeholder="LINE WORKS連携用"
        value={form.lineworks_id}
        onChange={(e) => setForm({ ...form, lineworks_id: e.target.value })}
      />
      <Input
        label="日当（現場作業員用）"
        type="number"
        placeholder="例: 15000"
        value={form.daily_rate}
        onChange={(e) => setForm({ ...form, daily_rate: e.target.value })}
      />

      {/* 現場作業員フラグ */}
      <div className="flex items-center gap-3 py-3 px-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_field_worker}
            onChange={(e) => setForm({ ...form, is_field_worker: e.target.checked })}
            className="w-5 h-5 rounded accent-emerald-500"
          />
          <span className="text-sm flex items-center gap-1">
            <HardHat size={16} className="text-emerald-500" />
            現場作業員（日報配置で使用）
          </span>
        </label>
      </div>

      {/* 有効フラグ */}
      <div className="flex items-center gap-3 py-3 px-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-5 h-5 rounded accent-blue-500"
          />
          <span className="text-sm">有効（チェックを外すと非稼働）</span>
        </label>
      </div>
    </Modal>
  )
}
