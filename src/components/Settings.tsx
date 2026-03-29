import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Target, TrendingUp } from 'lucide-react';

const YOUR_CATEGORIES = [
  { key: 'Snacks', emoji: '🍿' },
  { key: 'Food', emoji: '🍽️' },
  { key: 'Academics', emoji: '📚' },
  { key: 'Beauty', emoji: '💄' },
  { key: 'Household', emoji: '🏠' },
];

interface SettingsProps {
  settings: any;
  onClose: () => void;
  onComplete: () => void;
  inline?: boolean;
}

export function Settings({ settings, onClose, onComplete, inline }: SettingsProps) {
  const { user } = useAuth();
  const [spendingLimit, setSpendingLimit] = useState(settings?.spending_limit?.toString() || '10000');
  const [savingsGoal, setSavingsGoal] = useState(settings?.savings_goal?.toString() || '50000');
  const [categoryLimits, setCategoryLimits] = useState<Record<string, string>>(
    Object.fromEntries(YOUR_CATEGORIES.map(c => [
      c.key,
      settings?.category_limits?.[c.key]?.toString() || ''
    ]))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(''); setLoading(true);
    try {
      const numLimit = parseFloat(spendingLimit);
      const numGoal = parseFloat(savingsGoal);
      if (numLimit < 0 || numGoal < 0) { setError('Values cannot be negative'); setLoading(false); return; }

      const parsedCatLimits: Record<string, number> = {};
      for (const cat of YOUR_CATEGORIES) {
        const v = parseFloat(categoryLimits[cat.key]);
        if (!isNaN(v) && v > 0) parsedCatLimits[cat.key] = v;
      }

      await supabase.from('settings').update({
        spending_limit: numLimit,
        savings_goal: numGoal,
        category_limits: parsedCatLimits,
      }).eq('user_id', user.id);

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error occurred');
    } finally { setLoading(false); }
  };

  const inner = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Overall Limits */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Overall Limits</h3>
        <div>
          <label className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <Target className="w-4 h-4 text-red-400" /> Monthly Spending Limit (₹)
          </label>
          <input type="number" step="0.01" value={spendingLimit} onChange={(e) => setSpendingLimit(e.target.value)}
            className="w-full px-4 py-3 bg-[#1f2937] border border-white/10 text-white rounded-xl focus:outline-none focus:border-emerald-500/50"
            placeholder="10000" />
          <p className="text-gray-600 text-xs mt-1">Alert triggers when total monthly expenses cross this</p>
        </div>
        <div>
          <label className="flex items-center gap-2 text-gray-400 text-sm mb-2">
            <TrendingUp className="w-4 h-4 text-amber-400" /> Savings Goal (₹)
          </label>
          <input type="number" step="0.01" value={savingsGoal} onChange={(e) => setSavingsGoal(e.target.value)}
            className="w-full px-4 py-3 bg-[#1f2937] border border-white/10 text-white rounded-xl focus:outline-none focus:border-emerald-500/50"
            placeholder="50000" />
        </div>
      </div>

      {/* Category Limits */}
      <div className="space-y-3">
        <div>
          <h3 className="text-white font-semibold text-sm uppercase tracking-wide">Category Monthly Limits</h3>
          <p className="text-gray-600 text-xs mt-0.5">Leave blank for no limit. You'll be warned at 80% and blocked at 100%.</p>
        </div>
        <div className="space-y-2">
          {YOUR_CATEGORIES.map(cat => (
            <div key={cat.key} className="flex items-center gap-3 bg-[#1f2937] rounded-xl px-4 py-3">
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-gray-300 text-sm font-medium flex-1">{cat.key}</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input type="number" step="0.01" min="0"
                  value={categoryLimits[cat.key]}
                  onChange={(e) => setCategoryLimits(prev => ({ ...prev, [cat.key]: e.target.value }))}
                  placeholder="No limit"
                  className="pl-7 pr-3 py-2 bg-[#111827] border border-white/10 text-white rounded-lg text-sm w-32 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {saved && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm">✅ Settings saved!</div>}

      <div className="flex gap-3">
        {!inline && (
          <button type="button" onClick={onClose}
            className="flex-1 bg-[#1f2937] hover:bg-[#374151] text-gray-300 py-3 rounded-xl font-medium transition">
            Cancel
          </button>
        )}
        <button type="submit" disabled={loading}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black py-3 rounded-xl font-bold transition disabled:opacity-50">
          {loading ? 'Saving...' : '💾 Save Settings'}
        </button>
      </div>
    </form>
  );

  if (inline) return inner;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-[#111827] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-emerald-600 p-5 rounded-t-2xl flex justify-between items-center sticky top-0">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition"><X className="w-5 h-5 text-white" /></button>
        </div>
        <div className="p-5">{inner}</div>
      </div>
    </div>
  );
}