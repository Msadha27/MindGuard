import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, ArrowDownCircle, ArrowUpCircle,
  PiggyBank, Settings as SettingsIcon, LogOut,
  TrendingUp, TrendingDown, Wallet, Menu, X,
  Plus, Target, Bot
} from 'lucide-react';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { SpendingChart } from './SpendingChart';
import { CategoryPieChart } from './CategoryPieChart';
import { AICoach } from './AICoach';
import { SavingsManager } from './SavingsManager';
import { Settings } from './Settings';
import { QuickTopUp } from './QuickTopUp';
import { formatINR } from '../utils/currency';

type Page = 'dashboard' | 'transactions' | 'analytics' | 'savings' | 'ai' | 'settings';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [showSavingsManager, setShowSavingsManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTopUp, setShowTopUp] = useState<'main' | 'savings' | null>(null);

  useEffect(() => {
    if (user) {
      initUser();
      loadData();
    }
  }, [user]);

  const initUser = async () => {
    if (!user) return;
    const { data: w } = await supabase.from('wallet').select().eq('user_id', user.id).maybeSingle();
    if (!w) await supabase.from('wallet').insert({ user_id: user.id, main_balance: 0, savings_balance: 0 });
    const { data: s } = await supabase.from('settings').select().eq('user_id', user.id).maybeSingle();
    if (!s) await supabase.from('settings').insert({ user_id: user.id, spending_limit: 10000, savings_goal: 50000, category_limits: {} });
  };

  const loadData = async () => {
    if (!user) return;
    const [w, t, s] = await Promise.all([
      supabase.from('wallet').select().eq('user_id', user.id).maybeSingle(),
      supabase.from('transactions').select().eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('settings').select().eq('user_id', user.id).maybeSingle(),
    ]);
    setWallet(w.data);
    setTransactions(t.data || []);
    setSettings(s.data);
  };

  const now = new Date();
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' &&
      new Date(t.date).getMonth() === now.getMonth() &&
      new Date(t.date).getFullYear() === now.getFullYear())
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const spendingPct = settings?.spending_limit > 0 ? Math.min(100, (monthlyExpenses / settings.spending_limit) * 100) : 0;
  const savingsPct = settings?.savings_goal > 0 && wallet ? Math.min(100, (Number(wallet.savings_balance) / settings.savings_goal) * 100) : 0;

  const isOverspending = settings?.spending_limit > 0 && monthlyExpenses > settings.spending_limit;

  // Category limit alerts
  const catAlerts = settings?.category_limits
    ? Object.entries(settings.category_limits).filter(([cat, limit]: any) => {
      const spent = transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((s: number, t: any) => s + Number(t.amount), 0);
      return spent > limit;
    }).map(([cat]) => cat)
    : [];

  if (!wallet) return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
      <div className="text-emerald-400 text-lg animate-pulse">Loading MindGuard...</div>
    </div>
  );

  const totalBalance = Number(wallet.main_balance) + Number(wallet.savings_balance);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowDownCircle },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'savings', label: 'Savings', icon: PiggyBank },
    { id: 'ai', label: 'AI Coach', icon: Bot },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardHome
          wallet={wallet} totalBalance={totalBalance} totalExpenses={totalExpenses}
          totalIncome={totalIncome} monthlyExpenses={monthlyExpenses}
          settings={settings} spendingPct={spendingPct} savingsPct={savingsPct}
          isOverspending={isOverspending} catAlerts={catAlerts}
          transactions={transactions}
          onAddIncome={() => { setTransactionType('income'); setShowTransactionForm(true); }}
          onAddExpense={() => { setTransactionType('expense'); setShowTransactionForm(true); }}
          onManageSavings={() => setShowSavingsManager(true)}
          onTopUpMain={() => setShowTopUp('main')}
          onTopUpSavings={() => setShowTopUp('savings')}
        />;
      case 'transactions':
        return <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-white text-xl font-bold">All Transactions</h2>
            <div className="flex gap-2">
              <button onClick={() => { setTransactionType('income'); setShowTransactionForm(true); }}
                className="bg-emerald-500 px-3 py-2 rounded-lg text-black text-sm font-semibold flex items-center gap-1">
                <Plus className="w-4 h-4" /> Income
              </button>
              <button onClick={() => { setTransactionType('expense'); setShowTransactionForm(true); }}
                className="bg-red-500 px-3 py-2 rounded-lg text-white text-sm font-semibold flex items-center gap-1">
                <Plus className="w-4 h-4" /> Expense
              </button>
            </div>
          </div>
          <TransactionList transactions={transactions} onDelete={loadData} />
        </div>;
      case 'analytics':
        return <div className="space-y-6">
          <h2 className="text-white text-xl font-bold">Analytics</h2>
          <div className="bg-[#111827] rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Spending by Category</h3>
            <SpendingChart transactions={transactions} />
          </div>
          <div className="bg-[#111827] rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Category Distribution</h3>
            <div className="flex justify-center">
              <CategoryPieChart transactions={transactions} />
            </div>
          </div>
        </div>;
      case 'savings':
        return <div className="space-y-6">
          <h2 className="text-white text-xl font-bold">Savings Vault 🔒</h2>
          <div className="bg-[#111827] rounded-xl p-6 border border-amber-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Locked Savings</p>
                <p className="text-amber-400 text-4xl font-bold">{formatINR(Number(wallet.savings_balance))}</p>
              </div>
              <PiggyBank className="w-12 h-12 text-amber-400 opacity-50" />
            </div>
            {settings?.savings_goal > 0 && (
              <>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{savingsPct.toFixed(0)}% of goal</span>
                  <span>Goal: {formatINR(settings.savings_goal)}</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${savingsPct}%` }} />
                </div>
              </>
            )}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowSavingsManager(true)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-black py-3 rounded-lg font-semibold transition">
                Manage Savings
              </button>
              <button onClick={() => setShowTopUp('savings')}
                className="flex-1 bg-[#1f2937] hover:bg-[#374151] text-white py-3 rounded-lg font-semibold transition border border-amber-500/30">
                + Direct Top-Up
              </button>
            </div>
          </div>
        </div>;
      case 'ai':
        return <div className="space-y-4">
          <h2 className="text-white text-xl font-bold">AI Financial Coach 🤖</h2>
          <div className="bg-[#111827] rounded-xl p-5">
            <AICoach transactions={transactions} settings={settings} />
          </div>
        </div>;
      case 'settings':
        return <div className="space-y-4">
          <h2 className="text-white text-xl font-bold">Settings</h2>
          <div className="bg-[#111827] rounded-xl p-5">
            <Settings settings={settings} onClose={() => { }} onComplete={() => { loadData(); }} inline />
          </div>
        </div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex">

      {/* ── Sidebar Overlay (mobile) ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#0d1117] border-r border-white/5 z-40 flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:flex
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-black font-bold text-base">M</span>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">MindGuard</p>
              <p className="text-gray-500 text-xs">Money</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-4 border-b border-white/5 space-y-2">
          <p className="text-gray-600 text-xs uppercase tracking-widest mb-3">Quick Actions</p>
          <button
            onClick={() => { setTransactionType('income'); setShowTransactionForm(true); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm font-medium transition">
            <ArrowUpCircle className="w-4 h-4" /> + Add Income
          </button>
          <button
            onClick={() => { setTransactionType('expense'); setShowTransactionForm(true); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 text-sm font-medium transition">
            <ArrowDownCircle className="w-4 h-4" /> + Add Expense
          </button>
          <button
            onClick={() => { setShowTopUp('main'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 text-sm font-medium transition">
            <Wallet className="w-4 h-4" /> Top-Up Main Wallet
          </button>
          <button
            onClick={() => { setShowTopUp('savings'); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-amber-400 text-sm font-medium transition">
            <PiggyBank className="w-4 h-4" /> Top-Up Savings
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="text-gray-600 text-xs uppercase tracking-widest px-2 mb-3">Navigation</p>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id}
              onClick={() => { setActivePage(id as Page); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                ${activePage === id
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Icon className="w-4 h-4" />
              {label}
              {id === 'savings' && savingsPct >= 100 && (
                <span className="ml-auto text-xs bg-amber-500 text-black px-1.5 py-0.5 rounded-full">✓</span>
              )}
            </button>
          ))}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-white/5">
          <p className="text-gray-600 text-xs truncate mb-3">{user?.email}</p>
          <button onClick={async () => { await signOut(); window.location.href = '/login'; }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-[#0d1117] border-b border-white/5 px-5 py-4 flex items-center justify-between lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-white font-bold text-lg capitalize">
                {activePage === 'ai' ? 'AI Coach' : activePage}
              </h1>
              <p className="text-gray-500 text-xs hidden sm:block">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          {/* Balance pill */}
          <div className="bg-[#1f2937] rounded-xl px-4 py-2 text-right hidden sm:block">
            <p className="text-gray-400 text-xs">Total Balance</p>
            <p className="text-white font-bold">{formatINR(totalBalance)}</p>
          </div>
        </header>

        {/* Alerts */}
        {(isOverspending || catAlerts.length > 0) && (
          <div className="px-5 pt-4 lg:px-8 space-y-2">
            {isOverspending && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-center gap-3 text-red-400 text-sm">
                <TrendingDown className="w-5 h-5 flex-shrink-0" />
                <span>🚨 Monthly spending limit exceeded! You've spent {formatINR(monthlyExpenses)} of {formatINR(settings.spending_limit)}</span>
              </div>
            )}
            {catAlerts.map(cat => (
              <div key={cat} className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 text-amber-400 text-sm">
                ⚠️ Category limit exceeded for <strong>{cat}</strong>
              </div>
            ))}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-5 lg:p-8 overflow-auto">
          {renderPage()}
        </main>
      </div>

      {/* ── Modals ── */}
      {showTransactionForm && (
        <TransactionForm type={transactionType}
          onClose={() => setShowTransactionForm(false)}
          onComplete={() => { loadData(); setShowTransactionForm(false); }}
          settings={settings} transactions={transactions}
        />
      )}
      {showSavingsManager && wallet && (
        <SavingsManager wallet={wallet}
          onClose={() => setShowSavingsManager(false)}
          onComplete={() => { loadData(); setShowSavingsManager(false); }}
        />
      )}
      {showTopUp && (
        <QuickTopUp type={showTopUp} wallet={wallet}
          onClose={() => setShowTopUp(null)}
          onComplete={() => { loadData(); setShowTopUp(null); }}
        />
      )}
    </div>
  );
}

/* ─── Dashboard Home ─────────────────────────────────── */
function DashboardHome({ wallet, totalBalance, totalExpenses, totalIncome, monthlyExpenses, settings, spendingPct, savingsPct, isOverspending, catAlerts, transactions, onAddIncome, onAddExpense, onManageSavings, onTopUpMain, onTopUpSavings }: any) {
  return (
    <div className="space-y-6">

      {/* Hero Balance */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-6">
        <p className="text-gray-400 text-sm mb-1">Total Balance</p>
        <p className="text-white text-5xl font-bold mb-4">{formatINR(totalBalance)}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/20 rounded-xl p-3">
            <p className="text-gray-400 text-xs">Main Wallet</p>
            <p className="text-emerald-400 text-lg font-bold">{formatINR(wallet.main_balance)}</p>
            <button onClick={onTopUpMain} className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Top-Up
            </button>
          </div>
          <div className="bg-black/20 rounded-xl p-3">
            <p className="text-gray-400 text-xs">Savings 🔒</p>
            <p className="text-amber-400 text-lg font-bold">{formatINR(wallet.savings_balance)}</p>
            <button onClick={onTopUpSavings} className="text-xs text-blue-400 hover:text-blue-300 mt-1 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Top-Up
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="This Month Spent" value={formatINR(monthlyExpenses)}
          sub={`of ${formatINR(settings?.spending_limit || 0)} limit`}
          color={isOverspending ? 'red' : 'emerald'} />
        <StatCard label="Total Income" value={formatINR(totalIncome)} color="emerald" />
        <StatCard label="Total Expenses" value={formatINR(totalExpenses)} color="red" />
      </div>

      {/* Progress Bars */}
      <div className="grid sm:grid-cols-2 gap-4">
        <ProgressCard
          title="Monthly Spending Limit"
          pct={spendingPct} spent={monthlyExpenses}
          limit={settings?.spending_limit || 0}
          colorClass={spendingPct >= 100 ? 'bg-red-500' : spendingPct >= 80 ? 'bg-yellow-400' : 'bg-emerald-500'}
        />
        <ProgressCard
          title="Savings Goal"
          pct={savingsPct} spent={wallet.savings_balance}
          limit={settings?.savings_goal || 0}
          colorClass="bg-amber-400"
          labelLeft={`₹${wallet.savings_balance.toFixed(0)} saved`}
          labelRight={`Goal: ₹${(settings?.savings_goal || 0).toFixed(0)}`}
        />
      </div>

      {/* Category limits */}
      {settings?.category_limits && Object.keys(settings.category_limits).length > 0 && (
        <div className="bg-[#111827] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Category Budgets</h3>
          <div className="space-y-3">
            {Object.entries(settings.category_limits).map(([cat, limit]: any) => {
              const spent = transactions.filter((t: any) => t.type === 'expense' && t.category === cat).reduce((s: number, t: any) => s + Number(t.amount), 0);
              const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
              const EMOJIS: any = { Snacks: '🍿', Food: '🍽️', Academics: '📚', Beauty: '💄', Household: '🏠' };
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{EMOJIS[cat] || '💰'} {cat}</span>
                    <span className={pct >= 100 ? 'text-red-400 font-semibold' : 'text-gray-400'}>
                      {formatINR(spent)} / {formatINR(limit)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-400' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Transactions (last 5) */}
      <div className="bg-[#111827] rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
        {transactions.length === 0
          ? <p className="text-gray-500 text-sm">No transactions yet</p>
          : transactions.slice(0, 5).map((t: any) => (
            <div key={t.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                  {t.type === 'income' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{t.category}</p>
                  {t.description && <p className="text-gray-500 text-xs">{t.description}</p>}
                </div>
              </div>
              <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                {t.type === 'income' ? '+' : '-'}{formatINR(Number(t.amount))}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: any) {
  return (
    <div className="bg-[#111827] rounded-xl p-4 border border-white/5">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold ${color === 'red' ? 'text-red-400' : 'text-emerald-400'}`}>{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function ProgressCard({ title, pct, spent, limit, colorClass, labelLeft, labelRight }: any) {
  const fmtINR = (n: number) => n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });
  return (
    <div className="bg-[#111827] rounded-xl p-4 border border-white/5">
      <div className="flex justify-between items-center mb-2">
        <p className="text-gray-300 text-sm font-medium">{title}</p>
        <span className={`text-xs font-bold ${pct >= 100 ? 'text-red-400' : 'text-gray-400'}`}>{pct.toFixed(0)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
        <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{labelLeft || fmtINR(spent) + ' spent'}</span>
        <span>{labelRight || fmtINR(limit) + ' limit'}</span>
      </div>
    </div>
  );
}
