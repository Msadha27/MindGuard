import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Target, TrendingUp } from 'lucide-react';
import type { Database } from '../lib/database.types';

type SettingsRow = Database['public']['Tables']['settings']['Row'];

interface SettingsProps {
  settings: SettingsRow | null;
  onClose: () => void;
  onComplete: () => void;
}

export function Settings({ settings, onClose, onComplete }: SettingsProps) {
  const { user } = useAuth();
  const [spendingLimit, setSpendingLimit] = useState(
    settings?.spending_limit.toString() || '1000'
  );
  const [savingsGoal, setSavingsGoal] = useState(
    settings?.savings_goal.toString() || '5000'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryLimits, setCategoryLimits] = useState(
    settings?.category_limits || {}
  );
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const numSpendingLimit = parseFloat(spendingLimit);
      const numSavingsGoal = parseFloat(savingsGoal);

      if (numSpendingLimit < 0 || numSavingsGoal < 0) {
        setError('Values cannot be negative');
        setLoading(false);
        return;
      }

      await supabase.from('settings').update({
        spending_limit: numSpendingLimit,
        savings_goal: numSavingsGoal,
        category_limits: categoryLimits,
      })
        .eq('user_id', user.id);

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-emerald-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <Target className="w-5 h-5 text-red-600" />
              <span>Monthly Spending Limit (₹)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={spendingLimit}
              onChange={(e) => setSpendingLimit(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="1000.00"
            />
            <p className="text-xs text-gray-500 mt-2">
              You'll be alerted when your monthly expenses exceed this limit
            </p>
          </div>

          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <span>Savings Goal (₹)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={savingsGoal}
              onChange={(e) => setSavingsGoal(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="5000.00"
            />
            <p className="text-xs text-gray-500 mt-2">
              Target amount you want to save for financial security
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <h3 className="font-semibold mb-2">Category Limits (₹)</h3>

            {['Food', 'Shopping', 'Travel', 'Bills', 'Entertainment'].map((cat) => (
              <div key={cat} className="flex gap-2 mb-2">
                <label className="w-32">{cat}</label>
                <input
                  type="number"
                  value={categoryLimits[cat] || ''}
                  onChange={(e) =>
                    setCategoryLimits({
                      ...categoryLimits,
                      [cat]: Number(e.target.value),
                    })
                  }
                  className="border px-2 py-1 rounded"
                />
              </div>
            ))}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
