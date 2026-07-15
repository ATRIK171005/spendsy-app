import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import {
  Wallet, Search, Plus, Target, Repeat, LayoutDashboard, ListTree,
  Sparkles, TrendingUp, TrendingDown, ChevronDown,
  X, Check, AlertTriangle, Trash2, Calendar, CreditCard, ArrowUpRight, ArrowDownRight
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  TOKENS & DESIGN SYSTEM (MATTE DARK GOLD & BLACK THEME)                */
/* ---------------------------------------------------------------------- */
const INK = "#0C0C0E";        // Ultra-deep matte obsidian header
const INK_DARK = "#060608";   // Pure matte black navigation tab bar
const PAPER = "#101014";      // Main background / app base matte charcoal-black
const PAPER_DIM = "#2A261D";  // Surface / subtle gold-tinted dark border
const GOLD = "#D4AF37";       // Luxurious metallic royal champagne gold
const RUST = "#FF5C5C";       // Luminous crimson red for debits / warnings
const TEAL = "#10B981";       // Sleek emerald gold-green for income / positive savings
const TEXT = "#F4F1EA";       // Crisp champagne off-white text
const TEXT_DIM = "#9E9A8C";   // Muted warm gold-tinted gray text

const CATEGORIES = [
  { key: "Food & Dining", icon: "🍔", color: "#FF6B6B" },
  { key: "Transport", icon: "🚕", color: "#D4AF37" },
  { key: "Shopping", icon: "🛒", color: "#B882CC" },
  { key: "Groceries", icon: "🛍", color: "#4E9F3D" },
  { key: "Entertainment", icon: "🎬", color: "#5998E2" },
  { key: "Healthcare", icon: "💊", color: "#E06888" },
  { key: "Utilities", icon: "⚡", color: "#E5C158" },
  { key: "Rent", icon: "🏠", color: "#A07652" },
  { key: "Recharge", icon: "📱", color: "#4DA6A6" },
  { key: "Education", icon: "🎓", color: "#7488CC" },
  { key: "Travel", icon: "✈️", color: "#10B981" },
  { key: "Bills", icon: "💼", color: "#A8884C" },
  { key: "Investments", icon: "💰", color: "#3B9ABF" },
  { key: "Other", icon: "📎", color: "#8E8976" },
];
const catMeta = (k) => CATEGORIES.find((c) => c.key === k) || CATEGORIES[CATEGORIES.length - 1];

const ACCOUNTS_LIST = [
  "UPI / Bank Account",
  "HDFC Bank Card",
  "ICICI Account",
  "SBI Account",
  "Axis Credit Card",
  "Cash",
  "Paytm Wallet"
];

const INR = (n) => "₹" + Math.round(Math.abs(n)).toLocaleString("en-IN");

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function monthKey(d) { return `${d.getFullYear()}-${d.getMonth()}`; }
function fmtDate(d) { 
  if (!(d instanceof Date) || isNaN(d.getTime())) return "Invalid Date";
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`; 
}

/* ---------------------------------------------------------------------- */
/*  LOCAL STORAGE & SEED DATA                                             */
/* ---------------------------------------------------------------------- */
const STORAGE_KEY = "khaata_transactions_manual_v1";

function seedTransactions() {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const mk = (day, monOffset = 0) => new Date(y, m + monOffset, day);
  
  const rows = [
    // This month
    ["Swiggy Order", 420, "debit", 3, "Food & Dining", "UPI / Bank Account"],
    ["Swiggy Dinner", 610, "debit", 9, "Food & Dining", "HDFC Bank Card"],
    ["Zomato Lunch", 350, "debit", 6, "Food & Dining", "UPI / Bank Account"],
    ["Uber Office Ride", 180, "debit", 2, "Transport", "UPI / Bank Account"],
    ["Ola Cab", 220, "debit", 8, "Transport", "Paytm Wallet"],
    ["Amazon Electronics", 2400, "debit", 5, "Shopping", "Axis Credit Card"],
    ["Myntra Apparel", 1800, "debit", 12, "Shopping", "HDFC Bank Card"],
    ["BigBasket Weekly Groceries", 1650, "debit", 4, "Groceries", "UPI / Bank Account"],
    ["DMart Supermarket", 2100, "debit", 14, "Groceries", "Cash"],
    ["Netflix Premium", 649, "debit", 1, "Entertainment", "Axis Credit Card"],
    ["Spotify Subscription", 119, "debit", 1, "Entertainment", "UPI / Bank Account"],
    ["Apollo Pharmacy", 460, "debit", 11, "Healthcare", "Cash"],
    ["BSES Electricity Bill", 2200, "debit", 7, "Utilities", "UPI / Bank Account"],
    ["House Rent", 18000, "debit", 1, "Rent", "SBI Account"],
    ["Airtel Mobile Recharge", 599, "debit", 2, "Recharge", "UPI / Bank Account"],
    ["Cult Fit Gym Membership", 1499, "debit", 3, "Healthcare", "HDFC Bank Card"],
    ["Groww Index Fund SIP", 5000, "debit", 5, "Investments", "UPI / Bank Account"],
    ["Company Payroll Salary", 68000, "credit", 1, "Other", "SBI Account"],
    ["UPI Friend Split Refund", 350, "credit", 13, "Other", "UPI / Bank Account"],
    // Last month
    ["Swiggy Order", 480, "debit", 5, "Food & Dining", "UPI / Bank Account", -1],
    ["Zomato Dinner", 610, "debit", 15, "Food & Dining", "HDFC Bank Card", -1],
    ["Uber Ride", 300, "debit", 9, "Transport", "UPI / Bank Account", -1],
    ["Amazon Shopping", 4100, "debit", 10, "Shopping", "Axis Credit Card", -1],
    ["BigBasket Groceries", 1500, "debit", 6, "Groceries", "UPI / Bank Account", -1],
    ["Netflix Premium", 649, "debit", 1, "Entertainment", "Axis Credit Card", -1],
    ["BSES Electricity Bill", 2050, "debit", 7, "Utilities", "UPI / Bank Account", -1],
    ["House Rent", 18000, "debit", 1, "Rent", "SBI Account", -1],
    ["Groww Index Fund SIP", 5000, "debit", 5, "Investments", "UPI / Bank Account", -1],
    ["Company Payroll Salary", 68000, "credit", 1, "Other", "SBI Account", -1],
  ];

  return rows.map(([merchant, amount, type, day, category, account, monOffset = 0], i) => ({
    id: "seed_" + i + "_" + Math.random().toString(36).slice(2, 6),
    merchant,
    amount,
    type,
    date: mk(day, monOffset),
    account,
    category,
    source: "manual",
  }));
}

function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedTransactions();
    const parsed = JSON.parse(raw);
    return parsed.map((t) => ({
      ...t,
      date: new Date(t.date),
    }));
  } catch (e) {
    console.warn("Failed to load or parse transactions from localStorage, loading seeds:", e);
    return seedTransactions();
  }
}

/* ---------------------------------------------------------------------- */
/*  REUSABLE UI COMPONENTS                                                */
/* ---------------------------------------------------------------------- */
function StampBadge({ cat, size = 34 }) {
  const meta = catMeta(cat);
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#1A1A22", border: `1.5px dashed ${meta.color}`,
        fontSize: size * 0.5, flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)"
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
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD, marginBottom: 2 }}>
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
        background: "#16161C",
        border: "1px solid rgba(212, 175, 55, 0.18)",
        borderRadius: 12,
        padding: 18,
        boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  MAIN APPLICATION                                                      */
/* ---------------------------------------------------------------------- */
export default function ExpenseLedger() {
  const [transactions, setTransactions] = useState(loadTransactions);
  const [tab, setTab] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [budgets, setBudgets] = useState({
    total: 45000,
    categories: { "Food & Dining": 8000, "Shopping": 6000, "Transport": 3000, "Entertainment": 2500, "Groceries": 5000 },
  });
  const [goals, setGoals] = useState([
    { id: "g1", name: "Emergency Fund", target: 100000, saved: 42000 },
    { id: "g2", name: "Goa Vacation", target: 30000, saved: 11000 },
  ]);
  
  // Modal State for Manual Entry
  const [modalOpen, setModalOpen] = useState(false);
  const [newTx, setNewTx] = useState({
    merchant: "",
    amount: "",
    type: "debit",
    category: "Food & Dining",
    account: "UPI / Bank Account",
    date: new Date().toISOString().slice(0, 10),
  });

  const [months, setMonths] = useState(() => {
    const now = new Date();
    return monthKey(now);
  });

  // Save to localStorage automatically on mutation
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error("Failed to persist transactions to localStorage", e);
    }
  }, [transactions]);

  /* ---- derived month list ---- */
  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map((t) => monthKey(t.date)));
    if (!set.has(monthKey(new Date()))) set.add(monthKey(new Date()));
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

  // Safe daily average calculation (avoids Day 1 division spike)
  const daysSoFar = (() => {
    const now = new Date();
    if (monthKey(now) === currentMonth) return Math.max(now.getDate(), 1);
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
      const dayNum = t.date.getDate();
      const wk = Math.min(Math.floor((dayNum - 1) / 7), 4);
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

  /* ---- subscriptions: recurring across >=2 months or known strings ---- */
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
      const variance = amounts.every((a) => Math.abs(a - avgAmt) / avgAmt < 0.08);
      const knownSubs = ["netflix", "spotify", "cult fit gym", "airtel", "landlord", "bses electricity", "groww sip", "prime video", "broadband"];
      const isKnown = knownSubs.some(k => merchant.toLowerCase().includes(k));
      if ((monthsSeen.size >= 2 && variance) || isKnown) {
        const latest = list.sort((a, b) => b.date - a.date)[0];
        // Safe month + 1 renewal calculation (capped at day 28 to prevent rollover bugs)
        const safeDay = Math.min(latest.date.getDate(), 28);
        const nextDate = new Date(latest.date.getFullYear(), latest.date.getMonth() + 1, safeDay);
        subs.push({ merchant, amount: Math.round(avgAmt), next: nextDate, category: latest.category });
      }
    });
    return subs.sort((a, b) => a.next - b.next);
  }, [transactions]);

  const monthlySubTotal = subscriptions.reduce((s, x) => s + x.amount, 0);

  /* ---- filtered transactions for Ledger tab ---- */
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
  const handleAddManualTx = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newTx.merchant.trim() || !newTx.amount || parseFloat(newTx.amount) <= 0) return;
    
    const parsedDate = new Date(newTx.date + "T12:00:00");
    const safeDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    const created = {
      id: "manual_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      merchant: newTx.merchant.trim(),
      amount: parseFloat(newTx.amount),
      type: newTx.type,
      category: newTx.type === "credit" ? "Other" : newTx.category,
      account: newTx.account,
      date: safeDate,
      source: "manual",
    };

    setTransactions((prev) => [created, ...prev]);
    setModalOpen(false);
    setNewTx({
      merchant: "",
      amount: "",
      type: "debit",
      category: "Food & Dining",
      account: "UPI / Bank Account",
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const removeTransaction = (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const recategorize = (id, newCat) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, category: newCat } : t)));
  };

  /* ---- rule-based insights ---- */
  const insights = useMemo(() => {
    const out = [];
    const weekendSpend = txThisMonth
      .filter((t) => t.type === "debit" && [0, 6].includes(t.date.getDay()))
      .reduce((s, t) => s + t.amount, 0);
    const weekdaySpend = cur.expense - weekendSpend;
    if (weekendSpend > weekdaySpend / 5 && weekendSpend > 1000) {
      out.push(`You spend disproportionately on weekends — ${INR(weekendSpend)} so far this month.`);
    }
    const swiggyCount = txThisMonth.filter((t) => t.merchant.toLowerCase().includes("swiggy") || t.merchant.toLowerCase().includes("zomato")).length;
    if (swiggyCount >= 3) {
      const swiggyTotal = txThisMonth.filter((t) => t.merchant.toLowerCase().includes("swiggy") || t.merchant.toLowerCase().includes("zomato")).reduce((s, t) => s + t.amount, 0);
      out.push(`Food delivery (Swiggy/Zomato) totals ${INR(swiggyTotal)} across ${swiggyCount} orders this month.`);
    }
    if (trendPct !== null && Number(trendPct) >= 15) {
      out.push(`Spending is ${trendPct}% higher than last month — mainly driven by ${byCategory[0]?.name || "discretionary categories"}.`);
    } else if (trendPct !== null && Number(trendPct) <= -15) {
      out.push(`Nice — spending is down ${Math.abs(trendPct)}% compared to last month.`);
    }
    const transportSpend = byCategory.find((c) => c.name === "Transport")?.value || 0;
    if (transportSpend > 1500) {
      out.push(`Two fewer cab rides a week could save around ${INR(transportSpend * 0.3)}/month — try public transit on short routes.`);
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

  /* ---- budget projected usage ---- */
  const totalDaysInMonth = new Date(yy, mm + 1, 0).getDate();
  const projectedMonthEnd = Math.round(dailyAvg * totalDaysInMonth);

  const NAV = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "transactions", label: "Ledger", icon: ListTree },
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
        ::-webkit-scrollbar-track { background: ${INK_DARK}; }
        .tabnum { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
        .ledgerline:hover { background: #1D1D26 !important; }
        button { cursor: pointer; font-family: inherit; transition: all 0.2s ease; }
        input, select, textarea { font-family: inherit; color: ${TEXT}; }
        input:focus, select:focus { outline: 1px solid ${GOLD}; border-color: ${GOLD} !important; }
      `}</style>

      {/* HEADER */}
      <div style={{ background: INK, color: TEXT, padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", borderBottom: "1px solid rgba(212, 175, 55, 0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg, ${GOLD}, #B8922A)`, display: "flex", alignItems: "center", justifyContent: "center", color: INK_DARK, fontWeight: 700, fontSize: 18, fontFamily: "'Fraunces', serif", boxShadow: "0 0 15px rgba(212, 175, 55, 0.35)" }}>₹</div>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, letterSpacing: "0.01em", color: TEXT }}>Khaata</div>
            <div style={{ fontSize: 10.5, letterSpacing: "0.14em", color: GOLD, textTransform: "uppercase", fontFamily: "'IBM Plex Mono', monospace" }}>your spending passbook</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <select
            value={currentMonth}
            onChange={(e) => setMonths(e.target.value)}
            style={{ background: "#16161C", color: TEXT, border: `1px solid rgba(212, 175, 55, 0.35)`, borderRadius: 8, padding: "7px 12px", fontSize: 13 }}
          >
            {availableMonths.map((k) => {
              const [ky, km] = k.split("-").map(Number);
              return <option key={k} value={k} style={{ background: "#16161C", color: TEXT }}>{MONTH_NAMES[km]} {ky}</option>;
            })}
          </select>
          <button
            onClick={() => setModalOpen(true)}
            style={{ background: `linear-gradient(135deg, ${GOLD}, #C09A2E)`, color: INK_DARK, border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 15px rgba(212, 175, 55, 0.25)" }}
          >
            <Plus size={16} /> Add Spend / Income
          </button>
        </div>
      </div>

      {/* TAB BAR */}
      <div style={{ display: "flex", gap: 4, padding: "0 16px", background: INK_DARK, overflowX: "auto", borderBottom: "1px solid rgba(212, 175, 55, 0.12)" }}>
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = tab === n.key;
          return (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              style={{
                background: active ? "#16161C" : "transparent",
                color: active ? GOLD : "rgba(244, 241, 234, 0.55)",
                border: active ? "1px solid rgba(212, 175, 55, 0.3)" : "none",
                borderBottom: "none",
                borderRadius: "8px 8px 0 0",
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                display: "flex", alignItems: "center", gap: 6,
                whiteSpace: "nowrap",
                boxShadow: active ? "0 -4px 12px rgba(212, 175, 55, 0.1)" : "none"
              }}
            >
              <Icon size={15} /> {n.label}
            </button>
          );
        })}
      </div>

      {/* BODY */}
      <div style={{ padding: 22, maxWidth: 1180, margin: "0 auto", width: "100%", flex: 1 }}>
        {tab === "dashboard" && (
          <Dashboard
            cur={cur} prev={prev} trendPct={trendPct} dailyAvg={dailyAvg}
            biggestExpense={biggestExpense} byCategory={byCategory} weeklySpend={weeklySpend}
            sixMonthTrend={sixMonthTrend} byMerchant={byMerchant} budgets={budgets}
            healthScore={healthScore} subscriptions={subscriptions} insights={insights}
            monthLabel={`${MONTH_NAMES[mm]} ${yy}`}
            openModal={() => setModalOpen(true)}
          />
        )}
        {tab === "transactions" && (
          <TransactionsView
            filteredTx={filteredTx} search={search} setSearch={setSearch}
            filterCat={filterCat} setFilterCat={setFilterCat} recategorize={recategorize}
            removeTransaction={removeTransaction} openModal={() => setModalOpen(true)}
          />
        )}
        {tab === "budgets" && (
          <BudgetsView budgets={budgets} setBudgets={setBudgets} byCategory={byCategory} cur={cur} projectedMonthEnd={projectedMonthEnd} />
        )}
        {tab === "subscriptions" && <SubscriptionsView subscriptions={subscriptions} monthlySubTotal={monthlySubTotal} />}
        {tab === "goals" && <GoalsView goals={goals} setGoals={setGoals} monthlySavings={Math.max(0, cur.net)} />}
        {tab === "insights" && <InsightsView insights={insights} healthScore={healthScore} cur={cur} />}
      </div>

      {/* MANUAL TRANSACTION ENTRY MODAL */}
      {modalOpen && (
        <AddTransactionModal
          newTx={newTx}
          setNewTx={setNewTx}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAddManualTx}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  DASHBOARD COMPONENT                                                   */
/* ---------------------------------------------------------------------- */
function StatCard({ label, value, sub, tone }) {
  const color = tone === "up" ? RUST : tone === "down" ? TEAL : GOLD;
  return (
    <Card style={{ flex: "1 1 180px", position: "relative", overflow: "hidden" }}>
      <div style={{ fontSize: 11.5, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "'IBM Plex Mono', monospace" }}>{label}</div>
      <div className="tabnum" style={{ fontSize: 26, fontWeight: 700, color, marginTop: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: TEXT_DIM, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

function Dashboard({ cur, prev, trendPct, dailyAvg, biggestExpense, byCategory, weeklySpend, sixMonthTrend, byMerchant, budgets, healthScore, subscriptions, insights, monthLabel, openModal }) {
  const savingsRate = cur.income ? Math.round(((cur.income - cur.expense) / cur.income) * 100) : 0;
  return (
    <div>
      <SectionTitle
        eyebrow={monthLabel}
        title="This month, at a glance"
        right={
          <button onClick={openModal} style={{ background: "rgba(212, 175, 55, 0.12)", color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: "7px 14px", fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={14} /> Record Manual Entry
          </button>
        }
      />
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard label="Income" value={INR(cur.income)} />
        <StatCard label="Expenses" value={INR(cur.expense)} tone="up" sub={trendPct !== null ? `${trendPct > 0 ? "+" : ""}${trendPct}% vs last month` : null} />
        <StatCard label="Savings" value={INR(cur.net)} tone={cur.net >= 0 ? "down" : "up"} sub={`${savingsRate}% savings rate`} />
        <StatCard label="Daily average" value={INR(dailyAvg)} sub="spend per day so far" />
        <StatCard label="Biggest expense" value={biggestExpense ? INR(biggestExpense.amount) : "—"} sub={biggestExpense?.merchant} />
        <StatCard label="Financial health" value={healthScore + " / 100"} tone={healthScore >= 60 ? "down" : "up"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionTitle eyebrow="Breakdown" title="Spending by category" />
          {byCategory.length === 0 ? (
            <div style={{ color: TEXT_DIM, fontSize: 13, padding: "24px 0", textAlign: "center" }}>No expenses recorded yet this month. Click "+ Add Spend / Income" above to begin.</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ width: 190, height: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={84} paddingAngle={3}>
                      {byCategory.map((c, i) => <Cell key={i} fill={c.color} stroke="#16161C" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#181820", border: "1px solid #D4AF37", borderRadius: 8, color: TEXT }} formatter={(v) => INR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                {byCategory.slice(0, 6).map((c) => (
                  <div key={c.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, padding: "6px 0", borderBottom: `1px dotted rgba(212, 175, 55, 0.15)` }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 9, height: 9, borderRadius: "50%", background: c.color, display: "inline-block", boxShadow: `0 0 6px ${c.color}` }} />
                      {c.name}
                    </span>
                    <span className="tabnum" style={{ fontWeight: 600 }}>{INR(c.value)}</span>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.12)" />
              <XAxis dataKey="week" fontSize={12} stroke={TEXT_DIM} />
              <YAxis fontSize={11} stroke={TEXT_DIM} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip contentStyle={{ background: "#181820", border: "1px solid #D4AF37", borderRadius: 8, color: TEXT }} formatter={(v) => INR(v)} />
              <Bar dataKey="amount" fill={GOLD} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card>
          <SectionTitle eyebrow="6-month view" title="Income vs. expenses" />
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={sixMonthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 175, 55, 0.12)" />
              <XAxis dataKey="month" fontSize={12} stroke={TEXT_DIM} />
              <YAxis fontSize={11} stroke={TEXT_DIM} tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip contentStyle={{ background: "#181820", border: "1px solid #D4AF37", borderRadius: 8, color: TEXT }} formatter={(v) => INR(v)} />
              <Legend wrapperStyle={{ fontSize: 12, color: TEXT }} />
              <Line type="monotone" dataKey="income" stroke={TEAL} strokeWidth={2.5} dot={{ fill: TEAL, r: 4 }} name="Income" />
              <Line type="monotone" dataKey="expense" stroke={RUST} strokeWidth={2.5} dot={{ fill: RUST, r: 4 }} name="Expense" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <SectionTitle eyebrow="Merchants" title="Top spending" />
          {byMerchant.slice(0, 5).map((m, i) => (
            <div key={m.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? `1px dotted rgba(212, 175, 55, 0.15)` : "none" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: TEXT }}>{m.name}</div>
                <div style={{ fontSize: 11, color: TEXT_DIM }}>{m.count} {m.count === 1 ? "payment" : "payments"} · avg {INR(m.avg)}</div>
              </div>
              <div className="tabnum" style={{ fontSize: 14.5, fontWeight: 700, color: GOLD }}>{INR(m.spent)}</div>
            </div>
          ))}
          {byMerchant.length === 0 && <div style={{ color: TEXT_DIM, fontSize: 13 }}>Nothing yet.</div>}
        </Card>
      </div>

      <Card>
        <SectionTitle eyebrow={`${subscriptions.length} active`} title="Upcoming bills & subscriptions" />
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 6 }}>
          {subscriptions.slice(0, 6).map((s) => (
            <div key={s.merchant} style={{ minWidth: 160, background: "#121216", border: `1px solid rgba(212, 175, 55, 0.25)`, borderRadius: 10, padding: 12, flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <StampBadge cat={s.category} size={28} />
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{s.merchant}</div>
              </div>
              <div className="tabnum" style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{INR(s.amount)}/mo</div>
              <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 4 }}>renews {fmtDate(s.next)}</div>
            </div>
          ))}
          {subscriptions.length === 0 && <div style={{ color: TEXT_DIM, fontSize: 13, padding: "8px 0" }}>No recurring subscriptions detected right now.</div>}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  TRANSACTIONS LEDGER COMPONENT (WITH DELETE / EDIT)                    */
/* ---------------------------------------------------------------------- */
function TransactionsView({ filteredTx, search, setSearch, filterCat, setFilterCat, recategorize, removeTransaction, openModal }) {
  const [openCatFor, setOpenCatFor] = useState(null);
  return (
    <div>
      <SectionTitle
        eyebrow={`${filteredTx.length} entries`}
        title="Transaction ledger"
        right={
          <button onClick={openModal} style={{ background: `linear-gradient(135deg, ${GOLD}, #C09A2E)`, color: INK_DARK, border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={15} /> + Record Transaction
          </button>
        }
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 240px" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: GOLD }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchant, amount, category, payment method…"
            style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: 8, border: `1px solid rgba(212, 175, 55, 0.3)`, background: "#16161C", color: TEXT, fontSize: 13.5 }}
          />
        </div>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid rgba(212, 175, 55, 0.3)`, background: "#16161C", color: TEXT, fontSize: 13.5 }}>
          <option>All</option>
          {CATEGORIES.map((c) => <option key={c.key}>{c.key}</option>)}
        </select>
      </div>

      <Card style={{ padding: 0, overflow: "visible" }}>
        {filteredTx.length === 0 && (
          <div style={{ padding: 32, textAlign: "center", color: TEXT_DIM, fontSize: 13.5 }}>
            No transactions found. Click <strong style={{ color: GOLD }}>"+ Record Transaction"</strong> to log your first spend manually.
          </div>
        )}
        {filteredTx.map((t, i) => (
          <div
            key={t.id}
            className="ledgerline"
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
              borderBottom: i < filteredTx.length - 1 ? `1px dashed rgba(212, 175, 55, 0.15)` : "none",
            }}
          >
            <StampBadge cat={t.category} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.merchant}</div>
              <div style={{ fontSize: 11.5, color: TEXT_DIM, marginTop: 2 }}>
                {fmtDate(t.date)} · <span style={{ color: GOLD }}>{t.account}</span> · <span style={{ color: TEAL }}>Manual Entry</span>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setOpenCatFor(openCatFor === t.id ? null : t.id)}
                style={{ fontSize: 12, background: "#1A1A22", border: "1px solid rgba(212, 175, 55, 0.25)", borderRadius: 14, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5, color: TEXT }}
              >
                {t.category} <ChevronDown size={13} color={GOLD} />
              </button>
              {openCatFor === t.id && (
                <div style={{ position: "absolute", right: 0, top: 32, background: "#1C1C24", border: `1px solid ${GOLD}`, borderRadius: 10, zIndex: 20, boxShadow: "0 10px 30px rgba(0,0,0,0.7)", maxHeight: 220, overflowY: "auto", width: 180 }}>
                  {CATEGORIES.map((c) => (
                    <div
                      key={c.key}
                      onClick={() => { recategorize(t.id, c.key); setOpenCatFor(null); }}
                      style={{ padding: "8px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: TEXT }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#262632"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <span>{c.icon}</span>{c.key}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="tabnum" style={{ fontSize: 15, fontWeight: 700, color: t.type === "credit" ? TEAL : RUST, minWidth: 95, textAlign: "right" }}>
              {t.type === "credit" ? "+" : "−"}{INR(t.amount)}
            </div>
            <button
              onClick={() => removeTransaction(t.id)}
              title="Delete transaction"
              style={{ background: "transparent", border: "none", color: TEXT_DIM, padding: "6px" }}
              onMouseEnter={(e) => e.currentTarget.style.color = RUST}
              onMouseLeave={(e) => e.currentTarget.style.color = TEXT_DIM}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  BUDGETS COMPONENT                                                     */
/* ---------------------------------------------------------------------- */
function BudgetsView({ budgets, setBudgets, byCategory, cur, projectedMonthEnd }) {
  const overallPct = budgets.total ? Math.min(150, Math.round((cur.expense / budgets.total) * 100)) : 0;
  const barColor = (pct) => (pct >= 100 ? RUST : pct >= 90 ? "#E5A823" : pct >= 75 ? GOLD : TEAL);

  return (
    <div>
      <SectionTitle eyebrow="This month" title="Budget tracking" />
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>Overall budget</div>
            <div style={{ fontSize: 12, color: TEXT_DIM }}>{INR(cur.expense)} spent of {INR(budgets.total)}</div>
          </div>
          <input
            type="number"
            value={budgets.total}
            onChange={(e) => setBudgets((b) => ({ ...b, total: Number(e.target.value) }))}
            style={{ width: 120, padding: "7px 10px", borderRadius: 8, border: `1px solid rgba(212, 175, 55, 0.4)`, background: "#121216", color: TEXT, fontSize: 13.5, fontWeight: 600 }}
          />
        </div>
        <div style={{ height: 12, background: "#101014", borderRadius: 6, overflow: "hidden", border: "1px solid rgba(212, 175, 55, 0.15)" }}>
          <div style={{ height: "100%", width: `${overallPct}%`, background: barColor(overallPct), transition: "width .3s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12, color: TEXT_DIM }}>
          <span>{overallPct}% used</span>
          <span>Projected month-end: <b className="tabnum" style={{ color: projectedMonthEnd > budgets.total ? RUST : GOLD }}>{INR(projectedMonthEnd)}</b></span>
        </div>
        {overallPct >= 90 && (
          <div style={{ marginTop: 10, fontSize: 12.5, background: "rgba(255, 92, 92, 0.15)", color: RUST, border: `1px solid ${RUST}`, padding: "8px 12px", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={16} /> You've used {overallPct}% of your monthly budget{overallPct >= 100 ? " — over budget." : "."}
          </div>
        )}
      </Card>

      <SectionTitle title="Category budgets" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 16 }}>
        {CATEGORIES.filter((c) => c.key !== "Other").map((c) => {
          const spent = byCategory.find((b) => b.name === c.key)?.value || 0;
          const budget = budgets.categories[c.key];
          const pct = budget ? Math.min(150, Math.round((spent / budget) * 100)) : null;
          return (
            <Card key={c.key}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: TEXT }}>
                  <span>{c.icon}</span>{c.key}
                </div>
                <input
                  type="number"
                  placeholder="set"
                  value={budget || ""}
                  onChange={(e) => setBudgets((b) => ({ ...b, categories: { ...b.categories, [c.key]: Number(e.target.value) } }))}
                  style={{ width: 80, padding: "5px 8px", borderRadius: 6, border: `1px solid rgba(212, 175, 55, 0.3)`, background: "#121216", color: TEXT, fontSize: 12 }}
                />
              </div>
              {budget ? (
                <>
                  <div style={{ height: 8, background: "#101014", borderRadius: 5, overflow: "hidden", border: "1px solid rgba(212, 175, 55, 0.12)" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: barColor(pct) }} />
                  </div>
                  <div style={{ fontSize: 11.5, color: TEXT_DIM, marginTop: 6 }}>{INR(spent)} of {INR(budget)} ({pct}%)</div>
                </>
              ) : (
                <div style={{ fontSize: 11.5, color: TEXT_DIM }}>{INR(spent)} spent — no budget set</div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  SUBSCRIPTIONS COMPONENT                                               */
/* ---------------------------------------------------------------------- */
function SubscriptionsView({ subscriptions, monthlySubTotal }) {
  return (
    <div>
      <SectionTitle eyebrow={`${subscriptions.length} detected`} title="Recurring payments & subscriptions" />
      <div style={{ display: "flex", gap: 14, marginBottom: 16, flexWrap: "wrap" }}>
        <StatCard label="Monthly total" value={INR(monthlySubTotal)} />
        <StatCard label="Annual total" value={INR(monthlySubTotal * 12)} />
        <StatCard label="Active subscriptions" value={subscriptions.length} />
      </div>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {subscriptions.map((s, i) => (
          <div key={s.merchant} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderBottom: i < subscriptions.length - 1 ? `1px dashed rgba(212, 175, 55, 0.15)` : "none" }}>
            <StampBadge cat={s.category} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{s.merchant}</div>
              <div style={{ fontSize: 11.5, color: TEXT_DIM }}>Next renewal: {fmtDate(s.next)} · <span style={{ color: GOLD }}>{s.category}</span></div>
            </div>
            <div className="tabnum" style={{ fontWeight: 700, fontSize: 16, color: GOLD }}>{INR(s.amount)}/mo</div>
          </div>
        ))}
        {subscriptions.length === 0 && <div style={{ padding: 22, color: TEXT_DIM, fontSize: 13.5 }}>Nothing detected yet — recurring merchants appear automatically when logged across two or more months.</div>}
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  GOALS COMPONENT                                                       */
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 16 }}>
        {goals.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);
          return (
            <Card key={g.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: TEXT }}>{g.name}</div>
                <button onClick={() => remove(g.id)} style={{ background: "none", border: "none", color: TEXT_DIM }}><Trash2 size={15} /></button>
              </div>
              <div style={{ fontSize: 12.5, color: TEXT_DIM, margin: "6px 0 10px" }}>{INR(g.saved)} of {INR(g.target)} ({pct}%)</div>
              <div style={{ height: 10, background: "#101014", borderRadius: 5, overflow: "hidden", border: "1px solid rgba(212, 175, 55, 0.15)" }}>
                <div style={{ height: "100%", width: `${Math.min(100, pct)}%`, background: TEAL }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={() => allocate(g.id, 1000)} style={{ fontSize: 12, background: "#1A1A22", border: `1px solid rgba(212, 175, 55, 0.25)`, borderRadius: 6, padding: "6px 10px", color: GOLD }}>+ ₹1,000</button>
                <button onClick={() => allocate(g.id, 5000)} style={{ fontSize: 12, background: "#1A1A22", border: `1px solid rgba(212, 175, 55, 0.25)`, borderRadius: 6, padding: "6px 10px", color: GOLD }}>+ ₹5,000</button>
              </div>
            </Card>
          );
        })}
      </div>
      <Card style={{ maxWidth: 440 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: GOLD }}>New savings goal</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input placeholder="Goal name" value={newGoal.name} onChange={(e) => setNewGoal((g) => ({ ...g, name: e.target.value }))} style={{ flex: 1, minWidth: 130, padding: "9px 12px", borderRadius: 8, border: `1px solid rgba(212, 175, 55, 0.3)`, background: "#121216", color: TEXT, fontSize: 13.5 }} />
          <input placeholder="Target ₹" type="number" value={newGoal.target} onChange={(e) => setNewGoal((g) => ({ ...g, target: e.target.value }))} style={{ width: 110, padding: "9px 12px", borderRadius: 8, border: `1px solid rgba(212, 175, 55, 0.3)`, background: "#121216", color: TEXT, fontSize: 13.5 }} />
          <button onClick={addGoal} style={{ background: `linear-gradient(135deg, ${GOLD}, #C09A2E)`, color: INK_DARK, border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13.5, fontWeight: 700 }}>Add</button>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  INSIGHTS COMPONENT                                                    */
/* ---------------------------------------------------------------------- */
function InsightsView({ insights, healthScore, cur }) {
  return (
    <div>
      <SectionTitle eyebrow="Rule-based" title="AI insights" />
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", border: `6px solid ${healthScore >= 70 ? TEAL : healthScore >= 45 ? GOLD : RUST}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 700, color: TEXT, boxShadow: "0 0 15px rgba(212, 175, 55, 0.2)" }}>
            {healthScore}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: TEXT }}>Financial health score</div>
            <div style={{ fontSize: 12.5, color: TEXT_DIM, maxWidth: 380, marginTop: 4 }}>Based on savings rate, budget adherence, and subscription load relative to income.</div>
          </div>
        </div>
      </Card>
      {insights.length === 0 ? (
        <Card><div style={{ color: TEXT_DIM, fontSize: 13.5 }}>Log more manual transactions to unlock customized spending insights.</div></Card>
      ) : (
        insights.map((ins, i) => (
          <Card key={i} style={{ marginBottom: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Sparkles size={18} color={GOLD} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 14, lineHeight: 1.5, color: TEXT }}>{ins}</div>
          </Card>
        ))
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  ADD TRANSACTION MANUAL MODAL (MATTE DARK GOLD THEME)                  */
/* ---------------------------------------------------------------------- */
function AddTransactionModal({ newTx, setNewTx, onClose, onSubmit }) {
  const isDebit = newTx.type === "debit";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(6, 6, 8, 0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16, backdropFilter: "blur(6px)" }}>
      <div style={{ background: "#16161C", borderRadius: 16, padding: 26, width: "100%", maxWidth: 450, border: `1px solid ${GOLD}`, boxShadow: "0 25px 60px rgba(0,0,0,0.8)" }}>
        
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, color: TEXT }}>Record Transaction</div>
            <div style={{ fontSize: 11.5, color: GOLD, fontFamily: "'IBM Plex Mono', monospace", marginTop: 2 }}>Manual Passbook Entry</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT_DIM, padding: 4 }}><X size={22} /></button>
        </div>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Type Toggle Pills */}
          <div style={{ display: "flex", background: "#0C0C0E", padding: 5, borderRadius: 10, border: "1px solid rgba(212, 175, 55, 0.2)" }}>
            <button
              type="button"
              onClick={() => setNewTx((q) => ({ ...q, type: "debit" }))}
              style={{
                flex: 1, padding: "9px 14px", borderRadius: 8, border: "none",
                background: isDebit ? RUST : "transparent",
                color: isDebit ? "#fff" : TEXT_DIM,
                fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: isDebit ? "0 2px 10px rgba(255, 92, 92, 0.4)" : "none"
              }}
            >
              <ArrowDownRight size={17} /> Expense (−)
            </button>
            <button
              type="button"
              onClick={() => setNewTx((q) => ({ ...q, type: "credit" }))}
              style={{
                flex: 1, padding: "9px 14px", borderRadius: 8, border: "none",
                background: !isDebit ? TEAL : "transparent",
                color: !isDebit ? "#fff" : TEXT_DIM,
                fontWeight: 600, fontSize: 13.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                boxShadow: !isDebit ? "0 2px 10px rgba(16, 185, 129, 0.4)" : "none"
              }}
            >
              <ArrowUpRight size={17} /> Income (+)
            </button>
          </div>

          {/* Merchant / Title */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: GOLD, marginBottom: 6 }}>Merchant / Title *</label>
            <input
              required
              autoFocus
              placeholder={isDebit ? "e.g., Swiggy, House Rent, Amazon" : "e.g., Monthly Salary, Freelance Payout"}
              value={newTx.merchant}
              onChange={(e) => setNewTx((q) => ({ ...q, merchant: e.target.value }))}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: `1px solid rgba(212, 175, 55, 0.35)`, background: "#101014", color: TEXT, fontSize: 14 }}
            />
          </div>

          {/* Amount and Date Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: GOLD, marginBottom: 6 }}>Amount (₹) *</label>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                value={newTx.amount}
                onChange={(e) => setNewTx((q) => ({ ...q, amount: e.target.value }))}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: `1px solid rgba(212, 175, 55, 0.35)`, background: "#101014", color: GOLD, fontSize: 15, fontWeight: 700 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: GOLD, marginBottom: 6 }}>Date *</label>
              <input
                required
                type="date"
                value={newTx.date}
                onChange={(e) => setNewTx((q) => ({ ...q, date: e.target.value }))}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: `1px solid rgba(212, 175, 55, 0.35)`, background: "#101014", color: TEXT, fontSize: 13.5 }}
              />
            </div>
          </div>

          {/* Category Dropdown (Only for Expenses) */}
          {isDebit && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: GOLD, marginBottom: 6 }}>Category *</label>
              <select
                value={newTx.category}
                onChange={(e) => setNewTx((q) => ({ ...q, category: e.target.value }))}
                style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: `1px solid rgba(212, 175, 55, 0.35)`, background: "#101014", color: TEXT, fontSize: 14 }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key} style={{ background: "#16161C", color: TEXT }}>
                    {c.icon}  {c.key}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Payment Method / Account */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: GOLD, marginBottom: 6 }}>Payment Method / Account</label>
            <select
              value={newTx.account}
              onChange={(e) => setNewTx((q) => ({ ...q, account: e.target.value }))}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 8, border: `1px solid rgba(212, 175, 55, 0.35)`, background: "#101014", color: TEXT, fontSize: 14 }}
            >
              {ACCOUNTS_LIST.map((acc) => (
                <option key={acc} value={acc} style={{ background: "#16161C", color: TEXT }}>{acc}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, background: "transparent", color: TEXT_DIM, border: `1px solid rgba(212, 175, 55, 0.3)`, borderRadius: 8, padding: 12, fontSize: 13.5, fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ flex: 2, background: isDebit ? RUST : `linear-gradient(135deg, ${GOLD}, #C09A2E)`, color: isDebit ? "#fff" : INK_DARK, border: "none", borderRadius: 8, padding: 12, fontSize: 14.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 15px rgba(212, 175, 55, 0.3)" }}
            >
              <Check size={18} /> Save to Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
