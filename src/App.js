/* eslint-disable */
// Storage polyfill for web deployment
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    get: (k) => new Promise(r => { try { const v = localStorage.getItem("savvie_" + k); r(v ? { key: k, value: v } : null); } catch { r(null); } }),
    set: (k, v) => new Promise(r => { try { localStorage.setItem("savvie_" + k, v); r({ key: k, value: v }); } catch { r(null); } }),
    delete: (k) => new Promise(r => { try { localStorage.removeItem("savvie_" + k); r({ key: k, deleted: true }); } catch { r(null); } }),
    list: (p) => new Promise(r => { try { const ks = Object.keys(localStorage).filter(k => k.startsWith("savvie_" + (p || ""))).map(k => k.replace("savvie_", "")); r({ keys: ks }); } catch { r({ keys: [] }); } }),
  };
}

import React, { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

// ── CONSTANTS ────────────────────────────────────────────────────────────────

const CATEGORIES = {
  food: {
    label: "Food & Drinks",
    icon: "🍜",
    color: "#FF6B6B",
    subs: ["Hawker Centre", "Kopitiam", "Koufu", "Restaurant", "Grab Food", "Foodpanda", "Deliveroo", "Cafe", "Bubble Tea", "Other Food"],
  },
  transport: {
    label: "Transport",
    icon: "🚌",
    color: "#4ECDC4",
    subs: ["MRT / Bus", "Grab", "Gojek", "Ryde", "Tada", "Taxi", "Petrol", "ERP / Parking", "Other Transport"],
  },
  groceries: {
    label: "Groceries",
    icon: "🛒",
    color: "#45B7D1",
    subs: ["FairPrice", "FairPrice Finest", "FairPrice Xtra", "Cold Storage", "Sheng Siong", "Giant", "Don Don Donki", "Prime Supermarket", "Hao Mart", "Marketplace", "Mustafa Centre", "Jasons Deli", "Little Farms", "Redmart", "Other Groceries"],
  },
  housing: {
    label: "Housing",
    icon: "🏠",
    color: "#96CEB4",
    subs: ["HDB / Mortgage", "Rent", "SP Utilities", "Town Council", "Renovation", "Other Housing"],
  },
  shopping: {
    label: "Shopping",
    icon: "🛍️",
    color: "#FD79A8",
    subs: ["Lazada", "Shopee", "Zalora", "Physical Store", "Electronics", "Other Shopping"],
  },
  health: {
    label: "Health",
    icon: "💊",
    color: "#DDA0DD",
    subs: ["GP Clinic", "Polyclinic", "Hospital", "Pharmacy", "Dental", "Gym", "Other Health"],
  },
  snacks: {
    label: "Snacks & Convenience",
    icon: "🍿",
    color: "#FF9F43",
    subs: [
      "7-Eleven", "Cheers", "FairPrice Xpress", "U Stars Supermart",
      "Prime Supermarket", "Buzz (SMRT)", "Watsons", "Guardian",
      "Convenience Store", "Vending Machine", "Other Snacks"
    ],
  },
  telco: {
    label: "Telco & Internet",
    icon: "📱",
    color: "#F0A500",
    subs: [
      "Singtel", "StarHub", "M1", "Circles.Life", "TPG", "MyRepublic",
      "Giga!", "Zero Mobile", "GOMO", "Simba Telecom",
      "Vivifi", "Grid Mobile", "RedONE", "Spartel",
      "ViewQwest", "WhizComms", "Other Telco"
    ],
  },
  entertainment: {
    label: "Entertainment",
    icon: "📺",
    color: "#A29BFE",
    subs: [
      "Netflix", "Disney+", "HBO Max", "Apple TV+", "Amazon Prime Video",
      "meWATCH", "iQIYI", "Viu", "WeTV", "YouTube Premium",
      "Spotify", "Apple Music", "Tidal", "Amazon Music",
      "Movies (Cinema)", "Gaming", "Concerts / Events", "Other Entertainment"
    ],
  },
  education: {
    label: "Education",
    icon: "📚",
    color: "#74B9FF",
    subs: ["School Fees", "Tuition", "Books", "Courses", "Other Education"],
  },
  travel: {
    label: "Travel",
    icon: "✈️",
    color: "#00CEC9",
    subs: [
      "Flight", "Hotel / Accommodation", "Airbnb",
      "Train / Bus (Overseas)", "Car Rental",
      "Travel Insurance", "Tours / Activities",
      "Airport Transfer", "Visa Fees", "Other Travel"
    ],
  },
  pets: {
    label: "Pets",
    icon: "🐾",
    color: "#FDCB6E",
    subs: [
      "Pet Food", "Vet / Medical", "Grooming",
      "Pet Supplies", "Pet Insurance",
      "Boarding / Day Care", "Other Pets"
    ],
  },
  donation: {
    label: "Donation & Charity",
    icon: "🤲",
    color: "#A29BFE",
    subs: [
      "Mosque / Zakat / Fitrah", "Church / Temple",
      "Community Chest", "SINDA / Mendaki / CDAC",
      "Red Cross", "Food Bank", "GoFundMe / Crowdfunding",
      "Sadaqah", "Other Donation"
    ],
  },
  income: {
    label: "Income",
    icon: "💰",
    color: "#00B894",
    subs: [
      "Salary", "Bonus", "Commission", "Overtime Pay",
      "Freelance / Side Income", "Sale of Items (Carousell etc)",
      "Government (GST Voucher / CDC)", "Government (Baby Bonus)",
      "Investment Returns", "Rental Income",
      "Ang Bao / Gift Money", "Insurance Claim / Payout",
      "Tax Refund", "Cashback / Rewards", "Other Income"
    ],
  },
  savings: {
    label: "Savings / Transfer",
    icon: "🏦",
    color: "#FD79A8",
    subs: [
      "CPF Top-Up", "Emergency Fund",
      "DBS / POSB", "OCBC", "UOB", "Maybank", "Citibank",
      "Standard Chartered", "HSBC", "Bank of China", "CIMB",
      "Trust Bank", "GXS Bank", "MariBank", "RHB Bank",
      "ICBC", "ANZ", "Other Bank Transfer"
    ],
  },
  investment: {
    label: "Investment",
    icon: "📈",
    color: "#00CEC9",
    subs: [
      "SSB (Singapore Savings Bond)", "T-Bills", "SGX Stocks",
      "ETF / Index Fund", "Unit Trust", "Endowment Plan",
      "Syfe", "StashAway", "Endowus", "Moomoo", "Tiger Brokers",
      "FSMOne", "Robo-Advisor", "Crypto", "Other Investment"
    ],
  },
};

const PAYMENT_METHODS = [
  "Cash", "PayNow", "PayLah!", "GrabPay",
  "DBS / POSB", "OCBC", "UOB", "Citibank",
  "Standard Chartered", "HSBC", "GovWallet", "Other",
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// Approximate exchange rates relative to SGD
const RATES_FROM_SGD = {
  SGD: 1, MYR: 3.1051, USD: 0.7834, EUR: 0.6703, GBP: 0.5805,
  AUD: 1.0964, JPY: 124.99, CNY: 5.3533, HKD: 6.1362, IDR: 13536.82,
  KRW: 1160.24, THB: 25.38, PHP: 47.35, VND: 20400, INR: 73.62,
  TWD: 24.73, BDT: 96.39, PKR: 218.41, SAR: 2.9377, AED: 2.8770,
  CHF: 0.6153, CAD: 1.0716, NZD: 1.3325, SEK: 7.2364, NOK: 7.3200,
  DKK: 5.0090, TRY: 35.20, ZAR: 12.9257, BRL: 3.8931, MXN: 13.6086,
};

const CURRENCY_FLAGS = {
  SGD:"🇸🇬", MYR:"🇲🇾", USD:"🇺🇸", EUR:"🇪🇺", GBP:"🇬🇧",
  AUD:"🇦🇺", JPY:"🇯🇵", CNY:"🇨🇳", HKD:"🇭🇰", IDR:"🇮🇩",
  KRW:"🇰🇷", THB:"🇹🇭", PHP:"🇵🇭", VND:"🇻🇳", INR:"🇮🇳",
  TWD:"🇹🇼", BDT:"🇧🇩", PKR:"🇵🇰", SAR:"🇸🇦", AED:"🇦🇪",
  CHF:"🇨🇭", CAD:"🇨🇦", NZD:"🇳🇿", SEK:"🇸🇪", NOK:"🇳🇴",
  DKK:"🇩🇰", TRY:"🇹🇷", ZAR:"🇿🇦", BRL:"🇧🇷", MXN:"🇲🇽",
};

const CURRENCY_NAMES = {
  SGD:"Singapore Dollar", MYR:"Malaysian Ringgit", USD:"US Dollar",
  EUR:"Euro", GBP:"British Pound", AUD:"Australian Dollar",
  JPY:"Japanese Yen", CNY:"Chinese Yuan", HKD:"Hong Kong Dollar",
  IDR:"Indonesian Rupiah", KRW:"Korean Won", THB:"Thai Baht",
  PHP:"Philippine Peso", VND:"Vietnamese Dong", INR:"Indian Rupee",
  TWD:"Taiwan Dollar", BDT:"Bangladeshi Taka", PKR:"Pakistani Rupee",
  SAR:"Saudi Riyal", AED:"UAE Dirham", CHF:"Swiss Franc",
  CAD:"Canadian Dollar", NZD:"New Zealand Dollar", SEK:"Swedish Krona",
  NOK:"Norwegian Krone", DKK:"Danish Krone", TRY:"Turkish Lira",
  ZAR:"South African Rand", BRL:"Brazilian Real", MXN:"Mexican Peso",
};

const TRANSLATIONS = {
  EN: {
    home: "Home", history: "History", stats: "Stats", wealth: "Wealth",
    budget: "Budget", settings: "Settings", addTransaction: "Add Transaction",
    expense: "Expense", income: "Income", category: "Category",
    subcategory: "Subcategory", subscription: "Subscription?",
    creditCard: "Credit Card?", paymentMethod: "Payment Method",
    date: "Date", note: "Note (optional)", saveTransaction: "Save Transaction",
    saved: "✓ Saved!", yes: "✓ Yes", no: "✗ No",
    availableBalance: "Available Balance", goodDay: "Good day! 👋",
    overview: "Overview", expenses: "Expenses", savings: "Savings",
    topSpending: "Top Spending", recentTransactions: "Recent Transactions",
    noTransactions: "No transactions yet.", tapToAdd: "Tap + to add your first entry!",
    overBudget: "Over budget",
    monthlyBudget: "Monthly Budget 💰", overallBudget: "Overall Budget",
    remaining: "remaining", setLimit: "+ Set Limit", editLimit: "✏️ Edit Limit",
    noLimitSet: "No limit set", used: "% used", overBudgetBy: "Over budget by",
    spendingByCategory: "Spending by Category", noExpenses: "No expenses recorded",
    monthlyOverview: "Monthly Overview", invested: "Invested",
    saveInvest: "Save & Invest 💹", totalSaved: "Saved",
    goalsSaved: "Goals", goals: "🎯 Goals", investments: "📈 Investments",
    savingsTab: "🏦 Savings", noInvestments: "No investments yet.",
    noSavings: "No savings recorded yet.", investmentTx: "Investment Transactions",
    savingsTx: "Savings Transactions", portfolioBreakdown: "Portfolio Breakdown",
    savingsBreakdown: "Savings Breakdown", topUp: "+ Top Up", createGoal: "Create Goal",
    noGoals: "No savings goals yet.", setGoalSub: "Tap + to create your first goal!",
    complete: "% complete", goalName: "Goal Name", targetAmount: "Target Amount",
    historyTitle: "Transaction History", allMonths: "All Months",
    all: "All", searchPlaceholder: "🔍 Search transactions...",
    netFiltered: "Net for filtered period", noTxFound: "No transactions found.",
    statsTitle: "Stats 📈", settingsTitle: "Settings ⚙️",
    theme: "Theme", darkMode: "Dark Mode", lightMode: "Light Mode", systemMode: "Follow System", language: "Language", currency: "Currency", calculator: "Calculator",

    catLabels: {"food": "Food & Drinks", "transport": "Transport", "groceries": "Groceries", "housing": "Housing", "shopping": "Shopping", "health": "Health", "snacks": "Snacks & Convenience", "telco": "Telco & Internet", "entertainment": "Entertainment", "education": "Education", "travel": "Travel", "pets": "Pets", "donation": "Donation & Charity", "savings": "Savings / Transfer", "investment": "Investment", "income": "Income"},
      noSubscriptions: "No subscriptions this month.", noCreditCard: "No credit card transactions this month.", itemCount: "item", itemCountPlural: "items",
    paid: "Paid", total: "Total", markPaid: "Mark Paid", unpay: "Unpay",
    selectCard: "— Select Card —",
  },
  BM: {
    home: "Utama", history: "Sejarah", stats: "Statistik", wealth: "Kekayaan",
    budget: "Belanjawan", settings: "Tetapan", addTransaction: "Tambah Transaksi",
    expense: "Perbelanjaan", income: "Pendapatan", category: "Kategori",
    subcategory: "Subkategori", subscription: "Langganan?",
    creditCard: "Kad Kredit?", paymentMethod: "Kaedah Bayaran",
    date: "Tarikh", note: "Nota (pilihan)", saveTransaction: "Simpan Transaksi",
    saved: "✓ Disimpan!", yes: "✓ Ya", no: "✗ Tidak",
    availableBalance: "Baki Tersedia", goodDay: "Selamat datang! 👋",
    overview: "Ringkasan", expenses: "Perbelanjaan", savings: "Simpanan",
    topSpending: "Perbelanjaan Tertinggi", recentTransactions: "Transaksi Terkini",
    noTransactions: "Tiada transaksi lagi.", tapToAdd: "Tekan + untuk tambah entri pertama!",
    overBudget: "Melebihi belanjawan",
    monthlyBudget: "Belanjawan Bulanan 💰", overallBudget: "Belanjawan Keseluruhan",
    remaining: "baki", setLimit: "+ Tetapkan Had", editLimit: "✏️ Edit Had",
    noLimitSet: "Tiada had ditetapkan", used: "% digunakan", overBudgetBy: "Melebihi belanjawan sebanyak",
    spendingByCategory: "Perbelanjaan mengikut Kategori", noExpenses: "Tiada perbelanjaan dicatat",
    monthlyOverview: "Gambaran Keseluruhan Bulanan", invested: "Dilaburkan",
    saveInvest: "Simpan & Labur 💹", totalSaved: "Disimpan",
    goalsSaved: "Matlamat", goals: "🎯 Matlamat", investments: "📈 Pelaburan",
    savingsTab: "🏦 Simpanan", noInvestments: "Tiada pelaburan lagi.",
    noSavings: "Tiada simpanan dicatat lagi.", investmentTx: "Transaksi Pelaburan",
    savingsTx: "Transaksi Simpanan", portfolioBreakdown: "Pecahan Portfolio",
    savingsBreakdown: "Pecahan Simpanan", topUp: "+ Tambah", createGoal: "Cipta Matlamat",
    noGoals: "Tiada matlamat simpanan lagi.", setGoalSub: "Tekan + untuk cipta matlamat!",
    complete: "% selesai", goalName: "Nama Matlamat", targetAmount: "Jumlah Sasaran",
    historyTitle: "Sejarah Transaksi", allMonths: "Semua Bulan",
    all: "Semua", searchPlaceholder: "🔍 Cari transaksi...",
    netFiltered: "Jumlah bersih tempoh ditapis", noTxFound: "Tiada transaksi ditemui.",
    statsTitle: "Statistik 📈", settingsTitle: "Tetapan ⚙️",
    theme: "Tema", darkMode: "Mod Gelap", lightMode: "Mod Cerah", systemMode: "Ikut Sistem", language: "Bahasa", currency: "Mata Wang", calculator: "Kalkulator",

    catLabels: {"food": "Makanan & Minuman", "transport": "Pengangkutan", "groceries": "Barangan Runcit", "housing": "Perumahan", "shopping": "Membeli-belah", "health": "Kesihatan", "snacks": "Snek & Kedai Runcit", "telco": "Telco & Internet", "entertainment": "Hiburan", "education": "Pendidikan", "travel": "Pelancongan", "pets": "Haiwan Peliharaan", "donation": "Derma & Amal", "savings": "Simpanan / Pindahan", "investment": "Pelaburan", "income": "Pendapatan"},
      noSubscriptions: "Tiada langganan bulan ini.", noCreditCard: "Tiada transaksi kad kredit bulan ini.", itemCount: "item", itemCountPlural: "item",
    paid: "Dibayar", total: "Jumlah", markPaid: "Tandai Bayar", unpay: "Batal Bayar",
    selectCard: "— Pilih Kad —",
  },
  ZH: {
    home: "主页", history: "记录", stats: "统计", wealth: "财富",
    budget: "预算", settings: "设置", addTransaction: "添加交易",
    expense: "支出", income: "收入", category: "类别",
    subcategory: "子类别", subscription: "订阅?",
    creditCard: "信用卡?", paymentMethod: "付款方式",
    date: "日期", note: "备注（可选）", saveTransaction: "保存交易",
    saved: "✓ 已保存!", yes: "✓ 是", no: "✗ 否",
    availableBalance: "可用余额", goodDay: "你好！👋",
    overview: "概览", expenses: "支出", savings: "储蓄",
    topSpending: "主要支出", recentTransactions: "最近交易",
    noTransactions: "暂无交易记录。", tapToAdd: "点击 + 添加第一笔记录！",
    overBudget: "超出预算",
    monthlyBudget: "月度预算 💰", overallBudget: "总体预算",
    remaining: "剩余", setLimit: "+ 设置限额", editLimit: "✏️ 编辑限额",
    noLimitSet: "未设置限额", used: "% 已使用", overBudgetBy: "超出预算",
    spendingByCategory: "各类别支出", noExpenses: "本月暂无支出记录",
    monthlyOverview: "月度概览", invested: "已投资",
    saveInvest: "储蓄与投资 💹", totalSaved: "储蓄",
    goalsSaved: "目标", goals: "🎯 目标", investments: "📈 投资",
    savingsTab: "🏦 储蓄", noInvestments: "暂无投资记录。",
    noSavings: "暂无储蓄记录。", investmentTx: "投资交易",
    savingsTx: "储蓄交易", portfolioBreakdown: "投资组合分析",
    savingsBreakdown: "储蓄分析", topUp: "+ 充值", createGoal: "创建目标",
    noGoals: "暂无储蓄目标。", setGoalSub: "点击 + 创建第一个目标！",
    complete: "% 完成", goalName: "目标名称", targetAmount: "目标金额",
    historyTitle: "交易记录", allMonths: "所有月份",
    all: "全部", searchPlaceholder: "🔍 搜索交易...",
    netFiltered: "筛选期间净额", noTxFound: "未找到交易记录。",
    statsTitle: "统计 📈", settingsTitle: "设置 ⚙️",
    theme: "主题", darkMode: "深色模式", lightMode: "浅色模式", systemMode: "跟随系统", language: "语言", currency: "货币", calculator: "计算器",

    catLabels: {"food": "餐饮", "transport": "交通", "groceries": "杂货", "housing": "住房", "shopping": "购物", "health": "健康", "snacks": "零食与便利店", "telco": "电信与网络", "entertainment": "娱乐", "education": "教育", "travel": "旅游", "pets": "宠物", "donation": "捐款与慈善", "savings": "储蓄/转账", "investment": "投资", "income": "收入"},
      noSubscriptions: "本月无订阅记录。", noCreditCard: "本月无信用卡消费。", itemCount: "项", itemCountPlural: "项",
    paid: "已付", total: "总计", markPaid: "标记已付", unpay: "取消付款",
    selectCard: "— 选择卡片 —",
  },
  TA: {
    home: "முகப்பு", history: "வரலாறு", stats: "புள்ளிவிவரம்", wealth: "செல்வம்",
    budget: "பட்ஜெட்", settings: "அமைப்புகள்", addTransaction: "பரிவர்த்தனை சேர்",
    expense: "செலவு", income: "வருமானம்", category: "வகை",
    subcategory: "உட்பிரிவு", subscription: "சந்தா?",
    creditCard: "கிரெடிட் கார்டு?", paymentMethod: "கட்டண முறை",
    date: "தேதி", note: "குறிப்பு (விருப்பமானது)", saveTransaction: "சேமி",
    saved: "✓ சேமிக்கப்பட்டது!", yes: "✓ ஆம்", no: "✗ இல்லை",
    availableBalance: "கிடைக்கும் இருப்பு", goodDay: "வணக்கம்! 👋",
    overview: "கண்ணோட்டம்", expenses: "செலவுகள்", savings: "சேமிப்பு",
    topSpending: "முக்கிய செலவுகள்", recentTransactions: "சமீபத்திய பரிவர்த்தனைகள்",
    noTransactions: "பரிவர்த்தனைகள் இல்லை.", tapToAdd: "+ அழுத்தி சேர்க்கவும்!",
    overBudget: "பட்ஜெட் மீறியது",
    monthlyBudget: "மாதாந்திர பட்ஜெட் 💰", overallBudget: "மொத்த பட்ஜெட்",
    remaining: "மீதி", setLimit: "+ வரம்பு நிர்ணயி", editLimit: "✏️ திருத்து",
    noLimitSet: "வரம்பு இல்லை", used: "% பயன்படுத்தப்பட்டது", overBudgetBy: "மீறிய தொகை",
    spendingByCategory: "வகையின்படி செலவு", noExpenses: "செலவுகள் இல்லை",
    monthlyOverview: "மாதாந்திர கண்ணோட்டம்", invested: "முதலீடு செய்யப்பட்டது",
    saveInvest: "சேமி & முதலீடு 💹", totalSaved: "சேமிப்பு",
    goalsSaved: "இலக்கு", goals: "🎯 இலக்குகள்", investments: "📈 முதலீடுகள்",
    savingsTab: "🏦 சேமிப்பு", noInvestments: "முதலீடுகள் இல்லை.",
    noSavings: "சேமிப்பு இல்லை.", investmentTx: "முதலீட்டு பரிவர்த்தனைகள்",
    savingsTx: "சேமிப்பு பரிவர்த்தனைகள்", portfolioBreakdown: "போர்ட்ஃபோலியோ பகுப்பாய்வு",
    savingsBreakdown: "சேமிப்பு பகுப்பாய்வு", topUp: "+ நிரப்பு", createGoal: "இலக்கு உருவாக்கு",
    noGoals: "இலக்குகள் இல்லை.", setGoalSub: "+ அழுத்தி இலக்கு உருவாக்கவும்!",
    complete: "% முடிந்தது", goalName: "இலக்கு பெயர்", targetAmount: "இலக்கு தொகை",
    historyTitle: "பரிவர்த்தனை வரலாறு", allMonths: "அனைத்து மாதங்கள்",
    all: "அனைத்தும்", searchPlaceholder: "🔍 தேடு...",
    netFiltered: "வடிகட்டிய காலகட்டத்தின் நிகர", noTxFound: "பரிவர்த்தனைகள் கிடைக்கவில்லை.",
    statsTitle: "புள்ளிவிவரம் 📈", settingsTitle: "அமைப்புகள் ⚙️",
    theme: "தீம்", darkMode: "இருண்ட பயன்முறை", lightMode: "வெளிர் பயன்முறை", systemMode: "கணினி பயன்முறை", language: "மொழி", currency: "நாணயம்", calculator: "கணிப்பான்",

    catLabels: {"food": "உணவு & பானங்கள்", "transport": "போக்குவரத்து", "groceries": "மளிகை", "housing": "வீட்டு வசதி", "shopping": "கடை", "health": "உடல்நலம்", "snacks": "தின்பண்டங்கள்", "telco": "தொலைத்தொடர்பு", "entertainment": "பொழுதுபோக்கு", "education": "கல்வி", "travel": "பயணம்", "pets": "செல்லப்பிராணி", "donation": "தானம்", "savings": "சேமிப்பு / பரிமாற்றம்", "investment": "முதலீடு", "income": "வருமானம்"},
      noSubscriptions: "இம்மாதம் சந்தாக்கள் இல்லை.", noCreditCard: "இம்மாதம் கிரெடிட் கார்டு பயன்பாடு இல்லை.", itemCount: "உருப்படி", itemCountPlural: "உருப்படிகள்",
    paid: "செலுத்தப்பட்டது", total: "மொத்தம்", markPaid: "செலுத்தியதாக குறி", unpay: "ரத்து செய்",
    selectCard: "— அட்டை தேர்ந்தெடு —",
  },
};

function useT(settings) {
  const lang = settings?.language || "EN";
  const tr = TRANSLATIONS[lang] || TRANSLATIONS.EN;
  return {
    ...tr,
    getCatLabel: (key) => tr.catLabels?.[key] || TRANSLATIONS.EN.catLabels?.[key] || key,
  };
}

function formatSGD(val, sym) {
  const s = sym || "S$";
  return s + " " + parseFloat(val || 0).toFixed(2);
}


function haptic(type = "light") {
  if (!navigator.vibrate) return;
  if (type === "light")   navigator.vibrate(10);
  if (type === "medium")  navigator.vibrate(30);
  if (type === "heavy")   navigator.vibrate([50, 30, 50]);
  if (type === "success") navigator.vibrate([10, 50, 10]);
  if (type === "error")   navigator.vibrate([50, 30, 50, 30, 50]);
}

function useSym(settings) {
  return settings?.currencySymbol || "S$";
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(dateStr) {
  return dateStr ? dateStr.slice(0, 7) : "";
}

const STORAGE_KEY = "sg_finance_tracker_v8";

// ── THEME ────────────────────────────────────────────────────────────────────

const THEMES = {
  dark: {
    bg: "#0F2B34", surface: "#124554", surface2: "#0F3B48", surface3: "#1a5566",
    border: "#1F5A68", border2: "#164856", text: "#F0F8FA", textMuted: "#88BCC5",
    textDim: "#5FA8B2", textFaint: "#4A8894", navBg: "#0A1F27", sideNavBg: "#0F2B34",
    balanceCard: "linear-gradient(135deg, #0F2B34 0%, #0A1F27 100%)",
    inputBg: "#124554", inputInner: "#0F2B34",
    alertBg: "#3A2A2A", alertBorder: "#FF6B6B44",
    hintBg: "#1a4055", hintBorder: "#7FD9E544",
    calcClear: "#1F5A68", calcNum: "#0F3B48",
    cancelBg: "#1F5A68", divider: "#1F5A68",
    catBorder: "#1F5A68", modalClose: "#1F5A68", accent: "#7FD9E5",
  },
  light: {
    bg: "#F2DFCE", surface: "#FFF9F5", surface2: "#FFF1E0", surface3: "#EDD5BE",
    border: "#DFC4A8", border2: "#E8D0B8", text: "#1A120A", textMuted: "#0D7680",
    textDim: "#2A6068", textFaint: "#5A9098", navBg: "#FFF9F5", sideNavBg: "#FFF1E0",
    balanceCard: "linear-gradient(135deg, #0D7680 0%, #085560 100%)",
    inputBg: "#FFF9F5", inputInner: "#F2DFCE",
    alertBg: "#FDEEE8", alertBorder: "#FF6B6B44",
    hintBg: "#D6EEF0", hintBorder: "#0D768044",
    calcClear: "#EDD5BE", calcNum: "#F2DFCE",
    cancelBg: "#EDD5BE", divider: "#DFC4A8",
    catBorder: "#DFC4A8", modalClose: "#EDD5BE", accent: "#0D7680",
  },
};

function useTheme(settings) {
  const theme = settings?.theme || "dark";
  const prefersDark = typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
  return THEMES[resolved] || THEMES.dark;
}

// ── RESPONSIVE HOOK ───────────────────────────────────────────────────────────

function useScreenSize() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 430);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return { isTablet: width >= 768, width };
}


// ── PIN LOCK ──────────────────────────────────────────────────────────────────

function PinLock({ storedPin, onUnlock, th, biometricEnabled }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [bioStatus, setBioStatus] = useState(""); // "", "scanning", "failed"

  // Auto-trigger biometric on mount if enabled
  React.useEffect(() => {
    if (biometricEnabled) {
      setTimeout(tryBiometric, 400);
    } else {
      setShowPin(true);
    }
  }, []);

  const tryBiometric = async () => {
    setBioStatus("scanning");
    try {
      // Check WebAuthn support
      if (!window.PublicKeyCredential) {
        setBioStatus("failed");
        setShowPin(true);
        return;
      }
      // Check if platform authenticator (fingerprint/Face ID) is available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setBioStatus("failed");
        setShowPin(true);
        return;
      }
      // Use a simple challenge — just verify user presence
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const credId = localStorage.getItem("savvie_bio_cred");
      if (!credId) {
        setBioStatus("failed");
        setShowPin(true);
        return;
      }
      const credIdBytes = Uint8Array.from(atob(credId), c => c.charCodeAt(0));
      await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 30000,
          userVerification: "required",
          allowCredentials: [{ type: "public-key", id: credIdBytes, transports: ["internal"] }],
        }
      });
      // Success
      haptic("success");
      setBioStatus("");
      onUnlock();
    } catch(e) {
      setBioStatus("failed");
      setShowPin(true);
    }
  };

  const press = (val) => {
    if (pin.length >= 4) return;
    haptic("light");
    const next = pin + val;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      if (btoa(next.split("").reverse().join("") + "sv") === storedPin) {
        haptic("success");
        setTimeout(onUnlock, 200);
      } else {
        setShake(true);
        setError(true);
        haptic("error");
        setTimeout(() => { setPin(""); setShake(false); }, 600);
      }
    }
  };

  const del = () => { setPin(p => p.slice(0,-1)); setError(false); };

  return (
    <div style={{ minHeight:"100vh", background: th.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding: 32 }}>
      {/* Logo */}
      <div style={{ width:72, height:72, borderRadius:20, background:"#0D7680", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24, boxShadow:"0 8px 32px #0D768033" }}>
        <span style={{ fontSize:36 }}>🔒</span>
      </div>
      <p style={{ color: th.text, fontSize:22, fontWeight:800, margin:"0 0 6px" }}>SAVVIE</p>

      {/* Biometric scanning state */}
      {bioStatus === "scanning" && !showPin && (
        <div style={{ textAlign:"center", marginTop:20 }}>
          <p style={{ fontSize:64, margin:"0 0 16px" }}>👆</p>
          <p style={{ color: th.textMuted, fontSize:15, margin:"0 0 24px" }}>Touch the fingerprint sensor</p>
          <div style={{ width:32, height:32, border:"3px solid #0D768033", borderTop:"3px solid #0D7680", borderRadius:"50%", animation:"spin 0.8s linear infinite", margin:"0 auto 24px" }} />
          <button onClick={() => { setBioStatus(""); setShowPin(true); }} style={{ background:"transparent", border:"none", color:th.textMuted, fontSize:13, cursor:"pointer", textDecoration:"underline" }}>
            Use PIN instead
          </button>
        </div>
      )}

      {/* Failed biometric */}
      {bioStatus === "failed" && !showPin && (
        <div style={{ textAlign:"center", marginTop:20 }}>
          <p style={{ fontSize:48, margin:"0 0 12px" }}>❌</p>
          <p style={{ color:"#FF6B6B", fontSize:14, margin:"0 0 20px" }}>Biometric failed. Use PIN.</p>
        </div>
      )}

      {/* PIN entry */}
      {showPin && (
        <>
          <p style={{ color: th.textMuted, fontSize:14, margin:"0 0 32px" }}>Enter your PIN to continue</p>
          <div style={{ display:"flex", gap:16, marginBottom:12, animation: shake ? "shake 0.5s ease" : "none" }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ width:18, height:18, borderRadius:"50%", background: i < pin.length ? "#0D7680" : "transparent", border:"2px solid " + (i < pin.length ? "#0D7680" : th.border), transition:"all 0.15s" }} />
            ))}
          </div>
          {error && <p style={{ color:"#FF6B6B", fontSize:13, margin:"0 0 20px", fontWeight:600 }}>Incorrect PIN. Try again.</p>}
          {!error && <div style={{ height:33, marginBottom:20 }} />}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, width:"100%", maxWidth:280 }}>
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((btn, i) => (
              <button key={i} onClick={() => { haptic("light"); if (btn === "⌫") del(); else if (btn) press(btn); }}
                style={{ height:72, background: btn === "" ? "transparent" : btn === "⌫" ? th.surface2 : th.surface, border: btn === "" ? "none" : "1px solid " + th.border, borderRadius:16, fontSize:24, fontWeight:700, color: btn === "⌫" ? th.textMuted : th.textMuted, cursor: btn ? "pointer" : "default", transition:"all 0.1s" }}>
                {btn}
              </button>
            ))}
          </div>
          {biometricEnabled && (
            <button onClick={tryBiometric} style={{ marginTop:20, background:"transparent", border:"none", color:"#0D7680", fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontWeight:600 }}>
              <span style={{ fontSize:20 }}>👆</span> Try fingerprint again
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    icon: "🇸🇬",
    title: "Welcome to Savvie",
    subtitle: "Track. Plan. Grow.",
    desc: "Your all-in-one personal finance tracker built for Singapore. Manage your money the smart way.",
    bg: "#0F2B34",
  },
  {
    icon: "💸",
    title: "Track Every Dollar",
    subtitle: "Know where your money goes",
    desc: "Log expenses and income instantly. Categorised for Singapore — hawker meals, Grab rides, groceries and more.",
    bg: "#1A6B3C",
  },
  {
    icon: "📊",
    title: "Import Bank Transactions",
    subtitle: "Smart auto-categorisation",
    desc: "Download your CSV from DBS, OCBC, UOB or any SG bank. We automatically categorise everything — 100+ merchants recognised.",
    bg: "#005BAC",
  },
  {
    icon: "💰",
    title: "Set Budgets and Goals",
    subtitle: "Stay on top of your finances",
    desc: "Set monthly spending limits per category, create savings goals and track your investments — all in one place.",
    bg: "#16213E",
  },
  {
    icon: "💱",
    title: "Currency Converter",
    subtitle: "Built for travellers",
    desc: "Travelling soon? Instantly convert between 30+ currencies — SGD, USD, MYR, KRW, JPY and more — right from your Home tab.",
    bg: "#124554",
  },
  {
    icon: "📈",
    title: "Insights at a Glance",
    subtitle: "Understand your money",
    desc: "Beautiful charts and stats show exactly where you stand — monthly, yearly, by category.",
    bg: "#4A1A6B",
  },
  {
    icon: "💰",
    title: "Pick Your Currency",
    subtitle: "Almost Done",
    desc: "Choose your home currency. Savvie works for Singapore and travellers worldwide.",
    bg: "#0D7680",
    isCurrency: true,
  },
];

function Onboarding({ onDone, th, settings, onUpdateSetting }) {
  const styles = makeStyles(th);
  const [slide, setSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState(1); // 1 = forward, -1 = back
  const touchStartX = { current: 0 };
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  const goTo = (index) => {
    if (animating || index === slide) return;
    setSlideDir(index > slide ? 1 : -1);
    setAnimating(true);
    setTimeout(() => { setSlide(index); setAnimating(false); }, 300);
  };

  const next = () => {
    if (isLast) { onDone(); return; }
    goTo(slide + 1);
  };

  const prev = () => {
    if (slide > 0) goTo(slide - 1);
  };

  const skip = () => onDone();

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: current.bg, transition: "background 0.5s ease", position: "relative", overflow: "hidden" }}>

      {/* Decorative circles */}
      <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
      <div style={{ position: "absolute", top: 60, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
      <div style={{ position: "absolute", bottom: 120, left: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

      {/* Skip */}
      {!isLast && (
        <button onClick={() => { haptic("light"); skip(); }} style={{ position: "absolute", top: 52, right: 24, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, color: "#fff", padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          Skip
        </button>
      )}

      {/* Back arrow */}
      {slide > 0 && (
        <button onClick={() => { haptic("light"); prev(); }} style={{ position: "absolute", top: 52, left: 24, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, color: "#fff", padding: "8px 14px", cursor: "pointer", fontSize: 18 }}>
          ‹
        </button>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 32px 20px", opacity: animating ? 0 : 1, transition: "opacity 0.3s ease" }}>

        {/* Icon circle */}
        {current.icon === "🇸🇬" ? (
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: "transparent", position: "relative", marginBottom: 40, boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden", flexShrink: 0 }}>
            <img src="data:image/png;base64,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" alt="Savvie" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "120%", height: "120%", objectFit: "cover" }} />
          </div>
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56, marginBottom: 40, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            {current.icon}
          </div>
        )}

        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 12px", textAlign: "center" }}>
          {current.subtitle}
        </p>
        <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 800, margin: "0 0 20px", textAlign: "center", lineHeight: 1.2 }}>
          {current.title}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 16, lineHeight: 1.6, textAlign: "center", maxWidth: 320, margin: 0 }}>
          {current.desc}
        </p>
        {current.isCurrency && (
          <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 320 }}>
            {[
              { code: "SGD", symbol: "S$", label: "Singapore Dollar", flag: "🇸🇬" },
              { code: "USD", symbol: "US$", label: "US Dollar", flag: "🇺🇸" },
              { code: "MYR", symbol: "RM", label: "Malaysian Ringgit", flag: "🇲🇾" },
              { code: "AUD", symbol: "A$", label: "Australian Dollar", flag: "🇦🇺" },
              { code: "GBP", symbol: "£", label: "British Pound", flag: "🇬🇧" },
              { code: "EUR", symbol: "€", label: "Euro", flag: "🇪🇺" },
            ].map(c => (
              <button key={c.code} onClick={() => {
                if (typeof onUpdateSetting === "function") onUpdateSetting("currency", c.code);
                if (typeof onUpdateSetting === "function") onUpdateSetting("currencySymbol", c.symbol);
              }}
                style={{ background: "rgba(255,255,255,0.15)", border: "2px solid " + (settings?.currency === c.code ? "#fff" : "transparent"), borderRadius: 12, padding: "10px 8px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, textAlign: "center" }}>
                <span style={{ fontSize: 20 }}>{c.flag}</span>
                <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 700 }}>{c.code}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div style={{ padding: "24px 32px 48px", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>

        {/* Dots */}
        <div style={{ display: "flex", gap: 8 }}>
          {SLIDES.map((_, i) => (
            <div key={i} onClick={() => { haptic("light"); goTo(i); }} style={{ width: i === slide ? 24 : 8, height: 8, borderRadius: 4, background: i === slide ? "#fff" : "rgba(255,255,255,0.35)", transition: "all 0.3s ease", cursor: "pointer" }} />
          ))}
        </div>

        {/* CTA button */}
        <button onClick={() => { haptic("light"); next(); }} style={{ width: "100%", maxWidth: 320, background: "#fff", border: "none", borderRadius: 16, padding: "18px 0", fontSize: 16, fontWeight: 800, color: current.bg, cursor: "pointer", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", transition: "transform 0.1s ease" }}>
          {isLast ? "Get Started 🚀" : "Next →"}
        </button>

        {/* Swipe hint on first slide */}
        {slide === 0 && (
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: 0 }}>Swipe left or right to navigate</p>
        )}
      </div>
    </div>
  );
}


// ── MAIN APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [reviewShown, setReviewShown] = useState(false);
  const [recurringTx, setRecurringTx] = useState([]);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [budgets, setBudgets] = useState({});
  const [customCategories, setCustomCategories] = useState({});
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("✨");
  const [loaded, setLoaded] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [pinLocked, setPinLocked] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(() => localStorage.getItem("savvie_bio_enabled") === "1");
  const [bioSupported, setBioSupported] = useState(false);
  React.useEffect(() => {
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(ok => setBioSupported(ok)).catch(() => {});
    }
  }, []);
  const [storedPin, setStoredPin] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiry, setPremiumExpiry] = useState(null); // null = permanent, date string = daily
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAdReward, setShowAdReward] = useState(false);
  const [adWatching, setAdWatching] = useState(false);
  const [adCountdown, setAdCountdown] = useState(30);
  // Interstitial ad state
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [interstitialCountdown, setInterstitialCountdown] = useState(5);
  const [interstitialCallback, setInterstitialCallback] = useState(null);
  const [txSinceAd, setTxSinceAd] = useState(0);
  const [interstitialTodayCount, setInterstitialTodayCount] = useState(() => {
    const saved = localStorage.getItem("savvie_ad_day");
    const today = new Date().toDateString();
    if (saved) { const p = JSON.parse(saved); if (p.date === today) return p.count; }
    return 0;
  });
  // Export gate state
  const [showExportGate, setShowExportGate] = useState(false);
  const [exportGateType, setExportGateType] = useState(""); // "csv" | "pdf"
  const [exportGateWatching, setExportGateWatching] = useState(false);
  const [exportGateCountdown, setExportGateCountdown] = useState(30);

  // Check if daily premium has expired
  useEffect(() => {
    if (premiumExpiry) {
      const expiry = new Date(premiumExpiry);
      if (new Date() > expiry) {
        setIsPremium(false);
        setPremiumExpiry(null);
      }
    }
  }, [premiumExpiry]);

  // Show interstitial ad, then run callback after 5-sec countdown
  const showInterstitialAd = (callback) => {
    if (isPremium) { callback(); return; } // premium users skip ads
    setInterstitialCountdown(15); // 15 sec total
    setInterstitialCallback(() => callback);
    setShowInterstitial(true);
    let count = 15;
    const timer = setInterval(() => {
      count -= 1;
      setInterstitialCountdown(count);
      // No auto-close — user must tap X after 5 sec
    }, 1000);
    // Store timer ref so we can clear it when user closes
    window._interstitialTimer = timer;
  };
  const closeInterstitial = () => {
    if (window._interstitialTimer) { clearInterval(window._interstitialTimer); window._interstitialTimer = null; }
    setShowInterstitial(false);
    const cb = interstitialCallback;
    setInterstitialCallback(null);
    haptic("light");
    if (cb) cb();
  };

  // Export gate — watch 15s ad, skip button appears after 5s
  const watchExportAd = (type) => {
    setExportGateWatching(true);
    setExportGateCountdown(15);
    let count = 15;
    const timer = setInterval(() => {
      count -= 1;
      setExportGateCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        setExportGateWatching(false);
        setShowExportGate(false);
        haptic("success");
        if (type === "csv") doExportCSV();
        else if (type === "pdf") doExportPDF();
      }
    }, 1000);
    window._exportTimer = timer;
  };
  const skipExportAd = (type) => {
    if (window._exportTimer) { clearInterval(window._exportTimer); window._exportTimer = null; }
    setExportGateWatching(false);
    setShowExportGate(false);
    haptic("success");
    if (type === "csv") doExportCSV();
    else if (type === "pdf") doExportPDF();
  };

  const watchAdForPremium = () => {
    setAdWatching(true);
    setAdCountdown(30);
    let count = 30;
    const timer = setInterval(() => {
      count -= 1;
      setAdCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        setAdWatching(false);
        setShowAdReward(false);
        // Grant 1 day premium — only if not already active (no stacking)
        const now = new Date();
        const currentExpiry = premiumExpiry ? new Date(premiumExpiry) : null;
        if (currentExpiry && currentExpiry > now) {
          // Already active — do NOT extend, just close
          haptic("success");
          setAdWatching(false);
          setShowAdReward(false);
          return;
        }
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 1);
        setIsPremium(true);
        setPremiumExpiry(expiry.toISOString());
        haptic("success");
        window.storage.get(STORAGE_KEY).then(res => {
          const data = res?.value ? JSON.parse(res.value) : {};
          window.storage.set(STORAGE_KEY, JSON.stringify({ ...data, isPremium: true, premiumExpiry: expiry.toISOString() }));
        }).catch(() => {});
      }
    }, 1000);
  };
  const [settings, setSettings] = useState({ language: "EN", currency: "SGD", currencySymbol: "S$", theme: "dark" });
  const { isTablet } = useScreenSize();
  const th = useTheme(settings);
  const styles = makeStyles(th);

  useEffect(() => {
    document.body.style.background = th.bg;
    document.body.style.margin = "0";
    document.documentElement.style.background = th.bg;
  }, [th.bg]);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res?.value) {
          const data = JSON.parse(res.value);
          setTransactions(data.transactions || []);
          setSavingsGoals(data.savingsGoals || []);
          setBudgets(data.budgets || {});
          setCustomCategories(data.customCategories || {});
          if (data.settings) setSettings(data.settings);
          if (data.onboarded) setOnboarded(true);
          if (data.pin) { setStoredPin(data.pin); setPinEnabled(true); setPinLocked(true); }
          if (data.recurringTx) setRecurringTx(data.recurringTx);
          if (data.isPremium) {
            if (data.premiumExpiry) {
              const expiry = new Date(data.premiumExpiry);
              if (new Date() < expiry) { setIsPremium(true); setPremiumExpiry(data.premiumExpiry); }
            } else {
              setIsPremium(true); // permanent premium
            }
          }
        }
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  const purchasePremium = (plan) => {
    setIsPremium(true);
    setShowUpgrade(false);
    window.storage.get(STORAGE_KEY).then(res => {
      const data = res?.value ? JSON.parse(res.value) : {};
      window.storage.set(STORAGE_KEY, JSON.stringify({ ...data, isPremium: true, premiumPlan: plan, premiumDate: new Date().toISOString() }));
    }).catch(() => {});
  };

  const completeOnboarding = () => {
    setOnboarded(true);
    window.storage.get(STORAGE_KEY).then(res => {
      const data = res?.value ? JSON.parse(res.value) : {};
      window.storage.set(STORAGE_KEY, JSON.stringify({ ...data, onboarded: true }));
    }).catch(() => {});
  };

  // Merge default categories with custom categories
  const getAllCategories = () => {
    const merged = { ...CATEGORIES };
    Object.entries(customCategories).forEach(([key, cat]) => {
      merged[key] = {
        label: cat.name,
        icon: cat.emoji,
        color: cat.color || "#888888",
        subs: cat.subcategories || [],
        isCustom: true
      };
    });
    return merged;
  };

  const addCustomCategory = (name, emoji) => {
    if (!name.trim()) return;
    // Free users limited to 3 custom categories
    if (!isPremium && Object.keys(customCategories).length >= 3) {
      setShowUpgrade(true);
      return;
    }
    const key = "custom_" + Date.now();
    const newCat = {
      name,
      emoji,
      color: "#888888",
      subcategories: []
    };
    setCustomCategories(prev => ({ ...prev, [key]: newCat }));
    setNewCategoryName("");
    setNewCategoryEmoji("✨");
    setShowAddCategory(false);
    haptic("medium");
  };

  const deleteCustomCategory = (key) => {
    setCustomCategories(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    haptic("light");
  };

  // Auto-save custom categories when they change
  useEffect(() => {
    save(transactions, savingsGoals, budgets, settings, customCategories);
  }, [customCategories]);

  const save = useCallback((txns, goals, bdg, s, customCats = customCategories) => {
    window.storage.get(STORAGE_KEY).then(res => {
      const existing = res?.value ? JSON.parse(res.value) : {};
      window.storage.set(STORAGE_KEY, JSON.stringify({ ...existing, transactions: txns, savingsGoals: goals, budgets: bdg, settings: s, customCategories: customCats, recurringTx: existing.recurringTx || [] }));
    }).catch(() => {});
  }, [customCategories]);

  const addRecurringTx = (rec) => {
    const updated = [{ ...rec, id: Date.now() }, ...recurringTx];
    setRecurringTx(updated);
    window.storage.get(STORAGE_KEY).then(res => {
      const existing = res?.value ? JSON.parse(res.value) : {};
      window.storage.set(STORAGE_KEY, JSON.stringify({ ...existing, recurringTx: updated }));
    }).catch(() => {});
  };
  const deleteRecurringTx = (id) => {
    const updated = recurringTx.filter(r => r.id !== id);
    setRecurringTx(updated);
    window.storage.get(STORAGE_KEY).then(res => {
      const existing = res?.value ? JSON.parse(res.value) : {};
      window.storage.set(STORAGE_KEY, JSON.stringify({ ...existing, recurringTx: updated }));
    }).catch(() => {});
  };
  // Auto-post recurring transactions on app load
  React.useEffect(() => {
    if (!recurringTx.length) return;
    const today = new Date().toISOString().slice(0, 10);
    const toPost = recurringTx.filter(r => r.nextDate && r.nextDate <= today);
    if (!toPost.length) return;
    let updatedTxs = [...transactions];
    const updatedRec = recurringTx.map(r => {
      if (!r.nextDate || r.nextDate > today) return r;
      updatedTxs = [{ ...r, id: Date.now() + Math.random(), date: r.nextDate, isRecurring: true }, ...updatedTxs];
      // Advance nextDate by frequency
      const next = new Date(r.nextDate);
      if (r.frequency === "weekly") next.setDate(next.getDate() + 7);
      else if (r.frequency === "monthly") next.setMonth(next.getMonth() + 1);
      else if (r.frequency === "yearly") next.setFullYear(next.getFullYear() + 1);
      return { ...r, nextDate: next.toISOString().slice(0, 10) };
    });
    setTransactions(updatedTxs);
    setRecurringTx(updatedRec);
    save(updatedTxs, savingsGoals, budgets, settings, updatedRec);
  }, []);

  const addTransaction = (tx) => {
    const updated = [{ ...tx, id: tx.id || Date.now() }, ...transactions];
    setTransactions(updated);
    save(updated, savingsGoals, budgets, settings);
    if (!reviewShown && updated.length === 10) {
      setReviewShown(true);
      setTimeout(() => setShowReviewPrompt(true), 1500);
    }
    // Show interstitial ad every 10 transactions, max 3 per day for free users
    if (!isPremium) {
      const today = new Date().toDateString();
      const savedDay = localStorage.getItem("savvie_ad_day");
      const parsed = savedDay ? JSON.parse(savedDay) : null;
      const todayCount = parsed && parsed.date === today ? parsed.count : 0;
      const newCount = txSinceAd + 1;
      if (newCount >= 10 && todayCount < 3) {
        setTxSinceAd(0);
        const newTodayCount = todayCount + 1;
        setInterstitialTodayCount(newTodayCount);
        localStorage.setItem("savvie_ad_day", JSON.stringify({ date: today, count: newTodayCount }));
        setTimeout(() => showInterstitialAd(() => {}), 600);
      } else {
        setTxSinceAd(newCount);
      }
    }
  };

  const updateTransaction = (id, changes) => {
    const updated = transactions.map(tx => tx.id === id ? { ...tx, ...changes } : tx);
    setTransactions(updated);
    save(updated, savingsGoals, budgets, settings);
  };

  const deleteTransaction = (id) => {
    const updated = transactions.filter(tx => tx.id !== id);
    setTransactions(updated);
    save(updated, savingsGoals, budgets, settings);
  };

  const addGoal = (g) => {
    const updated = [...savingsGoals, g];
    setSavingsGoals(updated);
    save(transactions, updated, budgets, settings);
  };

  const updateGoal = (id, amount) => {
    const updated = savingsGoals.map(g => g.id === id ? { ...g, saved: Math.min(g.target, parseFloat(g.saved || 0) + parseFloat(amount)) } : g);
    setSavingsGoals(updated);
    save(transactions, updated, budgets, settings);
  };

  const deleteGoal = (id) => {
    const updated = savingsGoals.filter(g => g.id !== id);
    setSavingsGoals(updated);
    save(transactions, updated, budgets, settings);
  };

  const updateBudget = (cat, amt) => {
    const updated = { ...budgets, [cat]: amt };
    setBudgets(updated);
    save(transactions, savingsGoals, updated, settings);
  };

  // Simple PIN obfuscation - prevents casual plain-text reads in storage
  const hashPin = (p) => p ? btoa(p.split("").reverse().join("") + "sv") : "";
  const savePin = (pin) => {
    const hashed = hashPin(pin);
    setStoredPin(hashed);
    setPinEnabled(!!pin);
    window.storage.get(STORAGE_KEY).then(res => {
      const data = res?.value ? JSON.parse(res.value) : {};
      window.storage.set(STORAGE_KEY, JSON.stringify({ ...data, pin: hashed }));
    }).catch(() => {});
  };

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#0D7680", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <img src="data:image/png;base64,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" alt="Savvie" style={{ width: 88, height: 88, borderRadius: 22, objectFit: "cover", marginBottom: 24, boxShadow: "0 16px 48px rgba(0,0,0,0.3)" }} />
      <p style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>SAVVIE</p>
      <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: 600, margin: "0 0 32px" }}>Track. Plan. Grow.</p>
      <div style={{ width: 28, height: 28, border: "3px solid rgba(255,255,255,0.2)", borderTop: "3px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
  // Auto-lock on visibility change based on lockAfter setting
  // NOTE: Must be before any conditional returns (React hooks rules)
  React.useEffect(() => {
    if (!pinEnabled) return;
    let lockTimer = null;
    const lockAfterMins = settings?.lockAfter ?? 0;
    const onHide = () => {
      if (lockAfterMins === 0) { setPinLocked(true); return; }
      lockTimer = setTimeout(() => setPinLocked(true), lockAfterMins * 60 * 1000);
    };
    const onShow = () => { if (lockTimer) { clearTimeout(lockTimer); lockTimer = null; } };
    document.addEventListener("visibilitychange", () => document.hidden ? onHide() : onShow());
    return () => document.removeEventListener("visibilitychange", () => {});
  }, [pinEnabled, settings?.lockAfter]);

  if (!onboarded) return <Onboarding onDone={completeOnboarding} th={th} settings={settings} onUpdateSetting={(k,v) => setSettings(s => ({ ...s, [k]: v }))} />;
  if (pinLocked && pinEnabled) return <PinLock storedPin={storedPin} onUnlock={() => setPinLocked(false)} th={th} biometricEnabled={biometricEnabled} />;

  // Detect ghost subscriptions (recurring charges pattern)
  const detectGhostSubscriptions = () => {
    const now = new Date();
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const recent = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate >= last90Days && tx.isSubscription;
    });

    const merchantMap = {};
    recent.forEach(tx => {
      const merchant = tx.note || tx.subcategory || tx.description || "";
      const key = merchant.slice(0, 20).toUpperCase();
      if (!merchantMap[key]) merchantMap[key] = [];
      merchantMap[key].push(tx);
    });

    const ghosts = [];
    Object.entries(merchantMap).forEach(([merchant, txs]) => {
      if (txs.length >= 2) {
        const amounts = txs.map(t => t.amount);
        const dates = txs.map(t => new Date(t.date).getDate());
        
        const allSameAmount = amounts.every(a => a === amounts[0]);
        const allSameDay = dates.every(d => d === dates[0]) && dates.length >= 2;
        
        if (allSameAmount && allSameDay) {
          const totalSpent = amounts.reduce((a, b) => a + b, 0);
          const monthlyBurn = amounts[0];
          ghosts.push({
            merchant,
            monthlyAmount: monthlyBurn,
            totalLast90: totalSpent,
            count: txs.length,
            lastDate: txs[txs.length - 1].date,
            category: txs[0].category,
            confidence: txs.length >= 3 ? "High" : "Medium",
            avgDayOfMonth: Math.round(dates.reduce((a, b) => a + b) / dates.length),
          });
        }
      }
    });

    return ghosts.sort((a, b) => b.totalLast90 - a.totalLast90);
  };

  return (
    <div style={{ ...styles.app, flexDirection: isTablet ? "row" : "column", background: th.bg, color: th.text }}>
      {isTablet && <SideNav tab={tab} setTab={setTab} settings={settings} th={th} />}
      <div style={{ ...styles.content, paddingBottom: isTablet ? 24 : 80, flex: 1 }}>
        <div style={isTablet ? { maxWidth: 960, margin: "0 auto", padding: "0 8px" } : {}}>
          {tab === "dashboard" && <Dashboard transactions={transactions} budgets={budgets} savingsGoals={savingsGoals} isTablet={isTablet} settings={settings} th={th} setTab={setTab} customCategories={customCategories} detectGhostSubscriptions={detectGhostSubscriptions} />}
          {tab === "add" && <AddTransaction onAdd={addTransaction} setTab={setTab} isTablet={isTablet} settings={settings} th={th} customCategories={customCategories} addCustomCategory={addCustomCategory} />}
          {tab === "history" && <History transactions={transactions} onDelete={deleteTransaction} onEdit={updateTransaction} isTablet={isTablet} settings={settings} th={th} isPremium={isPremium} onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "stats" && <Stats transactions={transactions} isTablet={isTablet} settings={settings} th={th} isPremium={isPremium} onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "budget" && <Budget transactions={transactions} budgets={budgets} onUpdate={updateBudget} isTablet={isTablet} settings={settings} th={th} customCategories={customCategories} addCustomCategory={addCustomCategory} isPremium={isPremium} onUpgrade={() => setShowUpgrade(true)} />}
          {tab === "wealth" && <SavingsInvestment goals={savingsGoals} transactions={transactions} onAdd={addTransaction} onAddGoal={addGoal} onUpdateGoal={updateGoal} onDeleteGoal={deleteGoal} isTablet={isTablet} settings={settings} th={th} />}
          {tab === "converter" && <CurrencyConverter settings={settings} th={th} />}
          {tab === "settings" && <Settings settings={settings} setSettings={setSettings} onSave={(s) => save(transactions, savingsGoals, budgets, s)} recurringTx={recurringTx} onAddRecurring={addRecurringTx} onDeleteRecurring={deleteRecurringTx} th={th} transactions={transactions} pinEnabled={pinEnabled} storedPin={storedPin} onSavePin={savePin} isPremium={isPremium} premiumExpiry={premiumExpiry} onUpgrade={() => setShowUpgrade(true)} onWatchAd={() => setShowAdReward(true)} onExport={(type) => { if (isPremium) { return false; } setExportGateType(type); setExportGateWatching(false); setExportGateCountdown(15); setShowExportGate(true); return true; }} bioSupported={bioSupported} biometricEnabled={biometricEnabled} setBiometricEnabled={setBiometricEnabled} onImport={(newTxs) => { const updated = [...newTxs, ...transactions]; setTransactions(updated); save(updated, savingsGoals, budgets, settings); }} customCategories={customCategories} setCustomCategories={setCustomCategories} addCustomCategory={addCustomCategory} deleteCustomCategory={deleteCustomCategory} showAddCategory={showAddCategory} setShowAddCategory={setShowAddCategory} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} newCategoryEmoji={newCategoryEmoji} setNewCategoryEmoji={setNewCategoryEmoji} />}
        </div>
      </div>
      {/* ── AD BANNER (non-premium only) ── */}
      {!isPremium && !isTablet && (
        <div style={{ background: th.surface2, borderBottom: "1px solid " + th.border, padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 48 }}>
          <div style={{ background: th.border, borderRadius: 6, padding: "4px 8px", display: "flex", alignItems: "center", gap: 6, flex: 1, maxWidth: 340 }}>
            <span style={{ fontSize: 10, color: th.textFaint, fontWeight: 600 }}>AD</span>
            <p style={{ margin: 0, fontSize: 12, color: th.textMuted, flex: 1, textAlign: "center" }}>📣 Ad placeholder — Google AdMob goes here</p>
          </div>
          <button onClick={() => { haptic("light"); setShowUpgrade(true); }} style={{ background: "#0D7680", border: "none", borderRadius: 8, padding: "6px 10px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>👑 Premium</button>
        </div>
      )}

      {!isOnline && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, background: "#FF6B6B", zIndex: 600, padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>📵</span>
          <p style={{ margin: 0, color: "#fff", fontSize: 12, fontWeight: 700 }}>No internet — FX rates may be outdated</p>
        </div>
      )}
      {!isTablet && <BottomNav tab={tab} setTab={setTab} settings={settings} th={th} />}

      {/* ── WATCH AD FOR PREMIUM MODAL ── */}
      {/* ── APP REVIEW PROMPT ── */}
      {showReviewPrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: th.surface, borderRadius: 24, padding: 28, maxWidth: 320, width: "100%", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
            <p style={{ fontSize: 48, margin: "0 0 12px" }}>⭐</p>
            <p style={{ fontWeight: 800, fontSize: 18, color: th.text, margin: "0 0 8px" }}>Enjoying Savvie?</p>
            <p style={{ fontSize: 14, color: th.textMuted, margin: "0 0 24px", lineHeight: 1.5 }}>You have logged 10 transactions! Help us grow by leaving a review.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowReviewPrompt(false)} style={{ flex: 1, background: th.surface2, border: "1px solid " + th.border, borderRadius: 14, padding: "12px 0", color: th.textMuted, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                Not Now
              </button>
              <button onClick={() => {
                haptic("success");
                setShowReviewPrompt(false);
                // Opens Play Store or App Store depending on platform
                const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
                const url = isIOS
                  ? "https://apps.apple.com/app/savvie/id0000000000"
                  : "https://play.google.com/store/apps/details?id=com.savvie.app";
                window.open(url, "_blank");
              }} style={{ flex: 2, background: "#0D7680", border: "none", borderRadius: 14, padding: "12px 0", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                Rate Savvie ⭐
              </button>
            </div>
            <p style={{ fontSize: 11, color: th.textFaint, margin: "12px 0 0" }}>Open the app store page to leave your review</p>
          </div>
        </div>
      )}

      {/* ── INTERSTITIAL AD MODAL ── */}
      {showInterstitial && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 500, display: "flex", flexDirection: "column" }}>
          {/* Full screen ad area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <p style={{ color: "#555", fontSize: 13, margin: "0 0 12px" }}>📣 Advertisement</p>
            <p style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: 0 }}>Google AdMob</p>
            <p style={{ color: "#444", fontSize: 12, margin: "10px 0 0" }}>Interstitial Ad — powered by AdMob</p>
            {/* AD label top-left */}
            <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(255,255,255,0.12)", borderRadius: 6, padding: "4px 10px" }}>
              <p style={{ color: "#aaa", fontSize: 11, margin: 0, fontWeight: 700 }}>AD</p>
            </div>
            {/* Skip / countdown top-right */}
            {interstitialCountdown <= 10 ? (
              <button onClick={closeInterstitial}
                style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 14, fontWeight: 800, color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✕
              </button>
            ) : (
              <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: "6px 12px" }}>
                <p style={{ color: "#ccc", fontSize: 12, margin: 0, fontWeight: 700 }}>Skip in {interstitialCountdown - 10}s</p>
              </div>
            )}
          </div>
          {/* Bottom bar with progress */}
          <div style={{ background: "#111", padding: "16px 24px 32px", borderTop: "1px solid #222" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p style={{ color: "#888", fontSize: 12, margin: 0 }}>
                {interstitialCountdown > 10 ? "Skip ad in " + (interstitialCountdown - 10) + "s" : "You can close this ad ✕"}
              </p>
              <p style={{ color: "#555", fontSize: 12, margin: 0 }}>{15 - interstitialCountdown}s / 15s</p>
            </div>
            <div style={{ background: "#222", borderRadius: 4, height: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", background: interstitialCountdown <= 10 ? "#00B894" : "#0D7680", width: ((15 - interstitialCountdown) / 15 * 100) + "%", transition: "width 1s linear" }} />
            </div>
            <p style={{ color: "#444", fontSize: 11, margin: "10px 0 0", textAlign: "center" }}>Upgrade to Premium to remove all ads</p>
          </div>
        </div>
      )}

      {/* ── EXPORT GATE AD MODAL ── */}
      {showExportGate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: th.surface, borderRadius: 24, padding: 28, maxWidth: 360, width: "100%", border: "1px solid " + th.border, textAlign: "center" }}>
            {!exportGateWatching ? (
              <>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#74B9FF22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 16px" }}>
                  {exportGateType === "csv" ? "📊" : "📄"}
                </div>
                <p style={{ fontSize: 19, fontWeight: 800, color: th.text, margin: "0 0 8px" }}>
                  {exportGateType === "csv" ? "Export to CSV" : "Export to PDF"}
                </p>
                <p style={{ fontSize: 14, color: th.textMuted, margin: "0 0 6px", lineHeight: 1.5 }}>
                  Free users watch a short ad to export.
                </p>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#0D7680", margin: "0 0 20px" }}>
                  Watch 30s ad to download free
                </p>
                <div style={{ background: th.surface2, borderRadius: 12, padding: "10px 14px", marginBottom: 20, border: "1px solid " + th.border }}>
                  <p style={{ margin: 0, fontSize: 12, color: th.textMuted, lineHeight: 1.5 }}>
                    Upgrade to Premium to export anytime, no ads required.
                  </p>
                </div>
                <button onClick={() => watchExportAd(exportGateType)}
                  style={{ width: "100%", background: "#F0A500", border: "none", borderRadius: 14, padding: "15px 0", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 10, boxShadow: "0 4px 16px #F0A50044" }}>
                  Watch Ad to Export 🎬
                </button>
                <button onClick={() => setShowUpgrade(true)}
                  style={{ width: "100%", background: "#0D7680", border: "none", borderRadius: 14, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 10 }}>
                  👑 Go Premium — No Ads
                </button>
                <button onClick={() => setShowExportGate(false)}
                  style={{ width: "100%", background: "transparent", border: "1px solid " + th.border, borderRadius: 14, padding: "11px 0", color: th.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
      {/* Export gate — FULL SCREEN ad while watching */}
      {showExportGate && exportGateWatching && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 500, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <p style={{ color: "#555", fontSize: 13, margin: "0 0 12px" }}>📣 Advertisement</p>
            <p style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: 0 }}>Google AdMob</p>
            <p style={{ color: "#444", fontSize: 12, margin: "10px 0 0" }}>Export Ad — powered by AdMob</p>
            <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(255,255,255,0.12)", borderRadius: 6, padding: "4px 10px" }}>
              <p style={{ color: "#aaa", fontSize: 11, margin: 0, fontWeight: 700 }}>AD</p>
            </div>
            {exportGateCountdown <= 10 ? (
              <button onClick={() => skipExportAd(exportGateType)}
                style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.85)", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 14, fontWeight: 800, color: "#000", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✕
              </button>
            ) : (
              <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.12)", borderRadius: 8, padding: "6px 12px" }}>
                <p style={{ color: "#ccc", fontSize: 12, margin: 0, fontWeight: 700 }}>Skip in {exportGateCountdown - 10}s</p>
              </div>
            )}
          </div>
          <div style={{ background: "#111", padding: "16px 24px 32px", borderTop: "1px solid #222" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <p style={{ color: "#888", fontSize: 12, margin: 0 }}>
                {exportGateCountdown > 10 ? "Skip in " + (exportGateCountdown - 10) + "s" : exportGateCountdown > 0 ? "You can close this ad ✕" : "✓ Preparing export..."}
              </p>
              <p style={{ color: "#555", fontSize: 12, margin: 0 }}>{15 - exportGateCountdown}s / 15s</p>
            </div>
            <div style={{ background: "#222", borderRadius: 4, height: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", background: exportGateCountdown <= 10 ? "#00B894" : "#0D7680", width: ((15 - exportGateCountdown) / 15 * 100) + "%", transition: "width 1s linear" }} />
            </div>
            <p style={{ color: "#444", fontSize: 11, margin: "10px 0 0", textAlign: "center" }}>Upgrade to Premium to export without ads</p>
          </div>
        </div>
      )}

      {showAdReward && (
        <div style={{ position: "fixed", inset: 0, background: adWatching ? "#000" : "rgba(0,0,0,0.85)", zIndex: 400, display: "flex", alignItems: adWatching ? "stretch" : "center", justifyContent: "center", padding: adWatching ? 0 : 24, flexDirection: "column" }}>
          <div style={{ background: adWatching ? "transparent" : th.surface, borderRadius: adWatching ? 0 : 24, padding: adWatching ? 0 : 28, maxWidth: adWatching ? "100%" : 360, width: "100%", border: adWatching ? "none" : "1px solid " + th.border, textAlign: "center", flex: adWatching ? 1 : "unset", display: adWatching ? "flex" : "block", flexDirection: "column" }}>
            {!adWatching ? (
              <>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F0A50022", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 16px" }}>🎬</div>
                <p style={{ fontSize: 20, fontWeight: 800, color: th.text, margin: "0 0 8px" }}>Watch 1 Ad</p>
                <p style={{ fontSize: 14, color: th.textMuted, margin: "0 0 6px" }}>Watch a short 30-second ad and get</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: "#0D7680", margin: "0 0 20px" }}>👑 1 Day of Premium Free</p>
                <div style={{ background: th.surface2, borderRadius: 14, padding: "12px 16px", marginBottom: 20, border: "1px solid " + th.border }}>
                  <p style={{ margin: 0, fontSize: 12, color: th.textMuted, lineHeight: 1.5 }}>No skip button. Watch the full 30 seconds to unlock your free day. You can do this once per day.</p>
                </div>
                {(() => {
                  const now = new Date();
                  const expiry = premiumExpiry ? new Date(premiumExpiry) : null;
                  const stillActive = expiry && expiry > now;
                  if (stillActive) {
                    const hoursLeft = Math.ceil((expiry - now) / (1000 * 60 * 60));
                    const minsLeft  = Math.ceil((expiry - now) / (1000 * 60));
                    const timeLeft  = hoursLeft >= 1 ? hoursLeft + "h" : minsLeft + "m";
                    return (
                      <>
                        <div style={{ background: "#0D768022", borderRadius: 14, padding: "14px 16px", marginBottom: 16, border: "1px solid #0D768044" }}>
                          <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#0D7680" }}>👑 Premium is active!</p>
                          <p style={{ margin: 0, fontSize: 13, color: th.textMuted, lineHeight: 1.5 }}>
                            Your free day expires in <strong>{timeLeft}</strong>. Come back then to watch another ad and renew.
                          </p>
                        </div>
                        <button onClick={() => setShowAdReward(false)} style={{ width: "100%", background: "#0D7680", border: "none", borderRadius: 14, padding: "14px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                          Got it 👍
                        </button>
                      </>
                    );
                  }
                  return (
                    <>
                      <button onClick={watchAdForPremium} style={{ width: "100%", background: "#F0A500", border: "none", borderRadius: 14, padding: "16px 0", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", marginBottom: 10, boxShadow: "0 4px 16px #F0A50044" }}>
                        Watch Now 🎬
                      </button>
                      <button onClick={() => setShowAdReward(false)} style={{ width: "100%", background: "transparent", border: "1px solid " + th.border, borderRadius: 14, padding: "12px 0", color: th.textMuted, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                        Maybe Later
                      </button>
                    </>
                  );
                })()}
              </>
            ) : (
              <>
                {/* Full screen ad playing */}
                <div style={{ flex: 1, background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <p style={{ color: "#555", fontSize: 13, margin: "0 0 12px" }}>📣 Advertisement</p>
                  <p style={{ color: "#fff", fontSize: 32, fontWeight: 800, margin: 0 }}>Google AdMob</p>
                  <p style={{ color: "#444", fontSize: 12, margin: "10px 0 0" }}>Rewarded Ad — No skip</p>
                  <div style={{ position: "absolute", top: 16, left: 16, background: "rgba(255,255,255,0.12)", borderRadius: 6, padding: "4px 10px" }}>
                    <p style={{ color: "#aaa", fontSize: 11, margin: 0, fontWeight: 700 }}>AD</p>
                  </div>
                </div>
                <div style={{ background: "#111", padding: "16px 24px 32px", borderTop: "1px solid #222" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <p style={{ color: "#888", fontSize: 12, margin: 0 }}>{adCountdown > 0 ? "No skip — watch to earn Premium" : "✓ Done! Unlocking premium..."}</p>
                    <p style={{ color: "#555", fontSize: 12, margin: 0 }}>{30 - adCountdown}s / 30s</p>
                  </div>
                  <div style={{ background: "#222", borderRadius: 4, height: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "#F0A500", width: ((30 - adCountdown) / 30 * 100) + "%", transition: "width 1s linear" }} />
                  </div>
                  <p style={{ color: "#444", fontSize: 11, margin: "10px 0 0", textAlign: "center" }}>👑 You will get 1 day Premium after this</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── PREMIUM UPGRADE MODAL ── */}
      {showUpgrade && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 400, display: "flex", flexDirection: "column", overflowY: "auto" }}>
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #0D7680 0%, #16213E 100%)", padding: "60px 24px 40px", textAlign: "center", position: "relative" }}>
            <button onClick={() => setShowUpgrade(false)} style={{ position: "absolute", top: 52, right: 20, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 32, height: 32, color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, margin: "0 auto 20px", boxShadow: "0 12px 40px rgba(0,0,0,0.3)" }}>👑</div>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", margin: "0 0 8px" }}>Go Premium</p>
            <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: "0 0 10px", letterSpacing: -0.5 }}>SAVVIE Premium</h1>
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, margin: 0 }}>Unlock your full financial potential</p>
          </div>

          {/* Body */}
          <div style={{ background: th.bg, padding: "24px 20px 40px", flex: 1 }}>
            {/* Honest value prop */}
            <p style={{ color: th.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px" }}>What you get</p>
            <div style={{ background: th.surface, borderRadius: 16, padding: 16, marginBottom: 24, border: "1px solid " + th.border }}>
              {[
                { icon: "🚫", text: "No ads — banner, interstitial and export gates removed" },
                { icon: "📋", text: "Full transaction history — unlimited months" },
                { icon: "📊", text: "Full stats — view any year, not just current month" },
                { icon: "🏷️", text: "Unlimited custom categories — no 3-category cap" },
                { icon: "📤", text: "Export anytime — CSV and PDF with no ad gate" },
                { icon: "🇸🇬", text: "CPF tracker — full access, Singapore-specific" },
              ].map((f, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid " + th.border : "none" }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{f.icon}</span>
                  <p style={{ margin: 0, fontSize: 14, color: th.text, fontWeight: 500 }}>{f.text}</p>
                </div>
              ))}
            </div>

            {/* Pricing tiers */}
            <p style={{ color: th.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 14px" }}>Choose your plan</p>

            {/* Lifetime — featured */}
            <button onClick={() => { haptic("success"); purchasePremium("lifetime"); }}
              style={{ width: "100%", background: "linear-gradient(135deg, #0D7680 0%, #16213E 100%)", border: "none", borderRadius: 16, padding: 18, marginBottom: 10, cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden", boxShadow: "0 8px 24px #0D768044" }}>
              <div style={{ position: "absolute", top: 12, right: 12, background: "#F0A500", color: "#fff", borderRadius: 12, padding: "3px 10px", fontSize: 10, fontWeight: 800, letterSpacing: 0.5 }}>BEST VALUE</div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.8 }}>🚀 Launch Special</p>
              <p style={{ color: "#fff", fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>Lifetime Access</p>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, margin: "0 0 8px" }}>Pay once, own forever. No recurring fees.</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <p style={{ color: "#fff", fontSize: 28, fontWeight: 800, margin: 0 }}>S$14.99</p>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, margin: 0, textDecoration: "line-through" }}>S$24.99</p>
              </div>
            </button>

            {/* Yearly */}
            <button onClick={() => { haptic("success"); purchasePremium("yearly"); }}
              style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 16, padding: 18, marginBottom: 10, cursor: "pointer", textAlign: "left", position: "relative" }}>
              <div style={{ position: "absolute", top: 14, right: 14, background: "#0D768022", color: "#0D7680", borderRadius: 10, padding: "3px 8px", fontSize: 10, fontWeight: 700 }}>SAVE 44%</div>
              <p style={{ color: th.textMuted, fontSize: 12, fontWeight: 600, margin: "0 0 4px" }}>Yearly</p>
              <p style={{ color: th.text, fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>S$19.99 / year</p>
              <p style={{ color: th.textMuted, fontSize: 12, margin: 0 }}>Just S$1.67/month, billed annually</p>
            </button>

            {/* Monthly */}
            <button onClick={() => { haptic("success"); purchasePremium("monthly"); }}
              style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 16, padding: 18, marginBottom: 16, cursor: "pointer", textAlign: "left" }}>
              <p style={{ color: th.textMuted, fontSize: 12, fontWeight: 600, margin: "0 0 4px" }}>Monthly</p>
              <p style={{ color: th.text, fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>S$2.99 / month</p>
              <p style={{ color: th.textMuted, fontSize: 12, margin: 0 }}>Cancel anytime</p>
            </button>

            <p style={{ color: th.textFaint, fontSize: 11, textAlign: "center", margin: "8px 0 0", lineHeight: 1.5 }}>
              Cancel subscriptions anytime in Google Play or App Store.<br />All data is stored locally on your device — never uploaded to any server.<br />Lifetime purchase is non-refundable.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

function Dashboard({ transactions, budgets, savingsGoals, isTablet, settings, th = THEMES.dark, setTab, customCategories = {}, detectGhostSubscriptions }) {
  const styles = makeStyles(th);
  const sym = useSym(settings);
  const t = useT(settings);

  // Merge default and custom categories
  const getAllCategories = () => {
    const merged = { ...CATEGORIES };
    Object.entries(customCategories).forEach(([key, cat]) => {
      merged[key] = {
        label: cat.name,
        icon: cat.emoji,
        color: cat.color || "#888888",
        subs: cat.subcategories || []
      };
    });
    return merged;
  };
  const allCats = getAllCategories();
  const now = new Date();
  const resetDay = settings?.budgetResetDay || 1;
  const effectiveMonth = (() => {
    const d = new Date();
    // If today is before reset day, budget month is previous calendar month
    if (d.getDate() < resetDay) {
      return new Date(d.getFullYear(), d.getMonth() - 1, 1).getFullYear() + "-" + String(new Date(d.getFullYear(), d.getMonth() - 1, 1).getMonth() + 1).padStart(2, "0");
    }
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  })();
  const currentMonth = effectiveMonth;
  const [modal, setModal] = useState(null);
  const [convFrom, setConvFrom] = useState(settings?.currency || "SGD");
  const [convTo, setConvTo] = useState("USD");
  const [convAmt, setConvAmt] = useState("");
  const [quickList, setQuickList] = useState(["USD","MYR","JPY","KRW","AUD","EUR","GBP","CNY","THB","IDR","HKD","INR"]);
  const [editingSlot, setEditingSlot] = useState(null);
  const [liveRates, setLiveRates] = useState(null); // null = using fallback
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [ratesUpdated, setRatesUpdated] = useState("");
  const [ratesLoading, setRatesLoading] = useState(false);
  const holdTimer = { current: null };

  const getRate = (from, to) => {
    const rates = liveRates || RATES_FROM_SGD;
    if (liveRates) {
      // liveRates are relative to SGD base
      return (liveRates[to] || 1) / (liveRates[from] || 1);
    }
    return (RATES_FROM_SGD[to] || 1) / (RATES_FROM_SGD[from] || 1);
  };

  const fetchRates = () => {
    setRatesLoading(true);
    fetch("https://api.frankfurter.app/latest?base=SGD")
      .then(r => r.json())
      .then(data => {
        if (data?.rates) {
          const rates = { SGD: 1, ...data.rates };
          setLiveRates(rates);
          const now = new Date();
          setRatesUpdated(now.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" }) + " · " + now.toLocaleDateString("en-SG", { day: "numeric", month: "short" }));
        }
        setRatesLoading(false);
      })
      .catch(() => { setRatesLoading(false); });
  };

  useEffect(() => { fetchRates(); }, []);

  // Back button handler removed - converter is now a regular tab

  const handleQuickHoldStart = (idx) => {
    holdTimer.current = setTimeout(() => setEditingSlot(idx), 600);
  };
  const handleQuickHoldEnd = () => { clearTimeout(holdTimer.current); };
  const replaceQuickSlot = (newCurrency) => {
    const updated = [...quickList];
    updated[editingSlot] = newCurrency;
    setQuickList(updated);
    setEditingSlot(null);
    setConvTo(newCurrency);
  };

  // FX converter is a regular tab — no modal needed
  const [showConverted, setShowConverted] = useState(false);

  // Currency conversion
  const baseCurrency = settings?.currency || "SGD";
  const convertCurrency = settings?.convertCurrency || "USD";
  const convertSymbol = settings?.convertSymbol || "US$";
  const rate = (RATES_FROM_SGD[convertCurrency] || 1) / (RATES_FROM_SGD[baseCurrency] || 1);
  const convert = (val) => convertSymbol + " " + (val * rate).toFixed(2);
  const [cardTapped, setCardTapped] = useState(false);

  const handleConvertToggle = (e) => { e.stopPropagation(); setShowConverted(c => !c); };
  const handleBalanceCardTap = () => {
    setCardTapped(true);
    setTimeout(() => { setCardTapped(false); setTab("stats"); }, 400);
  }; // null | "subscription" | "creditcard"

  const monthTx = transactions.filter(tx => monthKey(tx.date) === currentMonth);
  const income = monthTx.filter(tx => tx.category === "income").reduce((s, tx) => s + tx.amount, 0);
  const expenses = monthTx.filter(tx => tx.category !== "income" && tx.category !== "savings").reduce((s, tx) => s + tx.amount, 0);
  const savings = monthTx.filter(tx => tx.category === "savings").reduce((s, tx) => s + tx.amount, 0);
  const balance = income - expenses - savings;
  const subscriptionTxList = monthTx.filter(tx => tx.isSubscription);
  const creditCardTxList   = monthTx.filter(tx => tx.isCreditCard);
  const subscriptions  = subscriptionTxList.reduce((s, tx) => s + tx.amount, 0);
  const creditCardSpend = creditCardTxList.reduce((s, tx) => s + tx.amount, 0);

  // Category breakdown
  const catBreakdown = {};
  monthTx.filter(tx => tx.category !== "income").forEach(tx => {
    catBreakdown[tx.category] = (catBreakdown[tx.category] || 0) + tx.amount;
  });
  const topCats = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Budget overspend check
  const overBudgetCats = Object.entries(budgets).filter(([cat, limit]) => {
    const s = monthTx.filter(tx => tx.category === cat).reduce((sum, t) => sum + tx.amount, 0);
    return parseFloat(limit) > 0 && s > parseFloat(limit);
  });

  const recentTx = transactions.slice(0, 5);

  // Last month data for insights
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getFullYear() + "-" + String(lastMonthDate.getMonth() + 1).padStart(2, "0");
  const lastMonthTx = transactions.filter(tx => tx.date && tx.date.startsWith(lastMonth));
  const lastExpenses = lastMonthTx.filter(tx => tx.category !== "income" && tx.category !== "savings").reduce((s, tx) => s + tx.amount, 0);
  const lastCatBreakdown = {};
  lastMonthTx.filter(tx => tx.category !== "income").forEach(tx => {
    lastCatBreakdown[tx.category] = (lastCatBreakdown[tx.category] || 0) + tx.amount;
  });

  // Generate smart insights
  const insights = [];
  if (monthTx.length > 0) {
    const topCat = topCats[0];
    if (topCat) {
      const pct = expenses > 0 ? Math.round((topCat[1] / expenses) * 100) : 0;
      insights.push({ icon: allCats[topCat[0]]?.icon || "💸", text: "Your top spend is " + t.getCatLabel(topCat[0]) + " at " + pct + "% of expenses", color: allCats[topCat[0]]?.color || "#0D7680" });
    }
    if (lastExpenses > 0 && expenses > 0) {
      const diff = Math.round(((expenses - lastExpenses) / lastExpenses) * 100);
      if (diff > 10) insights.push({ icon: "📈", text: "Spending up " + diff + "% vs last month", color: "#FF6B6B" });
      else if (diff < -10) insights.push({ icon: "📉", text: "Spending down " + Math.abs(diff) + "% vs last month — great job!", color: "#00B894" });
      else insights.push({ icon: "➡️", text: "Spending on par with last month", color: "#74B9FF" });
    }
    if (income > 0 && expenses > 0) {
      const savingRate = Math.round(((income - expenses) / income) * 100);
      if (savingRate >= 20) insights.push({ icon: "🏆", text: "You're saving " + savingRate + "% of income — excellent!", color: "#00B894" });
      else if (savingRate < 0) insights.push({ icon: "⚠️", text: "Spending exceeds income this month", color: "#FF6B6B" });
    }
    if (overBudgetCats.length > 0) insights.push({ icon: "🚨", text: overBudgetCats.length + " categor" + (overBudgetCats.length > 1 ? "ies" : "y") + " over budget this month", color: "#FF6B6B" });
  }

  const monthLabel = MONTHS[now.getMonth()] + " " + now.getFullYear();

  // Monthly summary banner — show for first 7 days of new month
  const dayOfMonth = now.getDate();
  const showMonthlySummary = dayOfMonth <= 7 && lastMonthTx.length > 0;
  const lastMonthIncome = lastMonthTx.filter(tx => tx.category === "income").reduce((s, tx) => s + tx.amount, 0);
  const lastMonthTopCat = Object.entries(lastCatBreakdown).sort((a, b) => b[1] - a[1])[0];
  const lastMonthName = MONTHS[lastMonthDate.getMonth()];

  return (
    <div style={styles.screen}>
      {/* Header */}
      {/* ── APP BRAND HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Logo mark */}
          <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", flexShrink: 0, position: "relative" }}>
            <img src="data:image/png;base64,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" alt="Savvie" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: th.text, letterSpacing: -0.3 }}>SAVVIE</p>
            <p style={{ margin: 0, fontSize: 11, color: "#0D7680", fontWeight: 600, letterSpacing: 0.3 }}>Track. Plan. Grow.</p>
          </div>
        </div>
        {/* Month label */}
        <div style={{ background: th.surface2, border: "1px solid " + th.border, borderRadius: 20, padding: "6px 14px" }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: th.textMuted }}>{monthLabel}</p>
        </div>
      </div>

      {/* Floating + button bottom right */}

      {/* ── MONTHLY SUMMARY BANNER ── */}
      {showMonthlySummary && (
        <div style={{ background: th.balanceCard, borderRadius: 18, padding: "16px 18px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 6px" }}>📅 {lastMonthName} Summary</p>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: "0 0 10px", lineHeight: 1.4 }}>
                You spent {formatSGD(lastExpenses, sym)}
                {lastMonthIncome > 0 ? " and earned " + formatSGD(lastMonthIncome, sym) : ""}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {lastMonthTopCat && (
                  <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 12px" }}>
                    <p style={{ color: "#fff", fontSize: 12, margin: 0 }}>
                      Top: {allCats[lastMonthTopCat[0]]?.icon} {t.getCatLabel(lastMonthTopCat[0])} · {formatSGD(lastMonthTopCat[1], sym)}
                    </p>
                  </div>
                )}
                {lastMonthIncome > 0 && (
                  <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 20, padding: "4px 12px" }}>
                    <p style={{ color: "#fff", fontSize: 12, margin: 0 }}>
                      Saved: {formatSGD(Math.max(0, lastMonthIncome - lastExpenses), sym)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tablet: two-column layout */}
      <div style={isTablet ? styles.tabletGrid : {}}>
        <div style={isTablet ? styles.tabletCol : {}}>
          {/* Balance Card */}
          <div onClick={handleBalanceCardTap} style={{ ...styles.balanceCard, cursor: "pointer", transform: cardTapped ? "scale(0.96)" : "scale(1)", transition: "transform 0.15s ease, box-shadow 0.15s ease", boxShadow: cardTapped ? "0 2px 8px rgba(13,118,128,0.2)" : "0 8px 32px rgba(13,118,128,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <p style={styles.balLabel}>{t.availableBalance}</p>

            </div>
            <h2 style={{ ...styles.balAmount, fontSize: isTablet ? 40 : 32 }}>
              {formatSGD(balance, sym)}
            </h2>
            <div style={styles.balRow}>
              <div style={styles.balItem}>
                <span style={{ color: "#00B894", fontSize: 18 }}>↑</span>
                <div>
                  <p style={styles.balSmallLabel}>{t.income}</p>
                  <p style={{ ...styles.balSmallVal, color: "#00B894" }}>{formatSGD(income, sym)}</p>
                </div>
              </div>
              <div style={styles.balDivider} />
              <div style={styles.balItem}>
                <span style={{ color: "#FF6B6B", fontSize: 18 }}>↓</span>
                <div>
                  <p style={styles.balSmallLabel}>{t.expenses}</p>
                  <p style={{ ...styles.balSmallVal, color: "#FF6B6B" }}>{formatSGD(expenses, sym)}</p>
                </div>
              </div>
              <div style={styles.balDivider} />
              <div style={styles.balItem}>
                <span style={{ color: "#74B9FF", fontSize: 18 }}>🏦</span>
                <div>
                  <p style={styles.balSmallLabel}>{t.savings}</p>
                  <p style={{ ...styles.balSmallVal, color: "#74B9FF" }}>{formatSGD(savings, sym)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {overBudgetCats.length > 0 && (
            <div style={{ ...styles.alertCard, background: th.alertBg, borderColor: "#FF6B6B44", marginBottom: 12 }}>
              <span>🚨</span>
              <p style={styles.alertText}>{t.overBudget}: {overBudgetCats.map(([c]) => allCats[c]?.label).join(", ")}</p>
            </div>
          )}

          {/* Subscription and Credit Card */}
          <div style={styles.glanceRow}>
            <button onClick={() => { haptic("light"); setModal("subscription"); }} style={{ ...styles.glanceCard, cursor: "pointer", textAlign: "center", background: modal === "subscription" ? th.surface2 : th.surface, border: "1px solid " + (subscriptions > 0 ? "#A29BFE55" : th.border) }}>
              <p style={styles.glanceIcon}>🔁</p>
              <p style={styles.glanceLabel}>{t.subscription.replace("?","")}</p>
              <p style={{ ...styles.glanceAmt, color: "#A29BFE" }}>{formatSGD(subscriptions, sym)}</p>
              {subscriptionTxList.length > 0 && <p style={{ color: th.textDim, fontSize: 10, marginTop: 4 }}>{subscriptionTxList.length} {subscriptionTxList.length > 1 ? t.itemCountPlural : t.itemCount} ›</p>}
            </button>
            <button onClick={() => { haptic("light"); setModal("creditcard"); }} style={{ ...styles.glanceCard, cursor: "pointer", textAlign: "center", background: modal === "creditcard" ? th.surface2 : th.surface, border: "1px solid " + (creditCardSpend > 0 ? "#FD79A855" : th.border) }}>
              <p style={styles.glanceIcon}>💳</p>
              <p style={styles.glanceLabel}>{t.creditCard.replace("?","")}</p>
              <p style={{ ...styles.glanceAmt, color: "#F0A500" }}>{formatSGD(creditCardSpend, sym)}</p>
              {creditCardTxList.length > 0 && <p style={{ color: th.textDim, fontSize: 10, marginTop: 4 }}>{creditCardTxList.length} {creditCardTxList.length > 1 ? t.itemCountPlural : t.itemCount} ›</p>}
            </button>
          </div>

          {/* Add Transaction button */}
          <button onClick={() => { haptic("medium"); setTab("add"); }} style={{ width: "100%", background: "#0D7680", border: "none", borderRadius: 16, padding: "15px 0", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 16px #0D768033" }}>
            <span style={{ fontSize: 18 }}>+</span> Add Transaction
          </button>

          {/* Ghost Subscription Alert */}
          {(() => {
            const ghosts = detectGhostSubscriptions();
            if (ghosts.length === 0) return null;
            const totalSavings = ghosts.reduce((s, g) => s + g.monthlyAmount, 0);
            return (
              <div style={{ background: "linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)", borderRadius: 18, padding: "16px", marginBottom: 16, border: "1px solid #FF6B6B33", boxShadow: "0 8px 24px rgba(255, 107, 107, 0.25)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ fontSize: 32, flexShrink: 0 }}>👻</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#fff" }}>Ghost Subscriptions Detected</p>
                    <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                      We found {ghosts.length} recurring charge{ghosts.length > 1 ? "s" : ""} that might be unused subscriptions. You could save <span style={{ fontWeight: 800 }}>S${totalSavings.toFixed(2)}/month</span>.
                    </p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                      {ghosts.slice(0, 3).map((g, i) => (
                        <div key={i} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px" }}>
                          <p style={{ margin: 0, fontSize: 11, color: "#fff", fontWeight: 600 }}>{g.merchant.slice(0, 16)} · S${g.monthlyAmount.toFixed(2)}</p>
                        </div>
                      ))}
                      {ghosts.length > 3 && <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "4px 10px" }}><p style={{ margin: 0, fontSize: 11, color: "#fff", fontWeight: 600 }}>+{ghosts.length - 3} more</p></div>}
                    </div>
                    <button onClick={() => { haptic("medium"); setTab("history"); }} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "8px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(10px)" }}>
                      Review in History ›
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Spending Insights Card */}
          {insights.length > 0 && (
            <div style={{ background: th.surface, borderRadius: 18, padding: 16, marginBottom: 16, border: "1px solid " + th.border }}>
              <p style={{ color: th.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 12px" }}>💡 Spending Insights</p>
              {insights.map((ins, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: ins.color + "12", marginBottom: i < insights.length - 1 ? 8 : 0 }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{ins.icon}</span>
                  <p style={{ margin: 0, fontSize: 13, color: th.text, fontWeight: 500, lineHeight: 1.4 }}>{ins.text}</p>
                </div>
              ))}
            </div>
          )}

          {topCats.length > 0 && (
            <div style={styles.section}>
              <p style={{ ...styles.sectionTitle, color: th.textMuted }}>Top Spending</p>
              {topCats.map(([cat, amt]) => {
                const info = CATEGORIES[cat];
                const pct = expenses > 0 ? (amt / expenses) * 100 : 0;
                return (
                  <div key={cat} style={styles.catRow}>
                    <span style={styles.catIcon}>{info?.icon || "💸"}</span>
                    <div style={styles.catInfo}>
                      <div style={styles.catLabelRow}>
                        <p style={styles.catName}>{t.getCatLabel(cat)}</p>
                        <p style={styles.catAmt}>{formatSGD(amt, sym)}</p>
                      </div>
                      <div style={styles.barBg}>
                        <div style={{ ...styles.barFill, width: (pct) + "%", background: info?.color || "#aaa" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={isTablet ? styles.tabletCol : {}}>
          {/* Recent Transactions */}
          {recentTx.length > 0 && (
            <div style={styles.section}>
              <p style={{ ...styles.sectionTitle, color: th.textMuted }}>Recent Transactions</p>
              {recentTx.map(tx => (
                <TxRow key={tx.id} tx={tx} sym={sym} getCatLabel={t.getCatLabel} th={th} />
              ))}
            </div>
          )}

          {transactions.length === 0 && (
            <div style={{ ...styles.empty, padding: "32px 24px" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>💰</div>
              <p style={{ fontWeight: 800, fontSize: 20, color: th.text, margin: "0 0 8px" }}>Welcome to Savvie!</p>
              <p style={{ fontSize: 14, color: th.textMuted, margin: "0 0 28px", lineHeight: 1.6, textAlign: "center", maxWidth: 280 }}>
                Your personal finance tracker is ready. Start by adding your first transaction.
              </p>
              <button onClick={() => { haptic("medium"); setTab("add"); }}
                style={{ background: "#0D7680", border: "none", borderRadius: 16, padding: "14px 32px", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px #0D768044", marginBottom: 20 }}>
                + Add First Transaction
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 320 }}>
                {[
                  { icon: "📊", label: "Track spending", sub: "Log every expense" },
                  { icon: "💳", label: "Set budgets", sub: "Stay on target" },
                  { icon: "💱", label: "FX converter", sub: "30+ currencies" },
                  { icon: "🇸🇬", label: "CPF tracker", sub: "Singapore-built" },
                ].map((tip, i) => (
                  <div key={i} style={{ background: th.surface, borderRadius: 14, padding: "12px", textAlign: "center", border: "1px solid " + th.border }}>
                    <p style={{ fontSize: 24, margin: "0 0 4px" }}>{tip.icon}</p>
                    <p style={{ fontWeight: 700, fontSize: 12, color: th.text, margin: "0 0 2px" }}>{tip.label}</p>
                    <p style={{ fontSize: 11, color: th.textMuted, margin: 0 }}>{tip.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SUBSCRIPTION / CREDIT CARD MODAL ── */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div style={{ background: th.surface2, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: isTablet ? 560 : 430, maxHeight: "70vh", display: "flex", flexDirection: "column", border: "1px solid " + th.border }}>
            {/* Handle */}
            <div style={{ width: 40, height: 4, background: th.border, borderRadius: 99, margin: "12px auto 0" }} />
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>{modal === "subscription" ? "🔁" : "💳"}</span>
                <p style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>
                  {modal === "subscription" ? t.subscription.replace("?","") : t.creditCard.replace("?","")}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <p style={{ color: modal === "subscription" ? "#A29BFE" : "#F0A500", fontWeight: 800, fontSize: 16, margin: 0 }}>
                  {formatSGD(modal === "subscription" ? subscriptions : creditCardSpend, sym)}
                </p>
                <button onClick={() => { haptic("light"); setModal(null); }} style={{ background: th.border, border: "none", borderRadius: "50%", width: 30, height: 30, color: "#aaa", cursor: "pointer", fontSize: 14 }}>✕</button>
              </div>
            </div>
            {/* Transaction list */}
            <div style={{ overflowY: "auto", padding: "4px 16px 32px" }}>
              {(modal === "subscription" ? subscriptionTxList : creditCardTxList).length === 0 ? (
                <div style={styles.empty}>
                  <p style={{ fontSize: 32 }}>{modal === "subscription" ? "🔁" : "💳"}</p>
                  <p style={styles.emptyText}>{modal === "subscription" ? t.noSubscriptions : t.noCreditCard}</p>
                </div>
              ) : modal === "creditcard" ? (
                // Group by card name
                (() => {
                  const grouped = {};
                  creditCardTxList.forEach(tx => {
                    const card = tx.creditCard || "Other Card";
                    if (!grouped[card]) grouped[card] = [];
                    grouped[card].push(tx);
                  });
                  return Object.entries(grouped).sort((a,b) => a[0].localeCompare(b[0])).map(([card, txs]) => {
                    const total = txs.reduce((s, tx) => s + tx.amount, 0);
                    return (
                      <div key={card} style={{ marginBottom: 16 }}>
                        {/* Card header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0D7680", borderRadius: 12, padding: "10px 14px", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 16 }}>💳</span>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#fff" }}>{card}</p>
                          </div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#fff" }}>{formatSGD(total, sym)}</p>
                        </div>
                        {/* Card transactions */}
                        {txs.sort((a,b) => b.amount - a.amount).map(tx => {
                          const cat = CATEGORIES[tx.category];
                          return (
                            <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, background: th.surface, borderRadius: 12, padding: "10px 14px", marginBottom: 6 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 9, background: (cat?.color || "#888") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                                {cat?.icon || "💸"}
                              </div>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 2px", color: th.text }}>{tx.subcategory}</p>
                                <p style={{ color: th.textDim, fontSize: 11, margin: 0 }}>{formatDate(tx.date)}{tx.note ? " · " + tx.note : ""}</p>
                              </div>
                              <p style={{ color: "#FF6B6B", fontWeight: 700, fontSize: 13, margin: 0 }}>{formatSGD(tx.amount, sym)}</p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  });
                })()
              ) : (
                subscriptionTxList.sort((a, b) => b.amount - a.amount).map(tx => {
                  const cat = CATEGORIES[tx.category];
                  return (
                    <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, background: th.surface, borderRadius: 14, padding: "12px 14px", marginBottom: 8 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: (cat?.color || "#888") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {cat?.icon || "💸"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 2px", color: th.text }}>{tx.subcategory}</p>
                        <p style={{ color: th.textDim, fontSize: 11, margin: 0 }}>{formatDate(tx.date)}{tx.note ? " · " + tx.note : ""}</p>
                      </div>
                      <p style={{ color: "#FF6B6B", fontWeight: 700, fontSize: 14, margin: 0 }}>{formatSGD(tx.amount, sym)}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal converter removed - now a regular tab */}
    </div>
  );
}

function AddTransaction({ onAdd, setTab, isTablet, defaultCategory = null, settings, th = THEMES.dark, customCategories = {}, addCustomCategory }) {
  const styles = makeStyles(th);
  const sym = useSym(settings);
  const t = useT(settings);
  const [type, setType] = useState(defaultCategory === "investment" || defaultCategory === "savings" ? "expense" : "expense");
  const [category, setCategory] = useState(defaultCategory || "food");
  const [subcategory, setSubcategory] = useState(CATEGORIES[defaultCategory || "food"]?.subs[0] || CATEGORIES.food.subs[0]);
  const [foreignAmount, setForeignAmount] = useState("");
  const [foreignCurrency, setForeignCurrency] = useState("");
  const [showFxInput, setShowFxInput] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayStr());
  const [payment, setPayment] = useState("PayNow");
  const [isSubscription, setIsSubscription] = useState("No");
  const [isCreditCard, setIsCreditCard] = useState("No");
  const [creditCard, setCreditCard] = useState("");
  const [success, setSuccess] = useState(false);

  // Custom category form state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("✨");

  // Merge default and custom categories
  const getAllCategories = () => {
    const merged = { ...CATEGORIES };
    Object.entries(customCategories).forEach(([key, cat]) => {
      merged[key] = {
        label: cat.name,
        icon: cat.emoji,
        color: cat.color || "#888888",
        subs: cat.subcategories || [],
        isCustom: true
      };
    });
    return merged;
  };

  const allCats = getAllCategories();
  const expenseCats = Object.entries(allCats).filter(([k]) => k !== "income");
  const incomeCats = Object.entries(allCats).filter(([k]) => k === "income");
  const cats = type === "income" ? incomeCats : expenseCats;

  const handleCatChange = (cat) => {
    setCategory(cat);
    setSubcategory(allCats[cat].subs?.[0] || "");
  };

  const handleSubmit = () => { haptic("success");
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
    const tx = {
      id: Date.now().toString(),
      type,
      category: type === "income" ? "income" : category,
      subcategory,
      amount: parseFloat(amount),
      note,
      date,
      payment: isCreditCard === "Yes" ? "Credit Card (" + (creditCard || "Unspecified") + ")" : payment,
      isSubscription: isSubscription === "Yes",
      isCreditCard: isCreditCard === "Yes",
      creditCard: isCreditCard === "Yes" ? creditCard : "",
    };
    onAdd(tx);
    setAmount("");
    setNote("");
    setDate(todayStr());
    setIsSubscription("No");
    setIsCreditCard("No");
    setCreditCard("");
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setTab("dashboard"); }, 1500);
  };

  return (
    <div style={styles.screen}>
      <h1 style={{ ...styles.pageTitle, color: th.text }}>{t.addTransaction}</h1>

      {/* ── SUCCESS OVERLAY ── */}
      {success && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 300,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "rgba(13,118,128,0.92)", backdropFilter: "blur(6px)",
          animation: "fadeIn 0.2s ease",
        }}>
            <div style={{ animation: "bounceIn 0.5s cubic-bezier(0.36,0.07,0.19,0.97)", marginBottom: 20 }}>
            <div style={{ width: 90, height: 90, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="22" fill="#0D7680"/>
                <polyline points="10,22 18,30 34,14" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: "0 0 8px", animation: "slideUp 0.4s ease 0.2s both" }}>
            {t.saved}
          </p>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14, margin: 0, animation: "slideUp 0.4s ease 0.3s both" }}>
            Transaction added successfully
          </p>
        </div>
      )}

      {/* Type Toggle */}
      <div style={styles.typeToggle}>
        {["expense", "income"].map(tp => (
          <button key={tp} onClick={() => { haptic("light"); setType(tp); handleCatChange(tp === "income" ? "income" : "food"); }}
            style={{ ...styles.typeBtn, ...(type === tp ? styles.typeBtnActive : {}) }}>
            {tp === "income" ? "💰 " + t.income : "💸 " + t.expense}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div style={styles.amountBox}>
        <p style={styles.amountLabel}>{sym}</p>
        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={styles.amountInput} />
      </div>
      {/* Foreign currency — optional */}
      {foreignCurrency && (
        <div style={{ background: th.surface, borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 8, border: "1px solid " + th.border }}>
          <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>Original:</p>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#0D7680" }}>{foreignCurrency} {foreignAmount}</p>
          <button onClick={() => { setForeignCurrency(""); setForeignAmount(""); }} style={{ marginLeft: "auto", background: "transparent", border: "none", color: th.textMuted, cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      )}
      <button onClick={() => setShowFxInput(s => !s)} style={{ background: "transparent", border: "none", color: th.textMuted, fontSize: 12, cursor: "pointer", marginBottom: 12, display: "flex", alignItems: "center", gap: 4, padding: 0 }}>
        <span>{showFxInput ? "▲" : "▼"}</span> {showFxInput ? "Hide" : "Paid in foreign currency?"}
      </button>
      {showFxInput && (
        <div style={{ background: th.surface, borderRadius: 14, padding: 14, marginBottom: 14, border: "1px solid " + th.border, display: "flex", gap: 8 }}>
          <input value={foreignAmount} onChange={e => setForeignAmount(e.target.value)} type="number" placeholder="Amount" style={{ flex: 1, background: th.inputBg, border: "1px solid " + th.border, borderRadius: 10, padding: "8px 12px", color: th.text, fontSize: 14, outline: "none" }} />
          <select value={foreignCurrency} onChange={e => setForeignCurrency(e.target.value)} style={{ background: th.inputBg, border: "1px solid " + th.border, borderRadius: 10, padding: "8px 10px", color: th.text, fontSize: 14, outline: "none" }}>
            <option value="">Currency</option>
            {["USD","MYR","JPY","EUR","GBP","AUD","HKD","CNY","THB","IDR","KRW","TWD","INR","CHF","CAD"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Category */}
      <div style={styles.formGroup}>
        <p style={styles.formLabel}>{t.category}</p>
        <div style={{ ...styles.catGrid, gridTemplateColumns: isTablet ? "repeat(5, 1fr)" : "repeat(3, 1fr)" }}>
          {cats.map(([k, v]) => (
            <button key={k} onClick={() => { haptic("light"); handleCatChange(k); }}
              style={{ ...styles.catBtn, ...(category === k ? { ...styles.catBtnActive } : {}) }}>
              <span style={{ fontSize: 20 }}>{v.icon}</span>
              <span style={{ ...styles.catBtnLabel, color: category === k ? "#0D7680" : th.textMuted }}>{t.getCatLabel(k)}</span>
            </button>
          ))}
          {/* Add Custom Category Button */}
          <button onClick={() => { haptic("light"); setShowAddCategory(!showAddCategory); }}
            style={{ ...styles.catBtn, background: showAddCategory ? "#0D768022" : th.surface2, border: "2px dashed #0D7680", color: "#0D7680" }}>
            <span style={{ fontSize: 20 }}>➕</span>
            <span style={{ ...styles.catBtnLabel, color: "#0D7680", fontSize: 10, fontWeight: 700 }}>Add</span>
          </button>
        </div>

        {/* Add Custom Category Form */}
        {showAddCategory && (
          <div style={{ background: th.surface2, borderRadius: 12, padding: 14, marginTop: 12 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: th.text }}>New Category Name</p>
            <input type="text" placeholder="e.g., Gaming, Baby, Pet Care" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{ width: "100%", boxSizing: "border-box", border: "1px solid " + th.border, borderRadius: 8, padding: "10px 12px", background: th.surface, color: th.text, marginBottom: 10, fontSize: 12 }} />

            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: th.text }}>Pick an Emoji</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6, marginBottom: 12 }}>
              {["🎮", "🎨", "📚", "⚽", "🏋️", "👗", "💄", "🌱", "🍷", "✈️", "🎸", "📷", "🧘", "👶", "🚴", "🏊"].map(emoji => (
                <button key={emoji} onClick={() => { haptic("light"); setNewCategoryEmoji(emoji); }} style={{ background: newCategoryEmoji === emoji ? "#0D7680" : th.surface, border: "1px solid " + th.border, borderRadius: 10, padding: "10px 0", fontSize: 18, cursor: "pointer", color: newCategoryEmoji === emoji ? "#fff" : th.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {emoji}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { haptic("light"); setNewCategoryName(""); setNewCategoryEmoji("✨"); }} style={{ flex: 1, background: "transparent", border: "1px solid " + th.border, borderRadius: 10, padding: "10px", color: th.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Clear
              </button>
              <button onClick={() => { addCustomCategory(newCategoryName, newCategoryEmoji); }} style={{ flex: 1, background: "#0D7680", border: "none", borderRadius: 10, padding: "10px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Create & Use
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subscription — expense only */}
      {type === "expense" && (
        <div style={styles.formGroup}>
          <p style={styles.formLabel}>{t.subscription}</p>
          <div style={styles.typeToggle}>
            {["No", "Yes"].map(v => (
              <button key={v} onClick={() => { haptic("light"); setIsSubscription(v); }}
                style={{ ...styles.typeBtn, ...(isSubscription === v ? { ...styles.typeBtnActive, background: "#0D7680", color: "#fff" } : {}) }}>
                {v === "Yes" ? t.yes : t.no}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Credit Card — expense only */}
      {type === "expense" && (
        <div style={styles.formGroup}>
          <p style={styles.formLabel}>{t.creditCard}</p>
          <div style={styles.typeToggle}>
            {["No", "Yes"].map(v => (
              <button key={v} onClick={() => { haptic("light"); setIsCreditCard(v); }}
                style={{ ...styles.typeBtn, ...(isCreditCard === v ? { ...styles.typeBtnActive, background: "#0D7680", color: "#fff" } : {}) }}>
                {v === "Yes" ? t.yes : t.no}
              </button>
            ))}
          </div>
          {isCreditCard === "Yes" && (
            <SelectField th={th} value={creditCard} onChange={e => setCreditCard(e.target.value)} style={{ marginTop: 8 }}>
              <option value="">{t.selectCard}</option>
              <optgroup label="DBS / POSB">
                <option>DBS Live Fresh</option>
                <option>DBS Altitude</option>
                <option>DBS Multiplier</option>
                <option>POSB Everyday Card</option>
              </optgroup>
              <optgroup label="OCBC">
                <option>OCBC 365</option>
                <option>OCBC Rewards</option>
                <option>OCBC Frank</option>
                <option>OCBC 90°N</option>
              </optgroup>
              <optgroup label="UOB">
                <option>UOB One</option>
                <option>UOB EVOL</option>
                <option>UOB Preferred Platinum</option>
                <option>UOB KrisFlyer</option>
              </optgroup>
              <optgroup label="Citibank">
                <option>Citi PremierMiles</option>
                <option>Citi Cashback</option>
                <option>Citi Rewards</option>
              </optgroup>
              <optgroup label="Standard Chartered">
                <option>SC Simply Cash</option>
                <option>SC Rewards+</option>
                <option>SC Spree</option>
              </optgroup>
              <optgroup label="HSBC">
                <option>HSBC Revolution</option>
                <option>HSBC TravelOne</option>
                <option>HSBC Advance</option>
              </optgroup>
              <optgroup label="Maybank">
                <option>Maybank Family and Friends</option>
                <option>Maybank Horizon</option>
              </optgroup>
              <optgroup label="Others">
                <option>American Express (Amex)</option>
                <option>Trust Card</option>
                <option>Other Credit Card</option>
              </optgroup>
            </SelectField>
          )}
        </div>
      )}

      {/* Subcategory */}
      <div style={styles.formGroup}>
        <p style={styles.formLabel}>{t.subcategory}</p>
        <SelectField th={th} value={subcategory} onChange={e => setSubcategory(e.target.value)}>
          {CATEGORIES[category]?.subs.map(s => <option key={s}>{s}</option>)}
        </SelectField>
      </div>

      {/* Payment Method — hidden if credit card selected */}
      {!(type === "expense" && isCreditCard === "Yes") && (
        <div style={styles.formGroup}>
          <p style={styles.formLabel}>{t.paymentMethod}</p>
          <SelectField th={th} value={payment} onChange={e => setPayment(e.target.value)}>
            {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
          </SelectField>
        </div>
      )}

      {/* Date */}
      <div style={styles.formGroup}>
        <p style={styles.formLabel}>{t.date}</p>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...styles.select, background: th.inputBg, borderColor: th.border, color: th.text }} />
      </div>

      {/* Note */}
      <div style={styles.formGroup}>
        <p style={styles.formLabel}>{t.note}</p>
        <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Lunch at Maxwell Food Centre" style={{ ...styles.select, background: th.inputBg, borderColor: th.border, color: th.text }} />
      </div>

      <button onClick={() => { haptic("medium"); handleSubmit(); }} style={{ ...styles.primaryBtn, ...(success ? { background: "#0A5A60" } : {}) }}>
        {success ? t.saved : t.saveTransaction}
      </button>
    </div>
  );
}

// ── HISTORY ───────────────────────────────────────────────────────────────────

function History({ transactions, onDelete, onEdit, isTablet, settings, th = THEMES.dark, isPremium = false, onUpgrade }) {
  const styles = makeStyles(th);
  const sym = useSym(settings);
  const t = useT(settings);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editTx, setEditTx] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const handleEdit = (tx) => { haptic("light"); setEditTx({ ...tx }); };
  const handleEditSave = () => {
    if (!editTx) return;
    if (!editTx.amount || editTx.amount <= 0) return;
    haptic("medium");
    onEdit(editTx.id, editTx);
    setEditTx(null);
  };

  const allMonths = [...new Set(transactions.map(tx => monthKey(tx.date)))].sort().reverse();
  const months = isPremium ? allMonths : allMonths.slice(0, 3);
  const hasLockedHistory = !isPremium && allMonths.length > 3;
  const [selMonth, setSelMonth] = useState("all");
  const [showGhosts, setShowGhosts] = useState(false);

  const filtered = transactions.filter(tx => {
    if (showGhosts) {
      // Show only recurring subscriptions (detected ghosts)
      return tx.isSubscription;
    }
    if (filter !== "all" && tx.type !== filter && !(filter === "expense" && tx.category !== "income")) return false;
    if (selMonth !== "all" && monthKey(tx.date) !== selMonth) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = (tx.note || "").toLowerCase().includes(q) || (tx.subcategory || "").toLowerCase().includes(q) || (tx.category || "").toLowerCase().includes(q) || String(tx.amount).includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Group by date
  const grouped = {};
  filtered.forEach(tx => {
    if (!grouped[tx.date]) grouped[tx.date] = [];
    grouped[tx.date].push(tx);
  });

  const total = filtered.reduce((s, tx) => tx.category === "income" ? s + tx.amount : s - tx.amount, 0);

  return (
    <div style={styles.screen}>
      <h1 style={{ ...styles.pageTitle, color: th.text }}>{t.historyTitle}</h1>
      {/* Locked history banner for free users */}
      {hasLockedHistory && (
        <div style={{ background: "linear-gradient(135deg, #F0A500 0%, #FF6B6B 100%)", borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>🔒</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800, color: "#fff" }}>Showing last 3 months only</p>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.85)" }}>Upgrade to Premium to view your full history</p>
          </div>
          <button onClick={onUpgrade} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 10, padding: "6px 12px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            👑 Upgrade
          </button>
        </div>
      )}

      <input type="text" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} style={{ ...styles.select, marginBottom: 12 }} />

      <div style={styles.filterRow}>
        {["all", "expense", "income"].map(f => (
          <button key={f} onClick={() => { haptic("light"); setFilter(f); setShowGhosts(false); }} style={{ ...styles.filterBtn, ...(filter === f && !showGhosts ? styles.filterBtnActive : {}) }}>
            {f === "all" ? t.all : f === "expense" ? t.expense : t.income}
          </button>
        ))}
        {transactions.some(tx => tx.isSubscription) && (
          <button onClick={() => { haptic("light"); setShowGhosts(!showGhosts); }} style={{ ...styles.filterBtn, ...(showGhosts ? { background: "#FF6B6B", color: "#fff", borderColor: "#FF6B6B" } : {}), whiteSpace: "nowrap" }}>
            👻 Subscriptions
          </button>
        )}
      </div>

      <SelectField th={th} value={selMonth} onChange={e => setSelMonth(e.target.value)} style={{ marginBottom: 16 }}>
        <option value="all">{t.allMonths}</option>
        {months.map(m => <option key={m} value={m}>{m}</option>)}
      </SelectField>

      <div style={{ ...styles.balanceCard, padding: "12px 16px", marginBottom: 16 }}>
        <p style={styles.balLabel}>{t.netFiltered}</p>
        <p style={{ ...styles.balAmount, fontSize: 22, color: total >= 0 ? "#00B894" : "#FF6B6B" }}>{formatSGD(Math.abs(total), sym)}</p>
      </div>

      {Object.keys(grouped).sort().reverse().map(date => (
        <div key={date} style={styles.section}>
          <p style={styles.dateLabel}>{formatDate(date)}</p>
          {grouped[date].map(tx => (
            <TxRow key={tx.id} tx={tx} onDelete={() => setDeleteId(tx.id)} onEdit={() => handleEdit(tx)} sym={sym} getCatLabel={t.getCatLabel} th={th} />
          ))}
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={styles.empty}>
          <svg width="110" height="95" viewBox="0 0 110 95" fill="none">
            <rect x="10" y="15" width="70" height="70" rx="8" fill={th.surface2} stroke={th.border} strokeWidth="1.5"/>
            <rect x="20" y="28" width="40" height="4" rx="2" fill={th.border}/>
            <rect x="20" y="38" width="30" height="4" rx="2" fill={th.border}/>
            <rect x="20" y="48" width="35" height="4" rx="2" fill={th.border}/>
            <circle cx="78" cy="65" r="22" fill="#0D768022" stroke="#0D7680" strokeWidth="2"/>
            <text x="78" y="73" textAnchor="middle" fill="#0D7680" fontSize="26" fontWeight="800">$</text>
          </svg>
          <p style={styles.emptyText}>{t.noTxFound}</p>
        </div>
      )}

      {/* ── EDIT TRANSACTION BOTTOM SHEET ── */}
      {editTx && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={e => { if (e.target === e.currentTarget) setEditTx(null); }}>
          <div style={{ background: th.surface, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "80vh", overflowY: "auto", border: "1px solid " + th.border }}>
            <div style={{ width: 40, height: 4, background: th.border, borderRadius: 99, margin: "12px auto 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px 4px" }}>
              <p style={{ fontWeight: 800, fontSize: 17, margin: 0, color: th.text }}>✏️ Edit Transaction</p>
              <button onClick={() => setEditTx(null)} style={{ background: th.surface2, border: "none", borderRadius: "50%", width: 30, height: 30, color: th.textMuted, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "12px 20px 36px", display: "flex", flexDirection: "column", gap: 12 }}>

              {/* Amount */}
              <div style={{ background: th.surface2, borderRadius: 14, padding: "12px 16px", border: "1px solid " + th.border }}>
                <p style={{ color: th.textMuted, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase" }}>Amount</p>
                <input type="number" value={editTx.amount} onChange={e => setEditTx({ ...editTx, amount: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 28, fontWeight: 800, color: "#0D7680", boxSizing: "border-box" }} />
              </div>

              {/* Date */}
              <div>
                <p style={{ color: th.textMuted, fontSize: 12, margin: "0 0 6px", fontWeight: 600 }}>Date</p>
                <input type="date" value={editTx.date} onChange={e => setEditTx({ ...editTx, date: e.target.value })}
                  style={{ width: "100%", background: th.surface2, border: "1px solid " + th.border, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: th.text, boxSizing: "border-box" }} />
              </div>

              {/* Note */}
              <div>
                <p style={{ color: th.textMuted, fontSize: 12, margin: "0 0 6px", fontWeight: 600 }}>Note</p>
                <input type="text" value={editTx.note || ""} onChange={e => setEditTx({ ...editTx, note: e.target.value })}
                  placeholder="Add a note..."
                  style={{ width: "100%", background: th.surface2, border: "1px solid " + th.border, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: th.text, boxSizing: "border-box" }} />
              </div>

              {/* Subcategory */}
              <div>
                <p style={{ color: th.textMuted, fontSize: 12, margin: "0 0 6px", fontWeight: 600 }}>Subcategory</p>
                <input type="text" value={editTx.subcategory || ""} onChange={e => setEditTx({ ...editTx, subcategory: e.target.value })}
                  style={{ width: "100%", background: th.surface2, border: "1px solid " + th.border, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: th.text, boxSizing: "border-box" }} />
              </div>

              {/* Save button */}
              <button onClick={handleEditSave} style={{ width: "100%", background: "#0D7680", border: "none", borderRadius: 14, padding: "16px 0", color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", marginTop: 4 }}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── DELETE CONFIRM DIALOG ── */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div style={{ background: th.surface, borderRadius: 18, padding: 24, maxWidth: 360, width: "100%", border: "1px solid " + th.border, textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FF6B6B22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 14px" }}>🗑️</div>
            <p style={{ fontSize: 17, fontWeight: 800, color: th.text, margin: "0 0 6px" }}>Delete this transaction?</p>
            <p style={{ fontSize: 13, color: th.textMuted, margin: "0 0 20px" }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { haptic("light"); setDeleteId(null); }} style={{ flex: 1, background: th.surface2, border: "1px solid " + th.border, borderRadius: 12, padding: "12px 0", color: th.text, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { haptic("medium"); onDelete(deleteId); setDeleteId(null); }} style={{ flex: 1, background: "#FF6B6B", border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── SAVINGS & INVESTMENT ──────────────────────────────────────────────────────

function SavingsInvestment({ goals, transactions, onAdd, onAddGoal, onUpdateGoal, onDeleteGoal, isTablet, settings, th = THEMES.dark }) {
  const styles = makeStyles(th);
  const sym = useSym(settings);
  const t = useT(settings);
  const [subTab, setSubTab] = useState("savings");
  const [adding, setAdding] = useState(null); // null | "investment" | "savings"

  // If adding inline, show AddTransaction pre-set to that category
  if (adding) {
    return (
      <AddTransaction
        onAdd={(tx) => { onAdd(tx); setAdding(null); }}
        setTab={() => setAdding(null)}
        isTablet={isTablet}
        defaultCategory={adding}
        settings={settings}
        th={th}
      />
    );
  }

  const investTx = transactions.filter(tx => tx.category === "investment");
  const savingsTx = transactions.filter(tx => tx.category === "savings");

  const totalInvested   = investTx.reduce((s, tx) => s + tx.amount, 0);
  const totalSaved      = savingsTx.reduce((s, tx) => s + tx.amount, 0);
  const totalGoalsSaved = goals.reduce((s, g) => s + (g.saved || 0), 0);

  // Investment breakdown by subcategory
  const investBreakdown = {};
  investTx.forEach(tx => {
    investBreakdown[tx.subcategory] = (investBreakdown[tx.subcategory] || 0) + tx.amount;
  });
  const investItems = Object.entries(investBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div style={styles.screen}>
      <h1 style={{ ...styles.pageTitle, color: th.text }}>{t.saveInvest}</h1>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 20 }}>
        <div onClick={() => { haptic("light"); setSubTab("savings"); }} style={{ ...styles.glanceCard, borderColor: subTab === "savings" ? "#00B894" : "#00B89444", cursor: "pointer", border: "2px solid " + (subTab === "savings" ? "#00B894" : "#00B89422"), transition: "all 0.2s" }}>
          <p style={styles.glanceIcon}>🏦</p>
          <p style={styles.glanceLabel}>{t.totalSaved}</p>
          <p style={{ ...styles.glanceAmt, color: "#00B894" }}>+{formatSGD(totalSaved, sym)}</p>
        </div>
        <div onClick={() => { haptic("light"); setSubTab("investments"); }} style={{ ...styles.glanceCard, borderColor: subTab === "investments" ? "#74B9FF" : "#74B9FF44", cursor: "pointer", border: "2px solid " + (subTab === "investments" ? "#74B9FF" : "#74B9FF22"), transition: "all 0.2s" }}>
          <p style={styles.glanceIcon}>📈</p>
          <p style={styles.glanceLabel}>{t.invested}</p>
          <p style={{ ...styles.glanceAmt, color: "#74B9FF" }}>+{formatSGD(totalInvested, sym)}</p>
        </div>
        <div onClick={() => { haptic("light"); setSubTab("goals"); }} style={{ ...styles.glanceCard, borderColor: subTab === "goals" ? "#A29BFE" : "#A29BFE44", cursor: "pointer", border: "2px solid " + (subTab === "goals" ? "#A29BFE" : "#A29BFE22"), transition: "all 0.2s" }}>
          <p style={styles.glanceIcon}>🎯</p>
          <p style={styles.glanceLabel}>{t.goalsSaved}</p>
          <p style={{ ...styles.glanceAmt, color: "#A29BFE" }}>+{formatSGD(totalGoalsSaved, sym)}</p>
        </div>
        <div onClick={() => { haptic("light"); setSubTab("cpf"); }} style={{ ...styles.glanceCard, cursor: "pointer", border: "2px solid " + (subTab === "cpf" ? "#FD79A8" : "#FD79A822"), transition: "all 0.2s" }}>
          <p style={styles.glanceIcon}>🇸🇬</p>
          <p style={styles.glanceLabel}>CPF</p>
          <p style={{ ...styles.glanceAmt, color: "#FD79A8" }}>Track</p>
        </div>
      </div>

      {/* Sub-tab toggle */}
      <div style={styles.typeToggle}>
        {[["savings", t.savingsTab.replace("🏦 ","")], ["investments", t.investments.replace("📈 ","")], ["goals", t.goals.replace("🎯 ","")], ["cpf", "CPF"]].map(([id, label]) => (
          <button key={id} onClick={() => { haptic("light"); setSubTab(id); }}
            style={{ ...styles.typeBtn, ...(subTab === id ? styles.typeBtnActive : {}), fontSize: 13 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── GOALS SUB-TAB ── */}
      {subTab === "goals" && <GoalsPanel goals={goals} onAdd={onAddGoal} onUpdate={onUpdateGoal} onDelete={onDeleteGoal} isTablet={isTablet} sym={sym} t={t} th={th} />}

      {/* ── CPF SUB-TAB ── */}
      {subTab === "cpf" && <CPFTracker th={th} styles={styles} sym={sym} />}

      {/* ── INVESTMENTS SUB-TAB ── */}
      {subTab === "investments" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={() => { haptic("medium"); setAdding("investment"); }} style={styles.addBtn}>+</button>
          </div>
          {investItems.length > 0 ? (
            <>
              <p style={{ ...styles.sectionTitle, color: th.textMuted }}>{t.portfolioBreakdown}</p>
              {investItems.map(([sub, amt]) => {
                const pct = totalInvested > 0 ? (amt / totalInvested) * 100 : 0;
                return (
                  <div key={sub} style={styles.catRow}>
                    <span style={styles.catIcon}>📊</span>
                    <div style={styles.catInfo}>
                      <div style={styles.catLabelRow}>
                        <p style={styles.catName}>{sub}</p>
                        <p style={{ ...styles.catAmt, color: "#74B9FF" }}>{formatSGD(amt, sym)}</p>
                      </div>
                      <div style={styles.barBg}>
                        <div style={{ ...styles.barFill, width: (pct) + "%", background: "#74B9FF" }} />
                      </div>
                      <p style={{ color: th.textFaint, fontSize: 11, marginTop: 2 }}>{pct.toFixed(1)}%</p>
                    </div>
                  </div>
                );
              })}
              <div style={{ ...styles.section, marginTop: 20 }}>
                <p style={{ ...styles.sectionTitle, color: th.textMuted }}>{t.investmentTx}</p>
                {investTx.slice().sort((a,b) => b.date.localeCompare(a.date)).map(tx => (
                  <TxRow key={tx.id} tx={tx} wealthView={true} sym={sym} getCatLabel={t.getCatLabel} th={th} />
                ))}
              </div>
            </>
          ) : (
            <div style={styles.empty}>
              <p style={{ fontSize: 36 }}>📈</p>
              <p style={styles.emptyText}>No investments yet.</p>
              <p style={styles.emptySubText}>Tap + to add your first investment.</p>
            </div>
          )}
        </div>
      )}

      {/* ── SAVINGS SUB-TAB ── */}
      {subTab === "savings" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
            <button onClick={() => { haptic("medium"); setAdding("savings"); }} style={styles.addBtn}>+</button>
          </div>
          {savingsTx.length > 0 ? (
            <>
              <p style={{ ...styles.sectionTitle, color: th.textMuted }}>{t.savingsBreakdown}</p>
              {(() => {
                const breakdown = {};
                savingsTx.forEach(tx => { breakdown[tx.subcategory] = (breakdown[tx.subcategory] || 0) + tx.amount; });
                return Object.entries(breakdown).sort((a,b) => b[1]-a[1]).map(([sub, amt]) => {
                  const pct = totalSaved > 0 ? (amt / totalSaved) * 100 : 0;
                  return (
                    <div key={sub} style={styles.catRow}>
                      <span style={styles.catIcon}>🏦</span>
                      <div style={styles.catInfo}>
                        <div style={styles.catLabelRow}>
                          <p style={styles.catName}>{sub}</p>
                          <p style={{ ...styles.catAmt, color: "#00B894" }}>{formatSGD(amt, sym)}</p>
                        </div>
                        <div style={styles.barBg}>
                          <div style={{ ...styles.barFill, width: (pct) + "%", background: "#00B894" }} />
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
              <div style={{ ...styles.section, marginTop: 20 }}>
                <p style={{ ...styles.sectionTitle, color: th.textMuted }}>{t.savingsTx}</p>
                {savingsTx.slice().sort((a,b) => b.date.localeCompare(a.date)).map(tx => (
                  <TxRow key={tx.id} tx={tx} wealthView={true} sym={sym} getCatLabel={t.getCatLabel} th={th} />
                ))}
              </div>
            </>
          ) : (
            <div style={styles.empty}>
              <svg width="100" height="95" viewBox="0 0 100 95" fill="none">
                <ellipse cx="50" cy="55" rx="35" ry="28" fill={th.surface2} stroke={th.border} strokeWidth="1.5"/>
                <ellipse cx="50" cy="45" rx="35" ry="14" fill={th.surface} stroke={th.border} strokeWidth="1.5"/>
                <ellipse cx="50" cy="45" rx="22" ry="8" fill="#0D768022"/>
                <rect x="20" y="30" width="60" height="15" rx="0" fill={th.surface} />
                <ellipse cx="50" cy="30" rx="30" ry="12" fill={th.surface} stroke={th.border} strokeWidth="1.5"/>
                <ellipse cx="50" cy="30" rx="18" ry="7" fill="#0D768033"/>
                <text x="50" y="34" textAnchor="middle" fill="#0D7680" fontSize="10" fontWeight="700">S$</text>
              </svg>
              <p style={styles.emptyText}>{t.noSavings}</p>
              <p style={styles.emptySubText}>{t.tapToAdd}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GoalsPanel({ goals, onAdd, onUpdate, onDelete, isTablet, sym = "S$", t = TRANSLATIONS.EN, th = THEMES.dark }) {
  const styles = makeStyles(th);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [topUpId, setTopUpId] = useState(null);
  const [topUpAmt, setTopUpAmt] = useState("");

  const handleAdd = () => {
    if (!name || !target) return;
    onAdd({ id: Date.now().toString(), name, target: parseFloat(target), saved: 0, createdAt: todayStr() });
    setName(""); setTarget(""); setShowForm(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button onClick={() => { haptic("light"); setShowForm(!showForm); }} style={styles.addBtn}>+</button>
      </div>

      {showForm && (
        <div style={{ ...styles.formCard, marginBottom: 16 }}>
          <p style={styles.formLabel}>{t.goalName}</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Japan Trip ✈️, BTO Down Payment 🏠" style={{ ...styles.select, background: th.inputBg, borderColor: th.border, color: th.text }} />
          <p style={{ ...styles.formLabel, marginTop: 10 }}>{t.targetAmount} ({sym})</p>
          <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="0.00" style={{ ...styles.select, background: th.inputBg, borderColor: th.border, color: th.text }} />
          <button onClick={() => { haptic("medium"); handleAdd(); }} style={{ ...styles.primaryBtn, marginTop: 12 }}>{t.createGoal}</button>
        </div>
      )}

      <div style={isTablet ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } : {}}>
        {goals.map(g => {
          const pct = Math.min(100, (g.saved / g.target) * 100);
          return (
            <div key={g.id} style={styles.goalCard}>
              <div style={styles.goalHeader}>
                <p style={styles.goalName}>{g.name}</p>
                <button onClick={() => { haptic("light"); if (window.confirm("Delete this goal? This cannot be undone.")) onDelete(g.id); }} style={styles.deleteBtn}>✕</button>
              </div>
              <div style={styles.goalAmtRow}>
                <p style={styles.goalSaved}>{formatSGD(g.saved, sym)}</p>
                <p style={styles.goalTarget}>of {formatSGD(g.target, sym)}</p>
              </div>
              <div style={styles.barBg}>
                <div style={{ ...styles.barFill, width: (pct) + "%", background: pct >= 100 ? "#00B894" : "#A29BFE", transition: "width 0.5s ease" }} />
              </div>
              <p style={styles.goalPct}>{pct.toFixed(1)}{t.complete}</p>
              {topUpId === g.id ? (
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <input type="number" value={topUpAmt} onChange={e => setTopUpAmt(e.target.value)} placeholder="0.00" style={{ ...styles.select, flex: 1 }} />
                  <button onClick={() => { const v = parseFloat(topUpAmt); if (!topUpAmt || isNaN(v) || v <= 0) return; haptic("light"); onUpdate(g.id, topUpAmt); setTopUpId(null); setTopUpAmt(""); }} style={styles.topUpConfirm}>+</button>
                  <button onClick={() => { haptic("light"); setTopUpId(null); }} style={styles.cancelBtn}>✕</button>
                </div>
              ) : (
                <button onClick={() => { haptic("light"); setTopUpId(g.id); }} style={styles.topUpBtn}>{t.topUp}</button>
              )}
            </div>
          );
        })}
      </div>

      {goals.length === 0 && !showForm && (
        <div style={styles.empty}>
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="38" fill={th.surface2} stroke={th.border} strokeWidth="1.5"/>
            <circle cx="50" cy="50" r="26" fill={th.surface} stroke={th.border} strokeWidth="1.5"/>
            <circle cx="50" cy="50" r="14" fill="#0D768033"/>
            <circle cx="50" cy="50" r="6" fill="#0D7680"/>
            <line x1="50" y1="8" x2="50" y2="18" stroke={th.border} strokeWidth="2" strokeLinecap="round"/>
            <line x1="50" y1="82" x2="50" y2="92" stroke={th.border} strokeWidth="2" strokeLinecap="round"/>
            <line x1="8" y1="50" x2="18" y2="50" stroke={th.border} strokeWidth="2" strokeLinecap="round"/>
            <line x1="82" y1="50" x2="92" y2="50" stroke={th.border} strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p style={styles.emptyText}>{t.noGoals}</p>
          <p style={styles.emptySubText}>{t.setGoalSub}</p>
        </div>
      )}
    </div>
  );
}

// ── GOALS (kept for compatibility) ────────────────────────────────────────────

function Goals({ goals, onAdd, onUpdate, onDelete, th = THEMES.dark }) {
  const styles = makeStyles(th);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [topUpId, setTopUpId] = useState(null);
  const [topUpAmt, setTopUpAmt] = useState("");

  const handleAdd = () => {
    if (!name || !target) return;
    onAdd({ id: Date.now().toString(), name, target: parseFloat(target), saved: 0, createdAt: todayStr() });
    setName(""); setTarget(""); setShowForm(false);
  };

  return (
    <div style={styles.screen}>
      <h1 style={{ ...styles.pageTitle, color: th.text }}>Savings Goals</h1>

      {showForm && (
        <div style={styles.formCard}>
          <p style={styles.formLabel}>Goal Name</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Japan Trip ✈️" style={{ ...styles.select, background: th.inputBg, borderColor: th.border, color: th.text }} />
          <p style={{ ...styles.formLabel, marginTop: 10 }}>Target Amount (S$)</p>
          <input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="0.00" style={{ ...styles.select, background: th.inputBg, borderColor: th.border, color: th.text }} />
          <button onClick={() => { haptic("medium"); handleAdd(); }} style={{ ...styles.primaryBtn, marginTop: 12 }}>Create Goal</button>
        </div>
      )}

      {goals.map(g => {
        const pct = Math.min(100, (g.saved / g.target) * 100);
        return (
          <div key={g.id} style={styles.goalCard}>
            <div style={styles.goalHeader}>
              <p style={styles.goalName}>{g.name}</p>
              <button onClick={() => { haptic("light"); onDelete(g.id); }} style={styles.deleteBtn}>✕</button>
            </div>
            <div style={styles.goalAmtRow}>
              <p style={styles.goalSaved}>{formatSGD(g.saved, sym)}</p>
              <p style={styles.goalTarget}>of {formatSGD(g.target, sym)}</p>
            </div>
            <div style={styles.barBg}>
              <div style={{ ...styles.barFill, width: (pct) + "%", background: pct >= 100 ? "#00B894" : "#74B9FF", transition: "width 0.5s ease" }} />
            </div>
            <p style={styles.goalPct}>{pct.toFixed(1)}% complete</p>

            {topUpId === g.id ? (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input type="number" value={topUpAmt} onChange={e => setTopUpAmt(e.target.value)} placeholder="Amount" style={{ ...styles.select, flex: 1 }} />
                <button onClick={() => { const v = parseFloat(topUpAmt); if (!topUpAmt || isNaN(v) || v <= 0) return; haptic("light"); onUpdate(g.id, topUpAmt); setTopUpId(null); setTopUpAmt(""); }} style={styles.topUpConfirm}>+</button>
                <button onClick={() => { haptic("light"); setTopUpId(null); }} style={styles.cancelBtn}>✕</button>
              </div>
            ) : (
              <button onClick={() => { haptic("light"); setTopUpId(g.id); }} style={styles.topUpBtn}>+ Top Up</button>
            )}
          </div>
        );
      })}

      {goals.length === 0 && !showForm && (
        <div style={styles.empty}>
          <p style={{ fontSize: 36 }}>🎯</p>
          <p style={styles.emptyText}>No savings goals yet.</p>
          <p style={styles.emptySubText}>Set a goal and start saving!</p>
        </div>
      )}
    </div>
  );
}

// ── CUSTOM SELECT ─────────────────────────────────────────────────────────────

function SelectField({ value, onChange, style, children, th = THEMES.dark }) {
  const styles = makeStyles(th);
  const options = [];
  const extractOptions = (nodes) => {
    if (!nodes) return;
    const arr = Array.isArray(nodes) ? nodes : [nodes];
    arr.forEach(node => {
      if (!node) return;
      if (node.type === "option") {
        options.push({ value: String(node.props.value ?? node.props.children), label: String(node.props.children) });
      } else if (node.type === "optgroup" && node.props.children) {
        extractOptions(node.props.children);
      } else if (Array.isArray(node)) {
        extractOptions(node);
      }
    });
  };
  extractOptions(children);
  const selected = options.find(o => String(o.value) === String(value));
  const displayLabel = selected?.label || String(value) || "Select…";

  return (
    <div style={{ position: "relative", width: "100%", ...(style || {}) }}>
      <div style={{
        background: th.surface, border: "1px solid " + th.border, borderRadius: 12,
        padding: "14px 44px 14px 16px", color: th.text, fontSize: 15,
        display: "flex", alignItems: "center", minHeight: 52,
        pointerEvents: "none", boxSizing: "border-box",
      }}>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayLabel}</span>
        <svg style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <select value={value} onChange={onChange} style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        opacity: 0, cursor: "pointer", zIndex: 2, fontSize: 16,
      }}>
        {children}
      </select>
    </div>
  );
}

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────

function TxRow({ tx, onDelete, onEdit, wealthView = false, sym = "S$", getCatLabel, th = THEMES.dark }) {
  const styles = makeStyles(th);
  const cat = CATEGORIES[tx.category];
  const isIncome = tx.category === "income";
  const isWealth = wealthView && (tx.category === "investment" || tx.category === "savings");
  const isPositive = isIncome || isWealth;
  const amtColor = isPositive ? "#00B894" : "#FF6B6B";
  const amtPrefix = isPositive ? "+" : "-";
  const catLabel = getCatLabel ? getCatLabel(tx.category) : (cat?.label || tx.category);
  return (
    <div style={styles.txRow}>
      <div style={{ ...styles.txIcon, background: (cat?.color || "#888") + "22" }}>
        <span style={{ fontSize: 18 }}>{cat?.icon || "💸"}</span>
      </div>
      <div style={styles.txInfo}>
        <p style={styles.txSub}>{tx.subcategory}</p>
        <p style={styles.txMeta}>{tx.payment} · {tx.note || catLabel}</p>
      </div>
      <div style={styles.txRight}>
        {tx.foreignAmount && tx.foreignCurrency && (
          <p style={{ margin: "0 0 2px", fontSize: 10, color: th.textFaint, textAlign: "right" }}>
            {tx.foreignCurrency} {tx.foreignAmount}
          </p>
        )}
        <p style={{ ...styles.txAmt, color: amtColor }}>
          {amtPrefix}{formatSGD(tx.amount, sym)}
        </p>
        <div style={{ display: "flex", gap: 4 }}>
          {onEdit && <button onClick={() => { haptic("light"); onEdit(); }} style={{ background: "#0D768022", border: "none", borderRadius: 8, color: "#0D7680", padding: "4px 8px", cursor: "pointer", fontSize: 12 }}>✏️</button>}
          {onDelete && <button onClick={() => { haptic("light"); onDelete(); }} style={styles.deleteBtn}>✕</button>}
        </div>
      </div>
    </div>
  );
}

function SideNav({ tab, setTab, settings, th = THEMES.dark }) {
  const styles = makeStyles(th);
  const t = useT(settings);
  const items = [
    { id: "dashboard", icon: "📊", label: t.home },
    { id: "history",   icon: "📋", label: t.history },
    { id: "stats",     icon: "📈", label: t.stats },
    { id: "budget",    icon: "💰", label: t.budget },
    { id: "wealth",    icon: "💹", label: t.wealth },
    { id: "converter", icon: "💱", label: "FX" },
    { id: "settings",  icon: "⚙️", label: t.settings },
  ];
  return (
    <aside style={{ ...styles.sideNav, background: th.sideNavBg, borderRightColor: th.border2 }}>
      <div style={styles.sideNavLogo}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#0D7680", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px #0D768033" }}>
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAIAAAC2BqGFAAABMmlDQ1BJQ0MgUHJvZmlsZQAAeJx9kD9Lw0AYxn+Wgn+og+jokLGLUhW6qEsVi05SI1id0jRJhbaGJKUIbn4BP4Tg7ChCZwcFQXAUP4I4uMYnCZIu9T3eu98993B37wuFGRTFCvT6UdCo14yT5qkx/cmURhqWHfpMDrl+3jPv28o/vkkx23ZCW+uXsh3ocV1pipe8jDsJtzK+SngY+ZH4JuHAbOyIb8Vlb4xbY2z7QeJ/Fm/1ugM7/zclp398pHVPucwu54T4dLG4xOCQDc117XoMiMRDOSI6opCGTmoik0COvhQXR0zSv+yJ6w/YHsVx/JhrByO4r8LcQ66VN2GhBE8vuZb31LcCK5WKyoLrwvcdzDdh8VX3nP01ckJtRlpbnQsNT7U5Uvb1X5tV0ToV1qj+AiCUTfu+YhZyAABChElEQVR4nI29d6AmR3Unes6p6v7ivXeCJkeNGGUkoUAQCGGBH0ZgnADj8Lw89hH87MU4YnufDcYGY1gWzNpgDPaunxcbFoOxwSx+mCQEVk5oksIIjaTRpDs3fLm76pz9o0JXf98deVtX33yhu7rq1KlzfifUaezsuRjOcYgIIoqI+4gIAAgAAoKIBGSttdYIWwBQWmVZRkoRYbiiOvy1IiCIhBLaBwAUAEJBAREUACQAcPdFAH8mAoi7tyCi64Y/DcJ/4LrHUJ2AAhKvcudIaM4NDBGrwQIKACAwM7OxxrBlFkFARZqUEhBkEARBwdCHSKhZAqbU01Of3YVxJJ4WiKE5QESxXJoJArZarfnzNnQX5jvdbqPZVFku4HrJIkJISOAaFhEQYREE5bokbpz+RsIgLBYFEQgJ488ggOjPEpZqOFh1U0QcmQAASITBTWfoPyIAEooIi7gOCQAwuw6In0dBQBERELYsbI21bEpTFKPhcDjoj0djYy2RUqQwDgzcZK1B5TpJAWc4WsIIYkcdoQURjbGmLFvNxpYtWzZv396an7cCw9F4NJ4YY0pTsrXCHK/yMxTIKiKOcIgi7LiABBhEQMAiIEA154HhQocquiKiRFKHOUiHJwKI/tWxFjiaCkemqfGjJNciIAAhIZJSlGVZlmlFistyNOgtnV0a9HsooDKNiMyCeE6OrhG6vfui+klrEJqIxJaTYtKdm7/ggmdt2LplYuzySm8wGJbGsjAhKsLInm4URORXqqOypxEBAIAVcdOAzIyBNoKeP33nougQCV3EhL6OliBV1wWsYFgnns3dCbGtsIQQKMqcqQUdeN4tQgEAJMx03my18iwzk9HZ06dXlpZERGsNNdER5E86i66vzyyjAQAIi/Gk3cj3X3LJxm3be8PxmcXF8WiEiMpL5IQfAkfWJk8Ywu0xMLi7u1QLsH7T5H0l2QRSjvDcjsCQ6JLI2hDkQhiqVIxQtTN1u6n1DgCEFeFcU3met1pNscWZEydWl5aVJkLNIoyggrSbJaYndMr8ElSHCINIMZmcv2/fBZdc3hsMnj51qjQ205oQvWTEdK3XGondi/dKhsTJN/66lOipJvQLTCSZDhCE6dXqTuMapVLCrdW3aUkKYUVNte25EhEA2FrL3Gw25zudYjQ4/tQTxbjIspzFMgICUo3QYXXOcrQXF4hFOSFUV1599cLGjY89eXw4GmmdKZw+c83LY5/dXWaGygAwe3WUMenyW4MWmCwQgNoE+EmR6sO5j2fof4K1ap2v1ocIs3TbjWbeOHXixNLSYq6JAQWQKglZdU4n3anYCBEnxaTT7jz3Bdf3JsXBR45qRY08E5ZAh5ryCWoP1+p6IC5UpE27m/bGE1AEZPoWaXsY9AcChsVXSUmOSxen6TW1BGfp+ww6LV247l+lYHUwGI5Gm7dvb7abp556ipTjw5qE8/909lyYqD4AEEIsisnCunXXPO/644tnFs+ebWRZuAF6dV5plqmRuK54yTA1pJSsiFTx3ZQumh5S9cMUf02dE4m4JinPReI1b5Se70F9Mgf++/CeRTYsLBT9wZNPHVNKATgiOYQjAEoECICSGRBCKYrxXHf+Odc+7/vHjy8tLeV5JszMHG8CtZmvhFeAcA40rz3ael8rdDFFkWe4cJY0sxODiESUClY4B/XTRlJliHUdGE/wH6U6EFAjLa0sYSvfsm27LQ3UOMf1ASi9FyIYa1qt1pXXXXfsxMnhcKgzLTzdwRntjMEOwBmiVReBSMTEEUCJMAjHFRXYeRoJTJEyvnLggKkupVfNcmtKuNnGQYIxOWVxxFWfnC8iAswgSLSyupI1Ghu3bDFliSJT7VO8b+gCXnntdWdWVvujodYaWBC8WVzvvb/dFL/MzAEEilawIT0zoj2oURDSNuP7KTkr9QHPTsMsNWUKL9YHVZlXUOkH94f1dupNgbN6NanecNDqdhfWrzfG1HEhU7iKAcFMJhdedPGY5ezSUqYUczBZEw/DVL/rZJ3W1BAXWqoT00sEAIAxYjd0nDTLdyndnYmf3v0Z5MM0w/5bMqR2YSTWDD/VbDNhERYAIuoPh/MbNuXNFjOHkTKAUBSmpiw3bNo8f96mkydO5nlW54Xp+ZzqrnvPXOMXEXFI3NGNAdn1OJ2G+E8l08XZY7O3m/3yGTqz5pmzDU6dULFIIo6hroenJiwubgmSYVxONmzexALkiYwC6BhcQAABd+7dd2pxSZBEhDHt0zm5YJYckd2SVegWIHuC+49ODoKwAEee5YBYzrn2Xfs8QyZ3TnJ3iASapemaHxMTtKLyLJKZkjypRgERQioLA0p35xeMsYAiwCBMAIKEZVFu2rxNFA2HQ2f14TlGMvtNZHn3nf8tjNcL6Gj8sgBLkH21NcjBG5WSFX2b1aoCABDGxIuS3jfK8Sm+m2KF2hCCOk2/T5uqjxREhIhS6kdyi6e1jCeT9lwXiTh4S5xPBJTGzTt2rPT6itB5ExEh+Mj8fQHW8FGJCCJM9dwtEvSs6/065zJAphZE+sZ7mhHIOahEAAkBBZh9gwxMQRbNqqnaqn8G6k/359/yxk1NFQBEW8/BZysiKu905nq9Za20OEKzKRbWb6QsmywvKaXClTCl1ZI1UvM0OrZ1ZEUJoYFA2MCSKFJ5DFL5sCYh3GAIBUAhUTEZjwZ9y9ZBZGFptTqNdkOAKfGtTpkk51qRHiMHsVCjaUpB57BOzpE6UZL20ftZnGsBAABKY5rdbn+w6sijRYCNWdi4sT8aY4BxkZpJLxNbzsO0ytWAAbjF+3onujh3LabzNMtZU2sWEjZExGI8uvayi6+69KLReOQkcDPPv3fk0bsPPpS1Gol8r5GVmSONpK5kJIGVcS3gLB1nPNfpx/r3URv5dgiRWSDTeaNRTCaEqIVFZVmz1e6PR96H7dZ64sFKtWp6F3+eB2+VtE31j3txeHO2o1MMWHeAIIso5MHy8ktveMGvvfVNqzBWoEqw66D5nz/xF9+9+4FGp224cJOKgR0iKSF+WVNY/ohuHQgWVEr06qMjSjLxUF+IQVOEcXmPmGMgyZutyWgEiFrYtuc6qJQxpSLy4jmoltDc1OwFtxIHAocb15f/1IU1LZdOyYwejwsWBJhFBqPhih0tDZa11tYwdnA8HgOCsBFmZ3ZhCJHFVqb8bbFPNVpHLJH2st7p2J/0x6TPlRj0ftTg+LZsKMsdOxKzbbU7loGZXdwMog5Nmo6z5wFvAAIsUa+uqdY8r0zRd4riUXTMLkwkBIVASEoRKYUqU7qpchCxRcHWOiSDa12bziXEv/rEQ/2QtbqXMtBaSrI2R5IANmZRRKRIQDQINBrN0hoAj8kqf+O04HdNOJERFkyQ2rPOrVTjoZcxFaFDJ3FaxQeB6gwb1CrPm5nOyTk9xWNDtmxsCcLCEsy3IEASqoWbVGGK0L2w2uoMO+tLgnMo2HQhSr0RCNJGRASIiIyxGhCUzqwxENdAnKd6tyv6hDdr9qBO6wqZpN9XAwuzFdy4AgDk/MwE4mOuipAIUECsiGWegBFgRBBUSgEhOdXrPEwISAKCtT7MzLHjohobAVTB1oroM4o6Tl7ytnIRV2MMChKVQmM0ApJSJXMQGug1SqXK3NUcvp+WsPGus7SWaf02rSp9iyjCoJBQEYOYwk4mk0kxQWvanXyukXU7LQcurLBhLoBZkFSmdWYmo954VBYlqazRbDXzhguxg1gUEXQ+Bp6hDgCwSOq8ZPBIcW3WWeublI2mTw5mBCKSCGhAFMdYwcRI3CUBeUQGrndiSiwi4jMYV1MTkHQIEQgUjiajycpIWdm0Yf65V1xyxbMvu/CCfTt2btm2bcvc+vml4bIQAoIFZrAW2JTlXIbv/4P3sPCRhx85ePih7x166InjJweTSdZoNJtNBGY2AM4x7YVnnUaRS9YQwSmXzA7EsXtMapiZAvHgGl1wUzQgALKw4yzyWiWIiGncsBZxp3o2JU88KkovCToHAYCQlB4Nh2Y03LV54w0/+APXv/C5l1156fYdW9p5k4EN29KWRVmWbB3foAgKEwKiIqSLL37W9h3bX/ayGwF48czZBw4e/sY3vv21r99y+Ogx1WrOzXcdcAEAp4LWBCBhda1p906bKoHJaj7bOHsoQoACKMFL4NhXIzgPUyXUqutd0+eANVOYbMozUJ/byhPh+BlYiBCJhsMh2PLqSy9+/Y++6qU33XDejs0FFKPxuDfpr4x6KIBISKgAEZFDMxkqrTLdaFjEpUFf9RZNWRBR3sqe/6Jrb3zx9W/7xTd/42u3fOozn7v9gQMqazU7TWsKz2PegRYkpO8tB0LBjN0biejleJ3nIqwCF4H3q4M8FneaWkQ0OIM4/pJYnInFLE4sPIMHoL6spnGxJKtLAEiTmRTD1ZXnXnXlm9/4My96yQvyuWwwHJxYOgkASnkoJwGQcUiDAZ/2h0op53kUJ4BJEaG1ttcfDHDY6jZ++nWvec2Pvfp/fuVrf/KJv7zrwIFWd50mYm/Xi0+yq/ouiJTYiWuPSwCqhKkKOkTtWgWF409eSwroeEfnQZrVWpG4UwGO2W/W5vTwLqIqrfXK0vLWhbnf+53f/InXv8o2cXHlLJ+VjDJFJCCMIi6TKCxQ7xxBRAEWKYGZWaxFYMYK2SOiJq2QjLGny8VM6x/94R+66aYXffTP//IjH/+rEUur2zXWagAGFsT6iq8Y/Fz8FKLvgAjowDswRimRnMapzHQoz9FbgmKWcKzp6InEheRkSEIe6fsoRuIHQkTE5dNnbn7xCz77mU/+xBtefbJYPrG0yKgQFYMYYANsRFiYfUqisw+BRSyzFS7Yjk0xKsaTyZBtSRiElSAKgsuIQCLSwnK6t2SU/OYv/9Ln/urj+3dt7y8vZVnGAQAgM/rEO3cHloRFIt+kKFAEEBjZOjnkCc9CAiRAgghUZfpU1woBs2V2coTXulNCtNr3Kbkjz07zQDgbAQjJCoxXln/rP7zpIx99b7Yhe+zUcSNChMLWjdIKs4A4I9URD0AYmIWZjTGlNaW1I2PLspSy4IkR67nI3Z4F3RS54BIqJSynemeved41//CZv/qhG1+0cvYsae0iDjDlOQsex2q91gfv3A7i3OHhl4BSK8eQAChAR3pPGxQSAETyUoNlTTqmx+z3oRNrOASkurWYcgzD1Y/80bve8vY3Pr54vD8aUZZZa3wesrhk3zg3YoGNNSVbC4yadJ41W81Gs9lqNzvNVqOZe4FBzGytMZbBCloRdqAGRByXAWY6W+2vdNd1/urjH3ntK166fOYkKW3BqylIeAuwPsApTCU+TgTewKmGyf4HH8xOCegsFx18e7XfJBG7awqstZk66FzXXExTIABrmUfDj3/ofTfcfMORpx7ReQ4IbEtEl3GK7AQLe2CSAbQajUajQUjFqBis9pdXemeXlobDoTHlQnfdyZNnG1nTWDseTtrNtmqTKe14MhIgl4JN5IR8iHqQGk6KtlYf+/AHRuPyH7/69XUbN5TWuDw55KiqnExBCOisohdMJyCkxBHvtgvtBJUZITrmW/fsvGB/CWRN6WD2rNci0nCK3NPmSf0qzxEihDg8u/jB9/3Oza99+UNPPtJsdNxJAIKoouHtSEyKFrrzZPDpY8cfuP/Be+974OjRY4tnl3v9Ub8/LCYTsZa00s0WAplivGXjuosuvvC5117zvGufs/+S/XlDD4cjQtREAEBh/4CzzwzYdtYsBubVr//Zg4881prrWisuWbjGTgguiVjCPgHw0DCOl0QsVBrL2wYgKIiAIeEaQCk9PLs4HPcx37J35wX7SiBTGkRIsvMqUTUlMc71HqON5aSlICBkWX72zOlffcvP/T+/9uYDxx5pZRkgCbCbb0IEJER0gbv5+flJf3zbLbd/5ctff+CBQ2eWVplF51mW5agUEoEIistxdHPJ5aQo2SJAt9m89orLfu5nX/uSl91omIvxWCnlSRx5AIEtL7S7Bw4e+bHX/18TQgRAIQiJvwHlpsxT8U9gNQIHU2JObLDH3Ef0cERERCs9XF4aDweYbdm7c9/5BpQxZkrDQnXdWgA+CBZxBn09zRLAioBSejAY/MC1V37iLz700KnHDaFTQ+K75/mtZNNq5i3V/NY/3/K3n/r8g4ceZVLNZivLtAgEZ5G/a0x5dlyERIAIhMI8XF1B4R/+wZt+6zd/Zdve7f1eP9MZABDUcKoxZvP8xj/9s7/8j+/5QPe89VIYcHYyOnpHRzFFZ5HzsAW2IgAgnxAbiVuTpu4zO0KvLo0Hfcy37N1x/l6D2loL/9Yxpevie5yBzyIWhUuBlvCXPvNf1bbO6dUlpTQEfkRyfAFsy3a3e+LJ0x/90J/f+s3bqNFstrsAAFxyhcIDqF8rydtbAIhEJAIrK0sXbNv8n9/3+89/8QuWVpczpStDIRyE0MLGK3/iZ+458kin3WJmIgIARiChYIyEXAzPFcE0FQJvubi16xaEiEQJUrG41nqwulQMBy5IOK3c/ncUoPsqLoIgMUQivyrVO7P473/6NZsu2nFi6axSGixbESPMDimzFLacn1/3wJ0H3/7Wd9zyzTvb6zY2Gi0oC7Gl5Wrm1vRCxPeMyAAibI0VNuvXbXhqqf/v3vq2f/nnr8/PdUtbBozlLwVEa7nRavz8m3+OhwNArPYt+Pa87RdQlccnDnSHTCoIWr/qjsciAWEHwQ0CgNmWPdv37rWorbWpzX2ugU0xNda/TG1FW5p1Lf25z/3XZTUsrbPgPFMgACCZ0iwszN1xyz2//84/YkONRqs0pSBEkcqJIqK6CyLtGaTCDUFYlFbFeNQi+O9/9fHLn3P5eFgoDeF3EEQSh4vgx179+gOPH+9028KIAIwsAOR5kzzd1nCcoeN68a67SpkhIgCFX4W0Hq0sF6MhzWKJNQYzc2A4akR3gokZAJTWg1H/p1/3442Nc73BEAAEPJUFQAALW7TbrQP3HH737/yhNah1oyy9khBvfYRmxek+t63N/1W99Ygs8BcjIlljG832yrh85+/9EQ8nqMVwTOkBBGDEsbGd7vwrX3VzUUxIaQD2+8NCsxD4MrEYBAATt4IEbIWJDZHYdG40KALsMFDls5mieLym5i0MJnxqCoZsLkYUEGttuWn9/Cte+dLjy6dJZ9bbI57QVjhTerg6+k/v/UgxhkznxpSuBa9EEh1fqfRI/HpfGUQQolfM9dZY212/4d4Hj3zu8//UabdtaUSgcjOwAOLEjG/6gRvXL8xXkr8uRSXJRYlEjJRJ2auun2KalsslEhQgRMIY9hYRdt2GOhGl1tb0fMS59TdAon6//9wrrti0c0t/OCAgG4K4zMIsxppua+5v/9v/+P5jT3W6XWuN19IsIEA+8Q8JAKOxGv4wKILUSAqTICGLRRAArFWN/G8+9w+9lSEQOq1g2VGCAaEsiv0X7N29fdt4PAbn1QsINR071L6ppT7Xf4rkqU0VAHnUPAXcZOrc5MdK681MLITNA4iIpMx4dM01lw+ldILPiTTrgn7W5nnjocOPfvkfv9qZXyitQSREAkUIMBqPfUwJqn2W0wNDp/k9ralmOTvuQwBga/NG4/BDRw4dONRpNUVc6hOX1pRciDAbOzfXvWD39lF/VQi9oSJxvFwnWewApykGKSkcWYNU9XErJ0uclZo0V6N5TQGJ97lWVgk6U3XWgcvcybK9F+5bGq2GrDlx7Cwilm3WaH31y19bXe4pUs6ysQQEyBouuPLCAoRZSCBKm6n5Dm98LhGsdTimR6LhoDhy6KH1eafbaHUarWbeaDaa7UZ7rtlu5Y0Gqmft22fLImzMPCfOgSAsU/2UHk5Qx/TOSswJgMu9mzp7VihDws7Tg/EGZ6Q7AGJpzLr5+fO2bhoUY/I3B/ZRG0FFk/7w3jsfyNsdMQYBjLACVUxG2684/3k//pINt59391dv41LrTDFPo3tx+gzXRkcQgEHgB27NzX3y//ubr37jm+BjYeDDwETGlGDN8RNn5uYXrOGwl77KEpmi5nRWRDIlaU8wRFWSK0F750ZcL1I5wKF+Gy/dk1BLnLJqbCICUBbF+s1bOnOdRdOjeuIKMzdbzdOPnzxzclE3c7YMblstl4J236X7V/v9fc+7ZOPWDbf+4zdWnl5qt7uoFLN1lg5izLdytks0EWq8kjINZeqJk2cePva0h4sIiKhICSBbw9bkeaPRbLJAyAOIkKOyvwPVfP5UQhQQt8MfVVAVldIOEQkBAC0SdgM5lgwZJA7IxBFImhgYAGME5VEpAwECc1nOrVvQzUx6bP20eRnDzErpE8dPjQbjZqdjwACSi0K157uthS5YHg2H5+3b9qNvet1937z90J0Hyr5pNduolQ+zeEeZBLLAWqs8MD4AiOR5I88bU0yaSiFPPhRco5F4OH9BanlXgeY4y36sXnsghzx/AgQOCCk2X3UoTTdI5xFsBWIcgyEAsPjSDJQ18pLZMrubSrCA3Y2WFhfLonDzighEiona83N5qyHMmnE0GGE7v/F1r/ip//Azl153UcmjXq9nLCsMqdIeXbCTiXHwUSVN8bWEuA+z5XBYa2ez0dKmEmTgNFRFZamRxYMuABcVAKCwITP0R7svfM/dwImirks1Xbx9CIZFq9AlyMaeESplQSa2sCIU9Sugg1WWfcKRi6OAL42ikFBnyhhBRK0UMI8G/fV7tr76zT+18vTigdsfOHTfwdPHTwOoRrOVaeXQ4gxpKvGaitFkFBDHFA2NiIUjak4MkJSakRkrwvhoZZjaasV4meo/aRFOU8GY2bl7wDs61ziCaowyZgoMICKORgNjbcQwErhdAMXK/Pp1WZ5x9NIwE2BvadVMiqzdQFBuP6bSmS15ApMte7de+Oz9r1i9+ZH7j9z7nbuPHHh4ZWU111mj2QSt0M1Z1SVHOzpH9yAStE7H+hDD18mETeVZeF6N7FZJsJiRLfFX0ODysaLqxJpCqN7Ukmn8jdMOhRVAwIAi/dWemZSoyEVYXcTU0dVYs23H9vm5+QkwIiKLZdZA/bOrpx97et+1l5aTQqNCIkTUWuWZtsb2ev1ms/Hclz3/hh988eLTZ+6/4567brvn6OHHhks9nefNZotIMRsOSbMiFnAte7d+1O0676ZwDJZkfVQDnJqEOJV1uRtakwqJ+z0sNYLFTkC1EqJqxypKD1NKX0RIQIQVqaWzK4PeMN/QLssC3ebYsECG49HmHZu37d726CPHdK7YLTHmDPTBf71392X7QSEBEWpFhEREpIg0abGy2uvnWi9sXffyn7z5ZT/+Qycee+rQXd+76/Z7H3740X5vnOfNvNlEAmeEQsVwUyM71xFVDnn+CwsixXkpAnYAtz51rkiIp573xSBoD0a85qstqCjvn3GhVfBaBCwIimitV3urJ54+dcGm/aPJRPkdhkACFqEsS+mqy66++MF7H1zYtNFYBhFGypqtpeOLB75+x/Nf/QPDYtQgVC5NxvtmBAg1KQVYToqiKJXGbc/avv/y/a96/auOHT1253fuvuO7dz3+2BOTsWm22lmeiVipMZHDPiH6tEbJkYovU8g4JXynxHcS7gmWhPjNJm7G3Dk6NI/h/zWsgNk9JqFdiOhOxCdVAAgpLEs+9ODhC6++lI1FUq76ixURACLqDXovuumFX/7sF4vRiCgjJEFhgVa7e+DWuxc2bbjqB59vxiMAF0DxblJCAkSL6EKCCqAYFYvDErVsfdbOn7zkglf/5KseOXL09m/ffuetdz99/GTWaOTNlgCLZQwb6QS9oyhucpkaVnxNNPx0NktFAbemsfoJY/YjhKJjAiBCAXcFFDODctY8Eq3iNSOyz0RBAWbO8+a9d94/Go/FQToRh2vctBSTYtvenTf/xCsHKyuKFFuJTsys1fr2P/zLvV+8Za7VbbXbwIKMLOhAPviYIYALNhKSQhQYDoenl88Oodh7xb43/NIb3vvR97z1V9+0a9+O3upKOS4yrQWDMBGJQjm+hqSfaedGIPG04SYSbRL/tiZeko2hEmAV5lv2bN61yzn+aa047KyJGX6FuAHXiR9HUHc3IrJm/K4PvnPT/u2mKJTz8kAcIQLZpjR+7+3vfuTw9zvdjrXWx9+JSGAyGuy+fN/Lfuzley/aZ1FsWeYqazQampQm0kSkSCkKa5Gd10UArDVGJMvzbrNVDkd33nLH33/6i8cefbLT6QICswWi+ihkSjKsyV5rECFFAbTGteQAM9F4sGomI8y27Nm6a7cl7ZL+Z6j5zAwuMZUsRNfC9GjVW165+dU3veHX3rS84qKF/le3HJlNs9U+9fjJd/3y7477RbvdtdaictunBbUyg5FScvl1z37hD924++ILlM5sWaJApnWuFCkkhd6rhU6hYmLMCltLirpznaI/+dKnv/SFv/17Zmo2m8b5DySufPTaKqFplN3xu8DUlZPLSSAJW1VjURzXWnQBEtJ4uFpMxqi37Nq2+3wmbcpyap6DCoag8WJuKyZQUKIYcgOMfTPWZmD/8GPvm9u2UBQGgsnszUcBY0270zl28LEPvOv9g+Vxd37BsgEJcXJSzGbcX8lzfdEVlz3/phdecvXl6zatZ7ammIgIKdJKoYD1M+0XjZ9yBBEw1uqM1nXnj9x/6BN//InvP/LkQnddaY0gU5B5EJXjrMiuYAtOQfLKBIoWYPzobi4iglrhaNArHaG37torKjPGQB3Pi0jccAAOmVY3rzQ1Bio7kV2Jb8L+8spNr7jh53/7F0+tLinn7YWQKioAAKU13bm5xe+f+PP/9LHDh4/Oza8HFFMWKIJA7EZh7WQ8AsQdO7Y+57lXXn3DdXsvuaDZaZuinExKK0LAMV7txRdHjCtWwFqzMDdX9icff//Hbvv2nfPz65gNoIBQWtMrJbR7Q979IRDgaWTBoFMhPT/QQ1zuqDCSwvFg1UwK1Jt3bd21hxNCh5u6SeGoDQKhoUZol+DuZb5I8AaICAKBktFg5R3v+o1LXnjlysqKUpoEAIiRnfNNEK0t240GG/j8X3/+6//wtfG4aLZbRMRBgQIAKQLCclKWk1Grle0+f89V11155fOv3rV/b9bKRuPJeDwGAIUkIhYYBQhQkvCuMSbL9VzW/eQHP/61L399YWGdFYtCAOhiKxU3JkfNZ+Rlkjhdl5iBU7a+ACKwdUsKiSaOo7PNu7bu3mtQWWMQgpvaRYoFRKxPgUwIHe7r8TcyulwNBGDw0NX1hghMYdat7/7uh96J8y0uS6KQ+CKuRUFEa4wQzXfnHj909Euf/eJ9371nMizzbifLMnTuIHTeNQQitFxMJkUxajX0+Reef80Lr7vqedds37ubCYajgUsDcr1EAOuZTQBQGDDDjc35P33PR771L7euX7/eGOstdXE+mkCmSGa3tdttfgh7oafoO2suCggGaa5Ijwer5XiM+dY923btKQGNNakmBXCBrmoxJRaMy0ILkjr2xY9JvM5DBGalaDDoX37VRb/0++8Y8wTZAqG4nvjW3T43MWLb3XZT5Y8ffPQ7//8t995x38mTZ1Gk1WpTngEIWCPMztAXRGPsZDxkU84tdC658tLrX/rCq66/Omu3VpdX/bLnyDd+BIyglOpS6wO//Z6DDzzU7swxu7lO8NlUVphISpZKrqYepppwF4m0AlCkxv2emYwx37pn687dJYCxxlsGUXtWbhonLT1dBASFkyGI2yTsFXkkdLivUrS6svySl77o3//2L6wMe2gFFLKbKvYcwcLgN3nYZrOZ62bvbO/RA4fu+u5dB+87uHxmlVDrRqYyAvZp3MyABKTAWihGI4By7/7zb/6JV1570/MLtpPBBLVGsLGPAoJKseVGszFeXH3X2945GlhSfjdLRcEpD13lGKrpSQZJKzZG7k4QBAiAUjTu90sH77bs2FlW5h+GO3BiXiPF6wV8jLrG/iQuOxuqyY64HgFI0crK0stfcePP/sqbe8XYlhNSCirpGLnb5bWwiOgs63RaSuj0U6ePfO/Q/Xfed/i+A70zK6SbWatBBMZYEJfwjQoVCQ7HQ1sUl19z2U/+wv+57fydg9We0srjIi+uEACMtQvr5u/9l9v+9L0f7XTn2ZY+EAg+EO641PnaPPfOIt3K71SjdX2WgBSO+15G796yc2cJaNliRdlgQ8bajgCSuL19l51Qd8u/wtTxrt5mcnCNtO6vLD/v+qvf+I6fp07e7/WV0k6tx5Jq5EIBQQe45EaldbOZk8CZp049ePf37rr1zscOHx0Px41GU2c5R4EogARINOoNOt3Wv3v7/33dS1+wvLLkqsWgTy/y/TeWz1tY95H/+P77b/teY74jNtmqEwEf+OghrlWhksO++VRGuwnAYEeJCCo1GfTNZIzZlj1bdu4sBdhaqHnmxCUkOMGL6fpwQQSAQN8USgb0ASBgE3kFAEBaD1aXdu/b+cZfftOey/Yv95bFCCoNIV3NB4GQXH2yWJ7YGMsgKtONvGHGxVOPP3nfd+66+9Y7Tj15utnq5nluuCBmQGICrRQXdjTuv+ntb3nBD9+4uLrcQMXg+MYrD2Fpt9vHDz/2vl99t2rNE7h9wZ5kqZU460sK1IlFDCqwFggETuKIgCKaDHqmKBLRYa3/3Re0djPrhsrJLkTPyq4oZMrCiN61mIBRAQBw1UJFREApGo1HmuSHX/PDN73u5qzTHPT6AkykICAZgPRejjYgImytMYZFKNOks6XTZ++/5Y47vvrtM8fPtDtzrBUxE4AF0ICWy2ExeNv/+yuXvuia3uqKVj6fwCEiRGSW9XPz/+V33n/v7Q92u3PexwRSCZBpJq4dszyeAA8BEAQSQaVwMuyZyQT15t1bdu4yANbaIHso2JZVydhQ2KA6UASE6gZrpQbF1YxO5hpCTJiIQKQ37F1wwa5X/dSPXvGi61BjfzCwxhBQvbakBHtIWMTF+Iw1xtiiKICw0Wz2V3p3/PMtt//zd0QynZFYp2MtEFhjGk312x/+/cbmeS5M1GnOp2KYu/PdB2+956Pv/kinu1B5KKlGYppyHUceD7BDREK2aX2bLZAIkYJi2DOTSahjLo6YbncNkIDz3TICozPkiAB9MpK4fMuk0eDjrURV3eMVXbBALMBMPD+/7oknT/+X93zkg7/27ru+eitZmV+Yz5oNZoz18wCrInmuPKZl6+QxamKRldUVg/aFP/ay1/zSz3XW58VoCAiWjYvBUpYvnVn5/F9+qps3BYTCZgYRsQAEOOz3zr9s/+Ztm01ZVv1l7zcJ2mUaPqdsGxx+El3SIuAY1MeUnBYLjmkHhJ3mFQCXRUG+cCgICTOy+5BuRwz8y8lfyo7J5PvzEJBceqU1Jteq3ekeOfjIx973p+97+7u+8BefPnH08U6eLSzMZ43cR6ktC4t1O9qYw6v/A0RreXFxcd2uTa9842u7881iOABwKePMpe3Oz993+/3HHz7WajUtWxe4Z2ZjrQgXhe3Oz59/0fnFeESIkCQV+87P1KJIiI4RoQUtFvJcvTZPctUdoR2c8hahnzcAEM9SLCiA1Z7F1M1dEV1i6b+wBtN4sHiz3eezueKzjlrNVrc7t+HM08tf/tt/+uCv/+GH3vHe//nXf3/6+0+3G62Fdet0q2FAbGnZMPsMRq90HbWNZQFaXVrGTv7i17+SchBrmVAIiUjpfFLYO759e0bZxJRG2P357RoIiLh3/z5jSvFMGGkwzcvg/U4VzA46HwBIGAOtqxYqO1ukSgmrWnUZaAiMYSsDUnAHVp0AgARr1xaXZ4eYmgPppc6yDcRnABSLhhq61ZoTA48ceerQgaNf/uw/7T5/16XXXHrZNVdu3rtLWjQZTcrR2Fr2EUZrDbOxzJbZlBahHI3mdm2+5PlXPfC1O5pz8xrIjbqRNw89cOAH+zdHEOk6aQFQZFxOtu3dqTMV04gcPYNul9nRBQpMFcyIZAQHlxBdZN5vC9Nh7JW7MKaJhA0jFNdNnZrxy5qWcKcxs/fYQiXEvSCDELwUAEQhBGFkl6OBjVbWwoa1/Mjh7x+8//CX/uaLO/btuvTqZ1/0nMu37NnearcG48GoLEprLbO11piyYINWQKnJeLL72RcevutBZlCIDIxWiNTi06f7y6tqvmXLUlI3hdhxMe6um2+2mx4HYCTiGth5yr+RHAk/hYCs1Kx00Ahh52MorpZSLbBtnC5JJtbp2WjgOMmEBOAzRSSW00GnLhJjEpxecAgcJTwaAUGEDVsAyFuNvNmytvz+w8ceOfhY6/P/vGPfrkuvffaFV128futG1Ga8slpMCsuWjUvHsdZya8P8uq2bl59cEgVgBYBRcDIsJ6Px3PpuWUxc9b7AqmCKiWSUNZqlyxYWAeLwtJaKDimaTukwpfaDdeeGT9GJDQDaQw3LAL4+bNLcdN2IMKUY5hVTjo53clFPpRUAgg+EADvpygKILGwtOydHIHnkDP/QHrEgYhGh2W4RamF54pGnHjvy/W/849cuuGjv/qsv3nThPpXno36PTemQqWGrtWo0GuINTC8N2FpbGjcTTulDXIxWkDDL9GQ8Ub6+YqRabYP3WiSePhJLI9h5yn/WfvAJz0YmjTcI6wVmG58KL1Srx5ZnFpeQtMoy778wJtiQkmVZZ26OfVQeZ9pMViiisDAwAjTzTKDBpfnenQ/e9917N+/cfNkLrtpz1UWY56PJmJjB2NJOJoMhWAaimK2EhEhYlqW1lojIFavwtyBjjDUlevAQQIGAIAdbukbrdODhg4iPi03rKgjLXTs5jlU5eJlZH/XpCoKfmdObYdjCSIi2LLZvXP9bb/t5IgQiEbGWWcSZKrlSDx55+LNf+FLWbEG1FKbJ7ccGPgbhVhyIBYBms4XN5urJ5W98+subb7vv2ptv3HThnpWlJQYcr/SWT54myJjZWfMC0Gi1Wt3OpCiZxae3gwAhipBW5XhSDEeIjeAuQC8Ig32R0LqKKPo9TDW6r11PzA1Eew+IA3g1j0YQMG45V7MaH/uF4rchJ8pBRJCMsa1c/9IvvkUDjYEZfFhPAwHIHNCdhw584Ytf8aGh4A6OE1bvIjoXHfpdfjZmDag87zabK6d7X/3vX7r4eVc86/pnN9utx+8+NO6PWx1tATQLKCyNOX/Hjg3nrX/s1AlNZK0vFw5CWhgpn/RHpTGUZwgsgOgdxd4D4fONwx475si5wTGT+kBqWzycN4Kc+aPFecmewXL3szr9BBc/MU5mp64v4UxnJ08tHn7o4e17dvRHw8AVTrjLGaXWn3ferp3bjh47rvMsFHrDKRLXiJ5odQeRBMCCILPKdQbqwDfvPLt49rLrnvPoPYebra47nwkUQTHqX3ndlZArY0rKtC9khYAohXCm1MmnTk4K22mo6nFwQYVh4AGfUBDK84WlPNvlaepF4UCVSAh2x9qXAotYZzFw9UCqEE7hqmEQ0Fm23BscefjRrNEQBHKZGKSICBVNymJ+4/rnX3fVoL9KRIji9leuAVeTUHPENugnBb3lxmLENrvdxUPHbvn0l3hkSSlwaRWIbGyrnT/3putPLS4Skns+oRG2zNZyaVmsPPXYEzFcB0J1z78XF8GQc4lI5xARM0SX5B8CAPH1D+NsxDdrbPVK30glx0KmNwIQEKmS+Tvfvc0Kl2wBvDnq9v4g0bgY//iP/0i33WIO+Gkt0yCEhafUBVYUB7+Vha2lLFMWBcSycdUTctXo93o3vOzGuW2bTp1eBAFjxbLnFGFghuHq4PGHjuqsEao2ObGEIIRAIARCwghA4svmcVzGMevJk9OJk4RZU8pT5J9kLJFFPdiYnjmBmL9RJUgmph9bm7da3/r2d88uLhGhFbbMbhOh2/wzHPSvue6an3zNj/aXV5RuSJW0Xff5+grz6RJFjEwnvq4XuvCaE59sUYCRRFFZjs/bvOG1b/yZh449DkSFLa2TkiwiYoRVrk8+9sTJY8ezLBNh/9wonN7aVvGny5b1VgImZGUfd0poReLTAlyaJiEguUTCJFM4ULna7pweEoCQwzRxLSAA+J2b3Gw1Hzp69O677p1rzxlrJZZMctWlEHuj1V9821su2LNjsLqKpH10BawAC1i/YTi5YxxrNHuSKJifDPGbxDzWmQxWf/E3fmGk7crSEpJ7cGtpbclshcGYUuvs0G33F+MSyLlgJFZVC/bBLGpG8DuiuWJEDE76qSPgGKkHGCuNFA2TOD1QLwUWRKVvzTEZBs8esKCARfU/Pv05JUoQORT+csvWsF0ZDdsbFn7/D39Xky3HA6Uw1NgBEeRqjODfYUBUyJHvMRQsDN0kIURNGmD19Mm3vP2t5z/nkgOPHsnynI1hhzJZLHNpDCjsn1g8ePf3mu2mB3zVvDrycUorAQb/xFny4QEUJAbkqKOnNVyCEWr1ZqaerRGvnFWSIiGDJ6BgV/4NyPM3G9PtzH/967fcdtvtnU6ntJaFWcCKGDaGrUU6s7py+XVXfviPP9DK1Ggy1joPjgAA8ZXBwq3DaKVS/YLinu5JggzEQACoVW4mxWjUe/vv/vpzX/3S2x68X6m8tMyWrbFGxDAbaydlkeeNu7926+pKn3QG7DaTx/383nQR5HRtxbQZjLVTgCRWTPHxQowrIfB6ApCZAzROlFJSwa6agIqjAQBRArqHCMMBBPwTZSeMH/mTj3NpmNkwm+huE2RmRbi4tHz9D7zoz/7io3u2b1teXEQUVCjIAhbR8TcnpoHHWMLo6mZ46QxWIWRKgfDy2dPbNq37wJ/80dUvf9G/3nc3kLLWsrWGrSv5xpatYZXrxceeuvfWu1rNNsdcLxbyCNLtJkefyuS9mZWQDBQgx+C+ggEICgojCFEoOBsXSvCwhKTrWedGuiLqkMOv3moOgqPOdciw6c7N3fKt2z776c9vWJgvi1IE3YONnDvYMiPh02fP7Lro/A//2Qd+5EdeXo5H/dVVFNBKAxFg2IHjBhz4zRXsQiRSGlSGlBWmWF4509Dws2943R987H12S/fW++8mnbF/PjP7Bwi7PdLImdC3/u4rZuJKZhk3bT5bJcmaEAFfbwb980iCfoJKtFV8IL64AyZ7MjwmRMy27D5vyzYDYI3Pn0pcrrV6jol30S0GxMjgrmfR4+U7KoDMRjq5+utPfXLPBXtW+n1RKMxWxMWlDAuzjMwEFXWy1qH7D3z+M5+75457+4OxynKtFCkXKo3PzCNgFGErhq0txhNTFLlWe3dvv/FlN7z4FS+T+fa9jx7pDQaNLDfWpqFOZ4hMwC505+74x2/c+ZVvd9vzhg0ikAveUepudhHRRE8FnRVifwxCLvAV/MnekvTlBAFYGJUy45EtS8y37Tlvy/bSsquplBK0EhGRqT3zps6W0An3TwX1XGqQJVSj/vCyi/d94i8/Ck09Go+BFLO1bC1zyWKZjXBpTGHLZqvJxj588Mg9t9199KGjJ586vbq0ysKT0bCcjAFIaa2zTClSIPOdzu49Oy999qUXX3nplgt2jTN87OTxM8vLGSlAKK2JWWdx9bEp23NzR+/43jf+5p8azTYwMwgCIYbkPgSB+Ehrj9hDKVdBTBGYhFrQEjdTONEQAmKIAEBUjoe2LDDbuue8rduL0lhjY+Z6FSWZkRsoPkXTQZSwkNCbrN5grQS6iCite0tLL37h8z7w4fdNyE4KgwTWWitiWQy7ItGmNGZSFsPJ2IIgkSnN2ZNnPvlHf3bm2PH/4+Uvue7665ZXe1mWdbvdzlyn1Wy1FrqN9d1CwdnVlacXT/dHwwwREN1yiYeIIIOIGDbt+e5Thx77+n/7goYMQh0ljJoGFDinHUbu8RSvWM7xjwvxxfJFDr2Fra7iywMDCSCpYjxkU2gAb9R5/0mYsFlXN4bdXpiwbFxKoU8IIGwBkcKeFTBlOb9u/S233v4bv/Lbf/D+dzebeX8wEELDzCyGrbHWWFtaa5hZZFxOBpOxZWFNirRh2fPs/Ve+6sWnz57NdAbMpTHDYrI4Go1OnrWlcfvcWnnDGOPC5Na6efRwl4GFpTM3d+zAo7d86ksKclAEYoG8cCVA96QTQMRQPBBcxW0PJrxe8EMPmCPq6LCVJ1CvYk0PYMhf5hZI4oODqSMgudDQdC3fMCvJ+xjGRShNObd+/S233vYrv/CrvdMrC/PrisKUzM4bb9iU1hq2JduSWVhIkC2Px2MzGQKbQX944vSZ04tnT5w58/TimVNLZ3v9gRjbULqZZRmiK2VbPdMvFKUTAMsMRK1u5/C/3v+tT31RWY2afIplnaUSK4ygjjEkEjc1FdP3GLMzUn8exvMIopeGMG6Zi+SuAQwIQli8GeWdhXXZEt5z9QujABpTdufm77z3gTe/4a133HLb+oX1ADiaTEprjWXP0db6F+aSbVEWphwDF6RR55lW5LZ4AiIDONxSsjXCFpj9Ds6YkMCWuRTOWpmalLd99iu3fe6rWjIkBLYkgEDILoLr68b6RR9QsATwAA45TFl+Ph0BPexAL0jAowB0RqwEpOQxYGD1al94GjMGCOsGXHaYi3wIBKQDM1oU0lkIfSyt6XbnT55Z+vW3v+Oj7/0Q90bzC/MlcFGWbrWXxljLsdKVOAtCiFABOBDsaxZzeACmiEdw4oMDYtmyKa0xWZ51mo0TB45++RN/d+T2Q81WW1AsWCcLJNEpguCxtOcgxkjvtQ6H8Vyad8XdEus9+YoOEhYCiOjoGJEY9nayuh6UrN9UUuYFr21rxo6jUnq5u8BYk+c5QPNvP/P57/7r7a/56dde95IXtObnFnsr43FRlsYKWxZn1wgiag1KsWVrrQ1RR8tSoXFmK96EFmZrrWXRjUaGeOaJkwe+fdexB49q0J12y7jHMSCys+cQJCR1hixD9PY0RtMOA5MGFRRd0V5MY9CEtZmIfuxIPA0g1hog5VCDgF8kXvV5LFGLIyRUdsst+P4qk8JDGxG3laOqoONQAQKvW7f+xOmzH37/H+//wpduePlLLrn2is66+aGajMZDY21pTGmtKQoApKxhAUpTuifmMvuOubi3scYYw8xAkGW5buTD1f7TDx07es+hJw9/30zKvJEToGEb08tEBNFvvEH3cBy/f8HpHs8UJFSVWAp/Egcask99Um8NmlQkwsDTGgDYMulM0HpHEUsFfUJ+tASrJEYX/IQ5OzkK/URfeh3gTw7tOFEiYsTkSufd+aNHn3jojz+xcfPGi6+6/OJrr9iyd0ej1WCUcjJBRUhKKc0gxlrDVpF2nmTxNb+QQGeagKXoj089/tTjBx8+dvDRpacXQSBr5I1mw9lHgJX6QQAAilUQ0Gd+Sc1b7MSoROBcpemHUbh58pYxnONwYwZEDYhsrSYK6yBZTwLVnUO8GhNi+pAuQth7QakujYssgEAGL2FCrUYRtDZr5I1Gs78yvPWrt9z2zX9dv2Hdpt3b1m07b2HzeZ1OR5As26IsS8OlYSbrZKFiMMPJ8pmziydOLp06e/bk4uknT6ycXLTjUmeNRqMN6LxYIuC34lhw7zzpfHKdB8ppoltw2fiFGWBs+ATBjEjNuigwp9CwgwVIqBGgLCYt7KJ3NEULpLJW0G9XclSrtRioSXFZpYe/WcIovrsgHEA+iwhYpbO5vCECveXh0ulDlo3OdNZuIWgwppyMy9JYw6CA2XS73e/dctfX/u7LXPCo1/MPFNFaq1bebYqIiE1cERLAMkSXfcWcXvx5PpNYAxmqQnVh6UYj3PkDnulhKXGozEZESFATkilLZotIYsNmDgHGxOlRmdihk1O+J0isrBlyE8anCrgTwiUIIETO2eNcPyKYqUbWQkBEEoOiEYWNMQWXLAwMzGAEequ91dMrc911zfacq0zonhgi7PIE/ULn4BKIEhYjnqjEgh9eSCCtfQepRot2gX9Nk148X0YWBAEiMNYiCCJqILSlNZNS66ywxj1+CKINVInmcH8HjcQzxhTFp9EIsC9TAjMni3cTUGAicYuWg9MfGZ0fUpEQCrOxlkCMMTQe22JCIEIMVsRaL+Uc4HILUAQRiSuZACFU4aLYXouggPcBYUh5TkcUa0lDSBb1ceS4R3h27I7YAqKExFr3KB0SESScjEZKheylCF8qwCcBzjvmwzWpPHugUypBTlc0hvAdTrN/2nG2RqwBQK01ADj0bI0pisJaQSCfbR3pGBF7zCRMVUrEDt4eqTKYfZS3Am3sCzegh7sBgLngjp0qTQZTHObZEJkNW+u6pBFRKRoX447YLNemtLFzce/xVEsBQqwhJWbOdUGc2nDDInbDCHZNWOMUMqmcIYIMbK2xpjBlWRoiNKVBUmxD6QhPgnAXqeRbWBn+rs51GWBr6KT3YyQqL1gJGJOPfFrsM4y4NnbXICIURRG1KCGim6dBr5dnmTdVMPWQzFIwvsrUXKzRkQpZxxbrpyFUBbawGr+7hBBdJTmldd7IW512q9ttdjsq1yxGxGKYMIiX/VtHCA+BR1ahO6FXUclX3XQCJcWv59JJbg0goLBlU1LQSdolvhPRZDg0nW6mM+s3dHiFASAYNHDqPvX3YwGoimimJ7inXYaDHIM6hYqRJgIAqOKgUk1EzjeAebt18M77Tx0/UVqr8tw9XPT0E0/rRgstO3XH6OvTum3JjH6nSC2U7rzJPqfLZWq5RwShJJhPEAGI/ZqWiqAubFZP5K0ZwyFky8AaeTIeR+AgiNjcsc+dytZqna/buHFYlASIIjYppTQ1dbO3iSSuyQ2ovU84JOBoQEAgV64NwOVIBrqgM4kRaFKMyqJQQECEpACRMqWVFmEKPBjpCR4gOLlU7dDzCRaeKG5xc9CKAYj6DbM1POrbnXHQr6minM7jsigmE0UKEBAJkHQkDSlVFuNBb6UxP1+MSvJg3ttFU7SeInoqNJLTvDAMjw9KiVFBIodIIxOHE8n7vBFFoJm3G41WYBy3R05sFKRh1OF3L4FShxu6aARIdBqgCKDPO0oJi/XktHSYz0zlwGqAwsVkQoC+ei8AAGhJmlBa9/t9nTXyPJsURaj44Gjm9p4CAAgDxpxt51oMJrv4UGZCeu/IqiZ8dgwSCgyA65x41IsSo6VeXzmNwmAFhIAAwXopJwB+t4G3JRAr5o5TC8Ahd949LbgW7PDdq5hp1ncBCSdNS9HwcTwckghSEgxAIQIVT2UBjdRbWhRT5joDt9NInLYicLloTKnY8NQR8L86aRvzX7xDVmJ6gwMaVEEtEBQidE8Pc8KPCRjdtgiP4JxKJeeZQlc2hhh9iXrwCNkn0YbbypTSdZyBLATumZMM4hO3ACTYMdPFTtdk4XQCwtyIw5eT0QisRaWCvxpRETrfVXI9ACEhLi8ugrUqU6EkecCXzjDwSoYD6vBl9SGImiQYAAQuVO+TJzyGrZgQMRmPBAJNsXxir/m6wG5Www5UdI9xJIHgXomWSeq8jckLElIapyDdGoJRkgPOcbgNqIRQjIdiDRHFyYmQkLAKsbgDkEgjriwtgjWNPEvnMIVB/lkmQkGMBNJH4rj1yiTgU35C3ysrJe2+BPuCgn5fS1IChgw5iEowdCulC0zNHwQWrxG0avhcdJzyy0epOCVMEGEyGtiyUOhrGbpIUDB5oEpdcKAVkRhAiBBx5exiORk1GlnVaW9NeKK7UK/PcHUjAQ7hCQ6Gg1sRTvyGb4KyhMCDEIwXgDBfmJxYyXj/4qJzDGBncotTukzP0rmPae9NQtlAykpipj4RRESR8XDApiRCBohZKGkLrsRhdLOhuPNEHLjurSw1ikl7bp6ZSmtARAG6wknengoZpwFI+JwS8DrfP68CwT1UyInYoKUguCHd5lHw76MPgBKHQuItCRahRyWVSyse5wBFEmmdOoPiyVMSI30zhalCQBsJkcuymIzA7dAJu5NcvaA4PQigPVOzoLiUBgHykTAEzJQuR8PVYtLozmWNBluHqjBgIEdSBkQUhc4jhDG9QQTjluZqjt2FEkxVn0QXeLyq+hyHhy5loiZvAqg495pfi+h+is9N0P+ddtw/ikhEyvHQliUiOkEhgcrVCghqSGMIX4nXISTonxqCAAKotBbm0fJymWWNdocaDQDF1kZ0gRjYysVzwelIZ0who5CkbDXdaR8ECBnEjlWizRvUGs4O2OEYmckXjKetZUOtcSCii0SHM1M7yzeV3kU5V2I5NkUBrsSnlwTRN5U27iptuMeDVPHIxC72GyJdE0ppZGOGK8s6y3SrpfOclGJ0uTex5ig4TYehVpLDfQyC1a7waW6qO7ux+gExeLXEyxjxpTbEBek9evJmgsQxzODcOM1TUzIlFsJta/MSbSt/LZuyMNaUIOweDO8YDQHQAdFq8WKAYYgYn8Pi/U0hXRV8AVN0m4N8zIEUorXWrK4CosozpTOtM0QERMYITcA9FNDpP4i2llsg0fSTWM7UGeLISaokVgonEazuTJEkBoQg7tGIEoW+k54YxMQUbPByz//kcteiO9RTLDwU0s29CIhYa41lWzrOIkKsUdnBgql7IAYxwmyr6gZxiYpUnXGPeZJk2xCQS9gWLko7Hk8cXFEKlSJXyDyRphWfTK3HZImmbOiiDZU5sCZQCAQI1I8zWT/Hfw9xejFgIJw+Ueo8mIBEa/0TvNz+FkSfZ4SIGAqcIHkNPYUFHZ5DAAAiV6g7mQnPegCIwMzeYEcRFozbkLzCQm+NiVhjwNWQ9R0WL30DhStGBoipe+F8D9nIu+Edf3g/dcLTrmsSg9eVkg1WPvohVGSsZCEGPBqCJEFKhaVRGXuBVQScZiPvs0ZxD731vmn0O6DrVA73owi83PG/AHT4tgFbYjS+AAAAAElFTkSuQmCC" alt="Savvie" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
        </div>
        <div>
          <p style={{ ...styles.sideNavAppName, color: th.text, margin: 0 }}>SAVVIE</p>
          <p style={{ margin: 0, fontSize: 10, color: "#0D7680", fontWeight: 600 }}>Track. Plan. Grow.</p>
        </div>
      </div>
      <div style={styles.sideNavItems}>
        {items.map(item => (
          <button key={item.id} onClick={() => { haptic("light"); setTab(item.id); }}
            style={{ ...styles.sideNavBtn, color: tab === item.id && !item.big ? th.accent : th.textMuted, ...(item.big ? styles.sideNavBtnBig : {}), background: tab === item.id && !item.big ? th.accent + "22" : "transparent" }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span style={styles.sideNavLabel}>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function BottomNav({ tab, setTab, settings, th = THEMES.dark }) {
  const styles = makeStyles(th);
  const t = useT(settings);
  const lang = settings?.language || "EN";
  // Use short icon-only labels for long languages, show labels for all
  const shortLabels = {
    EN: { dashboard:"Home", history:"History", stats:"Stats", budget:"Budget", wealth:"Wealth", settings:"Settings" },
    BM: { dashboard:"Utama", history:"Sejarah", stats:"Statistik", budget:"Belanjawan", wealth:"Kekayaan", settings:"Tetapan" },
    ZH: { dashboard:"主页", history:"记录", stats:"统计", budget:"预算", wealth:"财富", settings:"设置" },
    TA: { dashboard:"முகப்பு", history:"வரலாறு", stats:"புள்.", budget:"பட்ஜெட்", wealth:"செல்வம்", settings:"அமைப்பு" },
  };
  const sl = shortLabels[lang] || shortLabels.EN;
  const items = [
    { id: "dashboard", icon: "📊", label: sl.dashboard },
    { id: "history",   icon: "📋", label: sl.history },
    { id: "stats",     icon: "📈", label: sl.stats },
    { id: "budget",    icon: "💰", label: sl.budget },
    { id: "wealth",    icon: "💹", label: sl.wealth },
    { id: "converter", icon: "💱", label: "FX" },
    { id: "settings",  icon: "⚙️", label: sl.settings },
  ];
  return (
    <nav style={{ ...styles.nav, background: th.navBg, borderColor: th.border }}>
      {items.map(item => (
        <button key={item.id} onClick={() => { haptic("light"); setTab(item.id); }}
          style={{ ...styles.navBtn, color: item.big ? "#fff" : tab === item.id && !item.big ? "#0D7680" : th.textFaint, ...(item.big ? styles.navBtnBig : {}) }}>
          <span style={{ fontSize: item.big ? 22 : 20 }}>{item.icon}</span>
          {!item.big && <span style={styles.navLabel}>{item.label}</span>}
        </button>
      ))}
    </nav>
  );
}

// ── BUDGET ────────────────────────────────────────────────────────────────────

function Budget({ transactions, budgets, onUpdate, isTablet, settings, th = THEMES.dark, customCategories = {}, addCustomCategory, isPremium = false, onUpgrade }) {
  const styles = makeStyles(th);
  const now = new Date();
  const resetDay = settings?.budgetResetDay || 1;
  const effectiveMonth = (() => {
    const d = new Date();
    // If today is before reset day, budget month is previous calendar month
    if (d.getDate() < resetDay) {
      return new Date(d.getFullYear(), d.getMonth() - 1, 1).getFullYear() + "-" + String(new Date(d.getFullYear(), d.getMonth() - 1, 1).getMonth() + 1).padStart(2, "0");
    }
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  })();
  const currentMonth = effectiveMonth;
  const sym = useSym(settings);
  const t = useT(settings);
  const [editing, setEditing] = useState(null); // category key being edited
  const [inputVal, setInputVal] = useState("");
  const [carryoverEnabled, setCarryoverEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("savvie_carryover") || "{}"); } catch { return {}; }
  });
  const toggleCarryover = (key) => {
    const updated = { ...carryoverEnabled, [key]: !carryoverEnabled[key] };
    setCarryoverEnabled(updated);
    localStorage.setItem("savvie_carryover", JSON.stringify(updated));
  };
  // Calculate carryover from previous month
  const prevMonth = (() => {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  })();

  // Custom category form state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("✨");

  // Merge default and custom categories
  const getAllCategories = () => {
    const merged = { ...CATEGORIES };
    Object.entries(customCategories).forEach(([key, cat]) => {
      merged[key] = {
        label: cat.name,
        icon: cat.emoji,
        color: cat.color || "#888888",
        subs: cat.subcategories || [],
        isCustom: true
      };
    });
    return merged;
  };

  const allCats = getAllCategories();
  const expCats = Object.entries(allCats).filter(([k]) => k !== "income" && k !== "savings" && k !== "investment");

  const monthTx = transactions.filter(tx => monthKey(tx.date) === currentMonth);

  const spent = {};
  monthTx.filter(tx => tx.category !== "income" && tx.category !== "savings" && tx.category !== "investment")
    .forEach(tx => { spent[tx.category] = (spent[tx.category] || 0) + tx.amount; });

  const totalBudget = Object.values(budgets).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const totalSpent  = Object.values(spent).reduce((s, v) => s + v, 0);
  const overallPct  = totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0;
  const overallColor = overallPct >= 100 ? "#FF6B6B" : overallPct >= 80 ? "#FFEAA7" : "#00B894";

  const handleSave = (cat) => {
    const val = parseFloat(inputVal);
    if (!isNaN(val) && val > 0) onUpdate(cat, val);
    else if (inputVal === "" || inputVal === "0") onUpdate(cat, 0);
    setEditing(null);
    setInputVal("");
  };

  const setBudgetsCount = expCats.filter(([k]) => budgets[k] > 0).length;

  return (
    <div style={styles.screen}>
      <h1 style={{ ...styles.pageTitle, color: th.text }}>{t.monthlyBudget}</h1>

      {/* Overall summary */}
      {totalBudget > 0 && (
        <div style={{ ...styles.balanceCard, marginBottom: 20 }}>
          <p style={styles.balLabel}>{t.overallBudget} — {MONTHS[now.getMonth()]} {now.getFullYear()}</p>
          <h2 style={{ ...styles.balAmount, fontSize: 28, color: overallColor }}>{sym} {totalSpent.toFixed(2)} <span style={{ fontSize: 16, color: th.textDim }}>of {sym} {totalBudget.toFixed(2)}</span></h2>
          <div style={styles.barBg}>
            <div style={{ ...styles.barFill, width: (overallPct) + "%", background: overallColor, transition: "width 0.5s" }} />
          </div>
          <p style={{ color: th.textDim, fontSize: 12, marginTop: 6 }}>
            {overallPct >= 100
              ? "⚠️ " + t.overBudgetBy + " " + sym + " " + (totalSpent - totalBudget).toFixed(2)
              : sym + " " + (totalBudget - totalSpent).toFixed(2) + " " + t.remaining}
          </p>
        </div>
      )}

      {setBudgetsCount === 0 && (
        <div style={{ background: "#0D7680", border: "none", borderRadius: 14, padding: "12px 16px", marginBottom: 20 }}>
          <p style={{ color: "#fff", fontSize: 13, margin: 0 }}>💡 Tap any category below to set your monthly spending limit.</p>
        </div>
      )}

      {/* Category budget rows */}
      <div style={isTablet ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } : {}}>
        {expCats.map(([k, v]) => {
          const budgetAmt = parseFloat(budgets[k]) || 0;
          const spentAmt  = spent[k] || 0;
          const pct       = budgetAmt > 0 ? Math.min(100, (spentAmt / budgetAmt) * 100) : 0;
          const isOver    = budgetAmt > 0 && spentAmt > budgetAmt;
          const isWarn    = budgetAmt > 0 && pct >= 80 && !isOver;
          const barColor  = isOver ? "#FF6B6B" : isWarn ? "#FFEAA7" : "#00B894";
          const isEditing = editing === k;

          return (
            <div key={k} style={{ background: th.surface, borderRadius: 16, padding: "14px 16px", marginBottom: isTablet ? 0 : 10, border: "1px solid " + (isOver ? "#FF6B6B44" : isWarn ? "#FFEAA744" : th.border) }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{v.icon}</span>
                <p style={{ flex: 1, fontWeight: 600, fontSize: 14, margin: 0 }}>{t.getCatLabel(k)}</p>
                {isOver && <span style={{ fontSize: 11, color: "#FF6B6B", fontWeight: 700 }}>OVER</span>}
                {isWarn && <span style={{ fontSize: 11, color: "#FFEAA7", fontWeight: 700 }}>⚠️</span>}
              </div>

              {/* Spent vs budget */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <p style={{ color: isOver ? "#FF6B6B" : "#0D7680", fontSize: 15, fontWeight: 700, margin: 0 }}>{sym} {spentAmt.toFixed(2)}</p>
                <p style={{ color: th.textFaint, fontSize: 13, margin: 0 }}>
                  {budgetAmt > 0 ? "of " + sym + " " + budgetAmt.toFixed(2) : t.noLimitSet}
                </p>
              </div>

              {budgetAmt > 0 && (
                <>
                  <div style={styles.barBg}>
                    <div style={{ ...styles.barFill, width: (pct) + "%", background: barColor }} />
                  </div>
                  <p style={{ color: th.textFaint, fontSize: 11, marginTop: 4 }}>{pct.toFixed(0)}{t.used}</p>
                </>
              )}

              {/* Edit input */}
              {isEditing ? (
                <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "stretch" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", background: th.inputBg, borderRadius: 10, padding: "0 12px", border: "2px solid #0D7680", height: 44, minWidth: 0, boxSizing: "border-box" }}>
                    <span style={{ color: "#0D7680", fontWeight: 700, marginRight: 6, flexShrink: 0 }}>{sym}</span>
                    <input
                      type="number"
                      value={inputVal}
                      onChange={e => setInputVal(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleSave(k)}
                      autoFocus
                      placeholder="0.00"
                      style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#0D7680", fontSize: 15, fontWeight: 700, width: "100%", minWidth: 0 }}
                    />
                  </div>
                  <button onClick={() => { haptic("medium"); handleSave(k); }} style={{ background: "#0D7680", border: "none", borderRadius: 10, color: "#fff", height: 44, padding: "0 16px", cursor: "pointer", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>Save</button>
                  <button onClick={() => { haptic("light"); setEditing(null); setInputVal(""); }} style={{ background: th.surface2, border: "1px solid " + th.border, borderRadius: 10, color: th.textMuted, height: 44, width: 44, cursor: "pointer", fontSize: 16, flexShrink: 0 }}>✕</button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                  <button
                    onClick={() => { haptic("light"); setEditing(k); setInputVal(budgetAmt > 0 ? budgetAmt.toString() : ""); }}
                    style={{ flex: 1, background: th.surface2, border: "1px solid " + th.border, borderRadius: 10, color: th.textMuted, padding: "7px 14px", cursor: "pointer", fontSize: 12 }}>
                    {budgetAmt > 0 ? t.editLimit : t.setLimit}
                  </button>
                  {budgetAmt > 0 && (
                    <button onClick={() => { haptic("light"); toggleCarryover(k); }}
                      title="Carry over unspent budget to next month"
                      style={{ background: carryoverEnabled[k] ? "#0D768022" : th.surface2, border: "1px solid " + (carryoverEnabled[k] ? "#0D7680" : th.border), borderRadius: 10, padding: "7px 10px", color: carryoverEnabled[k] ? "#0D7680" : th.textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                      ↩ {carryoverEnabled[k] ? "On" : "Off"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Custom Category Button */}
        <div style={{ background: th.surface, borderRadius: 16, padding: "14px 16px", marginBottom: isTablet ? 0 : 10, border: "2px dashed #0D7680" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12, flexDirection: "column" }}>
            <span style={{ fontSize: 24 }}>➕</span>
            <p style={{ fontWeight: 700, fontSize: 15, margin: 0, color: "#0D7680", textAlign: "center" }}>Add Custom Category</p>
            {!isPremium && (
              <p style={{ margin: "4px 0 0", fontSize: 11, color: th.textMuted, textAlign: "center" }}>
                {Object.keys(customCategories).length}/3 used {Object.keys(customCategories).length >= 3 ? "— 👑 Upgrade for unlimited" : ""}
              </p>
            )}
          </div>

          <div style={{ marginTop: 0, paddingTop: 0 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: th.text }}>Category Name</p>
            <input type="text" placeholder="e.g., Gaming, Baby, Side Gigs" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{ width: "100%", boxSizing: "border-box", border: "1px solid " + th.border, borderRadius: 8, padding: "10px 12px", background: th.surface2, color: th.text, marginBottom: 10, fontSize: 12 }} />

            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: th.text }}>Pick Emoji</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6, marginBottom: 12 }}>
              {["🎮", "🎨", "📚", "⚽", "🏋️", "👗", "💄", "🌱", "🍷", "✈️", "🎸", "📷", "🧘", "👶", "🚴", "🏊"].map(emoji => (
                <button key={emoji} onClick={() => { haptic("light"); setNewCategoryEmoji(emoji); }} style={{ background: newCategoryEmoji === emoji ? "#0D7680" : th.surface2, border: "1px solid " + th.border, borderRadius: 10, padding: "10px 0", fontSize: 18, cursor: "pointer", color: newCategoryEmoji === emoji ? "#fff" : th.text, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {emoji}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { haptic("light"); setNewCategoryName(""); setNewCategoryEmoji("✨"); }} style={{ flex: 1, background: "transparent", border: "1px solid " + th.border, borderRadius: 10, padding: "10px", color: th.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Clear
              </button>
              <button onClick={() => { addCustomCategory(newCategoryName, newCategoryEmoji); }} style={{ flex: 1, background: "#0D7680", border: "none", borderRadius: 10, padding: "10px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Create
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── STATS ─────────────────────────────────────────────────────────────────────

function Stats({ transactions, isTablet, settings, th = THEMES.dark, isPremium = false, onUpgrade }) {
  const styles = makeStyles(th);
  const sym = useSym(settings);
  const t = useT(settings);
  const now = new Date();
  const [selYear,  setSelYear]  = useState(now.getFullYear().toString());
  const currentYear = now.getFullYear().toString();
  // Free users: lock to current year/month only
  const [selMonth, setSelMonth] = useState(String(now.getMonth() + 1).padStart(2, "0"));

  const years  = [...new Set(transactions.map(tx => tx.date?.slice(0,4)))].filter(Boolean).sort().reverse();
  if (!years.includes(selYear)) years.unshift(selYear);
  const lockedYear = !isPremium ? now.getFullYear().toString() : null;
  // Force free users to current year
  React.useEffect(() => { if (!isPremium && selYear !== currentYear) setSelYear(currentYear); }, [isPremium]);

  const monthKey2 = selYear + "-" + selMonth;
  const monthTx   = transactions.filter(tx => tx.date?.startsWith(monthKey2));
  const expTx     = monthTx.filter(tx => tx.category !== "income" && tx.category !== "savings" && tx.category !== "investment");
  const incTx     = monthTx.filter(tx => tx.category === "income");
  const totalExp  = expTx.reduce((s,tx) => s + tx.amount, 0);
  const totalInc  = incTx.reduce((s,tx) => s + tx.amount, 0);
  const totalSavings    = monthTx.filter(tx => tx.category === "savings").reduce((s,tx) => s + tx.amount, 0);
  const totalInvestment = monthTx.filter(tx => tx.category === "investment").reduce((s,tx) => s + tx.amount, 0);

  // All expense categories — include all, sorted by amount (zero last)
  const expCatKeys = Object.keys(CATEGORIES).filter(k => k !== "income");
  const catData = {};
  expTx.forEach(tx => { catData[tx.category] = (catData[tx.category] || 0) + tx.amount; });
  const catItems = expCatKeys
    .map(k => [k, catData[k] || 0])
    .sort((a, b) => b[1] - a[1]);

  // Year monthly overview
  const yearMonths = Array.from({length:12}, (_,i) => {
    const m   = String(i+1).padStart(2,"0");
    const key = selYear + "-" + m;
    const tx  = transactions.filter(tx => tx.date?.startsWith(key));
    return {
      label: MONTHS[i],
      income:  tx.filter(m => m.category === "income").reduce((s,m)=>s+m.amount,0),
      expense: tx.filter(m => m.category !== "income" && m.category !== "savings" && m.category !== "investment").reduce((s,m)=>s+m.amount,0),
    };
  });
  const maxVal = Math.max(...yearMonths.map(m => Math.max(m.income, m.expense)), 1);

  const COLORS = ["#EF3340","#4ECDC4","#A29BFE","#F0A500","#00B894","#74B9FF","#FD79A8","#FFEAA7","#DDA0DD","#96CEB4","#FF6B6B","#45B7D1"];

  return (
    <div style={styles.screen}>
      <h1 style={{ ...styles.pageTitle, color: th.text }}>{t.statsTitle}</h1>

      {/* Month / Year selectors */}
      {/* Stats lock banner for free users */}
      {!isPremium && (
        <div style={{ background: "linear-gradient(135deg, #A29BFE 0%, #6C63FF 100%)", borderRadius: 14, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📊</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 1px", fontSize: 12, fontWeight: 800, color: "#fff" }}>Current month only</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.85)" }}>Upgrade to view all years</p>
          </div>
          <button onClick={onUpgrade} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", borderRadius: 10, padding: "5px 10px", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
            👑 Unlock
          </button>
        </div>
      )}
      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        <SelectField th={th} value={selMonth} onChange={e=>setSelMonth(e.target.value)} style={{flex:1}}>
          {MONTHS.map((m,i)=><option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
        </SelectField>
        <SelectField th={th} value={selYear} onChange={e => { if (!isPremium) { onUpgrade(); return; } setSelYear(e.target.value); }} style={{ flex:1, opacity: isPremium ? 1 : 0.5 }}>
          {years.map(y=><option key={y}>{y}</option>)}
        </SelectField>
      </div>

      {/* Monthly summary cards */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20}}>
        {[
          {label: t.income,     val:totalInc,        color:"#00B894", icon:"↑"},
          {label: t.expenses,   val:totalExp,         color:"#FF6B6B", icon:"↓"},
          {label: t.savings,    val:totalSavings,     color:"#74B9FF", icon:"🏦"},
          {label: t.invested,   val:totalInvestment,  color:"#A29BFE", icon:"📈"},
        ].map(c=>(
          <div key={c.label} style={{...styles.glanceCard, textAlign:"left", padding:"14px 16px"}}>
            <p style={{color:th.textFaint, fontSize:11, textTransform:"uppercase", letterSpacing:0.8, margin:"0 0 4px"}}>{c.icon} {c.label}</p>
            <p style={{color:c.color, fontSize:20, fontWeight:800, margin:0}}>{sym} {c.val.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Pie chart — spending categories */}
      <div style={{...styles.section}}>
        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>{t.spendingByCategory} — {MONTHS[parseInt(selMonth)-1]} {selYear}</p>

        {totalExp > 0 ? (
          <>
            {/* Pie chart with label lines */}
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={catItems.filter(([,amt]) => amt > 0).map(([cat, amt], idx) => ({
                    name: CATEGORIES[cat]?.label || cat,
                    value: amt,
                    color: COLORS[idx % COLORS.length],
                    icon: CATEGORIES[cat]?.icon || "💸",
                    pct: ((amt / totalExp) * 100).toFixed(1),
                  }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  labelLine={{ stroke: "#555", strokeWidth: 1 }}
                  label={({ cx, cy, midAngle, outerRadius, name, pct, color }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 30;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const anchor = x > cx ? "start" : "end";
                    return (
                      <text x={x} y={y} fill={color} textAnchor={anchor} dominantBaseline="central" fontSize={10} fontWeight={600}>
                        {name + " " + pct + "%"}
                      </text>
                    );
                  }}
                  paddingAngle={0}
                >
                  {catItems.filter(([,amt]) => amt > 0).map(([cat], idx) => (
                    <Cell key={cat} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [sym + " " + value.toFixed(2), name]}
                  contentStyle={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 10, color: "#fff", fontSize: 12 }}
                  itemStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend rows */}
            <div style={{ marginTop: 4 }}>
              {catItems.filter(([,amt]) => amt > 0).map(([cat, amt], idx) => {
                const info = CATEGORIES[cat];
                const pct = ((amt / totalExp) * 100).toFixed(1);
                return (
                  <div key={cat} style={{display:"flex", alignItems:"center", gap:8, marginBottom:8}}>
                    <div style={{width:10, height:10, borderRadius:2, background:COLORS[idx%COLORS.length], flexShrink:0}}/>
                    <span style={{fontSize:14, width:20}}>{info?.icon||"💸"}</span>
                    <p style={{flex:1, fontSize:13, margin:0}}>{t.getCatLabel(cat)}</p>
                    <p style={{fontSize:13, fontWeight:700, margin:0, color:COLORS[idx%COLORS.length]}}>{sym} {amt.toFixed(2)}</p>
                    <p style={{fontSize:11, color:th.textDim, margin:0, width:38, textAlign:"right"}}>{pct}%</p>
                  </div>
                );
              })}
            </div>

            {/* No-spend categories */}
            {catItems.filter(([,amt]) => amt === 0).length > 0 && (
              <div style={{marginTop:12, paddingTop:12, borderTop:"1px solid " + th.border2}}>
                <p style={{color:"#444", fontSize:11, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8}}>No spending</p>
                <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
                  {catItems.filter(([,amt]) => amt === 0).map(([cat]) => {
                    const info = CATEGORIES[cat];
                    return (
                      <div key={cat} style={{display:"flex", alignItems:"center", gap:5, background:th.surface, borderRadius:8, padding:"5px 10px"}}>
                        <span style={{fontSize:13}}>{info?.icon||"💸"}</span>
                        <p style={{fontSize:11, color:"#444", margin:0}}>{t.getCatLabel(cat)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{color:th.textFaint, fontSize:13, textAlign:"center", padding:"32px 0"}}>{t.noExpenses} — {MONTHS[parseInt(selMonth)-1]} {selYear}.</p>
        )}
      </div>

      {/* Yearly overview — custom bar chart */}
      <div style={{...styles.section, marginTop:8}}>
        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>{t.monthlyOverview} — {selYear}</p>
        <div style={{display:"flex", alignItems:"flex-end", gap:4, height:140, padding:"0 4px", marginBottom:6}}>
          {yearMonths.map((m,i) => (
            <div key={i} style={{flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, height:"100%", justifyContent:"flex-end"}}>
              <div style={{width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", gap:2, height:"100%"}}>
                <div style={{background:"#00B894", borderRadius:"4px 4px 0 0", height:((m.income/maxVal)*110) + "px", minHeight: m.income>0?2:0, transition:"height 0.4s"}}/>
                <div style={{background:"#FF6B6B", borderRadius:"4px 4px 0 0", height:((m.expense/maxVal)*110) + "px", minHeight: m.expense>0?2:0, transition:"height 0.4s"}}/>
              </div>
              <p style={{fontSize:8, color:th.textFaint, margin:0, textAlign:"center"}}>{m.label}</p>
            </div>
          ))}
        </div>
        <div style={{display:"flex", gap:16, justifyContent:"center"}}>
          <div style={{display:"flex", alignItems:"center", gap:6}}><div style={{width:10,height:10,borderRadius:2,background:"#00B894"}}/><p style={{color:th.textMuted,fontSize:11,margin:0}}>Income</p></div>
          <div style={{display:"flex", alignItems:"center", gap:6}}><div style={{width:10,height:10,borderRadius:2,background:"#FF6B6B"}}/><p style={{color:th.textMuted,fontSize:11,margin:0}}>Expenses</p></div>
        </div>
      </div>
    </div>
  );
}

// ── CURRENCY CONVERTER ────────────────────────────────────────────────────────

function CurrencyConverter({ settings, th = THEMES.dark }) {
  const t = useT(settings);
  const [convAmt, setConvAmt] = useState("");
  const [convFrom, setConvFrom] = useState(settings?.currency || "SGD");
  const [convTo, setConvTo] = useState("USD");
  const [liveRates, setLiveRates] = useState(null);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesUpdated, setRatesUpdated] = useState("");
  const [quickList, setQuickList] = useState(["USD", "MYR", "THB", "JPY"]);
  const [editingSlot, setEditingSlot] = useState(null);
  const holdTimer = React.useRef(null);

  const getRate = (from, to) => {
    if (from === to) return 1;
    if (liveRates) {
      const rateFrom = liveRates[from] || 1;
      const rateTo = liveRates[to] || 1;
      return rateTo / rateFrom;
    }
    const rateFrom = RATES_FROM_SGD[from] || 1;
    const rateTo = RATES_FROM_SGD[to] || 1;
    return rateTo / rateFrom;
  };

  const fetchRates = () => {
    setRatesLoading(true);
    fetch("https://api.frankfurter.app/latest?base=SGD")
      .then(r => r.json())
      .then(data => {
        if (data?.rates) {
          const rates = { SGD: 1, ...data.rates };
          setLiveRates(rates);
          const now = new Date();
          setRatesUpdated(now.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" }) + " · " + now.toLocaleDateString("en-SG", { day: "numeric", month: "short" }));
        }
        setRatesLoading(false);
      })
      .catch(() => { setRatesLoading(false); });
  };

  React.useEffect(() => { fetchRates(); const iv = setInterval(fetchRates, 15 * 60 * 1000); return () => clearInterval(iv); }, []);

  const handleQuickHoldStart = (idx) => {
    holdTimer.current = setTimeout(() => setEditingSlot(idx), 600);
  };
  const handleQuickHoldEnd = () => { clearTimeout(holdTimer.current); };
  const replaceQuickSlot = (newCurrency) => {
    const updated = [...quickList];
    updated[editingSlot] = newCurrency;
    setQuickList(updated);
    setEditingSlot(null);
    setConvTo(newCurrency);
  };

  return (
    <div style={{ padding: "20px 16px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Amount input */}
      <div style={{ background: th.surface, borderRadius: 16, padding: "16px 18px", marginBottom: 14, border: "1px solid " + th.border }}>
        <p style={{ color: th.textMuted, fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.8 }}>Amount</p>
        <input type="number" value={convAmt} onChange={e => { const v = e.target.value; if (v === "" || (!isNaN(v) && parseFloat(v) >= 0)) setConvAmt(v); }}
          placeholder="0.00" autoFocus
          style={{ width: "100%", background: "transparent", border: "none", outline: "none", fontSize: 32, fontWeight: 800, color: th.bg === "#0F2B34" ? "#fff" : "#0D7680", boxSizing: "border-box" }} />
      </div>

      {/* From / Swap / To */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <p style={{ color: th.textMuted, fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.8 }}>From</p>
          <select value={convFrom} onChange={e => setConvFrom(e.target.value)}
            style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "12px 14px", fontSize: 14, fontWeight: 700, color: th.text, cursor: "pointer" }}>
            {Object.keys(RATES_FROM_SGD).map(c => <option key={c} value={c}>{CURRENCY_FLAGS[c]} {c} — {CURRENCY_NAMES[c]}</option>)}
          </select>
        </div>
        <button onClick={() => { haptic("light"); const tmp = convFrom; setConvFrom(convTo); setConvTo(tmp); }}
          style={{ marginTop: 18, width: 44, height: 44, borderRadius: "50%", background: "#0D7680", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 12px #0D768044" }}>⇄</button>
        <div style={{ flex: 1 }}>
          <p style={{ color: th.textMuted, fontSize: 11, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.8 }}>To</p>
          <select value={convTo} onChange={e => setConvTo(e.target.value)}
            style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "12px 14px", fontSize: 14, fontWeight: 700, color: th.text, cursor: "pointer" }}>
            {Object.keys(RATES_FROM_SGD).map(c => <option key={c} value={c}>{CURRENCY_FLAGS[c]} {c} — {CURRENCY_NAMES[c]}</option>)}
          </select>
        </div>
      </div>

      {/* Result */}
      <div style={{ background: "#0D7680", borderRadius: 20, padding: "28px 24px", textAlign: "center", marginBottom: 20 }}>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, margin: "0 0 8px" }}>
          {CURRENCY_FLAGS[convFrom]} {convAmt || "0"} {convFrom}
        </p>
        <p style={{ color: "#fff", fontSize: 42, fontWeight: 800, margin: "0 0 8px", letterSpacing: -1 }}>
          {CURRENCY_FLAGS[convTo]} {((parseFloat(convAmt) || 0) * getRate(convFrom, convTo)).toFixed(2)}
        </p>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 4px" }}>
          {convTo} {CURRENCY_NAMES[convTo]}
        </p>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, margin: "0 0 12px" }}>
          {"1 " + convFrom + " = " + getRate(convFrom, convTo).toFixed(4) + " " + convTo + "  ·  Indicative rate"}
        </p>
        {/* Rate status + refresh */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0 }}>
            {ratesLoading ? "Updating rates..." : liveRates ? "🟢 Live · " + ratesUpdated : "🟡 Offline rates"}
          </p>
          <button onClick={() => { haptic("light"); fetchRates(); }} disabled={ratesLoading}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 20, padding: "4px 10px", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
            {ratesLoading ? "..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* Quick currency grid */}
      <p style={{ color: th.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Quick Select To</p>
      <p style={{ color: th.textFaint, fontSize: 11, margin: "0 0 10px" }}>Hold any tile to customise</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
        {quickList.map((c, idx) => (
          <button key={idx}
            onClick={() => { haptic("light"); setConvTo(c); }}
            onTouchStart={() => handleQuickHoldStart(idx)}
            onTouchEnd={handleQuickHoldEnd}
            onMouseDown={() => handleQuickHoldStart(idx)}
            onMouseUp={handleQuickHoldEnd}
            onMouseLeave={handleQuickHoldEnd}
            style={{ background: convTo === c ? "#0D7680" : th.surface, border: "2px solid " + (editingSlot === idx ? "#F0A500" : convTo === c ? "#0D7680" : th.border), borderRadius: 12, padding: "10px 4px", cursor: "pointer", textAlign: "center", position: "relative", transition: "all 0.15s" }}>
            {editingSlot === idx && <div style={{ position: "absolute", top: -6, right: -6, width: 16, height: 16, borderRadius: "50%", background: "#F0A500", fontSize: 9, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>✎</div>}
            <p style={{ margin: "0 0 2px", fontSize: 16 }}>{CURRENCY_FLAGS[c]}</p>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: convTo === c ? "#fff" : th.text }}>{c}</p>
          </button>
        ))}
      </div>

      {/* Slot picker overlay */}
      {editingSlot !== null && (
        <div style={{ background: th.surface2, borderRadius: 16, padding: 16, border: "2px solid #F0A500", marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: th.text }}>Replace slot {editingSlot + 1} with:</p>
            <button onClick={() => { haptic("light"); setEditingSlot(null); }} style={{ background: "transparent", border: "none", color: th.textMuted, fontSize: 18, cursor: "pointer" }}>✕</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, maxHeight: 220, overflowY: "auto" }}>
            {Object.keys(RATES_FROM_SGD).filter(c => !quickList.includes(c) || c === quickList[editingSlot]).map(c => (
              <button key={c} onClick={() => { haptic("light"); replaceQuickSlot(c); }}
                style={{ background: c === quickList[editingSlot] ? "#F0A50022" : th.surface, border: "1px solid " + (c === quickList[editingSlot] ? "#F0A500" : th.border), borderRadius: 10, padding: "8px 4px", cursor: "pointer", textAlign: "center" }}>
                <p style={{ margin: "0 0 2px", fontSize: 14 }}>{CURRENCY_FLAGS[c]}</p>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: th.text }}>{c}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────

// ── CPF TRACKER ─────────────────────────────────────────────────────────────
function CPFTracker({ th, styles, sym }) {
  const STORAGE_CPF = "savvie_cpf";
  // CPF Contribution Rates — effective 1 January 2026 (cpf.gov.sg)
  // employee.total = deducted from employee salary (% of wage)
  // employer.total = paid by employer on top (% of wage)
  // alloc = how the combined total is split across OA / SA / MA (% of wage)
  const CPF_RATES = {
    "55_below": { employee: { total: 20   }, employer: { total: 17   }, alloc: { oa: 23,   sa: 6,   ma: 8   } },
    "55_to_60": { employee: { total: 17   }, employer: { total: 15.5 }, alloc: { oa: 21,   sa: 5.5, ma: 6   } },
    "60_to_65": { employee: { total: 11.5 }, employer: { total: 12   }, alloc: { oa: 14,   sa: 3.5, ma: 6   } },
    "65_to_70": { employee: { total: 7.5  }, employer: { total: 9    }, alloc: { oa: 7.5,  sa: 2.5, ma: 6.5 } },
    "above_70": { employee: { total: 5    }, employer: { total: 7.5  }, alloc: { oa: 5,    sa: 1,   ma: 6.5 } },
  };
  const AGE_LABELS = {
    "55_below": "Below 55", "55_to_60": "55 to 60",
    "60_to_65": "60 to 65", "65_to_70": "65 to 70", "above_70": "Above 70"
  };
  const FRS_2025 = 213000;
  const BRS_2025 = 106500;
  const ERS_2025 = 426000;

  const [salary, setSalary] = useState("");
  const [ageGroup, setAgeGroup] = useState("55_below");
  const [oa, setOa] = useState("");
  const [sa, setSa] = useState("");
  const [ma, setMa] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_CPF);
        if (res && res.value) {
          const d = JSON.parse(res.value);
          if (d.salary)   setSalary(d.salary);
          if (d.ageGroup) setAgeGroup(d.ageGroup);
          if (d.oa)       setOa(d.oa);
          if (d.sa)       setSa(d.sa);
          if (d.ma)       setMa(d.ma);
        }
      } catch(_) {}
      setLoaded(true);
    })();
  }, []);

  const save = async (data) => {
    try { await window.storage.set(STORAGE_CPF, JSON.stringify(data)); } catch(_) {}
  };

  const handleSave = () => {
    const data = { salary, ageGroup, oa, sa, ma };
    save(data);
    setEditMode(false);
  };

  const s = parseFloat(salary) || 0;
  const rates = CPF_RATES[ageGroup];
  const cap = 8000; // OW ceiling from Jan 2026
  const base = Math.min(s, cap);
  const empContrib   = base * (rates.employee.total / 100);
  const erContrib    = base * (rates.employer.total / 100);
  const totalMonthly = empContrib + erContrib;
  // OA/SA/MA allocation is of the combined contribution pool (% of wage)
  const oaContrib    = base * (rates.alloc.oa / 100);
  const saContrib    = base * (rates.alloc.sa / 100);
  const maContrib    = base * (rates.alloc.ma / 100);

  const oaBal = parseFloat(oa) || 0;
  const saBal = parseFloat(sa) || 0;
  const maBal = parseFloat(ma) || 0;
  const totalBal = oaBal + saBal + maBal;
  const raBalance = saBal + oaBal;

  const frsGap = Math.max(0, FRS_2025 - raBalance);
  const frsPct = Math.min(100, (raBalance / FRS_2025) * 100);

  const accent = "#FD79A8";
  const accentLight = "#FD79A822";

  if (!loaded) return null;

  return (
    <div>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: th.text }}>CPF Overview</p>
          <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>Singapore CPF contributions</p>
        </div>
        <button onClick={() => setEditMode(!editMode)} style={{ background: editMode ? "#FF6B6B" : "#0D7680", border: "none", borderRadius: "50%", width: 52, height: 52, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: editMode ? 18 : 26, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px " + (editMode ? "#FF6B6B66" : "#0D768066"), flexShrink: 0 }}>
          {editMode ? "✕" : "+"}
        </button>
      </div>

      {/* Edit form */}
      {editMode && (
        <div style={{ background: th.surface, borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid " + th.border }}>
          <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: 14, color: th.text }}>Update Details</p>

          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: th.textMuted }}>Monthly Gross Salary (S$)</p>
          <input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="e.g. 4500" min="0"
            style={{ width: "100%", boxSizing: "border-box", background: th.inputBg, border: "1px solid " + th.border, borderRadius: 10, padding: "10px 12px", color: th.text, fontSize: 14, marginBottom: 12 }} />

          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: th.textMuted }}>Age Group</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 12 }}>
            {Object.entries(AGE_LABELS).map(([key, label]) => (
              <button key={key} onClick={() => setAgeGroup(key)}
                style={{ background: ageGroup === key ? accent : th.surface2, border: "1px solid " + (ageGroup === key ? accent : th.border), borderRadius: 10, padding: "8px 4px", color: ageGroup === key ? "#fff" : th.textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>

          <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: th.text }}>Current CPF Balances (optional)</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {[["OA", oa, setOa, "#74B9FF"], ["SA", sa, setSa, "#A29BFE"], ["MA", ma, setMa, "#55EFC4"]].map(([label, val, setter, col]) => (
              <div key={label}>
                <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: col }}>{label}</p>
                <input type="number" value={val} onChange={e => setter(e.target.value)} placeholder="0.00" min="0"
                  style={{ width: "100%", boxSizing: "border-box", background: th.inputBg, border: "1px solid " + col + "66", borderRadius: 8, padding: "8px", color: th.text, fontSize: 13 }} />
              </div>
            ))}
          </div>

          <button onClick={handleSave} style={{ width: "100%", background: accent, border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            Save Details
          </button>
        </div>
      )}

      {/* Monthly contribution calculator */}
      {s > 0 && (
        <div style={{ background: th.surface, borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid " + th.border }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: th.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Monthly Contributions</p>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: th.textFaint }}>Salary: S$ {s.toFixed(2)} — {AGE_LABELS[ageGroup]}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[
              ["Your contribution", empContrib, rates.employee.total + "%", accent],
              ["Employer adds", erContrib, rates.employer.total + "%", "#00B894"],
              ["Total / month", totalMonthly, "", "#F0A500"],
              ["Total / year", totalMonthly * 12, "", "#74B9FF"],
            ].map(([label, val, rate, col]) => (
              <div key={label} style={{ background: th.surface2, borderRadius: 12, padding: "10px 12px" }}>
                <p style={{ margin: 0, fontSize: 11, color: th.textMuted }}>{label}{rate ? " (" + rate + ")" : ""}</p>
                <p style={{ margin: "4px 0 0", fontWeight: 800, fontSize: 15, color: col }}>S$ {val.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[["OA", oaContrib, "#74B9FF"], ["SA", saContrib, "#A29BFE"], ["MA", maContrib, "#55EFC4"]].map(([label, val, col]) => (
              <div key={label} style={{ background: accentLight, borderRadius: 10, padding: "8px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 11, color: col, fontWeight: 700 }}>{label}</p>
                <p style={{ margin: "2px 0 0", fontSize: 13, fontWeight: 800, color: th.text }}>S$ {val.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Balance overview */}
      {totalBal > 0 && (
        <div style={{ background: th.surface, borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid " + th.border }}>
          <p style={{ margin: "0 0 12px", fontSize: 11, fontWeight: 700, color: th.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Your CPF Balances</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[["OA", oaBal, "#74B9FF", "Ordinary"], ["SA", saBal, "#A29BFE", "Special"], ["MA", maBal, "#55EFC4", "MediSave"]].map(([label, val, col, full]) => (
              <div key={label} style={{ background: th.surface2, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 10, color: col, fontWeight: 700 }}>{full}</p>
                <p style={{ margin: "2px 0 4px", fontSize: 18, fontWeight: 900, color: col }}>{label}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: th.text }}>S$ {val.toLocaleString("en-SG", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              </div>
            ))}
          </div>
          <div style={{ background: th.surface2, borderRadius: 12, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: 13, color: th.textMuted }}>Total CPF</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: accent }}>S$ {totalBal.toLocaleString("en-SG", {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
          </div>
        </div>
      )}

      {/* FRS Tracker */}
      {(saBal > 0 || oaBal > 0) && (
        <div style={{ background: th.surface, borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid " + th.border }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: th.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Retirement Sum Progress</p>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: th.textFaint }}>SA + OA balance vs CPF retirement sums (2025)</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
            {[["BRS", BRS_2025, "#74B9FF"], ["FRS", FRS_2025, "#A29BFE"], ["ERS", ERS_2025, "#FD79A8"]].map(([label, val, col]) => {
              const pct = Math.min(100, (raBalance / val) * 100);
              return (
                <div key={label} style={{ background: th.surface2, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 11, color: col, fontWeight: 800 }}>{label}</p>
                  <p style={{ margin: "2px 0 4px", fontSize: 11, color: th.textFaint }}>S$ {(val/1000).toFixed(0)}k</p>
                  <div style={{ background: th.border, borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ width: pct + "%", height: "100%", background: col, borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: pct >= 100 ? "#00B894" : col }}>{pct.toFixed(0)}%</p>
                </div>
              );
            })}
          </div>

          {frsGap > 0 && (
            <div style={{ background: "#A29BFE22", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>To reach FRS</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#A29BFE" }}>S$ {frsGap.toLocaleString("en-SG", {minimumFractionDigits: 2, maximumFractionDigits: 2})} to go</p>
            </div>
          )}
          {frsGap === 0 && (
            <div style={{ background: "#00B89422", borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#00B894" }}>FRS achieved!</p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {s === 0 && totalBal === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: 40, margin: "0 0 12px" }}>🇸🇬</p>
          <p style={{ fontWeight: 800, fontSize: 16, color: th.text, margin: "0 0 6px" }}>Track Your CPF</p>
          <p style={{ fontSize: 13, color: th.textMuted, margin: "0 0 20px", lineHeight: 1.5 }}>Enter your salary and CPF balances to see your contributions and retirement sum progress.</p>
          <button onClick={() => setEditMode(true)} style={{ background: "#0D7680", border: "none", borderRadius: "50%", width: 52, height: 52, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px #0D768066", margin: "0 auto" }}>+</button>
        </div>
      )}

      {/* Info footer */}
      <div style={{ background: th.surface2, borderRadius: 12, padding: "10px 14px", marginTop: 8 }}>
        <p style={{ margin: 0, fontSize: 11, color: th.textFaint, lineHeight: 1.6 }}>
          Rates based on CPF Board guidelines effective Jan 2026. OW ceiling S$8,000/month. BRS S$106,500 | FRS S$213,000 | ERS S$426,000. For reference only — always verify at cpf.gov.sg.
        </p>
      </div>
    </div>
  );
}


// ── RECURRING TRANSACTIONS PANEL ─────────────────────────────────────────────
function RecurringPanel({ recurringTx = [], onAdd, onDelete, th, styles, settings }) {
  const sym = settings?.currencySymbol || "S$";
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [category, setCategory] = useState("housing");
  const [nextDate, setNextDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [error, setError] = useState("");

  const FREQ_LABELS = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };
  const FREQ_ICONS  = { weekly: "📅", monthly: "🗓️", yearly: "📆" };

  const handleAdd = () => {
    if (!name.trim()) { setError("Please enter a name."); return; }
    if (!amount || parseFloat(amount) <= 0) { setError("Please enter a valid amount."); return; }
    if (!nextDate) { setError("Please set a next date."); return; }
    setError("");
    onAdd && onAdd({ name: name.trim(), amount: parseFloat(amount), frequency, category, nextDate });
    setName(""); setAmount(""); setFrequency("monthly"); setNextDate(""); setShowForm(false);
  };

  return (
    <div>
      {/* List of existing recurring */}
      {recurringTx.length === 0 && !showForm && (
        <div style={{ background: th.surface, borderRadius: 14, padding: "20px 16px", textAlign: "center", border: "1px solid " + th.border, marginBottom: 10 }}>
          <p style={{ fontSize: 28, margin: "0 0 8px" }}>🔄</p>
          <p style={{ fontSize: 14, fontWeight: 700, color: th.text, margin: "0 0 4px" }}>No recurring transactions</p>
          <p style={{ fontSize: 12, color: th.textMuted, margin: 0 }}>Set up salary, rent, subscriptions to auto-log monthly</p>
        </div>
      )}
      {recurringTx.map(r => (
        <div key={r.id} style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#0D768022", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
            {FREQ_ICONS[r.frequency] || "🔄"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: th.text }}>{r.name}</p>
            <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>
              {sym} {parseFloat(r.amount).toFixed(2)} · {FREQ_LABELS[r.frequency]} · Next: {r.nextDate}
            </p>
          </div>
          <button onClick={() => onDelete && onDelete(r.id)}
            style={{ background: "#FF6B6B22", border: "1px solid #FF6B6B44", borderRadius: 8, padding: "6px 10px", color: "#FF6B6B", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
            Remove
          </button>
        </div>
      ))}

      {/* Add form */}
      {showForm && (
        <div style={{ background: th.surface, border: "1px solid #0D7680", borderRadius: 14, padding: 16, marginBottom: 10 }}>
          <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 800, color: th.text }}>New Recurring Transaction</p>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: th.textMuted }}>Name</p>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Salary, Rent, Netflix"
            style={{ width: "100%", boxSizing: "border-box", background: th.inputBg, border: "1px solid " + th.border, borderRadius: 10, padding: "10px 12px", color: th.text, fontSize: 14, marginBottom: 10 }} />
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: th.textMuted }}>Amount ({sym})</p>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0"
            style={{ width: "100%", boxSizing: "border-box", background: th.inputBg, border: "1px solid " + th.border, borderRadius: 10, padding: "10px 12px", color: th.text, fontSize: 14, marginBottom: 10 }} />
          <p style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: th.textMuted }}>Frequency</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
            {["weekly","monthly","yearly"].map(f => (
              <button key={f} onClick={() => setFrequency(f)}
                style={{ background: frequency === f ? "#0D7680" : th.surface2, border: "1px solid " + (frequency === f ? "#0D7680" : th.border), borderRadius: 10, padding: "8px 4px", color: frequency === f ? "#fff" : th.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {FREQ_LABELS[f]}
              </button>
            ))}
          </div>
          <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: th.textMuted }}>Next date</p>
          <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", background: th.inputBg, border: "1px solid " + th.border, borderRadius: 10, padding: "10px 12px", color: th.text, fontSize: 14, marginBottom: 10 }} />
          {error && <p style={{ color: "#FF6B6B", fontSize: 12, margin: "0 0 8px" }}>{error}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setShowForm(false); setError(""); }} style={{ flex: 1, background: th.surface2, border: "1px solid " + th.border, borderRadius: 10, padding: "10px 0", color: th.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleAdd} style={{ flex: 2, background: "#0D7680", border: "none", borderRadius: 10, padding: "10px 0", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Add Recurring</button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          style={{ width: "100%", background: th.surface, border: "2px dashed #0D768066", borderRadius: 14, padding: "13px 0", color: "#0D7680", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          + Add Recurring Transaction
        </button>
      )}
    </div>
  );
}


function Settings({ settings, setSettings, onSave, th = THEMES.dark, transactions = [], pinEnabled, storedPin, onSavePin, isPremium, premiumExpiry, onUpgrade, onWatchAd, onExport, bioSupported, biometricEnabled, setBiometricEnabled, onImport, recurringTx = [], onAddRecurring, onDeleteRecurring, customCategories = {}, setCustomCategories, addCustomCategory, deleteCustomCategory, showAddCategory, setShowAddCategory, newCategoryName, setNewCategoryName, newCategoryEmoji, setNewCategoryEmoji }) {
  const styles = makeStyles(th);
  const t = useT(settings);
  const sym = useSym(settings);
  const updateSettings = (newSettings) => { setSettings(newSettings); onSave(newSettings); };
  const [calc, setCalc] = useState("0");
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcExpr, setCalcExpr] = useState("");
  const [justEvaled, setJustEvaled] = useState(false);
  const [exportMsg, setExportMsg] = useState("");
  const handleCurrencyChange = (e) => {
    const c = currencies.find(cur => cur.code === e.target.value);
    if (c) updateSettings({...settings, currency: c.code, currencySymbol: c.symbol});
  };
  const handleConvertChange = (e) => {
    const c = currencies.find(cur => cur.code === e.target.value);
    if (c) updateSettings({...settings, convertCurrency: c.code, convertSymbol: c.symbol});
  };
  const handleLanguageChange = (e) => updateSettings({...settings, language: e.target.value});
  const [pinSetup, setPinSetup] = useState(null); // null | "new" | "confirm"
  // Recurring transactions UI state
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recName, setRecName] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recCategory, setRecCategory] = useState("food");
  const [recFreq, setRecFreq] = useState("monthly");
  const [recType, setRecType] = useState("expense");
  const [recDay, setRecDay] = useState("1");
  const [pinInput, setPinInput] = useState("");
  const [pinFirst, setPinFirst] = useState("");
  const [pinMsg, setPinMsg] = useState("");

  const pinPress = (val) => {
    if (pinInput.length >= 4) return;
    const next = pinInput + val;
    setPinInput(next);
    if (next.length === 4) {
      if (pinSetup === "new") {
        setPinFirst(next);
        setPinInput("");
        setPinSetup("confirm");
        setPinMsg("Confirm your PIN");
      } else if (pinSetup === "confirm") {
        if (next === pinFirst) {
          onSavePin(next);
          setPinSetup(null); setPinInput(""); setPinFirst(""); setPinMsg("✓ PIN set successfully!");
          setTimeout(() => setPinMsg(""), 3000);
        } else {
          setPinInput(""); setPinMsg("PINs don't match. Try again."); setPinFirst(""); setPinSetup("new");
        }
      }
    }
  };
  const pinDel = () => setPinInput(p => p.slice(0,-1));

  const shareWhatsApp = () => {
    const now = new Date();
    const monthName = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][now.getMonth()];
    const year = now.getFullYear();
    const currentMonth = year + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const monthTx = transactions.filter(tx => tx.date && tx.date.startsWith(currentMonth));
    const income = monthTx.filter(tx => tx.category === "income").reduce((s, tx) => s + tx.amount, 0);
    const expenses = monthTx.filter(tx => tx.category !== "income" && tx.category !== "savings").reduce((s, tx) => s + tx.amount, 0);
    const savings = monthTx.filter(tx => tx.category === "savings").reduce((s, tx) => s + tx.amount, 0);
    const balance = income - expenses - savings;
    const catBreakdown = {};
    monthTx.filter(tx => tx.category !== "income").forEach(tx => {
      catBreakdown[tx.category] = (catBreakdown[tx.category] || 0) + tx.amount;
    });
    const topCats = Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const sym = settings.currencySymbol || "S$";

    let msg = "*SAVVIE — " + monthName + " " + year + " Summary* 💰\n\n";
    msg += "💵 Income: *" + sym + " " + income.toFixed(2) + "*\n";
    msg += "💸 Expenses: *" + sym + " " + expenses.toFixed(2) + "*\n";
    if (savings > 0) msg += "🏦 Savings: *" + sym + " " + savings.toFixed(2) + "*\n";
    msg += "✅ Balance: *" + sym + " " + balance.toFixed(2) + "*\n\n";
    if (topCats.length > 0) {
      msg += "*Top Spending:*\n";
      topCats.forEach(([cat, amt]) => {
        const info = CATEGORIES[cat];
        msg += (info?.icon || "💸") + " " + (info?.label || cat) + ": " + sym + " " + amt.toFixed(2) + "\n";
      });
    }
    msg += "\n_Tracked with SAVVIE_ 🇸🇬";
    const url = "https://wa.me/?text=" + encodeURIComponent(msg);
    window.open(url, "_blank");
    haptic("medium");
  };

  const [csvPreview, setCsvPreview] = useState("");
  const [showAbout, setShowAbout] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState("");

  const [importMsg, setImportMsg] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showBankGuide, setShowBankGuide] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [guideStep, setGuideStep] = useState(0);
  const bankFileRef = React.useRef(null);
  const restoreFileRef = React.useRef(null);

  const detectCategory = (description) => {
    if (!description) return { category: "food", subcategory: "", isSubscription: false };
    const d = description.toUpperCase();

    // Subscriptions (auto-flag)
    const subs = ["NETFLIX", "SPOTIFY", "DISNEY", "APPLE.COM", "ICLOUD", "GOOGLE", "YOUTUBE", "AMAZON PRIME", "HBO", "ADOBE", "MICROSOFT", "DROPBOX", "NOTION", "CLAUDE", "OPENAI", "CHATGPT", "CANVA", "VPN"];
    if (subs.some(s => d.includes(s))) return { category: "entertainment", subcategory: description.slice(0, 30), isSubscription: true };

    // Transport
    if (/GRAB|GOJEK|TADA|RYDE|COMFORT|TRANSCAB|CDG|SMRT|EZ-LINK|SIMPLY|TRANSITLINK|SBS|BUS|MRT|TAXI/i.test(description)) return { category: "transport", subcategory: description.slice(0, 30), isSubscription: false };

    // Petrol
    if (/SHELL|ESSO|CALTEX|SPC|SINOPEC|PETROL/i.test(description)) return { category: "transport", subcategory: "Petrol", isSubscription: false };

    // Groceries
    if (/FAIRPRICE|COLD STORAGE|GIANT|SHENG SIONG|PRIME SUPERMARKET|REDMART|U STARS|MUSTAFA|HAO MART|DON DON DONKI|MARKET PLACE|JASONS/i.test(description)) return { category: "groceries", subcategory: description.slice(0, 30), isSubscription: false };

    // Food chains
    if (/MCDONALD|KFC|BURGER KING|SUBWAY|STARBUCKS|COFFEE BEAN|TOAST BOX|YA KUN|OLD CHANG KEE|LIHO|KOI|GONG CHA|LIQUIDS|JUMBO|CRYSTAL JADE|DIN TAI|PIZZA HUT|DOMINO|LONG JOHN|TEXAS|MOS BURGER|SHAKE SHACK|FIVE GUYS|NENE|4FINGERS|SAIZERIYA/i.test(description)) return { category: "food", subcategory: description.slice(0, 30), isSubscription: false };

    // Hawker / kopitiam / generic food
    if (/KOPITIAM|FOODCOURT|FOOD COURT|HAWKER|COFFEESHOP|RESTAURANT|CAFE|EATERY|BAKERY|PASTA|RAMEN|SUSHI|NOODLE|RICE|CHICKEN|LAKSA|ROTI|PRATA|NASI|MEE/i.test(description)) return { category: "food", subcategory: description.slice(0, 30), isSubscription: false };

    // Online shopping
    if (/SHOPEE|LAZADA|AMAZON|TAOBAO|QOO10|CAROUSELL|ZALORA|ASOS|SHEIN|TEMU|EZBUY|EXPEDIA|AGODA|BOOKING.COM|TRIP.COM|KLOOK|TRIP/i.test(description)) return { category: "shopping", subcategory: description.slice(0, 30), isSubscription: false };

    // Retail stores
    if (/UNIQLO|H AND M|ZARA|MUJI|COTTON ON|GU|DECATHLON|IKEA|HARVEY NORMAN|COURTS|CHALLENGER|BEST DENKI|GAIN CITY|POPULAR|KINOKUNIYA|TOYS R US/i.test(description)) return { category: "shopping", subcategory: description.slice(0, 30), isSubscription: false };

    // Telco
    if (/SINGTEL|STARHUB|M1|CIRCLES|SIMBA|TPG|MYREPUBLIC|GIGA/i.test(description)) return { category: "telco", subcategory: description.slice(0, 30), isSubscription: true };

    // Utilities
    if (/SP GROUP|SP SERVICES|CITY ENERGY|GEYLANG GAS|UTILITIES|ELECTRICITY|WATER|PUB/i.test(description)) return { category: "housing", subcategory: "Utilities", isSubscription: true };

    // Health / pharmacy
    if (/GUARDIAN|WATSONS|UNITY|PHARMACY|RAFFLES MEDICAL|PARKWAY|HEALTHWAY|DOCTOR|CLINIC|HOSPITAL|MOUNT ELIZABETH|GLENEAGLES|DENTAL|OPTICAL|CHAS/i.test(description)) return { category: "health", subcategory: description.slice(0, 30), isSubscription: false };

    // Snacks / convenience
    if (/7-ELEVEN|7 ELEVEN|7-11|CHEERS|VENDING/i.test(description)) return { category: "snacks", subcategory: description.slice(0, 30), isSubscription: false };

    // Entertainment
    if (/GOLDEN VILLAGE|GV|CATHAY|SHAW|FILMGARDE|SPL|UNIVERSAL STUDIOS|ZOO|BIRD PARK|GARDENS BY THE BAY|SCIENCE CENTRE|ART SCIENCE|MUSEUM|KARAOKE|KTV|BOWLING/i.test(description)) return { category: "entertainment", subcategory: description.slice(0, 30), isSubscription: false };

    // Education
    if (/SCHOOL|UNIVERSITY|COLLEGE|TUITION|COURSERA|UDEMY|SKILLSFUTURE|MOE|NTU|NUS|SMU|SUTD|SIT|SUSS/i.test(description)) return { category: "education", subcategory: description.slice(0, 30), isSubscription: false };

    // Travel
    if (/SINGAPORE AIRLINES|SCOOT|JETSTAR|AIRASIA|EMIRATES|QATAR|HOTEL|AIRBNB|MARRIOTT|HILTON|SHANGRI|SWISSOTEL|FAIRMONT/i.test(description)) return { category: "travel", subcategory: description.slice(0, 30), isSubscription: false };

    // Pets
    if (/PET LOVERS|PET SAFARI|VET|VETERINARY|MARS|PURINA|ROYAL CANIN/i.test(description)) return { category: "pets", subcategory: description.slice(0, 30), isSubscription: false };

    // Donations
    if (/DONATION|TZU CHI|CARING|GIVING|CHARITY|SHARE|MOSQUE|CHURCH|TEMPLE|RED CROSS/i.test(description)) return { category: "donation", subcategory: description.slice(0, 30), isSubscription: false };

    // Default to food (most common)
    return { category: "food", subcategory: description.slice(0, 30), isSubscription: false };
  };

  const detectBank = (headers) => {
    const h = headers.join(",").toLowerCase();
    if (h.includes("transaction date") && h.includes("reference")) return "DBS";
    if (h.includes("transaction date") && h.includes("debit") && h.includes("credit") && !h.includes("reference")) return "OCBC";
    if (h.includes("txn date") && h.includes("debit") && h.includes("credit")) return "UOB";
    if (h.includes("date") && h.includes("description") && h.includes("amount")) return "Generic";
    return "Unknown";
  };

  const mapBankRow = (bank, headers, row) => {
    const get = (key) => {
      const idx = headers.findIndex(h => h.toLowerCase().includes(key.toLowerCase()));
      return idx >= 0 ? (row[idx] || "").trim() : "";
    };
    let date = "", description = "", amount = 0, type = "expense";

    if (bank === "DBS") {
      date = get("transaction date");
      description = get("reference") || get("description");
      const debit = parseFloat(get("debit").replace(/,/g, "")) || 0;
      const credit = parseFloat(get("credit").replace(/,/g, "")) || 0;
      amount = debit > 0 ? debit : credit;
      type = credit > 0 ? "income" : "expense";
    } else if (bank === "OCBC") {
      date = get("transaction date");
      description = get("description") || get("transaction description");
      const debit = parseFloat(get("debit").replace(/,/g, "")) || 0;
      const credit = parseFloat(get("credit").replace(/,/g, "")) || 0;
      amount = debit > 0 ? debit : credit;
      type = credit > 0 ? "income" : "expense";
    } else if (bank === "UOB") {
      date = get("txn date");
      description = get("description") || get("particulars");
      const debit = parseFloat(get("debit").replace(/,/g, "")) || 0;
      const credit = parseFloat(get("credit").replace(/,/g, "")) || 0;
      amount = debit > 0 ? debit : credit;
      type = credit > 0 ? "income" : "expense";
    } else {
      date = get("date");
      description = get("description") || get("memo") || get("details");
      const rawAmt = parseFloat(get("amount").replace(/,/g, "").replace(/[^0-9.-]/g, "")) || 0;
      amount = Math.abs(rawAmt);
      type = rawAmt < 0 ? "expense" : "income";
    }

    // Normalize date to YYYY-MM-DD
    let normalDate = "";
    if (date) {
      const parts = date.split(/[-\/]/);
      if (parts.length === 3) {
        if (parts[0].length === 4) normalDate = date.slice(0,10); // YYYY-MM-DD
        else if (parts[2].length === 4) normalDate = parts[2] + "-" + parts[1].padStart(2,"0") + "-" + parts[0].padStart(2,"0"); // DD/MM/YYYY
        else normalDate = "20" + parts[2] + "-" + parts[1].padStart(2,"0") + "-" + parts[0].padStart(2,"0");
      }
    }

    return { date: normalDate, description, amount, type };
  };

  const handleBankImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    haptic("medium");
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const allLines = text.split("\n").map(l => l.trim()).filter(Boolean);
        // Find header row
        let headerIdx = 0;
        for (let i = 0; i < Math.min(10, allLines.length); i++) {
          const lower = allLines[i].toLowerCase();
          if (lower.includes("date") && (lower.includes("amount") || lower.includes("debit") || lower.includes("credit"))) {
            headerIdx = i;
            break;
          }
        }
        const parseCSVRow = (row) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < row.length; i++) {
            if (row[i] === '"') { inQuotes = !inQuotes; }
            else if (row[i] === "," && !inQuotes) { result.push(current); current = ""; }
            else { current += row[i]; }
          }
          result.push(current);
          return result;
        };
        const headers = parseCSVRow(allLines[headerIdx]);
        const bank = detectBank(headers);
        const dataRows = allLines.slice(headerIdx + 1).filter(l => l.replace(/,/g, "").trim());
        const mapped = dataRows.map(row => {
          const cells = parseCSVRow(row);
          return mapBankRow(bank, headers, cells);
        }).filter(r => r.amount > 0 && r.date);

        setImportPreview({ bank, headers, count: mapped.length, mapped });
        setShowImport(true);
      } catch (err) {
        setImportMsg("Could not parse file. Make sure it is a CSV from your bank.");
        setTimeout(() => setImportMsg(""), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmBankImport = () => {
    if (!importPreview) return;
    haptic("success");
    const newTxs = importPreview.mapped.map(r => {
      const detected = r.type === "income" ? { category: "income", subcategory: r.description.slice(0, 30), isSubscription: false } : detectCategory(r.description);
      return {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        date: r.date,
        category: detected.category,
        subcategory: detected.subcategory || r.description.slice(0, 30),
        amount: r.amount,
        payment: importPreview.bank + " Bank",
        note: r.description,
        type: r.type,
        isSubscription: detected.isSubscription,
        isCreditCard: false,
      };
    });
    setImportPreview(null);
    setShowImport(false);
    setImportMsg("Imported " + newTxs.length + " transactions! Categories were auto-detected.");
    setTimeout(() => setImportMsg(""), 6000);
    if (onImport) onImport(newTxs);
  };

  const handleBackup = () => {
    haptic("medium");
    try {
      window.storage.get("sg_finance_tracker_v8").then(res => {
        const data = res?.value || "{}";
        try {
          const blob = new Blob([data], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "SGFinance_Backup_" + new Date().toISOString().slice(0,10) + ".json";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {}
        setExportMsg("✓ Backup created!");
        setTimeout(() => setExportMsg(""), 3000);
      });
    } catch (e) {}
  };

  const handleRestore = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    haptic("medium");
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data && (data.transactions || data.settings)) {
          window.storage.set("sg_finance_tracker_v8", JSON.stringify(data));
          setRestoreMsg("✓ Restored! Reloading...");
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setRestoreMsg("Invalid backup file.");
          setTimeout(() => setRestoreMsg(""), 3000);
        }
      } catch (err) {
        setRestoreMsg("Could not read backup file.");
        setTimeout(() => setRestoreMsg(""), 3000);
      }
    };
    reader.readAsText(file);
  };

  const doExportPDF = () => {
    haptic("medium");
    const now = new Date();
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthName = monthNames[now.getMonth()];
    const year = now.getFullYear();
    const currentMonth = year + "-" + String(now.getMonth() + 1).padStart(2, "0");
    const monthTx = transactions.filter(function(tx) { return tx.date && tx.date.startsWith(currentMonth); });
    const income = monthTx.filter(function(tx) { return tx.category === "income"; }).reduce(function(s, tx) { return s + tx.amount; }, 0);
    const expenses = monthTx.filter(function(tx) { return tx.category !== "income" && tx.category !== "savings"; }).reduce(function(s, tx) { return s + tx.amount; }, 0);
    const savings = monthTx.filter(function(tx) { return tx.category === "savings"; }).reduce(function(s, tx) { return s + tx.amount; }, 0);
    const balance = income - expenses - savings;
    const sym = settings.currencySymbol || "S$";

    const catBreakdown = {};
    monthTx.filter(function(tx) { return tx.category !== "income"; }).forEach(function(tx) {
      catBreakdown[tx.category] = (catBreakdown[tx.category] || 0) + tx.amount;
    });
    const topCats = Object.entries(catBreakdown).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 5);

    const rows = monthTx.map(function(tx) {
      const cat = CATEGORIES[tx.category];
      const amtColor = tx.category === "income" ? "#0D7680" : "#FF6B6B";
      const amtPrefix = tx.category === "income" ? "+" : "-";
      return "<tr style='border-bottom:1px solid #eee'>"
        + "<td style='padding:8px 12px;font-size:13px'>" + tx.date + "</td>"
        + "<td style='padding:8px 12px;font-size:13px'>" + (cat ? cat.icon : "") + " " + (tx.subcategory || "") + "</td>"
        + "<td style='padding:8px 12px;font-size:13px;color:" + amtColor + ";font-weight:700'>" + amtPrefix + sym + " " + tx.amount.toFixed(2) + "</td>"
        + "<td style='padding:8px 12px;font-size:13px;color:#888'>" + (tx.note || "") + "</td>"
        + "</tr>";
    }).join("");

    const topCatHtml = topCats.map(function(entry) {
      const cat = entry[0]; const amt = entry[1];
      const info = CATEGORIES[cat];
      return "<div style='background:#f9f9f9;border-radius:10px;padding:10px;text-align:center;border:1px solid #eee'>"
        + "<p style='margin:0 0 4px;font-size:18px'>" + (info ? info.icon : "💸") + "</p>"
        + "<p style='margin:0 0 2px;font-size:11px;font-weight:700'>" + (info ? info.label : cat) + "</p>"
        + "<p style='margin:0;font-size:12px;color:#FF6B6B;font-weight:700'>" + sym + " " + amt.toFixed(2) + "</p>"
        + "</div>";
    }).join("");

    const balColor = balance >= 0 ? "#0D7680" : "#FF6B6B";

    let html = "<!DOCTYPE html><html><head><title>SAVVIE - " + monthName + " " + year + "</title>";
    html += "<style>body{font-family:-apple-system,sans-serif;margin:0;padding:24px;color:#222}";
    html += "h1{color:#0D7680}table{width:100%;border-collapse:collapse}";
    html += "th{background:#0D7680;color:#fff;padding:10px 12px;text-align:left;font-size:13px}";
    html += "@media print{body{padding:0}}</style></head><body>";
    html += "<div style='display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #0D7680'>";
    html += "<div><h1 style='margin:0;font-size:22px'>SAVVIE</h1>";
    html += "<p style='margin:4px 0 0;color:#888;font-size:13px'>Monthly Report - " + monthName + " " + year + "</p></div>";
    html += "<p style='color:#888;font-size:12px'>Generated " + now.toLocaleDateString("en-SG") + "</p></div>";
    html += "<div style='display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px'>";
    html += "<div style='background:#0D768012;border-radius:12px;padding:14px;border:1px solid #0D768033'><p style='margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase'>Income</p><p style='margin:0;font-size:18px;font-weight:800;color:#0D7680'>" + sym + " " + income.toFixed(2) + "</p></div>";
    html += "<div style='background:#FF6B6B12;border-radius:12px;padding:14px;border:1px solid #FF6B6B33'><p style='margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase'>Expenses</p><p style='margin:0;font-size:18px;font-weight:800;color:#FF6B6B'>" + sym + " " + expenses.toFixed(2) + "</p></div>";
    html += "<div style='background:#74B9FF12;border-radius:12px;padding:14px;border:1px solid #74B9FF33'><p style='margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase'>Savings</p><p style='margin:0;font-size:18px;font-weight:800;color:#74B9FF'>" + sym + " " + savings.toFixed(2) + "</p></div>";
    html += "<div style='background:#f5f5f5;border-radius:12px;padding:14px;border:1px solid #ddd'><p style='margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase'>Balance</p><p style='margin:0;font-size:18px;font-weight:800;color:" + balColor + "'>" + sym + " " + balance.toFixed(2) + "</p></div>";
    html += "</div>";
    if (topCats.length > 0) {
      html += "<h3 style='color:#0D7680;margin:0 0 10px;font-size:14px;text-transform:uppercase'>Top Spending</h3>";
      html += "<div style='display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:24px'>" + topCatHtml + "</div>";
    }
    html += "<h3 style='color:#0D7680;margin:0 0 10px;font-size:14px;text-transform:uppercase'>All Transactions (" + monthTx.length + ")</h3>";
    html += "<table><thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Note</th></tr></thead><tbody>" + rows + "</tbody></table>";
    html += "<p style='text-align:center;color:#ccc;font-size:11px;margin-top:32px'>SAVVIE - Track. Plan. Grow. - " + year + "</p>";
    html += "</body></html>";

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(function() { win.print(); }, 500);
    } else {
      setExportMsg("Allow popups to export PDF.");
      setTimeout(function() { setExportMsg(""); }, 4000);
    }
  };

  // Gated export wrappers — show ad for free users
  const exportCSV = () => {
    // If premium, export directly. Otherwise trigger gate via parent
    if (isPremium) { doExportCSV(); return; }
    const gated = onExport && onExport("csv");
    if (!gated) doExportCSV(); // fallback if no gate (shouldn't happen)
  };
  const exportPDF = () => {
    if (isPremium) { doExportPDF(); return; }
    const gated = onExport && onExport("pdf");
    if (!gated) doExportPDF();
  };


  const doExportCSV = () => {
    if (transactions.length === 0) { setExportMsg("No transactions to export."); setTimeout(() => setExportMsg(""), 3000); return; }
    const headers = ["Date","Type","Category","Subcategory","Amount","Payment","Note","Subscription","Credit Card"];
    const rows = transactions.map(tx => [
      tx.date,
      tx.category === "income" ? "income" : "expense",
      tx.category,
      tx.subcategory || "",
      tx.amount.toFixed(2),
      tx.payment || "",
      (tx.note || "").replace(/,/g, ";"),
      tx.isSubscription ? "Yes" : "No",
      tx.isCreditCard ? tx.creditCard || "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    try {
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "SGFinance_" + new Date().toISOString().slice(0,10) + ".csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {}
    // Always show preview as a fallback (especially in sandboxed iframes where download silently fails)
    setCsvPreview(csv);
    setExportMsg("Exported " + transactions.length + " transaction" + (transactions.length > 1 ? "s" : "") + "!");
    setTimeout(() => setExportMsg(""), 4000);
  };

  const currencies = [
    { code:"SGD", symbol:"S$",  label:"Singapore Dollar" },
    { code:"MYR", symbol:"RM",  label:"Malaysian Ringgit" },
    { code:"USD", symbol:"US$", label:"US Dollar" },
    { code:"EUR", symbol:"€",   label:"Euro" },
    { code:"GBP", symbol:"£",   label:"British Pound" },
    { code:"AUD", symbol:"A$",  label:"Australian Dollar" },
    { code:"JPY", symbol:"¥",   label:"Japanese Yen" },
    { code:"CNY", symbol:"¥",   label:"Chinese Yuan" },
    { code:"HKD", symbol:"HK$", label:"Hong Kong Dollar" },
    { code:"IDR", symbol:"Rp",  label:"Indonesian Rupiah" },
  ];

  const languages = [
    { code:"EN", label:"English" },
    { code:"BM", label:"Bahasa Melayu" },
    { code:"ZH", label:"中文" },
    { code:"TA", label:"தமிழ்" },
  ];

  const safeCalc = (expr) => {
    // Tokenize: numbers and operators
    const clean = expr.replace(/x/g, "*").replace(/÷/g, "/");
    const toks = clean.match(/(\d+\.?\d*|\.\d+|[+\-*/])/g);
    if (!toks || toks.length === 0) throw new Error("bad");
    // Two-pass: handle * and / first, then + and -
    let nums = [], ops = [], buf = null;
    for (let t of toks) {
      if (/^[\d.]/.test(t)) { buf = parseFloat(t); }
      else {
        if (buf === null) throw new Error("bad");
        nums.push(buf); ops.push(t); buf = null;
      }
    }
    if (buf === null) throw new Error("bad");
    nums.push(buf);
    // Pass 1: * and /
    let i = 0;
    while (i < ops.length) {
      if (ops[i] === "*" || ops[i] === "/") {
        const res = ops[i] === "*" ? nums[i] * nums[i+1] : nums[i] / nums[i+1];
        nums.splice(i, 2, res);
        ops.splice(i, 1);
      } else { i++; }
    }
    // Pass 2: + and -
    let result = nums[0];
    for (let j = 0; j < ops.length; j++) {
      result = ops[j] === "+" ? result + nums[j+1] : result - nums[j+1];
    }
    if (result === Infinity || result === -Infinity) throw new Error("div0");
    if (!isFinite(result)) throw new Error("bad");
    return result;
  };

  const calcPress = (val) => {
    if (val === "C") { setCalc("0"); setCalcExpr(""); setJustEvaled(false); return; }
    if (val === "⌫") { setCalc(c => c.length > 1 ? c.slice(0,-1) : "0"); return; }
    if (val === "=") {
      try {
        const full = (calcExpr || "") + calc;
        const result = safeCalc(full);
        const rounded = Math.round(result * 1e10) / 1e10;
        setCalc(String(rounded));
        setCalcExpr("");
        setJustEvaled(true);
      } catch(e) { setCalc(e.message === "div0" ? "Div by 0" : "Error"); setCalcExpr(""); }
      return;
    }
    if (val === "%") { setCalc(c => { const n = parseFloat(c); return isNaN(n) ? "0" : String(n / 100); }); return; }
    const isOp = ["+","-","x","÷"].includes(val);
    if (isOp) {
      const op = val;
      setCalcExpr((calcExpr || "") + calc + op);
      setCalc("0");
      setJustEvaled(false);
      return;
    }
    if (justEvaled && !isOp) { setCalc(val === "." ? "0." : val); setJustEvaled(false); return; }
    setCalc(c => {
      if (val === "." && c.includes(".")) return c;
      if (c === "0" && val !== ".") return val;
      return c + val;
    });
  };

  const calcBtns = [
    ["C","⌫","%","÷"],
    ["7","8","9","x"],
    ["4","5","6","-"],
    ["1","2","3","+"],
    ["00","0",".","="],
  ];

  return (
    <div style={styles.screen}>
      <h1 style={{ ...styles.pageTitle, color: th.text }}>{t.settingsTitle}</h1>

      {/* Premium Status / Upgrade Card */}
      {isPremium ? (
        <div style={{ background: "linear-gradient(135deg, #0D7680 0%, #16213E 100%)", borderRadius: 18, padding: 18, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👑</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 2px" }}>
                {premiumExpiry ? "Daily Premium — Active" : "Premium Member"}
              </p>
              <p style={{ color: "#fff", fontSize: 15, fontWeight: 800, margin: "0 0 2px" }}>Thanks for supporting SAVVIE!</p>
              {premiumExpiry && (
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0 }}>
                  Expires: {new Date(premiumExpiry).toLocaleString("en-SG", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
            </div>
          </div>
          {premiumExpiry && (
            <button onClick={() => { haptic("medium"); onWatchAd(); }} style={{ width: "100%", background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 12, padding: "10px 0", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 12 }}>
              🎬 Watch another ad to extend by 1 day
            </button>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => { haptic("medium"); onUpgrade(); }} style={{ width: "100%", background: "linear-gradient(135deg, #F0A500 0%, #E67E00 100%)", border: "none", borderRadius: 18, padding: 18, marginBottom: 10, cursor: "pointer", textAlign: "left", boxShadow: "0 8px 24px #F0A50044" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👑</div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 2px" }}>Upgrade to Premium</p>
                <p style={{ color: "#fff", fontSize: 15, fontWeight: 800, margin: "0 0 2px" }}>Remove ads forever</p>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, margin: 0 }}>From S$14.99 lifetime · Launch special</p>
              </div>
              <span style={{ color: "#fff", fontSize: 22 }}>›</span>
            </div>
          </button>
          <button onClick={() => { haptic("light"); onWatchAd(); }} style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>🎬</span>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: th.text }}>Watch 1 Ad → 1 Day Free</p>
              <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>No skip button · 30 seconds · Once per day</p>
            </div>
          </button>
        </div>
      )}

      {/* Theme */}
      <div style={{...styles.section}}>
        <p style={{...styles.sectionTitle, color: th.textMuted}}>{t.theme}</p>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { val: "dark",   icon: "🌙", label: t.darkMode },
            { val: "light",  icon: "☀️", label: t.lightMode },
            { val: "system", icon: "📱", label: t.systemMode },
          ].map(opt => (
            <button key={opt.val} onClick={() => { haptic("light"); updateSettings({...settings, theme: opt.val}); }}
              style={{
                flex: 1, background: settings.theme === opt.val ? "#0D768022" : th.surface,
                border: "2px solid " + (settings.theme === opt.val ? "#0D7680" : th.border),
                borderRadius: 14, padding: "14px 8px", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}>
              <span style={{ fontSize: 22 }}>{opt.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: settings.theme === opt.val ? "#0D7680" : th.textMuted }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div style={{...styles.section}}>
        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>{t.language}</p>
        <SelectField th={th} value={settings.language} onChange={handleLanguageChange}>
          {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </SelectField>
      </div>

      {/* Currency */}
      <div style={{...styles.section}}>
        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>{t.currency}</p>
        <SelectField th={th} value={settings.currency} onChange={handleCurrencyChange}>
          {currencies.map(c => <option key={c.code} value={c.code}>{c.symbol} — {c.label}</option>)}
        </SelectField>
        <p style={{color:th.textFaint, fontSize:12, marginTop:6}}>Current: {settings.currencySymbol} ({settings.currency})</p>
      </div>

      {/* Convert to */}
      <div style={{...styles.section}}>
        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>Budget Reset Day</p>
        <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "14px 20px", marginBottom: 10 }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: th.textMuted }}>Day of month when your budget period starts</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
            {[1, 5, 10, 15, 20, 25, 28].map(d => (
              <button key={d} onClick={() => { haptic("light"); updateSettings({ ...settings, budgetResetDay: d }); }}
                style={{ background: (settings.budgetResetDay || 1) === d ? "#0D7680" : th.surface2, border: "1px solid " + ((settings.budgetResetDay || 1) === d ? "#0D7680" : th.border), borderRadius: 10, padding: "8px 4px", color: (settings.budgetResetDay || 1) === d ? "#fff" : th.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {d}th
              </button>
            ))}
          </div>
        </div>

        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>Convert Balance To</p>
        <SelectField th={th} value={settings.convertCurrency || "USD"} onChange={handleConvertChange}>
          {currencies.filter(c => c.code !== settings.currency).map(c => <option key={c.code} value={c.code}>{c.symbol} — {c.label}</option>)}
        </SelectField>
        <p style={{color:th.textFaint, fontSize:12, marginTop:6}}>Tap the currency pill on the balance card to toggle</p>
      </div>

      {/* Calculator */}
      <div style={{...styles.section}}>
        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>{t.calculator}</p>
        {/* Toggle button row */}
        <button
          onClick={() => { haptic("light"); setCalcOpen(o => !o); }}
          style={{
            width: "100%", background: th.surface, border: "1px solid " + th.border,
            borderRadius: 14, padding: "16px 20px", display: "flex",
            alignItems: "center", justifyContent: "space-between",
            cursor: "pointer", color: "#fff", marginBottom: calcOpen ? 10 : 0,
            transition: "all 0.2s",
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>🧮</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{t.calculator}</span>
          </div>
          <span style={{ color: "#0D7680", fontSize: 18, fontWeight: 700, transform: calcOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>⌄</span>
        </button>

        {/* Calculator panel — shown when open */}
        {calcOpen && (
          <div style={{background: th.surface, borderRadius:16, padding:16, border:"1px solid " + th.border}}>
            {/* Display */}
            <div style={{textAlign:"right", padding:"8px 4px 16px", borderBottom:"1px solid " + th.border, marginBottom:12}}>
              <p style={{color:th.textFaint, fontSize:13, margin:"0 0 4px", minHeight:18}}>{calcExpr}</p>
              <p style={{color:th.text, fontSize:36, fontWeight:800, margin:0, letterSpacing:-1}}>{calc}</p>
            </div>
            {/* Buttons */}
            {calcBtns.map((row, ri) => (
              <div key={ri} style={{display:"grid", gridTemplateColumns: ri===4 ? "2fr 1fr 1fr" : "1fr 1fr 1fr 1fr", gap:8, marginBottom:8}}>
                {(ri===4 ? ["0",".","="] : row).map((btn,bi) => {
                  const isOp   = ["+","-","x","÷","=","C","⌫","%"].includes(btn);
                  const isClear= false;
                  return (
                    <button key={bi} onClick={() => { haptic("light"); calcPress(btn); }}
                      style={{
                        background: isOp ? "#0D7680" : th.calcNum,
                        border:"none", borderRadius:12, color: isOp ? "#fff" : th.text,
                        fontSize: btn==="0" ? 18 : 20, fontWeight:700, padding:"18px 0",
                        cursor:"pointer", transition:"background 0.1s",
                      }}>
                      {btn}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── RECURRING TRANSACTIONS ── */}
      <div style={{...styles.section}}>
        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>Recurring Transactions</p>
        <RecurringPanel recurringTx={recurringTx} onAdd={onAddRecurring} onDelete={onDeleteRecurring} th={th} styles={styles} settings={settings} />
      </div>

      {/* PIN Security */}
      <div style={{...styles.section}}>
        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>Security</p>

        {/* Biometric row — only shown if device supports it */}
        {bioSupported && (
          <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "16px 20px", marginBottom: 10 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:"#A29BFE22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>👆</div>
                <div>
                  <p style={{ margin:0, fontSize:15, fontWeight:700, color:th.text }}>Fingerprint / Face ID</p>
                  <p style={{ margin:0, fontSize:12, color: biometricEnabled ? "#0D7680" : th.textMuted }}>{biometricEnabled ? "Enabled" : "Disabled"}</p>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {biometricEnabled ? (
                  <button onClick={async () => {
                    localStorage.removeItem("savvie_bio_cred");
                    localStorage.removeItem("savvie_bio_enabled");
                    setBiometricEnabled(false);
                    haptic("light");
                  }} style={{ background:"#FF6B6B22", border:"1px solid #FF6B6B44", borderRadius:10, padding:"6px 12px", color:"#FF6B6B", fontSize:12, fontWeight:600, cursor:"pointer" }}>Remove</button>
                ) : (
                  <button onClick={async () => {
                    if (!pinEnabled) { alert("Please set up a PIN first."); return; }
                    try {
                      const challenge = new Uint8Array(32);
                      crypto.getRandomValues(challenge);
                      const userId = new Uint8Array(16);
                      crypto.getRandomValues(userId);
                      const cred = await navigator.credentials.create({
                        publicKey: {
                          challenge,
                          rp: { name: "Savvie", id: window.location.hostname || "localhost" },
                          user: { id: userId, name: "savvie_user", displayName: "Savvie User" },
                          pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
                          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                          timeout: 30000,
                        }
                      });
                      const credId = btoa(String.fromCharCode(...new Uint8Array(cred.rawId)));
                      localStorage.setItem("savvie_bio_cred", credId);
                      localStorage.setItem("savvie_bio_enabled", "1");
                      setBiometricEnabled(true);
                      haptic("success");
                    } catch(e) {
                      alert("Biometric setup failed: " + (e.message || "Unknown error"));
                    }
                  }} style={{ background:"#0D768022", border:"1px solid #0D768044", borderRadius:10, padding:"6px 12px", color:"#0D7680", fontSize:12, fontWeight:600, cursor:"pointer" }}>Enable</button>
                )}
              </div>
            </div>
          </div>
        )}

        {pinEnabled && (
          <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "14px 20px", marginBottom: 10 }}>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: th.text }}>Auto-Lock</p>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: th.textMuted }}>Lock app after being backgrounded</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {[{ val: 0, label: "Instantly" }, { val: 1, label: "1 min" }, { val: 5, label: "5 min" }, { val: 15, label: "15 min" }].map(opt => (
                <button key={opt.val} onClick={() => { haptic("light"); updateSettings({ ...settings, lockAfter: opt.val }); }}
                  style={{ background: (settings.lockAfter ?? 0) === opt.val ? "#0D7680" : th.surface2, border: "1px solid " + ((settings.lockAfter ?? 0) === opt.val ? "#0D7680" : th.border), borderRadius: 10, padding: "8px 4px", color: (settings.lockAfter ?? 0) === opt.val ? "#fff" : th.textMuted, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "16px 20px", marginBottom: pinSetup ? 12 : 0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"#0D768022", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🔒</div>
              <div>
                <p style={{ margin:0, fontSize:15, fontWeight:700, color:th.text }}>PIN Lock</p>
                <p style={{ margin:0, fontSize:12, color: pinEnabled ? "#0D7680" : th.textMuted }}>{pinEnabled ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {pinEnabled && <button onClick={() => { haptic("light"); onSavePin(""); setPinMsg("PIN removed."); setTimeout(()=>setPinMsg(""),3000); }} style={{ background:"#FF6B6B22", border:"1px solid #FF6B6B44", borderRadius:10, padding:"6px 12px", color:"#FF6B6B", fontSize:12, fontWeight:600, cursor:"pointer" }}>Remove</button>}
              <button onClick={() => { haptic("light"); setPinSetup("new"); setPinInput(""); setPinFirst(""); setPinMsg("Enter a new 4-digit PIN"); }} style={{ background:"#0D768022", border:"1px solid #0D768044", borderRadius:10, padding:"6px 12px", color:"#0D7680", fontSize:12, fontWeight:600, cursor:"pointer" }}>{pinEnabled ? "Change" : "Set PIN"}</button>
            </div>
          </div>
        </div>

        {/* PIN Keypad */}
        {pinSetup && (
          <div style={{ background: th.surface, border:"1px solid " + th.border, borderRadius:14, padding:16 }}>
            <p style={{ color:th.textMuted, fontSize:13, textAlign:"center", margin:"0 0 16px" }}>{pinMsg}</p>
            <div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:20 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:16, height:16, borderRadius:"50%", background: i < pinInput.length ? "#0D7680" : "transparent", border:"2px solid " + (i < pinInput.length ? "#0D7680" : th.border), transition:"all 0.15s" }} />
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((btn, i) => (
                <button key={i} onClick={() => { haptic("light"); if (btn === "⌫") pinDel(); else if (btn) pinPress(btn); }}
                  style={{ height:56, background: btn === "" ? "transparent" : btn === "⌫" ? th.surface2 : th.surface2, border: btn === "" ? "none" : "1px solid " + th.border, borderRadius:12, fontSize:20, fontWeight:700, color: btn === "⌫" ? th.textMuted : th.textMuted, cursor: btn ? "pointer" : "default" }}>
                  {btn}
                </button>
              ))}
            </div>
            <button onClick={() => { haptic("light"); setPinSetup(null); setPinInput(""); }} style={{ width:"100%", background:"transparent", border:"none", color:th.textMuted, fontSize:13, marginTop:12, cursor:"pointer" }}>Cancel</button>
          </div>
        )}
        {pinMsg && !pinSetup && <p style={{ color:"#0D7680", fontSize:13, fontWeight:600, marginTop:8, textAlign:"center" }}>{pinMsg}</p>}
      </div>

      {/* Recurring Transactions */}
      <div style={{...styles.section}}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p style={{ ...styles.sectionTitle, color: th.textMuted, margin: 0 }}>🔁 Recurring Transactions</p>
          <button onClick={() => setShowRecurringForm(f => !f)}
            style={{ background: showRecurringForm ? "#FF6B6B" : "#0D7680", border: "none", borderRadius: "50%", width: 40, height: 40, color: "#fff", fontSize: showRecurringForm ? 18 : 22, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px " + (showRecurringForm ? "#FF6B6B44" : "#0D768044") }}>
            {showRecurringForm ? "✕" : "+"}
          </button>
        </div>

        {/* Add form */}
        {showRecurringForm && (
          <div style={{ background: th.surface, borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid " + th.border }}>
            <p style={{ margin: "0 0 12px", fontWeight: 700, fontSize: 14, color: th.text }}>New Recurring Transaction</p>
            {/* Type toggle */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["expense","income"].map(tp => (
                <button key={tp} onClick={() => setRecType(tp)}
                  style={{ flex: 1, background: recType === tp ? "#0D7680" : th.surface2, border: "1px solid " + (recType === tp ? "#0D7680" : th.border), borderRadius: 10, padding: "8px 0", color: recType === tp ? "#fff" : th.textMuted, fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>
                  {tp === "expense" ? "💸 Expense" : "💰 Income"}
                </button>
              ))}
            </div>
            {/* Name */}
            <input value={recName} onChange={e => setRecName(e.target.value)} placeholder="e.g. Netflix, Salary, Rent"
              style={{ width: "100%", boxSizing: "border-box", background: th.inputBg, border: "1px solid " + th.border, borderRadius: 10, padding: "10px 12px", color: th.text, fontSize: 14, marginBottom: 10 }} />
            {/* Amount */}
            <div style={{ display: "flex", alignItems: "center", background: th.inputBg, border: "1px solid " + th.border, borderRadius: 10, padding: "0 12px", marginBottom: 10, height: 44 }}>
              <span style={{ color: "#0D7680", fontWeight: 700, marginRight: 6, flexShrink: 0 }}>{sym}</span>
              <input type="number" value={recAmount} onChange={e => setRecAmount(e.target.value)} placeholder="0.00" min="0"
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#0D7680", fontSize: 15, fontWeight: 700 }} />
            </div>
            {/* Frequency */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
              {[["daily","Daily"],["weekly","Weekly"],["monthly","Monthly"],["quarterly","Quarterly"],["yearly","Yearly"]].map(([val,label]) => (
                <button key={val} onClick={() => setRecFreq(val)}
                  style={{ background: recFreq === val ? "#0D7680" : th.surface2, border: "1px solid " + (recFreq === val ? "#0D7680" : th.border), borderRadius: 10, padding: "7px 4px", color: recFreq === val ? "#fff" : th.textMuted, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>
            {/* Day of month for monthly/quarterly/yearly */}
            {(recFreq === "monthly" || recFreq === "quarterly" || recFreq === "yearly") && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <p style={{ margin: 0, fontSize: 13, color: th.textMuted, flexShrink: 0 }}>On day</p>
                <input type="number" value={recDay} onChange={e => setRecDay(e.target.value)} min="1" max="28"
                  style={{ width: 70, background: th.inputBg, border: "1px solid " + th.border, borderRadius: 10, padding: "8px 12px", color: th.text, fontSize: 14 }} />
                <p style={{ margin: 0, fontSize: 12, color: th.textFaint }}>of the month (1–28)</p>
              </div>
            )}
            {/* Save button */}
            <button onClick={() => {
              if (!recName.trim() || !recAmount || parseFloat(recAmount) <= 0) return;
              const today = new Date();
              const day = Math.min(parseInt(recDay) || 1, 28);
              let next = new Date(today.getFullYear(), today.getMonth(), day);
              if (next <= today) {
                if (recFreq === "daily") next = new Date(today.getTime() + 86400000);
                else if (recFreq === "weekly") next.setDate(next.getDate() + 7);
                else if (recFreq === "monthly") next.setMonth(next.getMonth() + 1);
                else if (recFreq === "quarterly") next.setMonth(next.getMonth() + 3);
                else if (recFreq === "yearly") next.setFullYear(next.getFullYear() + 1);
              }
              const nextDate = next.toISOString().slice(0, 10);
              onAddRecurring && onAddRecurring({ name: recName.trim(), amount: parseFloat(recAmount), category: recCategory, type: recType, freq: recFreq, day, nextDate });
              haptic("success");
              setRecName(""); setRecAmount(""); setRecFreq("monthly"); setRecDay("1"); setRecType("expense");
              setShowRecurringForm(false);
            }} style={{ width: "100%", background: "#0D7680", border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
              Save Recurring
            </button>
          </div>
        )}

        {/* List */}
        {recurringTx.length === 0 && !showRecurringForm && (
          <div style={{ background: th.surface, borderRadius: 14, padding: "20px 16px", textAlign: "center", border: "1px solid " + th.border }}>
            <p style={{ fontSize: 28, margin: "0 0 8px" }}>🔁</p>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: th.text }}>No recurring transactions</p>
            <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>Add salary, rent, subscriptions and they post automatically.</p>
          </div>
        )}
        {recurringTx.map(rec => (
          <div key={rec.id} style={{ background: th.surface, borderRadius: 14, padding: "12px 16px", marginBottom: 8, border: "1px solid " + th.border, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: rec.type === "income" ? "#00B89422" : "#FF6B6B22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
              {rec.type === "income" ? "💰" : "💸"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: th.text }}>{rec.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>{sym} {parseFloat(rec.amount).toFixed(2)} · {rec.freq} · next {rec.nextDate}</p>
            </div>
            <button onClick={() => { haptic("light"); onDeleteRecurring && onDeleteRecurring(rec.id); }}
              style={{ background: "#FF6B6B22", border: "1px solid #FF6B6B44", borderRadius: 8, padding: "6px 10px", color: "#FF6B6B", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Export Data */}
      <div style={{...styles.section}}>
        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>{t.exportData || "Export Data"}</p>
        <button onClick={() => { haptic("medium"); exportCSV(); }} style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#0D768022", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📤</div>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: th.text }}>Export to CSV</p>
              <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>{transactions.length} transaction{transactions.length !== 1 ? "s" : ""} · opens in Sheets / Excel</p>
            </div>
          </div>
          <span style={{ color: "#0D7680", fontSize: 18 }}>↓</span>
        </button>
        <button onClick={() => { haptic("medium"); exportPDF(); }} style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#FF6B6B22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📄</div>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: th.text }}>Export to PDF</p>
              <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>Monthly report · print or save as PDF</p>
            </div>
          </div>
          <span style={{ color: "#FF6B6B", fontSize: 18 }}>↓</span>
        </button>
        {exportMsg ? (
          <p style={{ color: "#0D7680", fontSize: 13, fontWeight: 600, marginTop: 8, textAlign: "center" }}>{exportMsg}</p>
        ) : null}

        {/* WhatsApp share */}
        <button onClick={shareWhatsApp} style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#25D36622", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📲</div>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: th.text }}>Share via WhatsApp</p>
              <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>Send this month summary to family</p>
            </div>
          </div>
          <span style={{ color: "#25D366", fontSize: 18 }}>→</span>
        </button>
      </div>

      {/* Import from Bank */}
      <div style={{...styles.section}}>
        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>Import from Bank</p>
        <div style={{ background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <p style={{ margin: 0, fontSize: 13, color: th.text, fontWeight: 800 }}>Smart Auto-Categorisation</p>
          </div>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: th.textMuted, lineHeight: 1.5 }}>
            Tap your bank to see how to download your CSV, then upload it here.
          </p>

          {/* Bank selector grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
            {[
              { id: "DBS", label: "DBS/POSB", color: "#E4002B", emoji: "🏦" },
              { id: "OCBC", label: "OCBC", color: "#E4261C", emoji: "🏦" },
              { id: "UOB", label: "UOB", color: "#005BAC", emoji: "🏦" },
              { id: "SC", label: "Stan Chart", color: "#0072AA", emoji: "🏦" },
              { id: "Citi", label: "Citibank", color: "#003B8E", emoji: "🏦" },
              { id: "HSBC", label: "HSBC", color: "#DB0011", emoji: "🏦" },
            ].map(bank => (
              <button key={bank.id} onClick={() => { haptic("light"); setSelectedBank(bank.id); setGuideStep(0); setShowBankGuide(true); }}
                style={{ background: th.surface2, border: "1px solid " + th.border, borderRadius: 12, padding: "10px 4px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: bank.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏦</div>
                <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: th.text, textAlign: "center" }}>{bank.label}</p>
              </button>
            ))}
          </div>

          <button onClick={() => { haptic("light"); bankFileRef.current && bankFileRef.current.click(); }}
            style={{ width: "100%", background: "#0D7680", border: "none", borderRadius: 12, padding: "14px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxSizing: "border-box" }}>
            <span>📂</span> Upload CSV File
          </button>
          <input ref={bankFileRef} type="file" accept=".csv,.txt" onChange={handleBankImport} style={{ display: "none" }} />
          {importMsg && <p style={{ color: "#0D7680", fontSize: 12, fontWeight: 600, marginTop: 8, textAlign: "center" }}>{importMsg}</p>}
        </div>
      </div>

      {/* Backup and Restore */}
      <div style={{...styles.section}}>
        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>Backup and Restore</p>
        <button onClick={handleBackup} style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#0D768022", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💾</div>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: th.text }}>Backup Data</p>
              <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>Download a JSON backup of all your data</p>
            </div>
          </div>
          <span style={{ color: "#0D7680", fontSize: 18 }}>↓</span>
        </button>
        <button onClick={() => { haptic("light"); restoreFileRef.current && restoreFileRef.current.click(); }} style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#74B9FF22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>📥</div>
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: th.text }}>Restore Data</p>
              <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>Upload a backup JSON file</p>
            </div>
          </div>
          <span style={{ color: "#74B9FF", fontSize: 18 }}>↑</span>
        </button>
        <input ref={restoreFileRef} type="file" accept=".json" onChange={handleRestore} style={{ display: "none" }} />
      </div>

      {/* About */}
      <div style={{...styles.section}}>
        <p style={{ ...styles.sectionTitle, color: th.textMuted }}>About</p>
        <button onClick={() => { haptic("light"); setShowAbout(true); }} style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="data:image/png;base64,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" alt="Savvie" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover" }} />
            <div style={{ textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: th.text }}>SAVVIE</p>
              <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>Version 1.0.0 · Made in Singapore</p>
            </div>
          </div>
          <span style={{ color: th.textMuted, fontSize: 14 }}>›</span>
        </button>
        <button onClick={() => { haptic("light"); setShowPrivacy(true); }} style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>🔐</span>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: th.text }}>Privacy Policy</p>
          </div>
          <span style={{ color: th.textMuted, fontSize: 14 }}>›</span>
        </button>
        <button onClick={() => { haptic("light"); setShowTerms(true); }} style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>📄</span>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: th.text }}>Terms of Service</p>
          </div>
          <span style={{ color: th.textMuted, fontSize: 14 }}>›</span>
        </button>
        <button onClick={() => { haptic("light"); setShowChangelog(true); }} style={{ width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 14, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>🆕</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: th.text }}>{"What's New"}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#0D7680" }}>Version 1.0.0</p>
            </div>
          </div>
          <span style={{ color: th.textMuted, fontSize: 14 }}>›</span>
        </button>
      </div>

      {/* CSV Preview modal (fallback for sandboxed environments) */}
      {csvPreview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setCsvPreview(""); }}>
          <div style={{ background: th.surface, borderRadius: 16, padding: 16, maxWidth: 600, width: "100%", maxHeight: "80vh", display: "flex", flexDirection: "column", border: "1px solid " + th.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 16, color: th.text }}>📤 CSV Export</p>
              <button onClick={() => setCsvPreview("")} style={{ background: th.surface2, border: "none", borderRadius: "50%", width: 30, height: 30, color: th.textMuted, cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: th.textMuted }}>If the file did not download, copy the text below and paste it into a .csv file.</p>
            <textarea readOnly value={csvPreview} style={{ flex: 1, background: th.surface2, border: "1px solid " + th.border, borderRadius: 10, padding: 10, fontSize: 11, color: th.text, fontFamily: "monospace", resize: "none", minHeight: 200, boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={() => { navigator.clipboard?.writeText(csvPreview); haptic("medium"); setExportMsg("Copied to clipboard!"); setTimeout(() => setExportMsg(""), 2000); }}
                style={{ flex: 1, background: "#0D7680", border: "none", borderRadius: 10, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>📋 Copy CSV</button>
              <button onClick={() => setCsvPreview("")}
                style={{ flex: 1, background: "transparent", border: "1px solid " + th.border, borderRadius: 10, padding: "12px 0", color: th.text, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* About Modal */}
      {showAbout && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAbout(false); }}>
          <div style={{ background: th.surface, borderRadius: 18, padding: 24, maxWidth: 360, width: "100%", border: "1px solid " + th.border, textAlign: "center" }}>
            <img src="data:image/png;base64,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" alt="Savvie" style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover", margin: "0 auto 14px", boxShadow: "0 8px 24px #0D768044" }} />
            <p style={{ fontSize: 22, fontWeight: 800, color: th.text, margin: "0 0 4px" }}>SAVVIE</p>
            <p style={{ fontSize: 13, color: "#0D7680", fontWeight: 600, margin: "0 0 16px" }}>Track. Plan. Grow.</p>
            <p style={{ fontSize: 12, color: th.textMuted, margin: "0 0 4px" }}>Version 1.0.0</p>
            <p style={{ fontSize: 12, color: th.textMuted, margin: "0 0 4px" }}>Built with care in Singapore 🇸🇬</p>
            <p style={{ fontSize: 11, color: th.textFaint, margin: "16px 0 16px" }}>A simple, beautiful personal finance tracker designed for Singaporeans. Your data stays on your device.</p>
            <button onClick={() => { haptic("light"); setShowAbout(false); }} style={{ width: "100%", background: "#0D7680", border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      {showPrivacy && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPrivacy(false); }}>
          <div style={{ background: th.surface, borderRadius: 18, padding: 20, maxWidth: 420, width: "100%", maxHeight: "80vh", overflowY: "auto", border: "1px solid " + th.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: th.text, margin: 0 }}>🔐 Privacy Policy</p>
              <button onClick={() => setShowPrivacy(false)} style={{ background: th.surface2, border: "none", borderRadius: "50%", width: 30, height: 30, color: th.textMuted, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: th.text, lineHeight: 1.6 }}>
              <p style={{ margin: "0 0 12px", fontWeight: 700 }}>Your data, your device.</p>
              <p style={{ margin: "0 0 12px" }}>SAVVIE stores all your financial data locally on your device only. We do not collect, transmit, or store any of your personal or financial information on external servers.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>What we store</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>Transactions, budgets, savings goals, and preferences — all kept in your phone storage.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>What we do not collect</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>No analytics. No tracking. No advertising IDs. No personal information ever leaves your device.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>Currency rates</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>The currency converter fetches rates from frankfurter.app (European Central Bank). Only the base currency is sent in the request.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>Advertising</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>Free users see ads powered by Google AdMob. AdMob may collect device identifiers and usage data to serve relevant ads. This is governed by Google's privacy policy. Premium users see no ads.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>Premium Subscriptions</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>Premium is available as a monthly, yearly, or lifetime purchase via Google Play or the App Store. A free 24-hour trial is available by watching a rewarded ad — this does not stack and cannot be combined with paid subscriptions.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>Refund Policy</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>Monthly and yearly subscriptions can be cancelled anytime via Google Play. Lifetime purchases are strictly non-refundable. No exceptions.</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>Uninstalling the app removes all your data. There is nothing for us to delete on our end.</p>
              <p style={{ margin: "16px 0 0", fontSize: 11, color: th.textFaint, textAlign: "center" }}>Last updated: May 2026</p>
            </div>
            <button onClick={() => { haptic("light"); setShowPrivacy(false); }} style={{ width: "100%", background: "#0D7680", border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}

      {/* ── CHANGELOG MODAL ── */}
      {showChangelog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowChangelog(false); }}>
          <div style={{ background: th.surface, borderRadius: 18, padding: 20, maxWidth: 420, width: "100%", maxHeight: "80vh", overflowY: "auto", border: "1px solid " + th.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: th.text, margin: 0 }}>{"🆕 What's New"}</p>
              <button onClick={() => setShowChangelog(false)} style={{ background: th.surface2, border: "none", borderRadius: "50%", width: 30, height: 30, color: th.textMuted, cursor: "pointer" }}>✕</button>
            </div>
            {[
              { version: "1.0.0", date: "May 2026", label: "🎉 Initial Release", items: [
                "Home dashboard with balance, income, expenses and savings",
                "Transaction tracking with 15+ categories",
                "Monthly budget planner with spending limits",
                "Wealth tab — savings goals and investment tracking",
                "CPF tracker with 2026 contribution rates",
                "FX converter with 30+ currencies and live rates",
                "Full stats with charts and spending breakdown",
                "Export to CSV and PDF",
                "PIN lock and fingerprint / Face ID support",
                "4 languages: English, Malay, Chinese, Tamil",
                "Dark mode, light mode and system theme",
                "Ghost subscription detector",
                "Budget reset day customisation",
                "Foreign currency per transaction",
                "Backup and restore",
                "Premium subscription with ad-free experience",
              ]}
            ].map((release, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ background: "#0D7680", borderRadius: 8, padding: "4px 10px" }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff" }}>v{release.version}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: th.textMuted }}>{release.date}</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: th.text }}>{release.label}</p>
                </div>
                {release.items.map((item, j) => (
                  <div key={j} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: "#0D7680", flexShrink: 0, fontWeight: 700 }}>•</span>
                    <p style={{ margin: 0, fontSize: 13, color: th.textMuted, lineHeight: 1.5 }}>{item}</p>
                  </div>
                ))}
              </div>
            ))}
            <button onClick={() => { haptic("light"); setShowChangelog(false); }} style={{ width: "100%", background: "#0D7680", border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>Close</button>
          </div>
        </div>
      )}

      {/* ── TERMS OF SERVICE MODAL ── */}
      {showTerms && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowTerms(false); }}>
          <div style={{ background: th.surface, borderRadius: 18, padding: 20, maxWidth: 420, width: "100%", maxHeight: "80vh", overflowY: "auto", border: "1px solid " + th.border }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: th.text, margin: 0 }}>📄 Terms of Service</p>
              <button onClick={() => setShowTerms(false)} style={{ background: th.surface2, border: "none", borderRadius: "50%", width: 30, height: 30, color: th.textMuted, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: th.text, lineHeight: 1.7 }}>
              <p style={{ margin: "0 0 12px", fontWeight: 700 }}>1. Acceptance</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>By downloading or using SAVVIE, you agree to these Terms of Service. If you do not agree, do not use the app.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>2. Use of App</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>SAVVIE is a personal finance tracking tool for informational purposes only. It is not a licensed financial advisor. Do not rely on it for investment, tax, or legal decisions.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>3. Data & Privacy</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>All financial data you enter is stored locally on your device. We do not collect, transmit, or have access to your personal financial information. See our Privacy Policy for full details.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>4. Premium & Subscriptions</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>Premium features are available via paid subscription or one-time lifetime purchase through Google Play or the App Store. Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date. Lifetime purchases are non-refundable.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>5. Free Ad-Supported Tier</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>Free users will see advertisements served by Google AdMob. A 24-hour Premium trial can be earned by watching a rewarded ad once per day. This cannot be stacked or combined with paid plans.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>6. Disclaimer</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>SAVVIE is provided "as is" without warranties of any kind. We are not responsible for any financial decisions made based on information displayed in the app. Currency rates are indicative only.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>7. Changes to Terms</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.</p>
              <p style={{ margin: "12px 0 6px", fontWeight: 700, color: "#0D7680" }}>8. Contact</p>
              <p style={{ margin: "0 0 12px", color: th.textMuted }}>For questions or concerns, contact us through the app store listing.</p>
              <p style={{ margin: "16px 0 0", fontSize: 11, color: th.textFaint, textAlign: "center" }}>Last updated: May 2026 · SAVVIE · Singapore</p>
            </div>
            <button onClick={() => { haptic("light"); setShowTerms(false); }} style={{ width: "100%", background: "#0D7680", border: "none", borderRadius: 12, padding: "12px 0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>Close</button>
          </div>
        </div>
      )}

      {/* Bank Guide Modal */}
      {showBankGuide && selectedBank && (() => {
        const GUIDES = {
          DBS: {
            name: "DBS/POSB", color: "#E4002B",
            steps: [
              { icon: "🌐", title: "Open DBS iBanking", desc: "Go to internet banking via browser — digibank.dbs.com. The CSV export is not available on mobile app." },
              { icon: "🏦", title: "Select Your Account", desc: "Click on your Savings or Current account from the Accounts overview page." },
              { icon: "📋", title: "View Transactions", desc: "Click 'View more transactions' to see your full transaction history." },
              { icon: "📅", title: "Set Date Range", desc: "Select your desired date range — up to 12 months of history available." },
              { icon: "⬇️", title: "Download CSV", desc: "Click the Download icon and select CSV format. The file will save to your Downloads folder." },
              { icon: "📂", title: "Upload to SAVVIE", desc: "Come back here, tap Upload CSV File and select the downloaded file. Done!" },
            ]
          },
          OCBC: {
            name: "OCBC", color: "#E4261C",
            steps: [
              { icon: "🌐", title: "Open OCBC Online Banking", desc: "Go to internet.ocbc.com on your browser. CSV export is web-only, not available on mobile app." },
              { icon: "🏦", title: "Go to Accounts", desc: "Click on Accounts in the top menu, then select your account." },
              { icon: "📋", title: "View Account Details", desc: "Click on your account name to see the full transaction listing." },
              { icon: "📅", title: "Select Period", desc: "Use the date filter to select your desired transaction period." },
              { icon: "⬇️", title: "Download CSV", desc: "Click the Download button and choose CSV or Excel. If Excel, open it and save as CSV before uploading." },
              { icon: "📂", title: "Upload to SAVVIE", desc: "Come back here, tap Upload CSV File and select the downloaded file. Done!" },
            ]
          },
          UOB: {
            name: "UOB", color: "#005BAC",
            steps: [
              { icon: "🌐", title: "Open UOB Internet Banking", desc: "Go to uob.com.sg and log in to Personal Internet Banking. Not available on mobile app." },
              { icon: "🏦", title: "Go to My Accounts", desc: "Click on My Accounts in the navigation menu." },
              { icon: "📋", title: "Select Account History", desc: "Click on Account Details or Account History for your account." },
              { icon: "📅", title: "Set Date Range", desc: "Select your desired date range — up to 12 months available." },
              { icon: "⬇️", title: "Download CSV", desc: "Click Download Account History and select CSV format." },
              { icon: "📂", title: "Upload to SAVVIE", desc: "Come back here, tap Upload CSV File and select the downloaded file. Done!" },
            ]
          },
          SC: {
            name: "Standard Chartered", color: "#0072AA",
            steps: [
              { icon: "🌐", title: "Open SC Online Banking", desc: "Go to sc.com/sg and log in to Online Banking on your browser." },
              { icon: "🏦", title: "Go to Accounts", desc: "Click on Accounts from the main menu." },
              { icon: "📋", title: "View Transactions", desc: "Select your account and click on Transaction History." },
              { icon: "📅", title: "Set Date Range", desc: "Filter by date — up to 6 months per download." },
              { icon: "⬇️", title: "Export CSV", desc: "Click the Export button and choose CSV format." },
              { icon: "📂", title: "Upload to SAVVIE", desc: "Come back here, tap Upload CSV File and select the downloaded file. Done!" },
            ]
          },
          Citi: {
            name: "Citibank", color: "#003B8E",
            steps: [
              { icon: "🌐", title: "Open Citi Online", desc: "Go to online.citibank.com.sg and log in. Use browser, not app." },
              { icon: "🏦", title: "Go to Account Summary", desc: "Click on Account Summary from the main dashboard." },
              { icon: "📋", title: "Select Account", desc: "Click on your savings or credit card account." },
              { icon: "📅", title: "Set Date Range", desc: "Set your desired date range for transactions." },
              { icon: "⬇️", title: "Download CSV", desc: "Click Download and select CSV format." },
              { icon: "📂", title: "Upload to SAVVIE", desc: "Come back here, tap Upload CSV File and select the downloaded file. Done!" },
            ]
          },
          HSBC: {
            name: "HSBC", color: "#DB0011",
            steps: [
              { icon: "🌐", title: "Open HSBC Online Banking", desc: "Go to hsbc.com.sg and log in to Personal Internet Banking." },
              { icon: "🏦", title: "Go to Accounts", desc: "Click on My Banking then Accounts from the top menu." },
              { icon: "📋", title: "View Statement", desc: "Select your account and click on View Statements or Transactions." },
              { icon: "📅", title: "Set Date Range", desc: "Choose your date range — up to 12 months available." },
              { icon: "⬇️", title: "Download CSV", desc: "Click Download and select CSV or Spreadsheet format." },
              { icon: "📂", title: "Upload to SAVVIE", desc: "Come back here, tap Upload CSV File and select the downloaded file. Done!" },
            ]
          },
        };
        const guide = GUIDES[selectedBank];
        const steps = guide.steps;
        const step = steps[guideStep];
        const isLast = guideStep === steps.length - 1;
        return (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={(e) => { if (e.target === e.currentTarget) { setShowBankGuide(false); setGuideStep(0); } }}>
            <div style={{ background: th.surface, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, border: "1px solid " + th.border }}>
              {/* Header */}
              <div style={{ background: guide.color, borderRadius: "24px 24px 0 0", padding: "20px 20px 24px", position: "relative" }}>
                <button onClick={() => { haptic("light"); setShowBankGuide(false); setGuideStep(0); }}
                  style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 30, height: 30, color: "#fff", cursor: "pointer", fontSize: 14 }}>✕</button>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 4px" }}>How to download CSV</p>
                <p style={{ color: "#fff", fontSize: 20, fontWeight: 800, margin: "0 0 14px" }}>{guide.name}</p>
                {/* Step dots */}
                <div style={{ display: "flex", gap: 6 }}>
                  {steps.map((_, i) => (
                    <div key={i} onClick={() => { haptic("light"); setGuideStep(i); }}
                      style={{ height: 4, flex: 1, borderRadius: 99, background: i <= guideStep ? "#fff" : "rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.3s" }} />
                  ))}
                </div>
              </div>

              {/* Step content */}
              <div style={{ padding: "24px 20px 32px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: guide.color + "18", border: "2px solid " + guide.color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
                    {step.icon}
                  </div>
                  <div>
                    <p style={{ margin: "0 0 6px", fontSize: 11, color: th.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>Step {guideStep + 1} of {steps.length}</p>
                    <p style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: th.text }}>{step.title}</p>
                    <p style={{ margin: 0, fontSize: 13, color: th.textMuted, lineHeight: 1.6 }}>{step.desc}</p>
                  </div>
                </div>

                {/* Navigation */}
                <div style={{ display: "flex", gap: 10 }}>
                  {guideStep > 0 && (
                    <button onClick={() => { haptic("light"); setGuideStep(g => g - 1); }}
                      style={{ flex: 1, background: th.surface2, border: "1px solid " + th.border, borderRadius: 14, padding: "14px 0", color: th.text, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                      ← Back
                    </button>
                  )}
                  <button onClick={() => {
                    haptic("medium");
                    if (isLast) { setShowBankGuide(false); setGuideStep(0); bankFileRef.current && bankFileRef.current.click(); }
                    else setGuideStep(g => g + 1);
                  }} style={{ flex: 2, background: isLast ? "#0D7680" : guide.color, border: "none", borderRadius: 14, padding: "14px 0", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
                    {isLast ? "📂 Upload CSV Now" : "Next →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bank Import Preview Modal */}
      {showImport && importPreview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 350, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowImport(false); }}>
          <div style={{ background: th.surface, borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 500, maxHeight: "80vh", overflowY: "auto", border: "1px solid " + th.border }}>
            <div style={{ width: 40, height: 4, background: th.border, borderRadius: 99, margin: "12px auto 0" }} />
            <div style={{ padding: "16px 20px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p style={{ fontWeight: 800, fontSize: 17, margin: 0, color: th.text }}>📂 Import Preview</p>
              <button onClick={() => setShowImport(false)} style={{ background: th.surface2, border: "none", borderRadius: "50%", width: 30, height: 30, color: th.textMuted, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "8px 20px 32px" }}>
              {/* Bank detected */}
              <div style={{ background: "#0D768012", border: "1px solid #0D768033", borderRadius: 12, padding: "10px 14px", marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#0D7680", fontWeight: 700 }}>
                  ✓ Detected: {importPreview.bank} · {importPreview.count} transactions found
                </p>
              </div>

              {/* Sample preview */}
              <p style={{ color: th.textMuted, fontSize: 12, fontWeight: 700, textTransform: "uppercase", margin: "0 0 8px" }}>Preview (first 5) — auto-categorised</p>
              {importPreview.mapped.slice(0, 5).map((r, i) => {
                const detected = r.type === "income" ? { category: "income", isSubscription: false } : detectCategory(r.description);
                const cat = CATEGORIES[detected.category];
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: th.surface2, borderRadius: 10, marginBottom: 6, gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: (cat?.color || "#888") + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{cat?.icon || "💸"}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: th.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.description.slice(0, 28)}{r.description.length > 28 ? "..." : ""}</p>
                      <p style={{ margin: 0, fontSize: 10, color: "#0D7680", fontWeight: 600 }}>→ {cat?.label || detected.category}{detected.isSubscription ? " · 🔁 sub" : ""}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: r.type === "income" ? "#00B894" : "#FF6B6B", flexShrink: 0 }}>
                      {r.type === "income" ? "+" : "-"}{settings.currencySymbol || "S$"} {r.amount.toFixed(2)}
                    </p>
                  </div>
                );
              })}

              <div style={{ background: "#0D768018", border: "1px solid #0D768033", borderRadius: 12, padding: "10px 14px", margin: "12px 0" }}>
                <p style={{ margin: 0, fontSize: 12, color: "#0D7680", fontWeight: 600 }}>
                  ✨ Smart Auto-Categorisation: We recognised Singapore merchants like Grab, FairPrice, NTUC, Singtel etc. You can edit any transaction in History.
                </p>
              </div>

              <button onClick={confirmBankImport} style={{ width: "100%", background: "#0D7680", border: "none", borderRadius: 14, padding: "16px 0", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", marginBottom: 10 }}>
                Import {importPreview.count} Transactions
              </button>
              <button onClick={() => setShowImport(false)} style={{ width: "100%", background: "transparent", border: "1px solid " + th.border, borderRadius: 14, padding: "12px 0", color: th.textMuted, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {restoreMsg && (
        <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: "#0D7680", color: "#fff", padding: "12px 20px", borderRadius: 24, fontSize: 13, fontWeight: 700, zIndex: 250, boxShadow: "0 8px 24px #0D768066" }}>
          {restoreMsg}
        </div>
      )}
    </div>
  );
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function formatDate(str) {
  if (!str) return "";
  const d = new Date(str + "T00:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });
}

function getDaySuffix(day) {
  const d = parseInt(day);
  if (d >= 11 && d <= 13) return "th";
  switch (d % 10) { case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th"; }
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const makeStyles = (th) => ({
  app: { background: th.bg, minHeight: "100vh", width: "100%", margin: 0, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: th.text, display: "flex", flexDirection: "column", position: "relative" },
  content: { flex: 1, overflowY: "auto", paddingBottom: 100 },

  // Tablet layout
  tabletGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  tabletCol: {},

  // Side nav (tablet)
  sideNav: { width: 220, background: th.sideNavBg, borderRight: "1px solid " + th.border2, display: "flex", flexDirection: "column", padding: "24px 12px", minHeight: "100vh", position: "sticky", top: 0, flexShrink: 0 },
  sideNavLogo: { display: "flex", alignItems: "center", gap: 10, padding: "0 8px 28px" },
  sideNavAppName: { fontWeight: 800, fontSize: 16, margin: 0, color: "#fff" },
  sideNavItems: { display: "flex", flexDirection: "column", gap: 4 },
  sideNavBtn: { background: "transparent", border: "none", borderRadius: 12, color: th.textDim, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", fontSize: 15, fontWeight: 600, textAlign: "left", width: "100%" },
  sideNavBtnActive: { background: "#0D768022", color: "#0D7680" },
  sideNavBtnBig: { background: "#0D7680", color: "#fff", borderRadius: 12, marginTop: 8, boxShadow: "0 4px 16px #0D768055" },
  sideNavLabel: { fontSize: 14, fontWeight: 600 },
  loading: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: th.bg, color: "#aaa", gap: 12 },
  spinner: { width: 36, height: 36, border: "3px solid #333", borderTop: "3px solid #EF3340", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  screen: { padding: "24px 16px 16px", animation: "screenIn 0.3s ease" },

  // Dashboard
  dashHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  dashGreet: { color: th.textMuted, fontSize: 13, marginBottom: 2 },
  dashTitle: { fontSize: 22, fontWeight: 700, margin: 0 },
  sgFlag: { fontSize: 28 },

  balanceCard: { background: th.balanceCard, border: "none", borderRadius: 20, padding: "20px 16px", marginBottom: 16 },
  balLabel: { color: "rgba(255,255,255,0.65)", fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 },
  balAmount: { fontSize: 32, fontWeight: 800, margin: "0 0 16px", color: "#FFFFFF" },
  balRow: { display: "flex", alignItems: "center", justifyContent: "space-around" },
  balItem: { display: "flex", gap: 8, alignItems: "center" },
  balDivider: { width: 1, height: 32, background: "rgba(255,255,255,0.25)" },
  balSmallLabel: { color: "rgba(255,255,255,0.65)", fontSize: 11, marginBottom: 2 },
  balSmallVal: { fontSize: 14, fontWeight: 700 },

  alertCard: { background: th.alertBg, border: "1px solid " + th.alertBorder, borderRadius: 12, padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", marginBottom: 16 },
  glanceRow: { display: "flex", gap: 10, marginBottom: 16 },
  glanceCard: { flex: 1, background: th.surface, border: "1px solid " + th.border, borderRadius: 16, padding: "14px 8px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  glanceIcon: { fontSize: 22, margin: "0 0 6px" },
  glanceLabel: { color: th.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 4px", lineHeight: 1.2, width: "100%" },
  glanceAmt: { fontSize: 17, fontWeight: 800, margin: 0, lineHeight: 1 },
  alertText: { color: "#FF6B6B", fontSize: 13, margin: 0 },

  section: { marginBottom: 20 },
  sectionTitle: { color: th.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  dateLabel: { color: th.textDim, fontSize: 12, marginBottom: 8, fontWeight: 600 },

  catRow: { display: "flex", gap: 12, alignItems: "center", marginBottom: 12 },
  catIcon: { fontSize: 24, width: 36, textAlign: "center" },
  catInfo: { flex: 1 },
  catLabelRow: { display: "flex", justifyContent: "space-between", marginBottom: 4 },
  catName: { fontSize: 13, margin: 0 },
  catAmt: { fontSize: 13, fontWeight: 700, margin: 0 },
  barBg: { background: th.border2, borderRadius: 99, height: 5, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 99, transition: "width 0.4s ease" },

  txRow: { display: "flex", alignItems: "center", gap: 12, background: th.surface, borderRadius: 14, padding: "12px 14px", marginBottom: 8 },
  txIcon: { width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txSub: { fontSize: 14, fontWeight: 600, margin: "0 0 2px", color: th.text },
  txMeta: { color: th.textDim, fontSize: 12, margin: 0 },
  txRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  txAmt: { fontSize: 14, fontWeight: 700, margin: 0 },

  empty: { textAlign: "center", padding: "48px 0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, minHeight: 300 },
  emptyText: { color: th.textMuted, fontSize: 16, margin: "8px 0 4px" },
  emptySubText: { color: th.textFaint, fontSize: 13 },

  // Add Transaction
  pageTitle: { fontSize: 22, fontWeight: 700, margin: "0 0 20px" },
  pageHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  typeToggle: { display: "flex", background: th.surface, borderRadius: 12, padding: 4, marginBottom: 20, gap: 4 },
  typeBtn: { flex: 1, background: "transparent", border: "none", color: th.textDim, padding: "10px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 },
  typeBtnActive: { background: "#0D7680", color: "#fff" },

  amountBox: { display: "flex", alignItems: "center", gap: 8, background: th.surface, borderRadius: 16, padding: "16px 20px", marginBottom: 20 },
  amountLabel: { color: th.bg === "#0F2B34" ? "#7FD9E5" : "#0D7680", fontSize: 22, fontWeight: 800, margin: 0 },
  amountInput: { flex: 1, background: "transparent", border: "none", outline: "none", color: th.bg === "#0F2B34" ? "#fff" : "#0D7680", fontSize: 32, fontWeight: 800, width: "100%" },

  formGroup: { marginBottom: 16 },
  formLabel: { color: th.textMuted, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  catGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  catBtn: { background: th.surface, border: "2px solid " + th.catBorder, borderRadius: 12, padding: "10px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer", transition: "all 0.15s" },
  catBtnActive: { border: "2px solid #0D7680", background: "#4ECDC422", color: "#0D7680" },
  catBtnLabel: { fontSize: 10, color: th.textMuted, textAlign: "center", lineHeight: 1.2 },

  select: { width: "100%", background: th.surface, border: "1px solid " + th.border, borderRadius: 12, padding: "14px 44px 14px 16px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none", MozAppearance: "none", backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", cursor: "pointer", minHeight: 52 },
  primaryBtn: { width: "100%", background: "#0D7680", border: "none", borderRadius: 14, padding: "16px", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", transition: "background 0.2s", marginTop: 8 },

  // Goals
  goalCard: { background: th.surface, borderRadius: 16, padding: "16px", marginBottom: 12, border: "1px solid " + th.border },
  goalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  goalName: { fontWeight: 700, fontSize: 16, margin: 0 },
  goalAmtRow: { display: "flex", gap: 6, alignItems: "baseline", marginBottom: 8 },
  goalSaved: { fontSize: 20, fontWeight: 800, color: "#74B9FF", margin: 0 },
  goalTarget: { color: th.textDim, fontSize: 13 },
  goalPct: { color: th.textMuted, fontSize: 12, marginTop: 6, marginBottom: 0 },
  topUpBtn: { marginTop: 10, background: "#1e2d3e", border: "1px solid #74B9FF", borderRadius: 8, color: "#74B9FF", padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  topUpConfirm: { background: "#0D7680", border: "none", borderRadius: 8, color: "#fff", padding: "8px 14px", cursor: "pointer", fontWeight: 700 },
  cancelBtn: { background: th.cancelBg, border: "none", borderRadius: 8, color: th.textMuted, padding: "8px 12px", cursor: "pointer" },
  formCard: { background: th.surface, borderRadius: 16, padding: 16, marginBottom: 16, border: "1px solid " + th.border },
  addBtn: { background: "#0D7680", border: "none", borderRadius: "50%", width: 52, height: 52, color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 26, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px #0D768066", flexShrink: 0 },

  // Shared
  deleteBtn: { background: "transparent", border: "none", color: th.textFaint, cursor: "pointer", fontSize: 14, padding: "2px 6px" },
  filterRow: { display: "flex", gap: 8, marginBottom: 12 },
  filterBtn: { background: th.surface, border: "1px solid " + th.border, borderRadius: 8, color: th.textMuted, padding: "8px 14px", cursor: "pointer", fontSize: 13 },
  filterBtnActive: { background: "#0D7680", color: "#fff", border: "1px solid #0D7680" },

  // Nav
  nav: { position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 16px)", maxWidth: 520, background: th.navBg, borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px", zIndex: 100, boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)", border: "1px solid #222230" },
  navBtn: { background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, cursor: "pointer", padding: "4px 2px", color: th.textFaint, flex: 1, minWidth: 0, overflow: "hidden" },
  navBtnActive: { color: "#0D7680" },
  navBtnBig: { background: "#0D7680", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4, boxShadow: "0 4px 20px #0D768066", color: "#fff" },
  navLabel: { fontSize: 9, fontWeight: 600, width: "100%", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 },
});
