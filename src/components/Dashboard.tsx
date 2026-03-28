import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';
import { SpendingChart } from './SpendingChart';
import { AICoach } from './AICoach';

import { formatINR } from '../utils/currency';

export function Dashboard() {
  const { user } = useAuth();
  const { signOut } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [w, t, s] = await Promise.all([
      supabase.from('wallet').select().eq('user_id', user.id).maybeSingle(),
      supabase.from('transactions').select().eq('user_id', user.id),
      supabase.from('settings').select().eq('user_id', user.id).maybeSingle()
    ]);

    setWallet(w.data);
    setTransactions(t.data || []);
    setSettings(s.data);
  };

  if (!wallet) return <div className="text-white p-10">Loading...</div>;

  const totalBalance = Number(wallet.main_balance) + Number(wallet.savings_balance);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-300 p-6 space-y-6">
      <div className="flex items-center gap-3">

        {/* ICON */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
          <span className="text-black font-bold text-lg">M</span>
        </div>

        {/* TEXT */}
        <h1 className="text-white text-2xl font-bold tracking-wide">
          MindGuard
        </h1>

      </div>
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">MindGuard Dashboard</h1>

        <div className="flex gap-3">

          {/* ADD INCOME */}
          <button
            onClick={() => {
              setTransactionType('income');
              setShowTransactionForm(true);
            }}
            className="bg-emerald-500 px-4 py-2 rounded-lg text-black font-semibold"
          >
            + Income
          </button>
          <button
            onClick={async () => {
              await signOut();
              window.location.href = '/login';
            }}
            className="bg-gray-700 px-4 py-2 rounded"
          >
            Logout
          </button>
          {/* ADD EXPENSE */}
          <button
            onClick={() => {
              setTransactionType('expense');
              setShowTransactionForm(true);
            }}
            className="bg-red-500 px-4 py-2 rounded-lg text-white font-semibold"
          >
            + Expense
          </button>

        </div>
      </div>

      {/* BALANCE */}
      <div className="bg-[#111827] p-6 rounded-xl">
        <p className="text-gray-400">Total Balance</p>
        <h2 className="text-3xl font-bold text-white">{formatINR(totalBalance)}</h2>
      </div>

      {/* CARDS */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Main Balance" value={formatINR(wallet.main_balance)} />
        <Card title="Savings" value={formatINR(wallet.savings_balance)} />
        <Card title="Expenses" value={formatINR(totalExpenses)} />
      </div>

      {/* TRANSACTIONS */}
      <Section title="Recent Transactions">
        <TransactionList transactions={transactions} onDelete={loadData} />
      </Section>

      {/* ANALYTICS */}
      <Section title="Analytics">
        <SpendingChart transactions={transactions} />
      </Section>

      {/* AI */}
      <Section title="AI Coach">
        <AICoach transactions={transactions} settings={settings} />
      </Section>

      {/* MODAL */}
      {showTransactionForm && (
        <TransactionForm
          type={transactionType}
          onClose={() => setShowTransactionForm(false)}
          onComplete={loadData}
        />
      )}
    </div>
  );
}

/* COMPONENTS */

function Card({ title, value }: any) {
  return (
    <div className="bg-[#111827] p-4 rounded-xl">
      <p className="text-gray-400">{title}</p>
      <p className="text-white font-semibold">{value}</p>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div className="bg-[#111827] p-5 rounded-xl">
      <h2 className="text-white font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}