import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, AlertTriangle } from 'lucide-react';

interface TransactionFormProps {
  type: 'income' | 'expense';
  onClose: () => void;
  onComplete: () => void;
  settings?: any;
  transactions?: any[];
}

// ── Student-focused income categories ──
const INCOME_CATEGORIES = [
  { value: 'Pocket Money', emoji: '👝', label: 'Pocket Money' },
  { value: 'Salary', emoji: '💼', label: 'Salary / Internship' },
  { value: 'Freelance', emoji: '💻', label: 'Freelance Work' },
  { value: 'Side Income', emoji: '🛒', label: 'Side Income' },
  { value: 'Scholarship', emoji: '🎓', label: 'Scholarship' },
  { value: 'Part-time Job', emoji: '🕐', label: 'Part-time Job' },
  { value: 'Investment', emoji: '📈', label: 'Investment Returns' },
  { value: 'Gift', emoji: '🎁', label: 'Gift / Festival' },
  { value: 'Selling', emoji: '🏷️', label: 'Selling Items' },
  { value: 'Family Transfer', emoji: '🏠', label: 'Family Transfer' },
  { value: 'Other', emoji: '💰', label: 'Other' },
];

// ── Expense categories (your 5 + Other with custom input) ──
const EXPENSE_CATEGORIES = [
  { value: 'Snacks', emoji: '🍿', label: 'Snacks' },
  { value: 'Food', emoji: '🍽️', label: 'Food / Meals' },
  { value: 'Academics', emoji: '📚', label: 'Academics' },
  { value: 'Beauty', emoji: '💄', label: 'Beauty & Care' },
  { value: 'Household', emoji: '🏠', label: 'Household' },
  { value: 'Transport', emoji: '🚌', label: 'Transport' },
  { value: 'Entertainment', emoji: '🎬', label: 'Entertainment' },
  { value: 'Health', emoji: '💊', label: 'Health' },
  { value: 'Other', emoji: '✏️', label: 'Other (custom)' },
];

export function TransactionForm({ type, onClose, onComplete, settings, transactions = [] }: TransactionFormProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectedCat = category === 'Other' && customCategory.trim()
    ? customCategory.trim()
    : category || categories[0].value;

  const checkLimits = (cat: string, amt: number) => {
    if (type !== 'expense' || !settings) return;
    const catLimit = settings.category_limits?.[cat];
    if (catLimit) {
      const spent = transactions.filter((t: any) => t.type === 'expense' && t.category === cat).reduce((s: number, t: any) => s + Number(t.amount), 0);
      if (spent + amt > catLimit) {
        setWarning(`⚠️ This will exceed your ${cat} budget! (₹${spent.toFixed(0)} / ₹${catLimit})`);
        return;
      }
      if ((spent + amt) / catLimit > 0.8) {
        setWarning(`💛 Almost at your ${cat} limit — ₹${(catLimit - spent).toFixed(0)} remaining`);
        return;
      }
    }
    if (settings.spending_limit) {
      const now = new Date();
      const monthlySpent = transactions.filter((t: any) => t.type === 'expense' &&
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
      ).reduce((s: number, t: any) => s + Number(t.amount), 0);
      if (monthlySpent + amt > settings.spending_limit) {
        setWarning(`🚨 This will exceed your monthly limit of ₹${settings.spending_limit}!`);
        return;
      }
    }
    setWarning('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    try {
      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) { setError('Enter a valid amount'); setLoading(false); return; }

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

      if (!wallet) { setError('Wallet not found'); setLoading(false); return; }

      if (type === 'expense' && Number(wallet.main_balance) < numAmount) {
        setError('Insufficient balance in main wallet'); setLoading(false); return;
      }

      // Hard-block on category limit
      if (type === 'expense' && settings?.category_limits) {
        const catLimit = settings.category_limits[selectedCat];
        if (catLimit) {
          const spent = transactions.filter((t: any) => t.type === 'expense' && t.category === selectedCat).reduce((s: number, t: any) => s + Number(t.amount), 0);
          if (spent + numAmount > catLimit) {
            setError(`Category limit exceeded for ${selectedCat} (₹${catLimit})`);
            setLoading(false); return;
          }
        }
      }

      await supabase.from('transactions').insert({
        user_id: user.id, amount: numAmount, type,
        category: selectedCat,
        description: description || selectedCat,
        date: new Date().toISOString(),
      });

      const newBalance = type === 'income'
        ? Number(wallet.main_balance) + numAmount
        : Number(wallet.main_balance) - numAmount;

      await supabase.from('wallet').update({ main_balance: newBalance }).eq('user_id', user.id);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-[#111827] text-white rounded-2xl w-full max-w-md border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className={`${type === 'income' ? 'bg-emerald-600' : 'bg-red-600'} p-5 rounded-t-2xl flex justify-between items-center sticky top-0`}>
          <div>
            <h2 className="text-xl font-bold">{type === 'income' ? '💰 Add Income' : '💸 Add Expense'}</h2>
            <p className="text-white/70 text-xs mt-0.5">{type === 'income' ? 'Record money coming in' : 'Record money going out'}</p>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Amount */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
              <input type="number" step="0.01" min="0" value={amount}
                onChange={(e) => { setAmount(e.target.value); if (category && e.target.value) checkLimits(selectedCat, parseFloat(e.target.value) || 0); }}
                className="w-full pl-9 pr-4 py-3 bg-[#1f2937] border border-white/10 text-white rounded-xl text-xl font-bold focus:outline-none focus:border-emerald-500/50"
                placeholder="0.00" />
            </div>
          </div>

          {/* Category grid */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-3 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button key={cat.value} type="button"
                  onClick={() => { setCategory(cat.value); if (amount) checkLimits(cat.value === 'Other' ? customCategory || 'Other' : cat.value, parseFloat(amount) || 0); }}
                  className={`p-3 rounded-xl border text-left transition ${category === cat.value
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/10 bg-[#1f2937] text-gray-300 hover:border-white/20'}`}>
                  <div className="text-lg mb-1">{cat.emoji}</div>
                  <div className="text-xs font-medium leading-tight">{cat.label}</div>
                </button>
              ))}
            </div>

            {/* Custom input for "Other" */}
            {category === 'Other' && (
              <div className="mt-3">
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="What did you spend on? (e.g. Stationery, Auto fare...)"
                  className="w-full px-4 py-3 bg-[#1f2937] border border-emerald-500/40 text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-gray-500 mt-1">This will be saved as the category name</p>
              </div>
            )}
          </div>

          {/* Warning */}
          {warning && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${warning.startsWith('🚨') || warning.startsWith('⚠️')
              ? 'bg-red-500/10 border border-red-500/30 text-red-400'
              : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'}`}>
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">Note (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note about this transaction..."
              className="w-full px-4 py-3 bg-[#1f2937] border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 bg-[#1f2937] hover:bg-[#374151] text-gray-300 py-3 rounded-xl font-medium transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className={`flex-1 ${type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'} text-white py-3 rounded-xl font-bold transition disabled:opacity-50`}>
              {loading ? 'Saving...' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}