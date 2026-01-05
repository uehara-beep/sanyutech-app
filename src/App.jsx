import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import AIHelpButton from './components/AIHelpButton'
import SplashScreen from './components/SplashScreen'
import { useThemeStore, useAuthStore, backgroundStyles } from './store'
import LoginPage from './pages/LoginPage'

// Pages
import HomePage from './pages/HomePage'
import SubMenuPage from './pages/SubMenuPage'
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

// 追加ページ
import ClientsPage from './pages/ClientsPage'
import SalesSchedulePage from './pages/SalesSchedulePage'
import DailyReportPage from './pages/DailyReportPage'
import DocumentsPage from './pages/DocumentsPage'
import IncomePage from './pages/IncomePage'
import ExpensePayPage from './pages/ExpensePayPage'

// タスク17-24の新ページ
import DrawingsPage from './pages/DrawingsPage'
import PhotosPage from './pages/PhotosPage'
import InspectionsPage from './pages/InspectionsPage'
import SafetyPage from './pages/SafetyPage'
import ChatPage, { ChatListPage } from './pages/ChatPage'
import SettingsPage, { UsersPage, IntegrationsPage, ExportPage, LineWorksPage, LineWorksSettingsPage, CompanySettingsPage } from './pages/SettingsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import BusinessCardsPage from './pages/BusinessCardsPage'
import QuotesPage from './pages/QuotesPage'
import QuoteCreatePage from './pages/QuoteCreatePage'
import QuoteImportPage from './pages/QuoteImportPage'
import ClientRankingPage from './pages/ClientRankingPage'
import WorkersPage from './pages/WorkersPage'
import EmployeeMasterPage from './pages/EmployeeMasterPage'
import SitesPage from './pages/SitesPage'
import ExpenseNewPage from './pages/ExpenseNewPage'
import MaterialSlipPage from './pages/MaterialSlipPage'
import MonthlyReportPage from './pages/MonthlyReportPage'
import OCRPage from './pages/OCRPage'
import HotelSearch from './components/HotelSearch'
import ProjectDetailPage2 from './pages/ProjectDetailPage'

// 認証が必要なルートを保護するコンポーネント
function ProtectedRoute({ children }) {
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const location = useLocation()

  // ハイドレーション完了まで待機（ローディング表示）
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default function App() {
  const { initTheme, backgroundId } = useThemeStore()
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const [showSplash, setShowSplash] = useState(true)
  const currentBg = backgroundStyles.find(b => b.id === backgroundId) || backgroundStyles[0]
  const location = useLocation()

  // ログインページかどうか
  const isLoginPage = location.pathname === '/login'

  // アプリ起動時にテーマを初期化（一度だけ実行）
  useEffect(() => {
    initTheme()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // スプラッシュスクリーンを2秒後に非表示
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // 背景スタイルを構築
  const bgStyle = {
    background: currentBg.bg,
    ...(currentBg.bgStyle || {}),
    color: 'var(--text)',
  }

  return (
    <div className="min-h-screen" style={bgStyle}>
      {/* スプラッシュスクリーン（ログインページ以外で表示） */}
      {!isLoginPage && <SplashScreen isVisible={showSplash} />}

      <Routes>
        {/* ログイン */}
        <Route path="/login" element={
          !_hasHydrated ? (
            <div className="min-h-screen flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        } />

        {/* メイン（認証必須） */}
        <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/menu/:category" element={<SubMenuPage />} />
        <Route path="/dantori" element={<DantoriPage />} />
        <Route path="/sbase" element={<SbasePage />} />
        <Route path="/sbase/:id" element={<ProjectDetailPage />} />
        <Route path="/ky" element={<KYPage />} />
        <Route path="/schedule" element={<SchedulePage />} />

        {/* 撮影ステーション */}
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/scan-result" element={<ScanResultPage />} />

        {/* 経理・事務 */}
        <Route path="/quotes" element={<QuotesPage />} />
        <Route path="/quotes/new" element={<QuoteCreatePage />} />
        <Route path="/quotes/:id/edit" element={<QuoteCreatePage />} />
        <Route path="/quotes/import" element={<QuoteImportPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage2 />} />
        <Route path="/invoice" element={<InvoicePage />} />
        <Route path="/price-master" element={<PriceMasterPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/material-slip" element={<MaterialSlipPage />} />
        <Route path="/expense" element={<ExpensePage />} />
        <Route path="/expense/new" element={<ExpenseNewPage />} />
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

        {/* 追加機能 */}
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/ranking" element={<ClientRankingPage />} />
        <Route path="/workers" element={<WorkersPage />} />
        <Route path="/ocr" element={<OCRPage />} />
        <Route path="/sites" element={<SitesPage />} />
        <Route path="/sales-schedule" element={<SalesSchedulePage />} />
        <Route path="/daily-report" element={<DailyReportPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/income" element={<IncomePage />} />
        <Route path="/expense-pay" element={<ExpensePayPage />} />

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
        <Route path="/settings/lineworks" element={<LineWorksSettingsPage />} />
        <Route path="/settings/company" element={<CompanySettingsPage />} />
        <Route path="/settings/employees" element={<EmployeeMasterPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/monthly-report" element={<MonthlyReportPage />} />
        <Route path="/business-cards" element={<BusinessCardsPage />} />
        <Route path="/hotel" element={<HotelSearch />} />
      </Routes>

      {/* ログインページ以外でナビゲーションを表示 */}
      {isAuthenticated && !isLoginPage && (
        <>
          <BottomNav />
          <AIHelpButton />
        </>
      )}
    </div>
  )
}
