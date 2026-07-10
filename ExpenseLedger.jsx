import React, { useState, useMemo, useCallback } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import {
  Wallet, Search, Plus, Bell, Target, Repeat, LayoutDashboard, ListTree,
  ScanText, PiggyBank, Sparkles, TrendingUp, TrendingDown, ChevronDown,
  X, Check, AlertTriangle, Trash2, Mic, Camera
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  TOKENS                                                                 */
/* ---------------------------------------------------------------------- */
const INK = "#16342A";
const INK_DARK = "#0E241C";
const PAPER = "#F2ECDA";
const PAPER_DIM = "#E9E1C9";
const GOLD = "#C7A24C";
const RUST = "#B5432F";
const TEAL = "#2F7A63";
const TEXT = "#2B2A22";
const TEXT_DIM = "#6B6653";

const CATEGORIES = [
  { key: "Food & Dining", icon: "🍔", color: "#B5432F" },
  { key: "Transport", icon: "🚕", color: "#C7862A" },
  { key: "Shopping", icon: "🛒", color: "#8E5AA3" },
  { key: "Groceries", icon: "🛍", color: "#4E8B5C" },
  { key: "Entertainment", icon: "🎬", color: "#3B6EA8" },
  { key: "Healthcare", icon: "💊", color: "#C25B7C" },
  { key: "Utilities", icon: "⚡", color: "#C7A24C" },
  { key: "Rent", icon: "🏠", color: "#7A5230" },
  { key: "Recharge", icon: "📱", color: "#3B8F8F" },
  { key: "Education", icon: "🎓", color: "#5B6EA8" },
  { key: "Travel", icon: "✈️", color: "#2F7A63" },
  { key: "Bills", icon: "💼", color: "#8A6D3B" },
  { key: "Investments", icon: "💰", color: "#2F7A9A" },
  { key: "Other", icon: "📎", color: "#807A63" },
];
const catMeta = (k) => CATEGORIES.find((c) => c.key === k) || CATEGORIES[CATEGORIES.length - 1];

const KEYWORD_MAP = [
  [["swiggy", "zomato", "dominos", "mcdonald", "kfc", "starbucks", "cafe", "burger", "pizza"], "Food & Dining"],
  [["ola", "uber", "rapido", "metro", "irctc", "petrol", "fuel", "diesel", "fastag"], "Transport"],
  [["amazon", "flipkart", "myntra", "ajio", "nykaa"], "Shopping"],
  [["bigbasket", "grofers", "dmart", "blinkit", "zepto", "grocery", "reliance fresh", "more supermarket"], "Groceries"],
  [["netflix", "hotstar", "prime video", "spotify", "bookmyshow", "pvr", "inox"], "Entertainment"],
  [["apollo", "pharmacy", "practo", "medplus", "hospital", "clinic", "1mg"], "Healthcare"],
  [["bses", "tneb", "electricity", "water bill", "gas bill", "broadband", "wifi"], "Utilities"],
  [["rent", "landlord", "housing"], "Rent"],
  [["airtel", "jio", "vodafone", "vi ", "recharge"], "Recharge"],
  [["byju", "udemy", "coursera", "unacademy", "tuition", "school fee"], "Education"],
  [["makemytrip", "goibibo", "indigo", "spicejet", "airbnb", "oyo", "yatra"], "Travel"],
  [["emi", "loan", "insurance", "premium", "credit card bill"], "Bills"],
  [["groww", "zerodha", "mutual fund", "sip", "upstox", "coin", "nps"], "Investments"],
];
function guessCategory(merchant, learned) {
  const m = (merchant || "").toLowerCase();
  if (learned[m]) return learned[m];
  for (const [words, cat] of KEYWORD_MAP) {
    if (words.some((w) => m.includes(w))) return cat;
  }
  return "Other";
}

const INR = (n) =>
  "₹" + Math.round(Math.abs(n)).toLocaleString("en-IN");

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function monthKey(d) { return `${d.getFullYear()}-${d.getMonth()}`; }
function fmtDate(d) { return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`; }

/* ---------------------------------------------------------------------- */
/*  SMS PARSER                                                             */
/* ---------------------------------------------------------------------- */
function parseSmsBlock(raw) {
  const blocks = raw
    .split(/\n\s*\n|(?=(?:Rs\.?|INR|₹))/gi)
    .map((b) => b.trim())
    .filter((b) => b.length > 8);
  const results = [];
  for (const text of blocks) {
    const lower = text.toLowerCase();
    if (/otp|one time password|verification code/.test(lower)) continue;
    if (/(win|cashback offer|discount|sale|% off|congratulations|lucky draw)/.test(lower) && !/debited|credited|spent/.test(lower)) continue;

    const amtMatch = text.match(/(?:Rs\.?|INR|₹)\s?([\d,]+(?:\.\d{1,2})?)/i);
    if (!amtMatch) continue;
    const amount = parseFloat(amtMatch[1].replace(/,/g, ""));
    if (!amount || amount <= 0) continue;

    let type = "debit";
    if (/credited|received|deposit(ed)?|refund|cashback|salary/i.test(lower)) type = "credit";
    if (/debited|spent|paid|purchase|withdrawn/i.test(lower)) type = "debit";

    let merchant = "Unknown";
    let m =
      text.match(/at\s+([A-Za-z0-9&.\-\s]+?)(?:\s+on|\s+dt|\.|,|\son \d|\s+info|$)/i) ||
      text.match(/to\s+VPA\s+([A-Za-z0-9@._\-]+)/i) ||
      text.match(/to\s+([A-Za-z0-9&.\-\s]+?)(?:\s+on|\.|,|$)/i) ||
      text.match(/Info[:\-]?\s*([A-Za-z0-9\/\-_. ]+)/i) ||
      text.match(/by\s+([A-Za-z0-9&.\-\s]+?)(?:\s+on|\.|,|$)/i);
    if (m) merchant = m[1].trim().replace(/\s{2,}/g, " ");
    merchant = merchant.replace(/^VPA\s*/i, "").split("@")[0].trim();
    if (merchant.length > 28) merchant = merchant.slice(0, 28).trim();
    if (!merchant || merchant.length < 2) merchant = type === "credit" ? "Incoming Transfer" : "Unknown Merchant";
    merchant = merchant.replace(/\b\w/g, (c) => c.toUpperCase());

    let account = "Account";
    const accMatch = text.match(/(?:A\/c|Card|a\/c)\s*(?:no\.?)?\s*[Xx*]*(\d{3,4})/i);
    if (accMatch) account = "•• " + accMatch[1];

    let date = new Date();
    const dMatch = text.match(/(\d{1,2})[-\/](\d{1,2}|[A-Za-z]{3})[-\/](\d{2,4})/);
    if (dMatch) {
      let [_, dd, mm, yy] = dMatch;
      let month;
      if (isNaN(mm)) {
        month = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"].indexOf(mm.toLowerCase().slice(0,3));
      } else {
        month = parseInt(mm, 10) - 1;
      }
      let year = parseInt(yy, 10);
      if (year < 100) year += 2000;
      date = new Date(year, month, parseInt(dd, 10));
      if (isNaN(date.getTime())) date = new Date();
    }

    let balance = null;
    const balMatch = text.match(/(?:Avl\s?Bal|Available Balance|Bal)\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s?([\d,]+(?:\.\d{1,2})?)/i);
    if (balMatch) balance = parseFloat(balMatch[1].replace(/,/g, ""));

    results.push({
      id: "sms_" + Math.random().toString(36).slice(2, 10),
      amount, type, merchant, account, date, balance,
      rawSms: text, source: "sms",
    });
  }
  return results;
}

/* ---------------------------------------------------------------------- */
/*  SEED DATA                                                              */
/* ---------------------------------------------------------------------- */
function seedTransactions() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const mk = (day, monOffset = 0) => new Date(y, m + monOffset, day);
  const rows = [
    // this month
    ["Swiggy", 420, "debit", 3], ["Swiggy", 610, "debit", 9], ["Swiggy", 380, "debit", 16], ["Swiggy", 545, "debit", 27],
    ["Zomato", 350, "debit", 6],
    ["Uber", 180, "debit", 2], ["Ola", 220, "debit", 8], ["Uber", 260, "debit", 19],
    ["Amazon", 2400, "debit", 5], ["Myntra", 1800, "debit", 12], ["Flipkart", 3200, "debit", 22],
    ["BigBasket", 1650, "debit", 4], ["DMart", 2100, "debit", 14], ["Zepto", 540, "debit", 24],
    ["Netflix", 649, "debit", 1], ["Spotify", 119, "debit", 1], ["BookMyShow", 900, "debit", 18],
    ["Apollo Pharmacy", 460, "debit", 11],
    ["BSES Electricity", 2200, "debit", 7],
    ["Landlord", 18000, "debit", 1],
    ["Airtel", 599, "debit", 2],
    ["Cult Fit Gym", 1499, "debit", 3],
    ["Groww SIP", 5000, "debit", 5],
    ["Company Payroll", 68000, "credit", 1],
    ["UPI Refund", 350, "credit", 13],
    ["Interest Credit", 210, "credit", 30],
    // last month
    ["Swiggy", 480, "debit", 5, -1], ["Swiggy", 390, "debit", 20, -1],
    ["Zomato", 610, "debit", 15, -1],
    ["Uber", 300, "debit", 9, -1], ["Ola", 190, "debit", 21, -1],
    ["Amazon", 4100, "debit", 10, -1],
    ["BigBasket", 1500, "debit", 6, -1], ["DMart", 1900, "debit", 18, -1],
    ["Netflix", 649, "debit", 1, -1], ["Spotify", 119, "debit", 1, -1],
    ["BSES Electricity", 2050, "debit", 7, -1],
    ["Landlord", 18000, "debit", 1, -1],
    ["Airtel", 599, "debit", 2, -1],
    ["Cult Fit Gym", 1499, "debit", 3, -1],
    ["Groww SIP", 5000, "debit", 5, -1],
    ["Company Payroll", 68000, "credit", 1, -1],
    ["Cashback Reward", 150, "credit", 12, -1],
  ];
  const learned = {};
  return rows.map(([merchant, amount, type, day, monOffset = 0], i) => ({
    id: "seed_" + i,
    merchant, amount, type,
    date: mk(day, monOffset),
    account: i % 3 === 0 ? "•• 4521" : i % 3 === 1 ? "UPI" : "•• 9087",
    balance: null,
    category: guessCategory(merchant, learned),
    source: "sms",
  }));
}

/* ---------------------------------------------------------------------- */
/*  SMALL UI PARTS                                                         */
/* ---------------------------------------------------------------------- */
function StampBadge({ cat, size = 34 }) {
  const meta = catMeta(cat);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: PAPER, border: `1.5px dashed ${meta.color}`,
        fontSize: size * 0.5, flexShrink: 0,
      }}
      title={cat}
    >
      {meta.icon}
    </div>
  );
}

function SectionTitle({ eyebrow, title, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
      <div>
        {eyebrow && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: TEAL, marginBottom: 2 }}>
            {eyebrow}
          </div>
        )}
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 600, color: TEXT }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: "#FBF9F0",
        border: `1px solid ${PAPER_DIM}`,
        borderRadius: 10,
        padding: 18,
        boxShadow: "0 1px 0 rgba(22,52,42,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  MAIN APP                                                               */
/* ---------------------------------------------------------------------- */
export default function ExpenseLedger() {
  const [transactions, setTransactions] = useState(seedTransactions);
  const [learnedCats, setLearnedCats] = useState({});
  const [tab, setTab] = useState("dashboard");
  const [smsInput, setSmsInput] = useState("");
  const [parsedPreview, setParsedPreview] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [budgets, setBudgets] = useState({
    total: 45000,
    categories: { "Food & Dining": 8000, "Shopping": 6000, "Transport": 3000, "Entertainment": 2500 },
  });
  const [goals, setGoals] = useState([
    { id: "g1", name: "Emergency Fund", target: 100000, saved: 42000 },
    { id: "g2", name: "Goa Vacation", target: 30000, saved: 11000 },
  ]);
  const [quickAdd, setQuickAdd] = useState({ open: false, merchant: "", amount: "", category: "Food & Dining" });
  const [months, setMonths] = useState(() => {
    const now = new Date();
    return monthKey(now);
  });

  /* ---- derived month list ---- */
  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    return Array.from(set).sort().reverse();
  }, [transactions]);

  const currentMonth = availableMonths.includes(months) ? months : availableMonths[0];
  const [yy, mm] = (currentMonth || monthKey(new Date())).split("-").map(Number);
  const prevMonthKey = (() => { const d = new Date(yy, mm - 1, 1); return monthKey(d); })();

  const txThisMonth = useMemo(
    () => transactions.filter((t) => monthKey(t.date) === currentMonth),
    [transactions, currentMonth]
  );
  const txPrevMonth = useMemo(
    () => transactions.filter((t) => monthKey(t.date) === prevMonthKey),
    [transactions, prevMonthKey]
  );

  const totals = (list) => {
    const income = list.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  };
  const cur = totals(txThisMonth);
  const prev = totals(txPrevMonth);
  const trendPct = prev.expense ? (((cur.expense - prev.expense) / prev.expense) * 100).toFixed(0) : null;

  const daysSoFar = (() => {
    const now = new Date();
    if (monthKey(now) === currentMonth) return now.getDate();
    return new Date(yy, mm + 1, 0).getDate();
  })();
  const dailyAvg = cur.expense / Math.max(daysSoFar, 1);

  const biggestExpense = useMemo(() => {
    const debits = txThisMonth.filter((t) => t.type === "debit");
    return debits.sort((a, b) => b.amount - a.amount)[0];
  }, [txThisMonth]);

  const byCategory = useMemo(() => {
    const map = {};
    txThisMonth.filter((t) => t.type === "debit").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([key, value]) => ({ name: key, value, color: catMeta(key).color }))
      .sort((a, b) => b.value - a.value);
  }, [txThisMonth]);

  const byMerchant = useMemo(() => {
    const map = {};
    txThisMonth.filter((t) => t.type === "debit").forEach((t) => {
      if (!map[t.merchant]) map[t.merchant] = { spent: 0, count: 0 };
      map[t.merchant].spent += t.amount;
      map[t.merchant].count += 1;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, avg: v.spent / v.count }))
      .sort((a, b) => b.spent - a.spent);
  }, [txThisMonth]);

  const weeklySpend = useMemo(() => {
    const weeks = [0, 0, 0, 0, 0];
    txThisMonth.filter((t) => t.type === "debit").forEach((t) => {
      const wk = Math.min(Math.floor((t.date.getDate() - 1) / 7), 4);
      weeks[wk] += t.amount;
    });
    return weeks.map((v, i) => ({ week: `W${i + 1}`, amount: v }));
  }, [txThisMonth]);

  const sixMonthTrend = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(yy, mm - i, 1);
      const key = monthKey(d);
      const list = transactions.filter((t) => monthKey(t.date) === key);
      const t = totals(list);
      arr.push({ month: MONTH_NAMES[d.getMonth()], expense: t.expense, income: t.income });
    }
    return arr;
  }, [transactions, yy, mm]);

  /* ---- subscriptions: merchants recurring across >=2 months with similar amount ---- */
  const subscriptions = useMemo(() => {
    const byMerchantAll = {};
    transactions.filter((t) => t.type === "debit").forEach((t) => {
      const k = t.merchant;
      if (!byMerchantAll[k]) byMerchantAll[k] = [];
      byMerchantAll[k].push(t);
    });
    const subs = [];
    Object.entries(byMerchantAll).forEach(([merchant, list]) => {
      const monthsSeen = new Set(list.map((t) => monthKey(t.date)));
      const amounts = list.map((t) => t.amount);
      const avgAmt = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.every((a) => Math.abs(a - avgAmt) / avgAmt < 0.05);
      const knownSubs = ["netflix", "spotify", "cult fit gym", "airtel", "landlord", "bses electricity", "groww sip"];
      const isKnown = knownSubs.includes(merchant.toLowerCase());
      if ((monthsSeen.size >= 2 && variance) || isKnown) {
        const latest = list.sort((a, b) => b.date - a.date)[0];
        const nextDate = new Date(latest.date);
        nextDate.setMonth(nextDate.getMonth() + 1);
        subs.push({ merchant, amount: Math.round(avgAmt), next: nextDate, category: latest.category });
      }
    });
    return subs.sort((a, b) => a.next - b.next);
  }, [transactions]);

  const monthlySubTotal = subscriptions.reduce((s, x) => s + x.amount, 0);

  /* ---- filtered transactions for Transactions tab ---- */
  const filteredTx = useMemo(() => {
    return transactions
      .filter((t) => (filterCat === "All" ? true : t.category === filterCat))
      .filter((t) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          t.merchant.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          String(t.amount).includes(q) ||
          (t.account || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date - a.date);
  }, [transactions, search, filterCat]);

  /* ---- handlers ---- */
  const handleParseSms = () => {
    if (!smsInput.trim()) return;
    const parsed = parseSmsBlock(smsInput).map((p) => ({
      ...p,
      category: guessCategory(p.merchant, learnedCats),
    }));
    setParsedPreview(parsed);
  };

  const isDuplicate = useCallback(
    (p) =>
      transactions.some(
        (t) =>
          t.merchant.toLowerCase() === p.merchant.toLowerCase() &&
          Math.abs(t.amount - p.amount) < 1 &&
          Math.abs(t.date - p.date) < 1000 * 60 * 60 * 36
      ),
    [transactions]
  );

  const commitParsed = () => {
    const fresh = parsedPreview.filter((p) => !isDuplicate(p));
    setTransactions((prev) => [...prev, ...fresh]);
    setParsedPreview([]);
    setSmsInput("");
  };

  const recategorize = (id, newCat) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, category: newCat } : t)));
    const merchant = transactions.find((t) => t.id === id)?.merchant;
    if (merchant) setLearnedCats((prev) => ({ ...prev, [merchant.toLowerCase()]: newCat }));
  };

  const addQuickTx = () => {
    if (!quickAdd.merchant || !quickAdd.amount) return;
    setTransactions((prev) => [
      ...prev,
      {
        id: "cash_" + Math.random().toString(36).slice(2, 8),
        merchant: quickAdd.merchant,
        amount: parseFloat(quickAdd.amount),
        type: "debit",
        date: new Date(),
        account: "Cash",
        category: quickAdd.category,
        source: "manual",
      },
    ]);
    setQuickAdd({ open: false, merchant: "", amount: "", category: "Food & Dining" });
  };

  /* ---- AI-style insights (rule based) ---- */
  const insights = useMemo(() => {
    const out = [];
    const weekendSpend = txThisMonth
      .filter((t) => t.type === "debit" && [0, 6].includes(t.date.getDay()))
      .reduce((s, t) => s + t.amount, 0);
    const weekdaySpend = cur.expense - weekendSpend;
    if (weekendSpend > weekdaySpend / 5) {
      out.push(`You spend disproportionately on weekends — ${INR(weekendSpend)} so far this month.`);
    }
    const swiggyCount = txThisMonth.filter((t) => t.merchant.toLowerCase() === "swiggy").length;
    if (swiggyCount >= 3) {
      const swiggyTotal = txThisMonth.filter((t) => t.merchant.toLowerCase() === "swiggy").reduce((s, t) => s + t.amount, 0);
      out.push(`Swiggy orders this month total ${INR(swiggyTotal)} across ${swiggyCount} orders — roughly ${INR(swiggyTotal / 4)}/week.`);
    }
    if (trendPct !== null && Number(trendPct) >= 15) {
      out.push(`Spending is ${trendPct}% higher than last month — mainly driven by ${byCategory[0]?.name || "discretionary categories"}.`);
    } else if (trendPct !== null && Number(trendPct) <= -15) {
      out.push(`Nice — spending is down ${Math.abs(trendPct)}% compared to last month.`);
    }
    const transportSpend = byCategory.find((c) => c.name === "Transport")?.value || 0;
    if (transportSpend > 1500) {
      out.push(`Two fewer cab rides a week could save around ${INR(transportSpend * 0.3)}/month — try public transport on short routes.`);
    }
    if (monthlySubTotal > 0) {
      out.push(`You're paying ${INR(monthlySubTotal)}/month across ${subscriptions.length} recurring subscriptions (${INR(monthlySubTotal * 12)}/year).`);
    }
    return out.slice(0, 5);
  }, [txThisMonth, cur, trendPct, byCategory, monthlySubTotal, subscriptions]);

  /* ---- financial health score ---- */
  const healthScore = useMemo(() => {
    let score = 50;
    const savingsRate = cur.income ? (cur.income - cur.expense) / cur.income : 0;
    score += Math.max(-20, Math.min(30, savingsRate * 100 * 0.6));
    const budgetAdherence = budgets.total ? Math.min(1, budgets.total / Math.max(cur.expense, 1)) : 1;
    score += (budgetAdherence - 0.5) * 30;
    const subLoad = cur.income ? monthlySubTotal / cur.income : 0;
    score -= Math.min(15, subLoad * 100);
    return Math.max(0, Math.min(100, Math.round(score)));
  }, [cur, budgets, monthlySubTotal]);

  /* ---- budget usage ---- */
  const projectedMonthEnd = dailyAvg * new Date(yy, mm + 1, 0).getDate();

  const NAV = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "transactions", label: "Ledger", icon: ListTree },
    { key: "import", label: "Import SMS", icon: ScanText },
    { key: "budgets", label: "Budgets", icon: Wallet },
    { key: "subscriptions", label: "Subscriptions", icon: Repeat },
    { key: "goals", label: "Goals", icon: Target },
    { key: "insights", label: "Insights", icon: Sparkles },
  ];

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        background: PAPER,
        minHeight: "100%",
        color: TEXT,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${GOLD}; border-radius: 4px; }
        .tabnum { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .ledgerline:hover { background: ${PAPER_DIM} !important; }
        button { cursor: pointer; font-family: inherit; }
        input, select { font-family: inherit; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: INK, color: PAPER, padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", color: INK_DARK, fontWeight: 700, fontFamily: "'Fraunces', serif" }}>₹</div>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 600, letterSpacing: "0.01em" }}>Khaata</div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.12em", color: "#B9C9BD", textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>your spending passbook</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={currentMonth}
            onChange={(e) => setMonths(e.target.value)}
            style={{ background: "transparent", color: PAPER, border: `1px solid #3E5C50`, borderRadius: 6, padding: "6px 10px", fontSize: 13 }}
          >
            {availableMonths.map((k) => {
              const [ky, km] = k.split("-").map(Number);
              return <option key={k} value={k} style={{ color: TEXT }}>{MONTH_NAMES[km]} {ky}</option>;
            })}
          </select>
          <button
            onClick={() => setQuickAdd((q) => ({ ...q, open: true }))}
            style={{ background: GOLD, color: INK_DARK, border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={15} /> Add cash spend
          </button>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display: "flex", gap: 2, padding: "0 16px", background: INK_DARK, overflowX: "auto" }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.key;
          return (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              style={{
                background: active ? PAPER : "transparent",
                color: active ? INK : "#C8D6CC",
                border: "none",
                borderRadius: "8px 8px 0 0",
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                display: "flex", alignItems: "center", gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={15} /> {n.label}
            </button>
          );
        })}
      </div>

      {/* BODY */}
      <div style={{ padding: 20, maxWidth: 1180, margin: "0 auto", width: "100%", flex: 1 }}>
        {tab === "dashboard" && (
          <Dashboard
            cur={cur} prev={prev} trendPct={trendPct} dailyAvg={dailyAvg}
            biggestExpense={biggestExpense} byCategory={byCategory} weeklySpend={weeklySpend}
            sixMonthTrend={sixMonthTrend} byMerchant={byMerchant} budgets={budgets}
            healthScore={healthScore} subscriptions={subscriptions} insights={insights}
            monthLabel={`${MONTH_NAMES[mm]} ${yy}`}
          />
        )}
        {tab === "transactions" && (
          <TransactionsView
            filteredTx={filteredTx} search={search} setSearch={setSearch}
            filterCat={filterCat} setFilterCat={setFilterCat} recategorize={recategorize}
          />
        )}
        {tab === "import" && (
          <ImportSms
            smsInput={smsInput} setSmsInput={setSmsInput} handleParseSms={handleParseSms}
            parsedPreview={parsedPreview} setParsedPreview={setParsedPreview}
            commitParsed={commitParsed} isDuplicate={isDuplicate}
          />
        )}
        {tab === "budgets" && (
          <BudgetsView budgets={budgets} setBudgets={setBudgets} byCategory={byCategory} cur={cur} projectedMonthEnd={projectedMonthEnd} />
        )}
        {tab === "subscriptions" && <SubscriptionsView subscriptions={subscriptions} monthlySubTotal={monthlySubTotal} />}
        {tab === "goals" && <GoalsView goals={goals} setGoals={setGoals} monthlySavings={Math.max(0, cur.net)} />}
        {tab === "insights" && <InsightsView insights={insights} healthScore={healthScore} cur={cur} />}
      </div>

      {quickAdd.open && (
        <QuickAddModal quickAdd={quickAdd} setQuickAdd={setQuickAdd} addQuickTx={addQuickTx} />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  DASHBOARD                                                              */
/* ---------------------------------------------------------------------- */
function StatCard({ label, value, sub, tone }) {
  const color = tone === "up" ? RUST : tone === "down" ? TEAL : TEXT;
  return (
    <Card style={{ flex: "1 1 180px" }}>
      <div style={{ fontSize: 11.5, color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
      <div className="tabnum" style={{ fontSize: 26, fontWeight: 600, color, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 3 }}>{sub}</div>}
    </Card>
  );
}

function Dashboard({ cur, prev, trendPct, dailyAvg, biggestExpense, byCategory, weeklySpend, sixMonthTrend, byMerchant, budgets, healthScore, subscriptions, insights, monthLabel }) {
  const savingsRate = cur.income ? Math.round(((cur.income - cur.expense) / cur.income) * 100) : 0;
  return (
    <div>
      <SectionTitle eyebrow={monthLabel} title="This month, at a glance" />
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label="Income" value={INR(cur.income)} />
        <StatCard label="Expenses" value={INR(cur.expense)} tone="up" sub={trendPct !== null ? `${trendPct > 0 ? "+" : ""}${trendPct}% vs last month` : null} />
        <StatCard label="Savings" value={INR(cur.net)} tone={cur.net >= 0 ? "down" : "up"} sub={`${savingsRate}% savings rate`} />
        <StatCard label="Daily average" value={INR(dailyAvg)} sub="spend per day so far" />
        <StatCard label="Biggest expense" value={biggestExpense ? INR(biggestExpense.amount) : "—"} sub={biggestExpense?.merchant} />
        <StatCard label="Financial health" value={healthScore + " / 100"} tone={healthScore >= 60 ? "down" : "up"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card>
          <SectionTitle eyebrow="Breakdown" title="Spending by category" />
          {byCategory.length === 0 ? (
            <div style={{ color: TEXT_DIM, fontSize: 13 }}>No expenses recorded yet this month.</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ width: 190, height: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={48} outerRadius={82} paddingAngle={2}>
                      {byCategory.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => INR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                {byCategory.slice(0, 6).map((c) => (
                  <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "4px 0", borderBottom: `1px dotted ${PAPER_DIM}` }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, display: "inline-block" }} />
                      {c.name}
                    </span>
                    <span className="tabnum">{INR(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle eyebrow="Pace" title="Weekly spending" />
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={weeklySpend}>
              <CartesianGrid strokeDasharray="3 3" stroke={PAPER_DIM} />
              <XAxis dataKey="week" fontSize={12} stroke={TEXT_DIM} />
              <YAxis fontSize={11} stroke={TEXT_DIM} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip formatter={(v) => INR(v)} />
              <Bar dataKey="amount" fill={GOLD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14, marginBottom: 14 }}>
        <Card>
          <SectionTitle eyebrow="6-month view" title="Income vs. expenses" />
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={sixMonthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={PAPER_DIM} />
              <XAxis dataKey="month" fontSize={12} stroke={TEXT_DIM} />
              <YAxis fontSize={11} stroke={TEXT_DIM} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip formatter={(v) => INR(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="income" stroke={TEAL} strokeWidth={2} dot={false} name="Income" />
              <Line type="monotone" dataKey="expense" stroke={RUST} strokeWidth={2} dot={false} name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle eyebrow="Merchants" title="Top spending" />
          {byMerchant.slice(0, 5).map((m, i) => (
            <div key={m.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: i < 4 ? `1px dotted ${PAPER_DIM}` : "none" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: TEXT_DIM }}>{m.count} {m.count === 1 ? "payment" : "payments"} · avg {INR(m.avg)}</div>
              </div>
              <div className="tabnum" style={{ fontSize: 14, fontWeight: 600 }}>{INR(m.spent)}</div>
            </div>
          ))}
          {byMerchant.length === 0 && <div style={{ color: TEXT_DIM, fontSize: 13 }}>Nothing yet.</div>}
        </Card>
      </div>

      <Card>
        <SectionTitle eyebrow={`${subscriptions.length} active`} title="Upcoming bills & subscriptions" />
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
          {subscriptions.slice(0, 6).map((s) => (
            <div key={s.merchant} style={{ minWidth: 150, border: `1px solid ${PAPER_DIM}`, borderRadius: 8, padding: 10, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <StampBadge cat={s.category} size={26} />
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s.merchant}</div>
              </div>
              <div className="tabnum" style={{ fontSize: 15, fontWeight: 600 }}>{INR(s.amount)}</div>
              <div style={{ fontSize: 11, color: TEXT_DIM }}>renews {fmtDate(s.next)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  TRANSACTIONS / LEDGER                                                  */
/* ---------------------------------------------------------------------- */
function TransactionsView({ filteredTx, search, setSearch, filterCat, setFilterCat, recategorize }) {
  const [openCatFor, setOpenCatFor] = useState(null);
  return (
    <div>
      <SectionTitle eyebrow={`${filteredTx.length} entries`} title="Transaction ledger" />
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: TEXT_DIM }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchant, amount, category, account…"
            style={{ width: "100%", padding: "8px 10px 8px 32px", borderRadius: 7, border: `1px solid ${PAPER_DIM}`, background: "#FBF9F0", fontSize: 13 }}
          />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ padding: "8px 10px", borderRadius: 7, border: `1px solid ${PAPER_DIM}`, background: "#FBF9F0", fontSize: 13 }}>
          <option>All</option>
          {CATEGORIES.map((c) => <option key={c.key}>{c.key}</option>)}
        </select>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filteredTx.length === 0 && <div style={{ padding: 20, color: TEXT_DIM, fontSize: 13 }}>No transactions match.</div>}
        {filteredTx.map((t, i) => (
          <div
            key={t.id}
            className="ledgerline"
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 16px",
              borderBottom: i < filteredTx.length - 1 ? `1px dashed ${PAPER_DIM}` : "none",
            }}
          >
            <StampBadge cat={t.category} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.merchant}</div>
              <div style={{ fontSize: 11.5, color: TEXT_DIM }}>
                {fmtDate(t.date)} · {t.account} {t.source === "manual" && "· cash entry"}
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setOpenCatFor(openCatFor === t.id ? null : t.id)}
                style={{ fontSize: 11, background: PAPER_DIM, border: "none", borderRadius: 12, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4, color: TEXT }}
              >
                {t.category} <ChevronDown size={12} />
              </button>
              {openCatFor === t.id && (
                <div style={{ position: "absolute", right: 0, top: 26, background: "#fff", border: `1px solid ${PAPER_DIM}`, borderRadius: 8, zIndex: 5, boxShadow: "0 6px 18px rgba(0,0,0,0.12)", maxHeight: 220, overflowY: "auto", width: 170 }}>
                  {CATEGORIES.map((c) => (
                    <div
                      key={c.key}
                      onClick={() => { recategorize(t.id, c.key); setOpenCatFor(null); }}
                      style={{ padding: "7px 10px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = PAPER}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span>{c.icon}</span>{c.key}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="tabnum" style={{ fontSize: 14.5, fontWeight: 700, color: t.type === "credit" ? TEAL : RUST, minWidth: 90, textAlign: "right" }}>
              {t.type === "credit" ? "+" : "−"}{INR(t.amount)}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  IMPORT SMS                                                             */
/* ---------------------------------------------------------------------- */
const SAMPLE_SMS = `Rs.549.00 debited from A/c XX4521 on 10-07-26 at NETFLIX. Avl Bal Rs.24,320.00

INR 610 debited from your account via UPI to VPA swiggy@ybl on 09-07-26. Info: UPI/Swiggy Order. Avl Bal Rs.23,710.00

Your OTP for login is 483920. Do not share with anyone.

Rs.68,000.00 credited to A/c XX4521 on 01-07-26 by NEFT from COMPANY PAYROLL. Avl Bal Rs.61,200.00

You have spent Rs 1,800 on your HDFC Bank Card ending 9087 at MYNTRA on 12-07-26.`;

function ImportSms({ smsInput, setSmsInput, handleParseSms, parsedPreview, setParsedPreview, commitParsed, isDuplicate }) {
  return (
    <div>
      <SectionTitle eyebrow="Paste to parse" title="Import bank / UPI SMS" />
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, color: TEXT_DIM, marginBottom: 8, lineHeight: 1.5 }}>
          Paste one or more transaction SMS below (separate multiple messages with a blank line). OTPs and promotional
          texts are detected and skipped automatically.
        </div>
        <textarea
          value={smsInput}
          onChange={(e) => setSmsInput(e.target.value)}
          rows={8}
          placeholder="Paste your bank/UPI SMS here…"
          style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${PAPER_DIM}`, fontFamily: "'IBM Plex Mono', monospace", fontSize: 12.5, resize: "vertical" }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button onClick={handleParseSms} style={{ background: INK, color: PAPER, border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600 }}>
            Parse messages
          </button>
          <button onClick={() => setSmsInput(SAMPLE_SMS)} style={{ background: "transparent", color: TEAL, border: `1px solid ${TEAL}`, borderRadius: 7, padding: "8px 14px", fontSize: 13 }}>
            Try sample SMS
          </button>
        </div>
      </Card>

      {parsedPreview.length > 0 && (
        <Card>
          <SectionTitle eyebrow={`${parsedPreview.length} found`} title="Review before adding" />
          {parsedPreview.map((p) => {
            const dup = isDuplicate(p);
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px dashed ${PAPER_DIM}` }}>
                <StampBadge cat={p.category} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.merchant} <span style={{ fontWeight: 400, color: TEXT_DIM, fontSize: 11.5 }}>· {p.category}</span></div>
                  <div style={{ fontSize: 11, color: TEXT_DIM }}>{fmtDate(p.date)} · {p.account}{dup && <span style={{ color: RUST }}> · possible duplicate, will be skipped</span>}</div>
                </div>
                <div className="tabnum" style={{ fontWeight: 700, color: p.type === "credit" ? TEAL : RUST }}>
                  {p.type === "credit" ? "+" : "−"}{INR(p.amount)}
                </div>
              </div>
            );
          })}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={commitParsed} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <Check size={15} /> Add {parsedPreview.filter((p) => !isDuplicate(p)).length} to ledger
            </button>
            <button onClick={() => setParsedPreview([])} style={{ background: "transparent", color: TEXT_DIM, border: `1px solid ${PAPER_DIM}`, borderRadius: 7, padding: "8px 14px", fontSize: 13 }}>
              Discard
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  BUDGETS                                                                */
/* ---------------------------------------------------------------------- */
function BudgetsView({ budgets, setBudgets, byCategory, cur, projectedMonthEnd }) {
  const overallPct = budgets.total ? Math.min(150, Math.round((cur.expense / budgets.total) * 100)) : 0;
  const barColor = (pct) => (pct >= 100 ? RUST : pct >= 90 ? "#D08A2E" : pct >= 75 ? GOLD : TEAL);

  return (
    <div>
      <SectionTitle eyebrow="This month" title="Budget tracking" />
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Overall budget</div>
            <div style={{ fontSize: 11.5, color: TEXT_DIM }}>{INR(cur.expense)} spent of {INR(budgets.total)}</div>
          </div>
          <input
            type="number"
            value={budgets.total}
            onChange={(e) => setBudgets((b) => ({ ...b, total: Number(e.target.value) }))}
            style={{ width: 110, padding: "6px 8px", borderRadius: 6, border: `1px solid ${PAPER_DIM}`, fontSize: 13 }}
          />
        </div>
        <div style={{ height: 10, background: PAPER_DIM, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${overallPct}%`, background: barColor(overallPct), transition: "width .3s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11.5, color: TEXT_DIM }}>
          <span>{overallPct}% used</span>
          <span>Projected month-end: <b className="tabnum" style={{ color: projectedMonthEnd > budgets.total ? RUST : TEXT }}>{INR(projectedMonthEnd)}</b></span>
        </div>
        {overallPct >= 90 && (
          <div style={{ marginTop: 8, fontSize: 12, background: "#FBEAE2", color: RUST, padding: "6px 10px", borderRadius: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={14} /> You've used {overallPct}% of your monthly budget{overallPct >= 100 ? " — over budget." : "."}
          </div>
        )}
      </Card>

      <SectionTitle title="Category budgets" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 14 }}>
        {CATEGORIES.filter((c) => c.key !== "Other").map((c) => {
          const spent = byCategory.find((b) => b.name === c.key)?.value || 0;
          const budget = budgets.categories[c.key];
          const pct = budget ? Math.min(150, Math.round((spent / budget) * 100)) : null;
          return (
            <Card key={c.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                  <span>{c.icon}</span>{c.key}
                </div>
                <input
                  type="number"
                  placeholder="set"
                  value={budget || ""}
                  onChange={(e) => setBudgets((b) => ({ ...b, categories: { ...b.categories, [c.key]: Number(e.target.value) } }))}
                  style={{ width: 72, padding: "4px 6px", borderRadius: 5, border: `1px solid ${PAPER_DIM}`, fontSize: 12 }}
                />
              </div>
              {budget ? (
                <>
                  <div style={{ height: 8, background: PAPER_DIM, borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: barColor(pct) }} />
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 4 }}>{INR(spent)} of {INR(budget)} ({pct}%)</div>
                </>
              ) : (
                <div style={{ fontSize: 11, color: TEXT_DIM }}>{INR(spent)} spent — no budget set</div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  SUBSCRIPTIONS                                                          */
/* ---------------------------------------------------------------------- */
function SubscriptionsView({ subscriptions, monthlySubTotal }) {
  return (
    <div>
      <SectionTitle eyebrow={`${subscriptions.length} detected`} title="Recurring payments & subscriptions" />
      <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <StatCard label="Monthly total" value={INR(monthlySubTotal)} />
        <StatCard label="Annual total" value={INR(monthlySubTotal * 12)} />
        <StatCard label="Active subscriptions" value={subscriptions.length} />
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {subscriptions.map((s, i) => (
          <div key={s.merchant} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < subscriptions.length - 1 ? `1px dashed ${PAPER_DIM}` : "none" }}>
            <StampBadge cat={s.category} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.merchant}</div>
              <div style={{ fontSize: 11.5, color: TEXT_DIM }}>Next renewal: {fmtDate(s.next)} · {s.category}</div>
            </div>
            <div className="tabnum" style={{ fontWeight: 700 }}>{INR(s.amount)}/mo</div>
          </div>
        ))}
        {subscriptions.length === 0 && <div style={{ padding: 18, color: TEXT_DIM, fontSize: 13 }}>Nothing detected yet — recurring merchants appear here once seen across two or more months.</div>}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  GOALS                                                                  */
/* ---------------------------------------------------------------------- */
function GoalsView({ goals, setGoals, monthlySavings }) {
  const [newGoal, setNewGoal] = useState({ name: "", target: "" });
  const addGoal = () => {
    if (!newGoal.name || !newGoal.target) return;
    setGoals((g) => [...g, { id: "goal_" + Date.now(), name: newGoal.name, target: Number(newGoal.target), saved: 0 }]);
    setNewGoal({ name: "", target: "" });
  };
  const allocate = (id, amt) => {
    setGoals((g) => g.map((x) => (x.id === id ? { ...x, saved: Math.min(x.target, x.saved + amt) } : x)));
  };
  const remove = (id) => setGoals((g) => g.filter((x) => x.id !== id));

  return (
    <div>
      <SectionTitle eyebrow={`${INR(monthlySavings)} saved this month`} title="Savings goals" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 14 }}>
        {goals.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);
          return (
            <Card key={g.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{g.name}</div>
                <button onClick={() => remove(g.id)} style={{ background: "none", border: "none", color: TEXT_DIM }}><Trash2 size={14} /></button>
              </div>
              <div style={{ fontSize: 12, color: TEXT_DIM, margin: "4px 0 8px" }}>{INR(g.saved)} of {INR(g.target)} ({pct}%)</div>
              <div style={{ height: 8, background: PAPER_DIM, borderRadius: 5, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: TEAL }} />
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button onClick={() => allocate(g.id, 1000)} style={{ fontSize: 11.5, background: PAPER_DIM, border: "none", borderRadius: 5, padding: "5px 8px" }}>+ ₹1,000</button>
                <button onClick={() => allocate(g.id, 5000)} style={{ fontSize: 11.5, background: PAPER_DIM, border: "none", borderRadius: 5, padding: "5px 8px" }}>+ ₹5,000</button>
              </div>
            </Card>
          );
        })}
      </div>
      <Card style={{ maxWidth: 420 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>New goal</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="Goal name" value={newGoal.name} onChange={(e) => setNewGoal((g) => ({ ...g, name: e.target.value }))} style={{ flex: 1, minWidth: 120, padding: 8, borderRadius: 6, border: `1px solid ${PAPER_DIM}`, fontSize: 13 }} />
          <input placeholder="Target ₹" type="number" value={newGoal.target} onChange={(e) => setNewGoal((g) => ({ ...g, target: e.target.value }))} style={{ width: 110, padding: 8, borderRadius: 6, border: `1px solid ${PAPER_DIM}`, fontSize: 13 }} />
          <button onClick={addGoal} style={{ background: INK, color: PAPER, border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13 }}>Add</button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  INSIGHTS                                                               */
/* ---------------------------------------------------------------------- */
function InsightsView({ insights, healthScore, cur }) {
  return (
    <div>
      <SectionTitle eyebrow="Rule-based" title="AI insights" />
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", border: `6px solid ${healthScore >= 70 ? TEAL : healthScore >= 45 ? GOLD : RUST}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700 }}>
            {healthScore}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Financial health score</div>
            <div style={{ fontSize: 12, color: TEXT_DIM, maxWidth: 360 }}>Based on savings rate, budget adherence, and subscription load relative to income.</div>
          </div>
        </div>
      </Card>
      {insights.length === 0 ? (
        <Card><div style={{ color: TEXT_DIM, fontSize: 13 }}>Add more transactions to unlock personalized insights.</div></Card>
      ) : (
        insights.map((ins, i) => (
          <Card key={i} style={{ marginBottom: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
            <Sparkles size={16} color={GOLD} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{ins}</div>
          </Card>
        ))
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  QUICK ADD MODAL                                                        */
/* ---------------------------------------------------------------------- */
function QuickAddModal({ quickAdd, setQuickAdd, addQuickTx }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(14,36,28,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
      <div style={{ background: PAPER, borderRadius: 12, padding: 20, width: 340, border: `1px solid ${PAPER_DIM}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 600 }}>Add cash spend</div>
          <button onClick={() => setQuickAdd((q) => ({ ...q, open: false }))} style={{ background: "none", border: "none" }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input placeholder="What was it for?" value={quickAdd.merchant} onChange={(e) => setQuickAdd((q) => ({ ...q, merchant: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: `1px solid ${PAPER_DIM}`, fontSize: 13 }} />
          <input placeholder="Amount ₹" type="number" value={quickAdd.amount} onChange={(e) => setQuickAdd((q) => ({ ...q, amount: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: `1px solid ${PAPER_DIM}`, fontSize: 13 }} />
          <select value={quickAdd.category} onChange={(e) => setQuickAdd((q) => ({ ...q, category: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: `1px solid ${PAPER_DIM}`, fontSize: 13 }}>
            {CATEGORIES.map((c) => <option key={c.key}>{c.key}</option>)}
          </select>
          <div style={{ display: "flex", gap: 8 }}>
            <button disabled style={{ flex: 1, opacity: 0.5, background: PAPER_DIM, border: "none", borderRadius: 7, padding: 9, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Mic size={14} /> Voice</button>
            <button disabled style={{ flex: 1, opacity: 0.5, background: PAPER_DIM, border: "none", borderRadius: 7, padding: 9, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Camera size={14} /> Receipt</button>
          </div>
          <button onClick={addQuickTx} style={{ background: TEAL, color: "#fff", border: "none", borderRadius: 7, padding: 10, fontSize: 13.5, fontWeight: 600, marginTop: 4 }}>Add to ledger</button>
        </div>
      </div>
    </div>
  );
}
