#!/usr/bin/env python3
"""
サンユウテック テストデータ生成スクリプト
- 作業員 50人
- 工事 20現場
- 工種・予算・原価・配置データ
"""
import random
from datetime import date, datetime, timedelta
from database import engine, get_db, Base
from sqlalchemy.orm import Session
from models import (
    Project, Cost, Worker, Assignment, Schedule,
    ProjectWorkType, WorkTypeDetail, Expense, ExpenseReceipt, ExpenseCategory
)

# データベース接続
Base.metadata.create_all(bind=engine)
db = next(get_db())

print("=" * 50)
print("テストデータ生成開始")
print("=" * 50)

# 既存データを削除
print("\n既存データを削除中...")
db.query(Assignment).delete()
db.query(Schedule).delete()
db.query(WorkTypeDetail).delete()
db.query(ProjectWorkType).delete()
db.query(Cost).delete()
db.query(ExpenseReceipt).delete()
db.query(Expense).delete()
db.query(ExpenseCategory).delete()
db.query(Worker).delete()
db.query(Project).delete()
db.commit()
print("削除完了")

# ========== 経費カテゴリマスタ ==========
print("\n経費カテゴリを生成中...")
expense_category_data = [
    ("ガソリン", "⛽", 1, True),
    ("軽油", "🛢️", 2, True),
    ("駐車場代", "🅿️", 3, False),
    ("高速道路代", "🛣️", 4, False),
    ("消耗品", "📦", 5, False),
    ("接待費", "🍽️", 6, False),
    ("事務用品", "📎", 7, False),
    ("その他", "📋", 8, False),
]
expense_categories = []
for cat_name, icon, order, is_fuel in expense_category_data:
    cat = ExpenseCategory(
        name=cat_name,
        icon=icon,
        sort_order=order,
        is_fuel=is_fuel,
        is_active=True
    )
    db.add(cat)
    expense_categories.append(cat)
db.commit()
print(f"経費カテゴリ {len(expense_categories)}件 を登録しました")

# ========== 作業員データ ==========
print("\n作業員データを生成中...")

last_names = ["田中", "山田", "佐藤", "鈴木", "高橋", "伊藤", "渡辺", "中村", "小林", "加藤",
              "吉田", "山本", "松本", "井上", "木村", "林", "斎藤", "清水", "山口", "森",
              "池田", "橋本", "阿部", "石川", "山崎", "中島", "前田", "藤田", "小川", "後藤"]
first_names = ["太郎", "一郎", "健一", "和也", "大輔", "誠", "浩", "剛", "翔太", "拓也",
               "修", "隆", "秀樹", "正", "明", "勇", "進", "博", "茂", "豊"]

teams = ["舗装班", "高速班", "土工班", "管理班"]
employment_types = ["社員", "契約", "外注"]
daily_rates = [
    (13000, 15000),  # 一般作業員
    (14000, 17000),  # 舗装工
    (18000, 22000),  # 重機オペレーター
    (20000, 25000),  # 現場監督
]

workers = []
for i in range(50):
    rate_range = random.choice(daily_rates)
    worker = Worker(
        name=f"{random.choice(last_names)} {random.choice(first_names)}",
        team=random.choice(teams),
        employment_type=random.choice(employment_types),
        daily_rate=random.randint(rate_range[0], rate_range[1]),
        phone=f"090-{random.randint(1000,9999)}-{random.randint(1000,9999)}",
        is_active=True
    )
    db.add(worker)
    workers.append(worker)

db.commit()
print(f"作業員 {len(workers)}人 を登録しました")

# ========== 工事データ ==========
print("\n工事データを生成中...")

project_templates = [
    ("県道〇〇線舗装補修工事", "福岡県", 45000000, 55000000),
    ("市道△△線道路改良工事", "〇〇市", 25000000, 35000000),
    ("国道×××号線維持修繕工事", "国土交通省九州地方整備局", 80000000, 120000000),
    ("〇〇団地外構舗装工事", "〇〇住宅株式会社", 15000000, 25000000),
    ("△△工業団地アクセス道路工事", "福岡県", 60000000, 80000000),
    ("市営駐車場舗装工事", "〇〇市", 8000000, 15000000),
    ("〇〇小学校通学路整備工事", "〇〇市教育委員会", 12000000, 20000000),
    ("河川護岸舗装工事", "福岡県", 35000000, 50000000),
    ("〇〇港湾道路整備工事", "国土交通省", 90000000, 130000000),
    ("農道舗装工事", "〇〇市農政課", 10000000, 18000000),
]

areas = ["福岡市東区", "福岡市博多区", "福岡市中央区", "北九州市小倉北区", "久留米市",
         "飯塚市", "大牟田市", "春日市", "筑紫野市", "太宰府市", "糸島市", "宗像市",
         "古賀市", "福津市", "宮若市", "嘉麻市", "朝倉市", "みやま市", "糟屋郡", "遠賀郡"]

statuses_distribution = ["施工中"] * 15 + ["見込み有"] * 3 + ["完了"] * 2

projects = []
total_order = 0

for i in range(20):
    template = project_templates[i % len(project_templates)]
    area = random.choice(areas)

    # 工事名に地域を組み込む
    project_name = template[0].replace("〇〇", area.replace("市", "").replace("区", "").replace("郡", ""))
    client = template[1].replace("〇〇", area.split("市")[0] if "市" in area else area[:2])

    min_amount = template[2]
    max_amount = template[3]
    order_amount = random.randint(min_amount, max_amount)
    budget_rate = random.uniform(0.75, 0.85)
    budget_amount = int(order_amount * budget_rate)

    # 工期設定
    start_month = random.randint(1, 12)
    start_year = random.choice([2024, 2025])
    duration_months = random.randint(2, 8)
    start_date = date(start_year, start_month, 1)
    end_date = start_date + timedelta(days=duration_months * 30)

    status = statuses_distribution[i]

    project = Project(
        code=f"P{2024 + (i // 10)}{str(i % 12 + 1).zfill(2)}-{str(i + 1).zfill(3)}",
        name=project_name,
        client=client,
        status=status,
        order_type="一次請" if random.random() > 0.3 else "JV",
        prefecture="福岡県",
        probability="確定" if status != "見込み有" else random.choice(["A", "B", "C"]),
        order_amount=order_amount,
        budget_amount=budget_amount,
        tax_rate=0.1,
        start_date=start_date,
        end_date=end_date,
        sales_person=random.choice(["山田部長", "田中課長", "佐藤主任"]),
        site_person=random.choice([w.name for w in workers if w.team == "管理班"][:5]) if any(w.team == "管理班" for w in workers) else workers[0].name if workers else "担当者未定",
        address=f"福岡県{area}{random.randint(1, 10)}丁目{random.randint(1, 30)}-{random.randint(1, 20)}"
    )
    db.add(project)
    projects.append(project)
    total_order += order_amount

db.commit()
print(f"工事 {len(projects)}件 を登録しました（総受注額: {total_order:,}円）")

# ========== 工種データ ==========
print("\n工種データを生成中...")

work_type_templates = [
    ("舗装工", [
        ("アスファルト舗装", "㎡", 3500, 5500, "材料費"),
        ("路盤工", "㎡", 1500, 2500, "材料費"),
        ("プライムコート", "㎡", 200, 400, "材料費"),
        ("タックコート", "㎡", 150, 300, "材料費"),
    ]),
    ("土工", [
        ("掘削工", "㎥", 800, 1500, "機械費"),
        ("盛土工", "㎥", 600, 1200, "機械費"),
        ("残土処分", "㎥", 2000, 4000, "外注費"),
        ("整地工", "㎡", 300, 600, "労務費"),
    ]),
    ("排水工", [
        ("側溝設置", "m", 8000, 15000, "材料費"),
        ("集水桝設置", "箇所", 25000, 45000, "外注費"),
        ("排水管布設", "m", 5000, 12000, "外注費"),
    ]),
    ("区画線工", [
        ("白線（実線）", "m", 200, 400, "材料費"),
        ("白線（破線）", "m", 250, 450, "材料費"),
        ("横断歩道", "㎡", 3000, 5000, "外注費"),
    ]),
    ("付帯工", [
        ("仮設工", "式", 100000, 500000, "経費"),
        ("安全対策費", "式", 50000, 200000, "経費"),
        ("清掃・後片付け", "式", 30000, 100000, "経費"),
    ]),
]

work_type_count = 0
detail_count = 0
for project in projects:
    # 各工事に3〜5工種を追加
    num_work_types = random.randint(3, 5)
    selected_types = random.sample(work_type_templates, num_work_types)

    seq = 1
    for wt_template in selected_types:
        work_type = ProjectWorkType(
            project_id=project.id,
            seq=seq,
            name=wt_template[0],
            unit="式",
            quantity=1,
            budget_unit_price=0,
            budget_amount=0
        )
        db.add(work_type)
        db.flush()

        # 明細を追加
        total_budget = 0
        detail_seq = 1
        for detail_template in wt_template[1]:
            quantity = random.randint(50, 500)
            unit_price = random.randint(detail_template[2], detail_template[3])
            amount = int(quantity * unit_price)
            total_budget += amount

            detail = WorkTypeDetail(
                work_type_id=work_type.id,
                seq=detail_seq,
                name=detail_template[0],
                unit=detail_template[1],
                cost_category=detail_template[4],
                budget_quantity=quantity,
                budget_unit_price=unit_price,
                budget_amount=amount
            )
            db.add(detail)
            detail_seq += 1
            detail_count += 1

        work_type.budget_amount = total_budget
        work_type.budget_unit_price = total_budget
        work_type_count += 1
        seq += 1

db.commit()
print(f"工種 {work_type_count}件、明細 {detail_count}件 を登録しました")

# ========== 原価データ ==========
print("\n原価データを生成中...")

cost_categories = [
    ("材料費", 0.35, 0.45),
    ("労務費", 0.20, 0.30),
    ("外注費", 0.15, 0.25),
    ("機械費", 0.05, 0.10),
    ("経費", 0.03, 0.08),
]

vendors = {
    "材料費": ["福岡建材", "九州アスファルト", "博多砂利", "筑紫セメント", "太陽建材"],
    "労務費": ["直営", "サンユウテック"],
    "外注費": ["山田建設", "九州舗装", "福岡土木", "北九州工業", "筑後建設"],
    "機械費": ["九州リース", "福岡機械", "レンタル太郎"],
    "経費": ["直接経費", "現場経費"],
}

cost_count = 0
for project in projects:
    if project.status == "見込み有":
        continue  # 見込み案件は原価なし

    # 予算の70-95%を原価として計上（完了案件は95%、施工中は70-85%）
    if project.status == "完了":
        cost_rate = random.uniform(0.90, 0.98)
    else:
        cost_rate = random.uniform(0.50, 0.75)

    target_cost = int(project.budget_amount * cost_rate)
    remaining_cost = target_cost

    for cat_name, min_rate, max_rate in cost_categories:
        cat_amount = int(target_cost * random.uniform(min_rate, max_rate))
        if cat_amount > remaining_cost:
            cat_amount = remaining_cost

        if cat_amount <= 0:
            continue

        # 複数回に分けて計上
        num_entries = random.randint(2, 5)
        for _ in range(num_entries):
            entry_amount = cat_amount // num_entries
            if entry_amount <= 0:
                continue

            cost_date = project.start_date + timedelta(days=random.randint(0, 180))

            cost = Cost(
                project_id=project.id,
                date=cost_date,
                category=cat_name,
                vendor=random.choice(vendors[cat_name]),
                description=f"{project.name[:10]}... {cat_name}",
                amount=entry_amount,
                quantity=1,
                unit_price=entry_amount
            )
            db.add(cost)
            cost_count += 1
            remaining_cost -= entry_amount

db.commit()
print(f"原価 {cost_count}件 を登録しました")

# ========== 配置データ（段取り） ==========
print("\n配置データを生成中...")

today = date.today()
assignment_count = 0

# 施工中の現場を取得
active_projects = [p for p in projects if p.status == "施工中"]

for day_offset in range(7):  # 今日から1週間分
    target_date = today + timedelta(days=day_offset)

    # 作業員をシャッフルして配置
    available_workers = workers.copy()
    random.shuffle(available_workers)

    for project in active_projects:
        # 各現場に2〜5人配置
        num_workers = random.randint(2, 5)

        for _ in range(num_workers):
            if not available_workers:
                break

            worker = available_workers.pop()

            assignment = Assignment(
                worker_id=worker.id,
                project_id=project.id,
                date=target_date,
                start_time="08:00",
                end_time="17:00",
                note=""
            )
            db.add(assignment)
            assignment_count += 1

db.commit()
print(f"配置 {assignment_count}件 を登録しました")

# ========== 経費データ ==========
print("\n経費データを生成中...")

# Fuel expenses
fuel_categories = [c for c in expense_categories if c.is_fuel]
non_fuel_categories = [c for c in expense_categories if not c.is_fuel]

expense_count = 0
for _ in range(20):
    expense_date = today - timedelta(days=random.randint(0, 30))
    project = random.choice(active_projects) if active_projects else projects[0]

    # 燃料費 or 一般経費
    if random.random() < 0.4 and fuel_categories:
        # 燃料費
        category = random.choice(fuel_categories)
        fuel_type = "regular" if category.name == "ガソリン" else "diesel"
        fuel_liter = random.randint(20, 60)
        expense = Expense(
            project_id=project.id,
            category_id=category.id,
            expense_date=expense_date,
            amount=None,  # 燃料費は単価×リッターで計算
            fuel_type=fuel_type,
            fuel_liter=fuel_liter,
            store_name=random.choice(["ENEOS", "出光", "コスモ石油", "昭和シェル"]),
            memo=f"現場向け給油",
            status=random.choice(["pending", "approved"])
        )
    else:
        # 一般経費
        category = random.choice(non_fuel_categories) if non_fuel_categories else expense_categories[0]
        expense = Expense(
            project_id=project.id,
            category_id=category.id,
            expense_date=expense_date,
            amount=random.randint(500, 15000),
            fuel_type=None,
            fuel_liter=None,
            store_name=random.choice(["コンビニ", "ホームセンター", "事務用品店", "飲食店"]),
            memo=f"{category.name}（現場使用）",
            status=random.choice(["pending", "approved"])
        )
    db.add(expense)
    expense_count += 1

db.commit()
print(f"経費 {expense_count}件 を登録しました")

# ========== 完了 ==========
print("\n" + "=" * 50)
print("テストデータ生成完了！")
print("=" * 50)
print(f"""
【生成したデータ】
- 作業員: {len(workers)}人
- 工事: {len(projects)}件（総受注額: {total_order:,}円）
- 工種: {work_type_count}件
- 原価: {cost_count}件
- 配置: {assignment_count}件
- 経費: {expense_count}件
""")

db.close()
