from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    client = Column(String)
    status = Column(String, default="見積中")
    order_type = Column(String, default="一次請")
    prefecture = Column(String)
    probability = Column(String, default="確定")
    order_amount = Column(Integer, default=0)
    budget_amount = Column(Integer, default=0)
    tax_rate = Column(Float, default=0.1)
    period = Column(String)  # 旧形式（後方互換）
    start_date = Column(Date)  # 工期開始日
    end_date = Column(Date)  # 工期終了日
    sales_person = Column(String)
    site_person = Column(String)
    # 位置情報
    address = Column(String)  # 現場住所
    latitude = Column(Float)  # 緯度
    longitude = Column(Float)  # 経度
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Cost(Base):
    __tablename__ = "costs"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=False)
    date = Column(Date, nullable=False)
    category = Column(String, nullable=False)  # 労務費/材料費/外注費/経費
    work_type = Column(String)  # 工種
    vendor = Column(String)
    description = Column(String)
    quantity = Column(Float, default=1)
    unit = Column(String)
    unit_price = Column(Integer, default=0)
    amount = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

class Billing(Base):
    __tablename__ = "billings"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=False)
    bill_type = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    amount = Column(Integer, default=0)
    done = Column(Integer, default=0)
    note = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class FixedCost(Base):
    __tablename__ = "fixed_costs"
    id = Column(Integer, primary_key=True, index=True)
    year_month = Column(String, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String)
    amount = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

# マスタテーブル
class Client(Base):
    """元請けマスタ"""
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    contact_person = Column(String)
    phone = Column(String)
    address = Column(String)
    closing_day = Column(Integer, default=25)  # 締め日（1-31）
    payment_day = Column(Integer, default=25)  # 支払日（1-31）
    payment_month_offset = Column(Integer, default=1)  # 支払月オフセット（0=当月, 1=翌月, 2=翌々月）
    created_at = Column(DateTime, server_default=func.now())

class Vendor(Base):
    """業者マスタ"""
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    category = Column(String)  # 外注/材料/機械
    default_price = Column(Integer, default=0)
    unit = Column(String)
    phone = Column(String)
    closing_day = Column(Integer, default=25)  # 締め日（1-31）
    payment_day = Column(Integer, default=25)  # 支払日（1-31）
    payment_month_offset = Column(Integer, default=1)  # 支払月オフセット（0=当月, 1=翌月, 2=翌々月）
    created_at = Column(DateTime, server_default=func.now())

class Material(Base):
    """材料マスタ"""
    __tablename__ = "materials"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String)
    unit = Column(String)
    unit_price = Column(Integer, default=0)
    vendor = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class Machine(Base):
    """機械マスタ"""
    __tablename__ = "machines"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String)
    unit = Column(String, default="台")
    unit_price = Column(Integer, default=0)
    vendor = Column(String)
    created_at = Column(DateTime, server_default=func.now())

class WorkType(Base):
    """工種マスタ"""
    __tablename__ = "work_types"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    category = Column(String)
    created_at = Column(DateTime, server_default=func.now())


class BudgetDetail(Base):
    """予算明細"""
    __tablename__ = "budget_details"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=False)
    category = Column(String)
    work_type = Column(String)
    vendor = Column(String)
    description = Column(String)
    quantity = Column(Float, default=0)
    unit = Column(String)
    unit_price = Column(Integer, default=0)
    amount = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

class Settings(Base):
    """設定"""
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, nullable=False, unique=True)
    value = Column(String)
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# 経費精算モジュール用テーブル
# ============================================

class ExpenseCategory(Base):
    """経費カテゴリマスタ"""
    __tablename__ = "expense_categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    icon = Column(String(10))
    sort_order = Column(Integer, default=0)
    is_fuel = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class FuelPrice(Base):
    """燃料単価"""
    __tablename__ = "fuel_prices"
    id = Column(Integer, primary_key=True, index=True)
    year_month = Column(String(7), nullable=False)  # YYYY-MM
    fuel_type = Column(String(20), nullable=False)  # regular / diesel
    price_per_liter = Column(Float, nullable=False)
    updated_by = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Expense(Base):
    """経費申請"""
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_id = Column(Integer, default=1)
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=False)
    expense_date = Column(Date, nullable=False)
    amount = Column(Float)  # 燃料費以外の金額
    fuel_type = Column(String(20))  # regular / diesel
    fuel_liter = Column(Float)  # 給油量
    store_name = Column(String(100))
    memo = Column(Text)
    status = Column(String(20), default="pending")  # pending / approved / rejected
    reject_reason = Column(Text)
    approved_by = Column(Integer)
    approved_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ExpenseReceipt(Base):
    """レシート画像"""
    __tablename__ = "expense_receipts"
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"))
    file_path = Column(String(255), nullable=False)
    original_filename = Column(String(255))
    file_size = Column(Integer)
    ocr_result = Column(Text)  # JSON文字列
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# 新構造: 工種管理（60社システム互換）
# ============================================

class ProjectWorkType(Base):
    """案件工種（内訳書レベル）"""
    __tablename__ = "project_work_types"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    seq = Column(Integer, default=1)  # 表示順
    parent_id = Column(Integer, default=None)  # 親工種ID（階層構造用）
    name = Column(String, nullable=False)  # 工種名
    spec = Column(String)  # 形状寸法
    quantity = Column(Float, default=1)  # 設計数量
    unit = Column(String, default="式")  # 単位
    budget_unit_price = Column(Integer, default=0)  # 予算単価
    budget_amount = Column(Integer, default=0)  # 予算金額
    rate = Column(Float, default=1.0)  # 掛率
    estimate_unit_price = Column(Integer, default=0)  # 見積単価
    estimate_amount = Column(Integer, default=0)  # 見積金額
    note = Column(String)  # 摘要
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class WorkTypeDetail(Base):
    """工種明細（品名レベル - 材料費・機械費・労務費など）"""
    __tablename__ = "work_type_details"
    id = Column(Integer, primary_key=True, index=True)
    work_type_id = Column(Integer, ForeignKey("project_work_types.id"), nullable=False)
    seq = Column(Integer, default=1)  # 表示順
    name = Column(String, nullable=False)  # 品名
    spec = Column(String)  # 規格
    formula = Column(String)  # 計算式
    cost_category = Column(String)  # 費目（材料費/機械費/労務費/外注費/経費）
    daily_quantity = Column(Float, default=0)  # 日当数量
    budget_quantity = Column(Float, default=0)  # 予算数量
    unit = Column(String)  # 単位
    budget_unit_price = Column(Integer, default=0)  # 予算単価
    budget_amount = Column(Integer, default=0)  # 予算金額
    procurement = Column(String, default="購買")  # 自損/購買
    is_ordered = Column(Boolean, default=False)  # 発注済み
    vendor = Column(String)  # 発注先
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ============================================
# 出来高調書・入出金管理
# ============================================

class MonthlyProgress(Base):
    """出来高調書（工事別・月別）"""
    __tablename__ = "monthly_progress"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    year_month = Column(String(7), nullable=False)  # YYYY-MM
    progress_amount = Column(Integer, default=0)  # 出来高金額
    progress_rate = Column(Float, default=0)  # 出来高率（%）
    cost_amount = Column(Integer, default=0)  # 原価金額
    gross_profit = Column(Integer, default=0)  # 粗利金額
    gross_profit_rate = Column(Float, default=0)  # 粗利率（%）
    note = Column(Text)  # 備考
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Receivable(Base):
    """入金予定（売掛金）"""
    __tablename__ = "receivables"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    progress_id = Column(Integer, ForeignKey("monthly_progress.id"))  # 関連する出来高
    client_name = Column(String, nullable=False)  # 元請け名
    description = Column(String)  # 内容
    amount = Column(Integer, default=0)  # 入金予定額
    billing_date = Column(Date)  # 請求日
    expected_date = Column(Date, nullable=False)  # 入金予定日
    actual_date = Column(Date)  # 実際の入金日
    status = Column(String, default="予定")  # 予定/請求済/入金済
    note = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Payable(Base):
    """支払予定（買掛金）"""
    __tablename__ = "payables"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))  # 関連工事（任意）
    cost_id = Column(Integer, ForeignKey("costs.id"))  # 関連する原価
    vendor_name = Column(String, nullable=False)  # 業者名
    category = Column(String)  # 外注費/材料費/機械費/経費
    description = Column(String)  # 内容
    amount = Column(Integer, default=0)  # 支払予定額
    invoice_date = Column(Date)  # 請求書日付
    expected_date = Column(Date, nullable=False)  # 支払予定日
    actual_date = Column(Date)  # 実際の支払日
    status = Column(String, default="予定")  # 予定/支払済
    note = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ============================================
# 見積・予算テーブル
# ============================================

class Estimate(Base):
    """見積明細"""
    __tablename__ = "estimates"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    work_type = Column(String)  # 工種
    description = Column(String)  # 明細
    quantity = Column(Float, default=0)  # 数量
    unit = Column(String)  # 単位
    unit_price = Column(Float, default=0)  # 単価
    amount = Column(Float, default=0)  # 金額
    rate = Column(Float, default=1.0)  # 掛率
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Budget(Base):
    """予算明細（案件別）"""
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    work_type = Column(String)  # 工種
    category = Column(String)  # カテゴリ（労務費/材料費/外注費/経費）
    vendor = Column(String)  # 業者名
    description = Column(String)  # 明細
    quantity = Column(Float, default=0)  # 数量
    unit = Column(String)  # 単位
    unit_price = Column(Float, default=0)  # 単価
    amount = Column(Float, default=0)  # 金額
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ============================================
# 経費精算関連
# ============================================

class Approval(Base):
    """承認ワークフロー"""
    __tablename__ = "approvals"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)  # expense/invoice/leave
    reference_id = Column(Integer)  # 参照先ID
    status = Column(String, default="pending")  # pending/approved/rejected
    requested_by = Column(String)  # 申請者
    approved_by = Column(String)  # 承認者
    requested_at = Column(DateTime, server_default=func.now())
    approved_at = Column(DateTime)
    comment = Column(Text)


class Notification(Base):
    """通知"""
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String)
    type = Column(String)  # approval/alert/info
    title = Column(String)
    message = Column(Text)
    link = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# 段取り・人員配置
# ============================================

class Worker(Base):
    """作業員マスタ"""
    __tablename__ = "workers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    team = Column(String)  # 舗装班/高速班
    employment_type = Column(String)  # 社員/契約/外注
    daily_rate = Column(Float, default=0)
    phone = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Assignment(Base):
    """作業員配置"""
    __tablename__ = "assignments"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"))
    worker_id = Column(Integer, ForeignKey("workers.id"))
    start_time = Column(String)
    end_time = Column(String)
    note = Column(String)
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# KY管理
# ============================================

class KYReport(Base):
    """KYレポート"""
    __tablename__ = "ky_reports"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    date = Column(Date, nullable=False)
    work_content = Column(Text)
    hazards = Column(Text)  # JSON配列
    countermeasures = Column(Text)  # JSON配列
    participants = Column(Text)  # JSON配列
    photo_path = Column(String)
    created_by = Column(String)
    created_at = Column(DateTime, server_default=func.now())


class KYSignature(Base):
    """KYサイン"""
    __tablename__ = "ky_signatures"
    id = Column(Integer, primary_key=True, index=True)
    ky_report_id = Column(Integer, ForeignKey("ky_reports.id"))
    worker_id = Column(Integer, ForeignKey("workers.id"))
    signed_at = Column(DateTime)


# ============================================
# 在庫管理
# ============================================

class InventoryItem(Base):
    """在庫品目"""
    __tablename__ = "inventory_items"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String)
    unit = Column(String)
    quantity = Column(Float, default=0)
    min_quantity = Column(Float, default=0)
    location = Column(String)
    created_at = Column(DateTime, server_default=func.now())


class InventoryTransaction(Base):
    """在庫入出庫"""
    __tablename__ = "inventory_transactions"
    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(Integer, ForeignKey("inventory_items.id"))
    type = Column(String)  # in/out
    quantity = Column(Float)
    project_id = Column(Integer, ForeignKey("projects.id"))
    date = Column(Date)
    note = Column(String)
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# 車両管理
# ============================================

class Vehicle(Base):
    """車両"""
    __tablename__ = "vehicles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    plate_number = Column(String)
    type = Column(String)
    inspection_date = Column(Date)  # 車検期限
    insurance_date = Column(Date)  # 保険期限
    created_at = Column(DateTime, server_default=func.now())


class VehicleLog(Base):
    """車両記録"""
    __tablename__ = "vehicle_logs"
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"))
    date = Column(Date)
    driver = Column(String)
    mileage = Column(Float)
    fuel_amount = Column(Float)
    fuel_cost = Column(Float)
    note = Column(String)
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# スケジュール・勤怠
# ============================================

class Schedule(Base):
    """工程スケジュール"""
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    start_date = Column(Date)
    end_date = Column(Date)
    progress_rate = Column(Float, default=0)
    color = Column(String, default="#3b82f6")
    created_at = Column(DateTime, server_default=func.now())


class Attendance(Base):
    """勤怠"""
    __tablename__ = "attendances"
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"))
    date = Column(Date)
    check_in = Column(DateTime)
    check_out = Column(DateTime)
    project_id = Column(Integer, ForeignKey("projects.id"))
    overtime_hours = Column(Float, default=0)
    note = Column(String)
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# その他
# ============================================

class Subcontractor(Base):
    """協力会社"""
    __tablename__ = "subcontractors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact_person = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(String)
    category = Column(String)
    note = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class Order(Base):
    """発注"""
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    vendor_id = Column(Integer, ForeignKey("vendors.id"))
    item_name = Column(String)
    quantity = Column(Float)
    unit = Column(String)
    unit_price = Column(Float)
    total = Column(Float)
    status = Column(String, default="draft")  # draft/ordered/delivered
    order_date = Column(Date)
    delivery_date = Column(Date)
    note = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class Checklist(Base):
    """チェックリスト"""
    __tablename__ = "checklists"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String)
    items = Column(Text)  # JSON配列
    completed_items = Column(Text)  # JSON配列
    created_at = Column(DateTime, server_default=func.now())


class EmergencyContact(Base):
    """緊急連絡先"""
    __tablename__ = "emergency_contacts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String)
    phone = Column(String)
    email = Column(String)
    priority = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())


class Equipment(Base):
    """機材"""
    __tablename__ = "equipment"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String)
    status = Column(String, default="available")  # available/in_use/maintenance
    current_project_id = Column(Integer, ForeignKey("projects.id"))
    note = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class Template(Base):
    """テンプレート"""
    __tablename__ = "templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    type = Column(String)  # ky/checklist/report
    content = Column(Text)  # JSON
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# タスク17: 図面管理
# ============================================

class Drawing(Base):
    """図面"""
    __tablename__ = "drawings"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String, nullable=False)
    version = Column(Integer, default=1)
    file_path = Column(String)
    file_type = Column(String)  # pdf/dwg/jpg
    uploaded_at = Column(DateTime, server_default=func.now())
    uploaded_by = Column(String)
    is_latest = Column(Boolean, default=True)


class DrawingPin(Base):
    """図面ピン（指示・写真紐付け）"""
    __tablename__ = "drawing_pins"
    id = Column(Integer, primary_key=True, index=True)
    drawing_id = Column(Integer, ForeignKey("drawings.id"))
    x = Column(Float)  # X座標(%)
    y = Column(Float)  # Y座標(%)
    pin_type = Column(String)  # instruction/photo/issue
    content = Column(Text)
    photo_id = Column(Integer)  # 紐付け写真ID
    created_by = Column(String)
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# タスク18: 工事写真管理
# ============================================

class SitePhoto(Base):
    """工事写真"""
    __tablename__ = "site_photos"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    category = Column(String)  # 着工前/施工中/完成
    work_type = Column(String)
    photo_path = Column(String)
    thumbnail_path = Column(String)
    blackboard_data = Column(Text)  # JSON（電子黒板情報）
    taken_at = Column(DateTime)
    taken_by = Column(String)
    location_lat = Column(Float)
    location_lng = Column(Float)
    tags = Column(Text)  # JSON配列
    created_at = Column(DateTime, server_default=func.now())


class BlackboardTemplate(Base):
    """電子黒板テンプレート"""
    __tablename__ = "blackboard_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    layout = Column(Text)  # JSON（レイアウト情報）
    fields = Column(Text)  # JSON（フィールド定義）
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# タスク19: 検査・是正管理
# ============================================

class Inspection(Base):
    """検査"""
    __tablename__ = "inspections"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    type = Column(String)  # 自主検査/中間検査/完了検査
    scheduled_date = Column(Date)
    completed_date = Column(Date)
    inspector = Column(String)
    result = Column(String)  # pass/fail/pending
    note = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class InspectionItem(Base):
    """検査項目"""
    __tablename__ = "inspection_items"
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    item_name = Column(String)
    standard = Column(String)
    result = Column(String)  # OK/NG/NA
    photo_id = Column(Integer)
    comment = Column(Text)


class Correction(Base):
    """是正指示"""
    __tablename__ = "corrections"
    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"))
    inspection_item_id = Column(Integer)
    description = Column(Text)
    photo_before = Column(Integer)  # 是正前写真ID
    photo_after = Column(Integer)  # 是正後写真ID
    status = Column(String, default="open")  # open/in_progress/completed
    due_date = Column(Date)
    completed_date = Column(Date)
    assigned_to = Column(String)
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# タスク20: 安全書類（グリーンファイル）
# ============================================

class WorkerRegistration(Base):
    """作業員登録（安全書類用）"""
    __tablename__ = "worker_registrations"
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    blood_type = Column(String)
    emergency_contact = Column(String)
    emergency_phone = Column(String)
    qualifications = Column(Text)  # JSON配列
    health_check_date = Column(Date)
    insurance_number = Column(String)
    registered_at = Column(DateTime, server_default=func.now())


class SafetyTraining(Base):
    """安全教育記録"""
    __tablename__ = "safety_trainings"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    worker_id = Column(Integer, ForeignKey("workers.id"))
    training_date = Column(Date)
    training_type = Column(String)  # 新規入場者教育/送り出し教育
    trainer = Column(String)
    signature_path = Column(String)
    created_at = Column(DateTime, server_default=func.now())


class Qualification(Base):
    """資格証"""
    __tablename__ = "qualifications"
    id = Column(Integer, primary_key=True, index=True)
    worker_id = Column(Integer, ForeignKey("workers.id"))
    name = Column(String, nullable=False)
    number = Column(String)
    issue_date = Column(Date)
    expiry_date = Column(Date)
    photo_path = Column(String)  # 資格証写真
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# タスク21: 案件別チャット
# ============================================

class Message(Base):
    """メッセージ"""
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    sender_id = Column(String)
    sender_name = Column(String)
    content = Column(Text)
    attachment_path = Column(String)
    attachment_type = Column(String)  # image/file
    sent_at = Column(DateTime, server_default=func.now())
    is_read = Column(Boolean, default=False)


class MessageRead(Base):
    """既読管理"""
    __tablename__ = "message_reads"
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id"))
    user_id = Column(String)
    read_at = Column(DateTime, server_default=func.now())


# ============================================
# タスク22: 権限管理
# ============================================

class User(Base):
    """ユーザー"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True)
    name = Column(String)
    password_hash = Column(String)
    role = Column(String, default="worker")  # admin/manager/worker/viewer
    department = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Permission(Base):
    """権限"""
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String)
    resource = Column(String)  # projects/costs/approvals
    action = Column(String)  # view/create/edit/delete
    is_allowed = Column(Boolean, default=False)


# ============================================
# タスク23: 外部連携設定
# ============================================

class IntegrationSetting(Base):
    """外部連携設定"""
    __tablename__ = "integration_settings"
    id = Column(Integer, primary_key=True, index=True)
    service = Column(String, nullable=False)  # line/google_calendar/yayoi/freee
    api_key = Column(String)
    access_token = Column(String)
    refresh_token = Column(String)
    config = Column(Text)  # JSON
    is_active = Column(Boolean, default=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ============================================
# タスク7-2: 日報（労務費自動計算用）
# ============================================

class DailyReport(Base):
    """日報"""
    __tablename__ = "daily_reports"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"))
    project_id = Column(Integer, ForeignKey("projects.id"))
    hours = Column(Float, default=8)  # 作業時間
    overtime_hours = Column(Float, default=0)  # 残業時間
    note = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# タスク7-6: 帳票電子発行
# ============================================

class DocumentSend(Base):
    """帳票発行履歴"""
    __tablename__ = "document_sends"
    id = Column(Integer, primary_key=True, index=True)
    document_type = Column(String)  # estimate/invoice/order/progress/payment
    document_id = Column(Integer)
    recipient_email = Column(String)
    sent_at = Column(DateTime, server_default=func.now())
    opened_at = Column(DateTime)
    status = Column(String, default="sent")  # sent/opened/failed


# ============================================
# タスク7-7: 会社設定
# ============================================

class CompanySettings(Base):
    """会社設定"""
    __tablename__ = "company_settings"
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String)
    postal_code = Column(String)
    address = Column(String)
    phone = Column(String)
    fax = Column(String)
    email = Column(String)
    invoice_number = Column(String)  # 適格請求書発行事業者登録番号
    logo_path = Column(String)
    bank_name = Column(String)
    bank_branch = Column(String)
    account_type = Column(String)  # 普通/当座
    account_number = Column(String)
    account_name = Column(String)
    fiscal_year_start = Column(Integer, default=4)  # 期首月
    annual_target = Column(Float, default=0)  # 年間売上目標
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


# ============================================
# タスク12-1: LINE WORKS連携
# ============================================

class LineWorksSettings(Base):
    """LINE WORKS設定"""
    __tablename__ = "lineworks_settings"
    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(String)
    client_id = Column(String)
    client_secret = Column(String)
    service_account = Column(String)
    private_key = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class LineWorksUser(Base):
    """LINE WORKSユーザー紐付け"""
    __tablename__ = "lineworks_users"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lineworks_user_id = Column(String)
    is_active = Column(Boolean, default=True)


class LineWorksNotification(Base):
    """LINE WORKS通知設定"""
    __tablename__ = "lineworks_notifications"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)  # approval/daily_reminder/assignment/ky_reminder/etc
    is_enabled = Column(Boolean, default=True)
    schedule = Column(String)  # cron形式
    template = Column(Text)  # メッセージテンプレート


class LineWorksLog(Base):
    """LINE WORKS送信ログ"""
    __tablename__ = "lineworks_logs"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String)
    recipient = Column(String)
    message = Column(Text)
    status = Column(String)  # sent/failed
    sent_at = Column(DateTime, server_default=func.now())
    error_message = Column(Text)


# ============================================
# 名刺図書館
# ============================================

class BusinessCard(Base):
    """名刺"""
    __tablename__ = "business_cards"
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String)
    person_name = Column(String)
    department = Column(String)
    position = Column(String)
    phone = Column(String)
    mobile = Column(String)
    email = Column(String)
    address = Column(String)
    url = Column(String)
    image_path = Column(String)
    tag = Column(String)  # client/subcon/vendor/other
    is_favorite = Column(Boolean, default=False)
    memo = Column(Text)
    project_ids = Column(Text)  # JSON配列
    created_at = Column(DateTime, server_default=func.now())


# ============================================
# 見積書（独立）
# ============================================

class QuoteDocument(Base):
    """見積書（工事登録前の独立見積）"""
    __tablename__ = "quote_documents"
    id = Column(Integer, primary_key=True, index=True)
    quote_no = Column(String, unique=True, index=True)  # 見積番号
    title = Column(String, nullable=False)  # 工事名・件名
    client_name = Column(String)  # 元請け・発注者
    issue_date = Column(Date)  # 発行日
    valid_until = Column(Date)  # 有効期限
    subtotal = Column(Integer, default=0)  # 小計
    tax_amount = Column(Integer, default=0)  # 消費税額
    total = Column(Integer, default=0)  # 合計金額
    notes = Column(Text)  # 備考
    status = Column(String, default="draft")  # draft/sent/ordered/rejected
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)  # 受注後に設定
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class QuoteItem(Base):
    """見積書明細"""
    __tablename__ = "quote_items"
    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(Integer, ForeignKey("quote_documents.id"), nullable=False)
    seq = Column(Integer, default=0)  # 表示順
    name = Column(String, nullable=False)  # 品名・工種
    specification = Column(String)  # 規格・仕様
    quantity = Column(Float, default=1)  # 数量
    unit = Column(String, default="式")  # 単位
    unit_price = Column(Integer, default=0)  # 単価
    amount = Column(Integer, default=0)  # 金額
    created_at = Column(DateTime, server_default=func.now())


class Member(Base):
    """社員・メンバーマスタ"""
    __tablename__ = "members"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # 氏名
    name_kana = Column(String)  # ふりがな
    email = Column(String)  # メールアドレス
    phone = Column(String)  # 電話番号
    department = Column(String)  # 部署
    position = Column(String)  # 役職
    line_works_id = Column(String)  # LINE WORKS ID
    is_active = Column(Boolean, default=True)  # 有効フラグ
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class HotelRequest(Base):
    """ホテル予約依頼"""
    __tablename__ = "hotel_requests"
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    project_name = Column(String)  # 現場名
    location = Column(String)  # 場所
    checkin_date = Column(Date)  # チェックイン
    checkout_date = Column(Date)  # チェックアウト
    nights = Column(Integer, default=1)  # 泊数
    members = Column(Text)  # メンバー名（JSON or カンマ区切り）
    member_count = Column(Integer, default=1)  # 人数
    status = Column(String, default="pending")  # pending/booked/cancelled
    notes = Column(Text)  # 備考
    requested_by = Column(String)  # 依頼者
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
