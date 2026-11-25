import os
import re
import warnings
import datetime
import openpyxl
from openpyxl.comments import Comment
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

warnings.filterwarnings("ignore", category=UserWarning, module="openpyxl")

FILE_NAME = "Бюджет .xlsx"

def hide_extra_sheets(wb):
    for sheet in wb.worksheets:
        sheet.sheet_state = "visible" if sheet.title in ("Данные", "Бюджет") else "hidden"

def parse_excel_date(d_val, default_year):
    if d_val is None:
        return None
    if isinstance(d_val, datetime.datetime):
        return datetime.date(default_year, d_val.month, d_val.day)
    if isinstance(d_val, datetime.date):
        return datetime.date(default_year, d_val.month, d_val.day)
    text = str(d_val).strip().replace(",", ".")
    match = re.search(r"(\d{1,2})\.(\d{1,2})", text)
    if match:
        try:
            return datetime.date(default_year, int(match.group(2)), int(match.group(1)))
        except ValueError:
            return None
    return None


def sort_desc(items_dict):
    return sorted(items_dict.items(), key=lambda p: p[1], reverse=True)

def add_expense(category, amount, note="", date_str=None):
    if not os.path.exists(FILE_NAME):
        return f"Ошибка: не вижу файл '{FILE_NAME}'."
    try:
        wb = openpyxl.load_workbook(FILE_NAME)
        ws = wb["Данные"]
    except PermissionError:
        return "Ошибка: закрой файл Excel на компьютере!"

    target_date = datetime.date.today()
    if date_str:
        parsed = parse_excel_date(date_str, target_date.year)
        if parsed:
            target_date = parsed

    target_row = None
    for row in range(3, ws.max_row + 1):
        d = parse_excel_date(ws.cell(row=row, column=1).value, target_date.year)
        if d and d.day == target_date.day and d.month == target_date.month:
            target_row = row
            break

    # Если такой даты нет в столбце A — добавляем новую строку в конец!
    if not target_row:
        target_row = ws.max_row + 1
        ws.cell(row=target_row, column=1).value = target_date.strftime("%d.%m")

    col, real_cat = None, None
    for c in range(2, ws.max_column + 1):
        val = ws.cell(row=2, column=c).value
        if val and category.strip().lower() in str(val).strip().lower():
            col, real_cat = c, str(val).strip()
            break
    if not col:
        return f"Ошибка: категория '{category}' не найдена."

    cell = ws.cell(row=target_row, column=col)
    old_val = cell.value if isinstance(cell.value, (int, float)) else 0
    cell.value = old_val + float(amount)

    new_note = f"{int(amount)} — {note}" if note else f"{int(amount)}"
    cell.comment = Comment(f"{cell.comment.text}\n{new_note}" if cell.comment else new_note, "Агент")

    hide_extra_sheets(wb)
    wb.save(FILE_NAME)
    return f"Записал! {target_date.strftime('%d.%m')} | «{real_cat}»: +{int(amount)} руб. Заметка: «{new_note}»."


def get_period_data(days=None, month_num=None):
    wb = openpyxl.load_workbook(FILE_NAME, data_only=True)
    wb_notes = openpyxl.load_workbook(FILE_NAME, data_only=False)
    ws_data, ws_budget = wb["Данные"], wb["Бюджет"]
    ws_notes = wb_notes["Данные"]
    today = datetime.date.today()
    month_num = month_num or today.month

    eng_months = {1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
                  7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"}
    m_code = eng_months.get(month_num, "Nov")

    total_budget, budget_col = 0, None
    for col in range(2, ws_budget.max_column + 1):
        if str(ws_budget.cell(row=2, column=col).value).strip() == m_code:
            budget_col = col
            break
    if budget_col:
        for row in range(3, ws_budget.max_row + 1):
            if "общий бюджет" in str(ws_budget.cell(row=row, column=1).value).lower():
                val = ws_budget.cell(row=row, column=budget_col).value
                total_budget = float(val) if isinstance(val, (int, float)) else 0
                break

    total_spent, cat_totals, notes_list = 0, {}, []
    start_date = today - datetime.timedelta(days=days - 1) if days else None

    for row in range(3, ws_data.max_row + 1):
        d = parse_excel_date(ws_data.cell(row=row, column=1).value, today.year)
        if not d:
            continue
        if days and not (start_date <= d <= today):
            continue
        if not days and d.month != month_num:
            continue

        for col in range(2, ws_data.max_column + 1):
            val = ws_data.cell(row=row, column=col).value
            if isinstance(val, (int, float)) and val > 0:
                cat = str(ws_data.cell(row=2, column=col).value).strip()
                total_spent += val
                cat_totals[cat] = cat_totals.get(cat, 0) + val
                note_cell = ws_notes.cell(row=row, column=col)
                if note_cell.comment:
                    txt = note_cell.comment.text.replace("\n", "; ")
                    notes_list.append(f"• {d.strftime('%d.%m')} ({cat}): {txt}")


    return {"month_code": m_code, "budget": int(total_budget), "spent": int(total_spent),
            "ost": int(total_budget - total_spent), "categories": cat_totals, "notes": notes_list}

def make_chart_image(days=None, month_num=None):
    data = get_period_data(days=days, month_num=month_num)
    label_period = f"за последние {days} дн." if days else f"за {data['month_code']}"
    if not data["categories"]:
        return None, f"За период ({label_period}) пока нет трат для графика."
    items = sort_desc(data["categories"])
    plt.figure(figsize=(10, 6))
    plt.pie([v for _, v in items], labels=[f"{k} ({int(v)} р.)" for k, v in items], autopct="%1.1f%%", startangle=140)
    plt.title(f"Расходы {label_period} (Всего: {data['spent']} руб.)", fontsize=14, fontweight="bold")
    plt.tight_layout()
    path = "chart_expenses.png"
    plt.savefig(path, dpi=150)
    plt.close()
    return path, f"📊 График расходов {label_period}"

def make_table_image(month_num=None):
    data = get_period_data(month_num=month_num)
    items = sort_desc(data["categories"])
    rows = [[k, f"{int(v):,} руб.".replace(",", " ")] for k, v in items]
    rows.append(["ИТОГО ПОТРАЧЕНО", f"{data['spent']:,} руб.".replace(",", " ")])
    rows.append(["ОБЩИЙ БЮДЖЕТ", f"{data['budget']:,} руб.".replace(",", " ")])
    rows.append(["ОСТАТОК", f"{data['ost']:,} руб.".replace(",", " ")])

    fig, ax = plt.subplots(figsize=(6, len(rows) * 0.45 + 1.2))
    ax.axis("off")
    plt.title(f"Сводка бюджета: {data['month_code']}", fontsize=13, fontweight="bold", pad=10)
    table = ax.table(cellText=rows, colLabels=["Категория", "Сумма"], loc="center", cellLoc="left")
    table.auto_set_font_size(False)
    table.set_fontsize(10)
    table.scale(1, 1.4)
    path = "tab_budget.png"
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    return path, f"Сводка бюджета за {data['month_code']}"

def delete_specific_expense(amount=None, keyword=""):
    """Ищет конкретную трату по сумме и/или слову в примечаниях Excel и удаляет её"""
    if not amount and not keyword:
        return "Уточни, какую именно трату удалить (например: «удали 7200 лента»)."

    if not os.path.exists(FILE_NAME):
        return f"Ошибка: не вижу файл '{FILE_NAME}'."

    try:
        wb = openpyxl.load_workbook(FILE_NAME)
        ws = wb["Данные"]
    except PermissionError:
        return "Ошибка: закрой файл Excel на компьютере!"

    raw_kw = str(keyword).strip().lower()
    kw_lower = raw_kw[:-1] if len(raw_kw) > 4 else raw_kw
    amt_str = str(int(float(amount))) if amount else ""

    # Ищем с конца таблицы (от свежих дат к старым)
    for row in range(ws.max_row, 2, -1):
        for col in range(2, ws.max_column + 1):
            cell = ws.cell(row=row, column=col)
            if not cell.comment:
                continue

            lines = cell.comment.text.split("\n")
            new_lines = []
            deleted_info = None

            for ln in lines:
                ln_low = ln.lower()
                # Проверяем совпадение по сумме и/или слову
                amt_ok = (amt_str in ln_low) if amt_str else True
                kw_ok = (kw_lower in ln_low) if kw_lower else True

                if amt_ok and kw_ok and not deleted_info:
                    # Вытаскиваем сумму из этой строки заметки (первое число в строке)
                    num_match = re.search(r"(\d+)", ln)
                    del_sum = float(num_match.group(1)) if num_match else (float(amount) if amount else 0)
                    cat_name = str(ws.cell(row=2, column=col).value).strip()
                    d_val = ws.cell(row=row, column=1).value
                    date_lbl = d_val.strftime("%d.%m") if isinstance(d_val, (datetime.datetime, datetime.date)) else str(d_val).strip()
                    deleted_info = (del_sum, cat_name, date_lbl, ln.strip())
                else:
                    new_lines.append(ln)

            if deleted_info:
                del_sum, cat_name, date_lbl, old_line = deleted_info
                cur_val = cell.value if isinstance(cell.value, (int, float)) else 0
                new_val = max(0, cur_val - del_sum)
                cell.value = new_val if new_val > 0 else None
                cell.comment = Comment("\n".join(new_lines), "Агент") if new_lines else None

                hide_extra_sheets(wb)
                wb.save(FILE_NAME)
                return f"🗑 *Удалил из Excel:*\n• Дата: {date_lbl} | «{cat_name}»: -{int(del_sum)} руб.\n• Стерта заметка: «{old_line}»"

    return f"Не нашёл в примечаниях Excel запись (сумма: {amt_str or 'любая'}, слово: «{keyword or 'любое'}»)."
