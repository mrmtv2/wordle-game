from telebot import types

def bottom_menu_button():
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True)
    kb.row("📱 Меню")
    return kb

def main_inline_menu():
    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.add(
        types.InlineKeyboardButton("💰 Остаток", callback_data="cmd_ost"),
        types.InlineKeyboardButton("📋 Таблица", callback_data="cmd_tab"),
        types.InlineKeyboardButton("📈 Статистика", callback_data="menu_stat"),
        types.InlineKeyboardButton("📊 Графики", callback_data="menu_chart"),
        types.InlineKeyboardButton("💡 Советы", callback_data="menu_adv"),
        types.InlineKeyboardButton("📥 Экспорт Excel", callback_data="cmd_export"),
        types.InlineKeyboardButton("😴 Сон ПК", callback_data="menu_sleep"),
        types.InlineKeyboardButton("🎮 Угадай слово", web_app=types.WebAppInfo(url="https://mrmtv2.github.io/wordle-game/?v=6")),
        types.InlineKeyboardButton("❓ Помощь", callback_data="cmd_help")
    )
    return kb

def sub_menu_stat():
    kb = types.InlineKeyboardMarkup(row_width=3)
    kb.add(
        types.InlineKeyboardButton("За 7 дней", callback_data="stat_7"),
        types.InlineKeyboardButton("За 30 дней", callback_data="stat_30"),
        types.InlineKeyboardButton("За 90 дней", callback_data="stat_90"),
        types.InlineKeyboardButton("⬅️ Назад в меню", callback_data="back_main")
    )
    return kb

def sub_menu_chart():
    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.add(
        types.InlineKeyboardButton("За 7 дней", callback_data="chart_7"),
        types.InlineKeyboardButton("За 30 дней", callback_data="chart_30"),
        types.InlineKeyboardButton("За 90 дней", callback_data="chart_90"),
        types.InlineKeyboardButton("Весь месяц", callback_data="chart_0"),
        types.InlineKeyboardButton("⬅️ Назад в меню", callback_data="back_main")
    )
    return kb

def sub_menu_adv():
    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.add(
        types.InlineKeyboardButton("За 7 дней", callback_data="adv_7"),
        types.InlineKeyboardButton("За 30 дней", callback_data="adv_30"),
        types.InlineKeyboardButton("За 90 дней", callback_data="adv_90"),
        types.InlineKeyboardButton("Весь месяц", callback_data="adv_0"),
        types.InlineKeyboardButton("⬅️ Назад в меню", callback_data="back_main")
    )
    return kb

def sub_menu_sleep():
    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.add(
        types.InlineKeyboardButton("💤 На 1 час", callback_data="sleep_1"),
        types.InlineKeyboardButton("💤 На 2 часа", callback_data="sleep_2"),
        types.InlineKeyboardButton("💤 На 3 часа", callback_data="sleep_3"),
        types.InlineKeyboardButton("💤 На 6 часов", callback_data="sleep_6"),
        types.InlineKeyboardButton("⬅️ Назад в меню", callback_data="back_main")
    )
    return kb

HELP_TEXT = (
    "🤖 *Семейный ИИ-Ассистент*\n\n"
    "💸 *Запись трат (пиши просто текстом):*\n"
    "• `добавь в еду 1500 - лента`\n"
    "• `3600 муэрте корма и 500 кофе` (можно несколько сразу)\n"
    "• `курилка 3200 запиши на вчера`\n\n"
    "📊 *Команды (всегда с пробелом или через «📱 Меню»):*\n"
    "• `остаток` — бюджет, траты и остаток месяца\n"
    "• `таблица` — картинка-таблица расходов\n"
    "• `стат 7` / `стат 30` / `стат 90` — статистика за N дней\n"
    "• `график 7` / `график 30` / `график 90` — диаграмма за N дней\n"
    "• `совет` или `совет 30` — советы по экономии от ИИ\n"
    "• `экспорт` — скачать файл `Бюджет .xlsx`\n"
    "• `сон 1` / `сон 3` / `сон 6` — усыпить ПК с автопробуждением"
)
