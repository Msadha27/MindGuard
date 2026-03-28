import { TrendingUp, TrendingDown, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';
import { formatINR } from '../utils/currency';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];

interface TransactionListProps {
  transactions: TransactionRow[];
  onDelete?: () => void; // 🔥 important
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  const { user } = useAuth();

  const handleDelete = async (transaction: TransactionRow) => {
    if (!user) return;

    const confirmDelete = confirm("Are you sure you want to delete this transaction?");
    if (!confirmDelete) return;

    try {
      // 🔥 Get wallet
      const { data: wallet } = await supabase
        .from('wallet')
        .select()
        .eq('user_id', user.id)
        .maybeSingle();

      if (!wallet) return;

      let newBalance = Number(wallet.main_balance);

      // 🔥 Reverse transaction
      if (transaction.type === 'income') {
        newBalance -= Number(transaction.amount);
      } else {
        newBalance += Number(transaction.amount);
      }

      // 🔥 Update wallet
      await supabase
        .from('wallet')
        .update({
          main_balance: newBalance,
        })
        .eq('user_id', user.id);

      // 🔥 Delete transaction
      await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id);

      alert("Transaction deleted ✅");

      onDelete && onDelete();

    } catch (err) {
      alert("Error deleting transaction");
    }
  };

  if (transactions.length === 0) {
    return <p>No transactions yet</p>;
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">Recent Transactions</h2>
      </div>

      {transactions.slice(0, 10).map((transaction) => (
        <div key={transaction.id} className="p-6 flex justify-between items-center">

          {/* LEFT */}
          <div className="flex items-center gap-4">
            <div>
              {transaction.type === 'income'
                ? <TrendingUp className="text-green-600" />
                : <TrendingDown className="text-red-600" />}
            </div>

            <div>
              <p className="font-semibold">{transaction.category}</p>
              <p className="text-sm text-gray-500">
                {new Date(transaction.date).toDateString()}
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">

            <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
              {transaction.type === 'income' ? '+' : '-'}
              {formatINR(Number(transaction.amount))}
            </p>

            {/* 🔥 DELETE BUTTON */}
            <button
              onClick={() => handleDelete(transaction)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 />
            </button>

          </div>

        </div>
      ))}
    </div>
  );
}