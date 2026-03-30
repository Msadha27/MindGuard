import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { formatINR as formatCurrency } from "../utils/currency";
import { CATEGORIES } from "../lib/categories";
import { QuickTopUp } from "./QuickTopUp";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { SpendingChart } from "./SpendingChart";
import { CategoryPieChart } from "./CategoryPieChart";
import { SavingsManager } from "./SavingsManager";
import { Settings } from "./Settings";
import { EditTransactionModal } from "./EditTransactionModal";

type Page = "dashboard" | "transactions" | "analytics" | "savings" | "settings";

interface WalletData {
  id: string;
  user_id: string;
  main_balance: number;
  savings_balance: number;
  created_at: string;
  updated_at: string;
}

// Removed CategoryLimit interface as we'll use Record<string, number>

export default function Dashboard({ user }: { user: any }) {
  const [wallet, setWallet] = useState<WalletData>({ 
    id: "", 
    user_id: user?.id || "", 
    main_balance: 0, 
    savings_balance: 0, 
    created_at: "", 
    updated_at: "" 
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categoryLimits, setCategoryLimits] = useState<Record<string, number>>({});
  const [spendingLimit, setSpendingLimit] = useState(10000);
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTopUp, setShowTopUp] = useState<"main" | "savings" | null>(null);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [overBudgetCategories, setOverBudgetCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    await Promise.all([fetchWallet(), fetchTransactions(), fetchSettings()]);
  }

  async function fetchWallet() {
    let { data: wallet } = await supabase.from('wallet').select().eq('user_id', user.id).maybeSingle();
    
    if (!wallet) {
      // 🔥 create wallet automatically
      await supabase.from('wallet').insert({
        user_id: user.id,
        main_balance: 0,
        savings_balance: 0,
      });

      // refetch wallet
      const { data: newWallet } = await supabase
        .from('wallet')
        .select()
        .eq('user_id', user.id)
        .single();

      wallet = newWallet;
    }

    if (wallet) setWallet(wallet);
  }

  async function fetchTransactions() {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })
      .limit(100);
    if (data) {
      setTransactions(data);
      checkCategoryBudgets(data);
    }
  }

  async function fetchSettings() {
    const { data } = await supabase.from("settings").select("*").single();
    if (data) {
      setSpendingLimit(data.spending_limit || 10000);
      setCategoryLimits(data.category_limits || {});
    }
  }

  function checkCategoryBudgets(txns: any[]) {
    const now = new Date();
    const monthTxns = txns.filter((t) => {
      const d = new Date(t.date);
      return t.type === "expense" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const over: string[] = [];
    Object.entries(categoryLimits).forEach(([category, limit]) => {
      const spent = monthTxns.filter((t) => t.category === category).reduce((s, t) => s + t.amount, 0);
      if (spent >= limit) over.push(category);
    });
    setOverBudgetCategories(over);
  }

  const monthlyExpenses = transactions
    .filter((t) => {
      const d = new Date(t.date);
      const now = new Date();
      return t.type === "expense" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, t) => s + t.amount, 0);


  const isOverspending = monthlyExpenses > spendingLimit;
  const spendingPercent = Math.min((monthlyExpenses / spendingLimit) * 100, 100);

  const streak = (() => {
    let days = 0;
    const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const dayMap: Record<string, number> = {};
    sorted.forEach((t) => {
      const d = new Date(t.date).toDateString();
      if (t.type === "expense") dayMap[d] = (dayMap[d] || 0) + t.amount;
    });
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      if (dayMap[key] && dayMap[key] > spendingLimit / 30) break;
      days++;
    }
    return days;
  })();

  // Category spending for this month
  const categorySpend: Record<string, number> = {};
  transactions.forEach((t) => {
    const d = new Date(t.date);
    const now = new Date();
    if (t.type === "expense" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      categorySpend[t.category] = (categorySpend[t.category] || 0) + t.amount;
    }
  });

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "transactions", label: "Transactions", icon: "📋" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "savings", label: "Savings Vault", icon: "🔒" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-30 flex flex-col transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-lg">🛡️</div>
            <div>
              <div className="font-bold text-white text-sm">MindGuard</div>
              <div className="text-purple-400 text-xs font-medium">Money</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-800 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>
          <button onClick={() => { setShowAddIncome(true); setSidebarOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 text-sm flex items-center gap-2 transition-colors">
            ➕ Add Income
          </button>
          <button onClick={() => { setShowAddExpense(true); setSidebarOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm flex items-center gap-2 transition-colors">
            ➖ Add Expense
          </button>
          <button onClick={() => { setShowTopUp("main"); setSidebarOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm flex items-center gap-2 transition-colors">
            💳 Top-Up Wallet
          </button>
          <button onClick={() => { setShowTopUp("savings"); setSidebarOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-sm flex items-center gap-2 transition-colors">
            🔒 Top-Up Savings
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setCurrentPage(item.id); setSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center gap-3 transition-all
                ${currentPage === item.id
                  ? "bg-purple-600 text-white font-medium"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 truncate mb-2">{user?.email}</p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full text-left px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm transition-colors"
          >
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white text-xl">☰</button>
          <span className="font-semibold text-sm">MindGuard Money</span>
          <span className="text-purple-400">🛡️</span>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-6xl mx-auto w-full">

          {/* ===== DASHBOARD PAGE ===== */}
          {currentPage === "dashboard" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Dashboard</h1>
                  <p className="text-gray-400 text-sm">Your financial overview</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">🔥 Streak</div>
                  <div className="text-xl font-bold text-orange-400">{streak} days</div>
                </div>
              </div>

              {/* OVERSPENDING ALERT */}
              {isOverspending && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                  <span className="text-2xl">🚨</span>
                  <div>
                    <p className="font-semibold">You are overspending this month!</p>
                    <p className="text-sm text-red-400/70">Control your expenses. You've exceeded your ₹{spendingLimit.toLocaleString("en-IN")} limit.</p>
                  </div>
                </div>
              )}

              {/* CATEGORY OVER-BUDGET ALERTS */}
              {overBudgetCategories.length > 0 && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <p className="text-yellow-400 font-semibold">⚠️ Category Budget Exceeded</p>
                  <p className="text-yellow-400/70 text-sm mt-1">
                    You've overspent in: {overBudgetCategories.join(", ")}
                  </p>
                </div>
              )}

              {/* ── BALANCE CARDS ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* MAIN BALANCE */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-blue-700/20 border border-indigo-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-indigo-300 font-medium">💳 Main Balance</span>
                    <button
                      onClick={() => setShowTopUp("main")}
                      className="text-xs px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 transition-colors"
                    >
                      + Top Up
                    </button>
                  </div>
                  <div className="text-3xl font-bold text-white">{formatCurrency(wallet.main_balance)}</div>
                  <p className="text-xs text-indigo-300/60 mt-2">Available for spending</p>
                </div>

                {/* SAVINGS BALANCE */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-600/30 to-violet-700/20 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-purple-300 font-medium">🔒 Savings Balance</span>
                    <button
                      onClick={() => setShowTopUp("savings")}
                      className="text-xs px-2 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 transition-colors"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="text-3xl font-bold text-white">{formatCurrency(wallet.savings_balance)}</div>
                  <p className="text-xs text-purple-300/60 mt-2">Protected savings 🛡️</p>
                </div>
              </div>

              {/* STATS ROW */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Main Balance</p>
                  <p className="text-lg font-bold text-emerald-400">{formatCurrency(wallet.main_balance)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">This Month's Spend</p>
                  <p className={`text-lg font-bold ${isOverspending ? "text-red-400" : "text-orange-400"}`}>
                    {formatCurrency(monthlyExpenses)}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 col-span-2 sm:col-span-1">
                  <p className="text-xs text-gray-500 mb-1">Total Savings</p>
                  <p className="text-lg font-bold text-amber-400">
                    {formatCurrency(wallet.savings_balance)}
                  </p>
                </div>
              </div>

              {/* MONTHLY SPENDING LIMIT BAR */}
              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Monthly Spending Limit</span>
                  <span className={isOverspending ? "text-red-400" : "text-gray-300"}>
                    {formatCurrency(monthlyExpenses)} / {formatCurrency(spendingLimit)}
                  </span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${spendingPercent >= 100 ? "bg-red-500" : spendingPercent >= 75 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                    style={{ width: `${spendingPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{Math.round(spendingPercent)}% of monthly budget used</p>
              </div>

              {/* CATEGORY BUDGET CARDS */}
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Category Budgets</h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {CATEGORIES.filter((c: any) => c.type === "expense").map((cat: any) => {
                    const limit = categoryLimits[cat.name] || cat.defaultLimit || 0;
                    const spent = categorySpend[cat.name] || 0;
                    const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                    const over = spent > limit && limit > 0;
                    return (
                      <div key={cat.name} className={`p-4 rounded-xl border ${over ? "bg-red-500/10 border-red-500/30" : "bg-gray-900 border-gray-800"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-base">{cat.emoji}</span>
                          {over && <span className="text-xs text-red-400">Over!</span>}
                        </div>
                        <p className="text-sm font-medium text-white">{cat.name}</p>
                        <p className="text-xs text-gray-400 mb-2">{formatCurrency(spent)} / {formatCurrency(limit)}</p>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct >= 75 ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RECENT TRANSACTIONS */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Recent Transactions</h2>
                  <button onClick={() => setCurrentPage("transactions")} className="text-xs text-purple-400 hover:text-purple-300">View all →</button>
                </div>
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-900 border border-gray-800">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{CATEGORIES.find((c: any) => c.name === t.category)?.emoji || (t.type === "income" ? "💰" : "💸")}</span>
                        <div>
                          <p className="text-sm font-medium">{t.category}</p>
                          <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString("en-IN")}</p>
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <p className="text-center text-gray-600 py-8">No transactions yet. Add your first one!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== OTHER PAGES ===== */}
          {currentPage === "transactions" && (
            <TransactionList
              transactions={transactions}
              onEdit={(t: any) => setEditingTransaction(t)}
              onRefresh={fetchAll}
            />
          )}
          {currentPage === "analytics" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Analytics</h1>
              <SpendingChart transactions={transactions} />
              <CategoryPieChart transactions={transactions} />
            </div>
          )}
          {currentPage === "savings" && (
            <SavingsManager 
              wallet={wallet} 
              onClose={() => setCurrentPage("dashboard")} 
              onComplete={fetchAll} 
            />
          )}
          {currentPage === "settings" && (
            <Settings
              settings={{ spending_limit: spendingLimit, category_limits: categoryLimits }}
              onClose={() => setCurrentPage("dashboard")}
              onComplete={() => { fetchSettings(); setCurrentPage("dashboard"); }}
            />
          )}
        </main>
      </div>

      {/* ===== MODALS ===== */}
      {showTopUp && (
        <QuickTopUp
          type={showTopUp}
          wallet={wallet}
          onClose={() => setShowTopUp(null)}
          onComplete={() => { fetchAll(); setShowTopUp(null); }}
        />
      )}
      {showAddIncome && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setShowAddIncome(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <TransactionForm type="income" onComplete={() => { fetchAll(); setShowAddIncome(false); }} onClose={() => setShowAddIncome(false)} />
          </div>
        </div>
      )}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md relative">
            <button onClick={() => setShowAddExpense(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
            <TransactionForm type="expense" onComplete={() => { fetchAll(); setShowAddExpense(false); }} onClose={() => setShowAddExpense(false)} />
          </div>
        </div>
      )}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onComplete={() => { fetchAll(); setEditingTransaction(null); }}
        />
      )}
    </div>
  );
}