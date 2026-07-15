# 🪙 Khaata Passbook (`spendsy-app`)
**Modern, Privacy-First Personal Expense Ledger & Budget Tracking Studio**

[![React 18](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Recharts](https://img.shields.io/badge/Recharts-2.12.7-FF6384?style=flat-square)](https://recharts.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-C7A24C?style=flat-square)](https://opensource.org/licenses/MIT)
[![Storage: localStorage](https://img.shields.io/badge/Persistence-localStorage-10B981?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

An ultra-sleek, zero-backend, client-side financial passbook built in React with a breathtaking **Matte Dark Obsidian, Gold & Black** aesthetic. Designed for users who want total control over their personal ledger without sharing private financial SMS data or bank credentials with third-party servers.

---

## ✨ Architecture & Key Features

### 1. ➕ Pure Manual Passbook Logging (`+ Record Transaction`)
* **Expense (−) vs. Income (+) Toggle:** Swiftly log daily expenditures or salary/payout inflows with single-click modal toggles.
* **Granular Attributes:** Record Merchant/Title, exact timestamp (`YYYY-MM-DD` native calendar picker), custom categories, and specific payment methods (`UPI / Bank Account`, `HDFC Bank Card`, `ICICI Account`, `SBI Account`, `Cash`, `Paytm Wallet`).
* **Instant Deletion (`Trash2`):** Every ledger row features an immediate inline removal trigger to correct typos or remove outdated records.

### 2. 👑 Matte Dark Obsidian & Gold Design System
* **Velvety Matte Obsidian (`#0C0C0E` / `#101014`):** Reduces eye strain and delivers a luxury, high-contrast financial terminal feel.
* **Metallic Champagne Gold (`#D4AF37`):** Highlights active tab indicators, primary interactive buttons, and critical numeric indicators.
* **Dynamic Color Tokens:** Uses vibrant emerald (`#10B981`) for positive cash flows and luminous crimson (`#FF5C5C`) for debits and over-budget alerts.

### 3. 📊 Visual Analytics & Pace Tracking
* **Category Breakdown (Donut Chart):** Interactive `Recharts` SVG pie chart mapping spending by category with custom stamp icons (`🍔`, `🛒`, `🚕`, `🎬`, etc.).
* **Weekly Spending Velocity:** 5-week bar chart analyzing spending pacing across the current month.
* **6-Month Trend Line:** Dual-axis comparison of total monthly income vs. total expenditures over the last two quarters.

### 4. 🧮 Smart Budgets, Goals & Subscription Engine
* **Pace-Aware Budgeting:** Set overall monthly ceilings and category-specific limits (`Food`, `Shopping`, `Transport`, etc.) with real-time progress bars and projected month-end overage alerts.
* **Automatic Subscription Detection:** Scans recurring debit patterns across months to identify active subscriptions (`Netflix`, `Spotify`, `Cult Fit`, `Electricity`, `House Rent`) and calculates exact monthly/annual burn rates.
* **Interactive Savings Goals:** Track milestone targets (`Emergency Fund`, `Vacation`) and allocate savings (`+ ₹1,000`, `+ ₹5,000`) instantly.

### 5. 🤖 Rule-Based Financial Health & AI Insights
* **Health Score (0–100):** Real-time algorithm calculating financial stability derived from savings rate (`(Income - Expense) / Income`), budget adherence, and subscription load.
* **Automated Spending Observations:** Flags weekend overspending, excessive food delivery counts (`Swiggy / Zomato`), month-over-month trend percentages, and cab/transport optimization opportunities.

---

## 🚀 Quickstart & Installation

### Option A: Standalone Browser Engine (Zero Build Required)
`spendsy-app` includes a standalone ES Module runner (`index.html`) using `@babel/standalone` and `esm.sh` import maps. No Node.js required!

1. Clone the repository:
   ```bash
   git clone https://github.com/ATRIK171005/spendsy-app.git
   cd spendsy-app
   ```
2. Start any local HTTP server (e.g., Python):
   ```bash
   python -m http.server 8083
   ```
3. Open your browser to:
   ```text
   http://localhost:8083/
   ```

### Option B: Vite / Create-React-App Integration
To drop this component directly into an existing React build pipeline:

1. Copy `ExpenseLedger.jsx` into your `src/components/` directory.
2. Ensure dependencies are installed:
   ```bash
   npm install recharts lucide-react
   ```
3. Import inside `App.jsx`:
   ```jsx
   import ExpenseLedger from "./components/ExpenseLedger";

   export default function App() {
     return <ExpenseLedger />;
   }
   ```

---

## 💾 Data Persistence Schema
All transaction logs, budget settings, and savings goals are serialized automatically in the browser's `window.localStorage` under the key:
`khaata_transactions_manual_v1`

### Sample Transaction Object:
```json
{
  "id": "manual_1721040000_a1b2",
  "merchant": "Swiggy Dinner",
  "amount": 610,
  "type": "debit",
  "category": "Food & Dining",
  "account": "HDFC Bank Card",
  "date": "2026-07-15T12:00:00.000Z",
  "source": "manual"
}
```

---

## 🛠️ Technology Stack
* **Frontend Framework:** React 18 (`useState`, `useMemo`, `useCallback`, `useEffect`)
* **Visualization Engine:** Recharts (`ResponsiveContainer`, `PieChart`, `BarChart`, `LineChart`)
* **Iconography:** Lucide React (`Wallet`, `Search`, `Plus`, `ListTree`, `Trash2`, `Sparkles`)
* **Styling:** CSS-in-JS + Scoped Style Sheets (IBM Plex Sans, Fraunces, IBM Plex Mono)

---

## 📄 License
This project is licensed under the **MIT License**. Created & maintained by **Atrik Samanta**.
