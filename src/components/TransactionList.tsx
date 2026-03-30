import { TrendingUp, TrendingDown, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatINR } from '../utils/currency';

const CAT_EMOJI: Record<string, string> = {
  Snacks: '🍿', Food: '🍽️', Academics: '📚', Beauty: '💄', Household: '🏠',
  Transport: '🚌', Entertainment: '🎬', Health: '💊',
  'Pocket Money': '👝', Salary: '💼', Freelance: '💻', 'Side Income': '🛒',
  Scholarship: '🎓', 'Part-time Job': '🕐', Investment: '📈', Gift: '🎁',
  Selling: '🏷️', 'Family Transfer': '🏠', 'Wallet Top-Up': '💳', 'Savings Top-Up': '🏦',
};

export function TransactionList({ transactions, onRefresh, onEdit }: { transactions: any[]; onRefresh?: () => void; onEdit?: (t: any) => void; }) {
  const { user } = useAuth();

  const handleDelete = async (t: any) => {
    if (!user || !confirm('Delete this transaction? Balance will be reversed.')) return;
    try {
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

      if (!wallet) return;
      const newBal = t.type === 'income' ? Number(wallet.main_balance) - Number(t.amount) : Number(wallet.main_balance) + Number(t.amount);
      await supabase.from('wallet').update({ main_balance: newBal }).eq('user_id', user.id);
      await supabase.from('transactions').delete().eq('id', t.id);
      onRefresh?.();
    } catch { alert('Error deleting'); }
  };

  if (transactions.length === 0) return (
    <div className="bg-[#111827] rounded-xl p-8 text-center border border-white/5">
      <p className="text-4xl mb-3">💸</p>
      <p className="text-gray-400 font-medium">No transactions yet</p>
      <p className="text-gray-600 text-sm mt-1">Add your first income or expense!</p>
    </div>
  );

  return (
    <div className="bg-[#111827] rounded-xl overflow-hidden border border-white/5 divide-y divide-white/5">
      {transactions.map((t) => {
        const emoji = CAT_EMOJI[t.category];
        return (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${t.type === 'income' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
              {emoji ? <span>{emoji}</span> : t.type === 'income' ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold leading-tight">{t.category}</p>
              {t.description && t.description !== t.category && <p className="text-gray-500 text-xs truncate mt-0.5">{t.description}</p>}
              <p className="text-gray-600 text-xs mt-0.5">{new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <p className={`font-bold text-sm flex-shrink-0 ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
              {t.type === 'income' ? '+' : '-'}{formatINR(Number(t.amount))}
            </p>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
              <button onClick={() => onEdit?.(t)} title="Edit"
                className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(t)} title="Delete"
                className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}