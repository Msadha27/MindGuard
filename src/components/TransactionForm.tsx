import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X } from 'lucide-react';

interface TransactionFormProps {
  type: 'income' | 'expense';
  onClose: () => void;
  onComplete: () => void;
}

const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
const expenseCategories = [
  'Food', 'Travel', 'Shopping', 'Bills',
  'Entertainment', 'Health', 'Education', 'Other',
];

export function TransactionForm({
  type,
  onClose,
  onComplete,
}: TransactionFormProps) {

  const { user } = useAuth();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const numAmount = parseFloat(amount);

      // ✅ VALIDATION
      if (numAmount <= 0) {
        setError('Amount must be greater than 0');
        setLoading(false);
        return;
      }

      // ✅ GET WALLET
      const { data: wallet } = await supabase
        .from('wallet')
        .select()
        .eq('user_id', user.id)
        .maybeSingle();

      if (!wallet) {
        setError('Wallet not found');
        setLoading(false);
        return;
      }

      // ✅ BALANCE CHECK
      if (type === 'expense' && Number(wallet.main_balance) < numAmount) {
        setError('Insufficient balance');
        setLoading(false);
        return;
      }

      // ✅ LIMIT LOGIC
      const { data: settings } = await supabase
        .from('settings')
        .select()
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: transactions } = await supabase
        .from('transactions')
        .select()
        .eq('user_id', user.id);

      if (type === 'expense' && settings && transactions) {

        const categoryLimit = settings.category_limits?.[category];

        if (categoryLimit) {
          const currentSpent = transactions
            .filter(t => t.category === category && t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          if (currentSpent + numAmount > categoryLimit) {
            setError(`Limit exceeded for ${category} (₹${categoryLimit})`);
            setLoading(false);
            return;
          }
        }

        if (settings.spending_limit) {
          const monthlySpent = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          if (monthlySpent + numAmount > settings.spending_limit) {
            setError("Monthly limit exceeded 🚫");
            setLoading(false);
            return;
          }
        }
      }

      // ✅ INSERT
      await supabase.from('transactions').insert({
        user_id: user.id,
        amount: numAmount,
        type,
        category: category || categories[0],
        description,
        date: new Date().toISOString(),
      });

      // ✅ UPDATE WALLET
      const newBalance =
        type === 'income'
          ? Number(wallet.main_balance) + numAmount
          : Number(wallet.main_balance) - numAmount;

      await supabase
        .from('wallet')
        .update({ main_balance: newBalance })
        .eq('user_id', user.id);

      onComplete();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">

      <div className="bg-[#111827] text-white rounded-2xl w-full max-w-md border border-white/10 shadow-xl">

        {/* HEADER */}
        <div className={`${type === 'income' ? 'bg-emerald-600' : 'bg-red-600'
          } p-5 rounded-t-2xl flex justify-between items-center`}>

          <h2 className="text-lg font-semibold">
            {type === 'income' ? 'Add Income' : 'Add Expense'}
          </h2>

          <button onClick={onClose}>
            <X />
          </button>

        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* AMOUNT */}
          <div>
            <label className="text-gray-400 text-sm">Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-gray-100 text-black rounded-lg"
              placeholder="0.00"
            />
          </div>

          {/* CATEGORY */}
          <div>
            <label className="text-gray-400 text-sm">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-gray-100 text-black rounded-lg"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="text-black">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-gray-400 text-sm">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-4 py-3 bg-gray-100 text-black rounded-lg"
              rows={3}
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          {/* BUTTONS */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 py-2 rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 bg-emerald-500 py-2 rounded-lg text-black font-semibold"
            >
              {loading ? 'Processing...' : 'Add'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}