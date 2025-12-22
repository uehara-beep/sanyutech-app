import { Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import AIHelpButton from './components/AIHelpButton'

// Pages
import HomePage from './pages/HomePage'
import DantoriPage from './pages/DantoriPage'
import SbasePage, { ProjectDetailPage } from './pages/SbasePage'
import ScanPage, { ScanResultPage } from './pages/ScanPage'
import WeatherPage from './pages/WeatherPage'
import { FeedbackPage, HelpPage } from './pages/FeedbackPage'
import {
  ApprovePage,
  NotifyPage,
  EmergencyPage,
  ChecklistPage,
  CarPage,
  EquipmentPage
} from './pages/OtherPages'
import PriceMasterPage from './pages/PriceMasterPage'

// 新しいページ
import ExpensePage from './pages/ExpensePage'
import InvoicePage from './pages/InvoicePage'
import KYPage from './pages/KYPage'
import InventoryPage from './pages/InventoryPage'
import SchedulePage from './pages/SchedulePage'
import AttendancePage from './pages/AttendancePage'
import QRPage from './pages/QRPage'
import SubcontractorPage from './pages/SubcontractorPage'
import OrderPage from './pages/OrderPage'
import TemplatePage from './pages/TemplatePage'
import SearchPage from './pages/SearchPage'
import CalendarPage from './pages/CalendarPage'
import SitePage from './pages/SitePage'

// タスク17-24の新ページ
import DrawingsPage from './pages/DrawingsPage'
import PhotosPage from './pages/PhotosPage'
import InspectionsPage from './pages/InspectionsPage'
import SafetyPage from './pages/SafetyPage'
import ChatPage, { ChatListPage } from './pages/ChatPage'
import SettingsPage, { UsersPage, IntegrationsPage, ExportPage, LineWorksPage, CompanySettingsPage } from './pages/SettingsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import BusinessCardsPage from './pages/BusinessCardsPage'

export default function App() {
  return (
    <div className="min-h-screen bg-app-bg text-slate-800">
      <Routes>
        {/* メイン */}
        <Route path="/" element={<HomePage />} />
        <Route path="/dantori" element={<DantoriPage />} />
        <Route path="/sbase" element={<SbasePage />} />
        <Route path="/sbase/:id" element={<ProjectDetailPage />} />
        <Route path="/ky" element={<KYPage />} />
        <Route path="/schedule" element={<SchedulePage />} />

        {/* 撮影ステーション */}
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/scan-result" element={<ScanResultPage />} />

        {/* 経理・事務 */}
        <Route path="/invoice" element={<InvoicePage />} />
        <Route path="/price-master" element={<PriceMasterPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/expense" element={<ExpensePage />} />
        <Route path="/approve" element={<ApprovePage />} />

        {/* 現場 */}
        <Route path="/site/:id" element={<SitePage />} />
        <Route path="/weather" element={<WeatherPage />} />
        <Route path="/emergency" element={<EmergencyPage />} />
        <Route path="/checklist" element={<ChecklistPage />} />
        <Route path="/qr" element={<QRPage />} />

        {/* 管理 */}
        <Route path="/car" element={<CarPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/subcon" element={<SubcontractorPage />} />
        <Route path="/order" element={<OrderPage />} />
        <Route path="/attendance" element={<AttendancePage />} />

        {/* その他 */}
        <Route path="/notify" element={<NotifyPage />} />
        <Route path="/template" element={<TemplatePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />

        {/* タスク17-24: 新機能 */}
        <Route path="/drawings" element={<DrawingsPage />} />
        <Route path="/photos" element={<PhotosPage />} />
        <Route path="/inspections" element={<InspectionsPage />} />
        <Route path="/safety" element={<SafetyPage />} />
        <Route path="/chat" element={<ChatListPage />} />
        <Route path="/chat/:projectId" element={<ChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/users" element={<UsersPage />} />
        <Route path="/settings/integrations" element={<IntegrationsPage />} />
        <Route path="/settings/export" element={<ExportPage />} />
        <Route path="/settings/lineworks" element={<LineWorksPage />} />
        <Route path="/settings/company" element={<CompanySettingsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/business-cards" element={<BusinessCardsPage />} />
      </Routes>

      <BottomNav />
      <AIHelpButton />
    </div>
  )
}
