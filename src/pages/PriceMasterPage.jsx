import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Header, Tabs, Card, SectionTitle, Button, Modal, Input, Select, Toast, Empty } from '../components/common'
import { Plus, Trash2, Edit3, ArrowLeft } from 'lucide-react'
import { useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

export default function PriceMasterPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[2]

  const [activeTab, setActiveTab] = useState('clients')
  const [toast, setToast] = useState({ show: false, message: '' })

  const tabs = [
    { id: 'clients', label: '元請け' },
    { id: 'vendors', label: '業者' },
    { id: 'materials', label: '材料' },
    { id: 'machines', label: '機械' },
    { id: 'workTypes', label: '工種' },
  ]

  const showToast = (message) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="単価マスタ"
        icon="💰"
        showBack
        onBack={() => navigate(-1)}
      />

      <div className="px-4 pt-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-4">
          {activeTab === 'clients' && <ClientsTab showToast={showToast} />}
          {activeTab === 'vendors' && <VendorsTab showToast={showToast} />}
          {activeTab === 'materials' && <MaterialsTab showToast={showToast} />}
          {activeTab === 'machines' && <MachinesTab showToast={showToast} />}
          {activeTab === 'workTypes' && <WorkTypesTab showToast={showToast} />}
        </div>
      </div>

      <Toast message={toast.message} isVisible={toast.show} />
    </div>
  )
}

// ============================================
// 元請けマスタ
// ============================================
function ClientsTab({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, data: null })

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/clients/`)
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async (formData) => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const url = formData.id ? `${API_BASE}/clients/${formData.id}` : `${API_BASE}/clients/`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        showToast(formData.id ? '更新しました' : '登録しました')
        setModal({ open: false, data: null })
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('削除しますか？')) return
    try {
      const res = await fetch(`${API_BASE}/clients/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('削除しました')
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <SectionTitle>🏢 元請けマスタ</SectionTitle>
        <Button size="sm" onClick={() => setModal({ open: true, data: null })}>
          <Plus size={16} className="inline mr-1" />追加
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">読み込み中...</div>
      ) : data.length === 0 ? (
        <Empty icon="🏢" title="元請けがありません" subtitle="新規追加してください" />
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <Card key={item.id} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-slate-400">
                  締め日: {item.closing_day || 25}日 /
                  支払: {item.payment_month_offset === 0 ? '当月' : item.payment_month_offset === 1 ? '翌月' : '翌々月'}{item.payment_day || 25}日
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal({ open: true, data: item })} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ClientModal
        isOpen={modal.open}
        data={modal.data}
        onClose={() => setModal({ open: false, data: null })}
        onSave={handleSave}
      />
    </>
  )
}

function ClientModal({ isOpen, data, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    closing_day: 25,
    payment_month_offset: 1,
    payment_day: 25
  })

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        name: data.name || '',
        closing_day: data.closing_day || 25,
        payment_month_offset: data.payment_month_offset ?? 1,
        payment_day: data.payment_day || 25
      })
    } else {
      setForm({ name: '', closing_day: 25, payment_month_offset: 1, payment_day: 25 })
    }
  }, [data, isOpen])

  const handleSubmit = () => {
    if (!form.name) {
      alert('会社名を入力してください')
      return
    }
    onSave(form)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? '元請けを編集' : '元請けを追加'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">保存</Button>
        </>
      }
    >
      <Input
        label="会社名 *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="例：〇〇建設株式会社"
      />
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="締め日"
          type="number"
          min="1"
          max="31"
          value={form.closing_day}
          onChange={(e) => setForm({ ...form, closing_day: parseInt(e.target.value) || 25 })}
        />
        <Select
          label="支払月"
          value={form.payment_month_offset}
          onChange={(e) => setForm({ ...form, payment_month_offset: parseInt(e.target.value) })}
          options={[
            { value: 0, label: '当月' },
            { value: 1, label: '翌月' },
            { value: 2, label: '翌々月' }
          ]}
        />
        <Input
          label="支払日"
          type="number"
          min="1"
          max="31"
          value={form.payment_day}
          onChange={(e) => setForm({ ...form, payment_day: parseInt(e.target.value) || 25 })}
        />
      </div>
    </Modal>
  )
}

// ============================================
// 業者マスタ
// ============================================
function VendorsTab({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, data: null })

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/vendors/`)
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async (formData) => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const url = formData.id ? `${API_BASE}/vendors/${formData.id}` : `${API_BASE}/vendors/`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        showToast(formData.id ? '更新しました' : '登録しました')
        setModal({ open: false, data: null })
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('削除しますか？')) return
    try {
      const res = await fetch(`${API_BASE}/vendors/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('削除しました')
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <SectionTitle>🏭 業者マスタ</SectionTitle>
        <Button size="sm" onClick={() => setModal({ open: true, data: null })}>
          <Plus size={16} className="inline mr-1" />追加
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">読み込み中...</div>
      ) : data.length === 0 ? (
        <Empty icon="🏭" title="業者がありません" subtitle="新規追加してください" />
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <Card key={item.id} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-slate-400">
                  {item.category && <span className="mr-2">{item.category}</span>}
                  {item.default_price > 0 && <span>単価: ¥{item.default_price?.toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal({ open: true, data: item })} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <VendorModal
        isOpen={modal.open}
        data={modal.data}
        onClose={() => setModal({ open: false, data: null })}
        onSave={handleSave}
      />
    </>
  )
}

function VendorModal({ isOpen, data, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    default_price: '',
    unit: '',
    closing_day: 25,
    payment_month_offset: 1,
    payment_day: 25
  })

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        name: data.name || '',
        category: data.category || '',
        default_price: data.default_price || '',
        unit: data.unit || '',
        closing_day: data.closing_day || 25,
        payment_month_offset: data.payment_month_offset ?? 1,
        payment_day: data.payment_day || 25
      })
    } else {
      setForm({ name: '', category: '', default_price: '', unit: '', closing_day: 25, payment_month_offset: 1, payment_day: 25 })
    }
  }, [data, isOpen])

  const handleSubmit = () => {
    if (!form.name) {
      alert('業者名を入力してください')
      return
    }
    onSave({ ...form, default_price: parseFloat(form.default_price) || 0 })
  }

  const categoryOptions = [
    { value: '', label: '選択してください' },
    { value: '外注', label: '外注' },
    { value: '材料', label: '材料' },
    { value: 'リース', label: 'リース' },
    { value: '自社', label: '自社' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? '業者を編集' : '業者を追加'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">保存</Button>
        </>
      }
    >
      <Input
        label="業者名 *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="例：〇〇工業"
      />
      <Select
        label="分類"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        options={categoryOptions}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="単価"
          type="number"
          value={form.default_price}
          onChange={(e) => setForm({ ...form, default_price: e.target.value })}
          placeholder="0"
        />
        <Input
          label="単位"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          placeholder="人工, 式 など"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input
          label="締め日"
          type="number"
          min="1"
          max="31"
          value={form.closing_day}
          onChange={(e) => setForm({ ...form, closing_day: parseInt(e.target.value) || 25 })}
        />
        <Select
          label="支払月"
          value={form.payment_month_offset}
          onChange={(e) => setForm({ ...form, payment_month_offset: parseInt(e.target.value) })}
          options={[
            { value: 0, label: '当月' },
            { value: 1, label: '翌月' },
            { value: 2, label: '翌々月' }
          ]}
        />
        <Input
          label="支払日"
          type="number"
          min="1"
          max="31"
          value={form.payment_day}
          onChange={(e) => setForm({ ...form, payment_day: parseInt(e.target.value) || 25 })}
        />
      </div>
    </Modal>
  )
}

// ============================================
// 材料マスタ
// ============================================
function MaterialsTab({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, data: null })

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/materials/`)
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async (formData) => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const url = formData.id ? `${API_BASE}/materials/${formData.id}` : `${API_BASE}/materials/`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        showToast(formData.id ? '更新しました' : '登録しました')
        setModal({ open: false, data: null })
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('削除しますか？')) return
    try {
      const res = await fetch(`${API_BASE}/materials/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('削除しました')
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <SectionTitle>🧱 材料マスタ</SectionTitle>
        <Button size="sm" onClick={() => setModal({ open: true, data: null })}>
          <Plus size={16} className="inline mr-1" />追加
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">読み込み中...</div>
      ) : data.length === 0 ? (
        <Empty icon="🧱" title="材料がありません" subtitle="新規追加してください" />
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <Card key={item.id} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-slate-400">
                  {item.unit && <span className="mr-2">{item.unit}</span>}
                  {item.unit_price > 0 && <span>単価: ¥{item.unit_price?.toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal({ open: true, data: item })} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <MaterialModal
        isOpen={modal.open}
        data={modal.data}
        onClose={() => setModal({ open: false, data: null })}
        onSave={handleSave}
      />
    </>
  )
}

function MaterialModal({ isOpen, data, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '',
    unit_price: ''
  })

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        name: data.name || '',
        category: data.category || '',
        unit: data.unit || '',
        unit_price: data.unit_price || ''
      })
    } else {
      setForm({ name: '', category: '', unit: '', unit_price: '' })
    }
  }, [data, isOpen])

  const handleSubmit = () => {
    if (!form.name) {
      alert('材料名を入力してください')
      return
    }
    onSave({ ...form, unit_price: parseFloat(form.unit_price) || 0 })
  }

  const unitOptions = [
    { value: '', label: '選択' },
    { value: 'm', label: 'm' },
    { value: 'm2', label: 'm²' },
    { value: 'm3', label: 'm³' },
    { value: 'kg', label: 'kg' },
    { value: 't', label: 't' },
    { value: '本', label: '本' },
    { value: '個', label: '個' },
    { value: '袋', label: '袋' },
    { value: '缶', label: '缶' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? '材料を編集' : '材料を追加'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">保存</Button>
        </>
      }
    >
      <Input
        label="材料名 *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="例：アスファルト合材"
      />
      <Input
        label="分類"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        placeholder="例：舗装材料"
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="単位"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          options={unitOptions}
        />
        <Input
          label="単価"
          type="number"
          value={form.unit_price}
          onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
          placeholder="0"
        />
      </div>
    </Modal>
  )
}

// ============================================
// 機械マスタ
// ============================================
function MachinesTab({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, data: null })

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/machines/`)
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async (formData) => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const url = formData.id ? `${API_BASE}/machines/${formData.id}` : `${API_BASE}/machines/`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        showToast(formData.id ? '更新しました' : '登録しました')
        setModal({ open: false, data: null })
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('削除しますか？')) return
    try {
      const res = await fetch(`${API_BASE}/machines/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('削除しました')
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <SectionTitle>🚜 機械マスタ</SectionTitle>
        <Button size="sm" onClick={() => setModal({ open: true, data: null })}>
          <Plus size={16} className="inline mr-1" />追加
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">読み込み中...</div>
      ) : data.length === 0 ? (
        <Empty icon="🚜" title="機械がありません" subtitle="新規追加してください" />
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <Card key={item.id} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-slate-400">
                  {item.unit && <span className="mr-2">{item.unit}</span>}
                  {item.unit_price > 0 && <span>単価: ¥{item.unit_price?.toLocaleString()}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal({ open: true, data: item })} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <MachineModal
        isOpen={modal.open}
        data={modal.data}
        onClose={() => setModal({ open: false, data: null })}
        onSave={handleSave}
      />
    </>
  )
}

function MachineModal({ isOpen, data, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    category: '',
    unit: '台',
    unit_price: ''
  })

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        name: data.name || '',
        category: data.category || '',
        unit: data.unit || '台',
        unit_price: data.unit_price || ''
      })
    } else {
      setForm({ name: '', category: '', unit: '台', unit_price: '' })
    }
  }, [data, isOpen])

  const handleSubmit = () => {
    if (!form.name) {
      alert('機械名を入力してください')
      return
    }
    onSave({ ...form, unit_price: parseFloat(form.unit_price) || 0 })
  }

  const unitOptions = [
    { value: '台', label: '台' },
    { value: '日', label: '日' },
    { value: 'h', label: 'h' },
    { value: '回', label: '回' }
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? '機械を編集' : '機械を追加'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">保存</Button>
        </>
      }
    >
      <Input
        label="機械名 *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="例：バックホウ 0.7m3"
      />
      <Input
        label="分類"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        placeholder="例：掘削機械"
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="単位"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          options={unitOptions}
        />
        <Input
          label="単価"
          type="number"
          value={form.unit_price}
          onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
          placeholder="0"
        />
      </div>
    </Modal>
  )
}

// ============================================
// 工種マスタ
// ============================================
function WorkTypesTab({ showToast }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, data: null })

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/work-types/`)
      if (res.ok) setData(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSave = async (formData) => {
    try {
      const method = formData.id ? 'PUT' : 'POST'
      const url = formData.id ? `${API_BASE}/work-types/${formData.id}` : `${API_BASE}/work-types/`
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        showToast(formData.id ? '更新しました' : '登録しました')
        setModal({ open: false, data: null })
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('削除しますか？')) return
    try {
      const res = await fetch(`${API_BASE}/work-types/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showToast('削除しました')
        fetchData()
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <SectionTitle>🔧 工種マスタ</SectionTitle>
        <Button size="sm" onClick={() => setModal({ open: true, data: null })}>
          <Plus size={16} className="inline mr-1" />追加
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-400">読み込み中...</div>
      ) : data.length === 0 ? (
        <Empty icon="🔧" title="工種がありません" subtitle="新規追加してください" />
      ) : (
        <div className="space-y-2">
          {data.map((item) => (
            <Card key={item.id} className="flex justify-between items-center">
              <div>
                <div className="font-medium">{item.name}</div>
                {item.category && <div className="text-xs text-slate-400">{item.category}</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setModal({ open: true, data: item })} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <WorkTypeModal
        isOpen={modal.open}
        data={modal.data}
        onClose={() => setModal({ open: false, data: null })}
        onSave={handleSave}
      />
    </>
  )
}

function WorkTypeModal({ isOpen, data, onClose, onSave }) {
  const [form, setForm] = useState({
    name: '',
    category: ''
  })

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        name: data.name || '',
        category: data.category || ''
      })
    } else {
      setForm({ name: '', category: '' })
    }
  }, [data, isOpen])

  const handleSubmit = () => {
    if (!form.name) {
      alert('工種名を入力してください')
      return
    }
    onSave(form)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? '工種を編集' : '工種を追加'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} className="flex-1">キャンセル</Button>
          <Button onClick={handleSubmit} className="flex-1">保存</Button>
        </>
      }
    >
      <Input
        label="工種名 *"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="例：舗装工事"
      />
      <Input
        label="分類"
        value={form.category}
        onChange={(e) => setForm({ ...form, category: e.target.value })}
        placeholder="例：道路工事"
      />
    </Modal>
  )
}
