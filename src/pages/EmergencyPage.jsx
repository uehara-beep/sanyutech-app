import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header, Card, SectionTitle } from '../components/common'
import { useThemeStore, backgroundStyles } from '../store'
import { API_BASE } from '../config/api'

function ContactCard({ icon, name, detail, tel }) {
  return (
    <a
      href={`tel:${tel}`}
      className="flex items-center gap-3 bg-app-card p-4 rounded-xl mb-2.5"
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="text-[15px] font-semibold">{name}</div>
        <div className="text-xs text-slate-400">{detail}</div>
      </div>
      <div className="w-11 h-11 bg-emerald-500 rounded-full flex items-center justify-center text-xl">
        📞
      </div>
    </a>
  )
}

export default function EmergencyPage() {
  const navigate = useNavigate()
  const { backgroundId } = useThemeStore()
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const res = await fetch(`${API_BASE}/emergency-contacts/`)
      if (res.ok) {
        setContacts(await res.json())
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupedContacts = contacts.reduce((acc, contact) => {
    const role = contact.role || 'other'
    if (!acc[role]) acc[role] = []
    acc[role].push(contact)
    return acc
  }, {})

  return (
    <div className="min-h-screen pb-24" style={{ background: currentBg.bg }}>
      <Header
        title="緊急連絡先"
        icon="🚨"
        gradient="from-red-800 to-red-500"
        onBack={() => navigate(-1)}
      />

      <div className="px-5 py-4">
        <SectionTitle>🆘 緊急通報</SectionTitle>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <a
            href="tel:119"
            className="flex flex-col items-center py-6 bg-gradient-to-br from-red-800 to-red-500 rounded-2xl text-white"
          >
            <span className="text-4xl mb-2">🚒</span>
            <span className="text-sm font-medium">消防・救急</span>
            <span className="text-2xl font-bold mt-1">119</span>
          </a>
          <a
            href="tel:110"
            className="flex flex-col items-center py-6 bg-gradient-to-br from-blue-800 to-blue-500 rounded-2xl text-white"
          >
            <span className="text-4xl mb-2">🚔</span>
            <span className="text-sm font-medium">警察</span>
            <span className="text-2xl font-bold mt-1">110</span>
          </a>
        </div>

        {loading ? (
          <div className="text-center py-8" style={{ color: currentBg.textLight }}>読み込み中...</div>
        ) : (
          <>
            {groupedContacts.hospital?.length > 0 && (
              <>
                <SectionTitle>🏥 最寄り病院</SectionTitle>
                {groupedContacts.hospital.map((contact, i) => (
                  <ContactCard key={i} icon="🏥" name={contact.name} detail={contact.email} tel={contact.phone} />
                ))}
              </>
            )}

            {groupedContacts.client?.length > 0 && (
              <>
                <SectionTitle>🏢 元請け連絡先</SectionTitle>
                {groupedContacts.client.map((contact, i) => (
                  <ContactCard key={i} icon="🏢" name={contact.name} detail={contact.email} tel={contact.phone} />
                ))}
              </>
            )}

            {groupedContacts.internal?.length > 0 && (
              <>
                <SectionTitle>👔 社内連絡先</SectionTitle>
                {groupedContacts.internal.map((contact, i) => (
                  <ContactCard key={i} icon="👔" name={contact.name} detail={contact.email} tel={contact.phone} />
                ))}
              </>
            )}

            {contacts.length === 0 && (
              <Card className="text-center py-6 text-slate-400">
                <div className="text-2xl mb-2">📭</div>
                <div className="text-sm">登録された連絡先はありません</div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
