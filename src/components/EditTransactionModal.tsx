import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Pencil } from 'lucide-react';
import { formatINR } from '../utils/currency';

const INCOME_CATEGORIES = [
    'Pocket Money', 'Salary', 'Freelance', 'Side Income',
    'Scholarship', 'Part-time Job', 'Investment', 'Gift',
    'Selling', 'Family Transfer', 'Wallet Top-Up', 'Savings Top-Up', 'Other',
];

const EXPENSE_CATEGORIES = [
    'Snacks', 'Food', 'Academics', 'Beauty', 'Household',
    'Transport', 'Entertainment', 'Health', 'Other',
];

interface EditTransactionModalProps {
    transaction: {
        id: string;
        amount: number;
        type: 'income' | 'expense';
        category: string;
        description: string;
        date: string;
    };
    onClose: () => void;
    onComplete: () => void;
}

export function EditTransactionModal({ transaction, onClose, onComplete }: EditTransactionModalProps) {
    const { user } = useAuth();

    const isKnownCategory = (type: string, cat: string) => {
        const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
        return list.includes(cat);
    };

    const [amount, setAmount] = useState(transaction.amount.toString());
    const [type] = useState<'income' | 'expense'>(transaction.type); // type not editable (would mess up balances)
    const [category, setCategory] = useState(
        isKnownCategory(transaction.type, transaction.category) ? transaction.category : 'Other'
    );
    const [customCategory, setCustomCategory] = useState(
        isKnownCategory(transaction.type, transaction.category) ? '' : transaction.category
    );
    const [description, setDescription] = useState(transaction.description || '');
    const [date, setDate] = useState(
        new Date(transaction.date).toISOString().slice(0, 16)
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const CAT_EMOJI: Record<string, string> = {
        Snacks: '🍿', Food: '🍽️', Academics: '📚', Beauty: '💄', Household: '🏠',
        Transport: '🚌', Entertainment: '🎬', Health: '💊', Other: '✏️',
        'Pocket Money': '👝', Salary: '💼', Freelance: '💻', 'Side Income': '🛒',
        Scholarship: '🎓', 'Part-time Job': '🕐', Investment: '📈', Gift: '🎁',
        Selling: '🏷️', 'Family Transfer': '🏠', 'Wallet Top-Up': '💳', 'Savings Top-Up': '🏦',
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError('');
        setLoading(true);

        try {
            const newAmount = parseFloat(amount);
            if (!newAmount || newAmount <= 0) {
                setError('Enter a valid amount');
                setLoading(false);
                return;
            }

            const oldAmount = Number(transaction.amount);
            const finalCategory = category === 'Other' && customCategory.trim()
                ? customCategory.trim()
                : category;

            // ── Adjust wallet balance for the difference ──
            const { data: wallet } = await supabase
                .from('wallet')
                .select()
                .eq('user_id', user.id)
                .maybeSingle();

            if (!wallet) { setError('Wallet not found'); setLoading(false); return; }

            let newMainBalance = Number(wallet.main_balance);

            if (type === 'income') {
                // Old income was added, new income should be added → diff = newAmount - oldAmount
                newMainBalance = newMainBalance - oldAmount + newAmount;
            } else {
                // Old expense was subtracted, new expense should be subtracted → diff = oldAmount - newAmount
                newMainBalance = newMainBalance + oldAmount - newAmount;
            }

            if (newMainBalance < 0) {
                setError('This edit would make your main balance negative. Reduce the amount.');
                setLoading(false);
                return;
            }

            // Update transaction
            await supabase
                .from('transactions')
                .update({
                    amount: newAmount,
                    category: finalCategory,
                    description,
                    date: new Date(date).toISOString(),
                })
                .eq('id', transaction.id);

            // Update wallet
            await supabase
                .from('wallet')
                .update({ main_balance: newMainBalance, updated_at: new Date().toISOString() })
                .eq('user_id', user.id);

            onComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const amountDiff = parseFloat(amount) - Number(transaction.amount);
    const showDiff = !isNaN(amountDiff) && amountDiff !== 0;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-[#111827] rounded-2xl w-full max-w-md border border-white/10 shadow-2xl max-h-[92vh] overflow-y-auto">

                {/* Header */}
                <div className={`${type === 'income' ? 'bg-emerald-700' : 'bg-red-700'} p-5 rounded-t-2xl flex justify-between items-center sticky top-0 z-10`}>
                    <div className="flex items-center gap-3">
                        <Pencil className="w-5 h-5" />
                        <div>
                            <h2 className="text-xl font-bold text-white">Edit Transaction</h2>
                            <p className="text-white/60 text-xs">
                                {type === 'income' ? '💰 Income' : '💸 Expense'} •
                                Original: {formatINR(Number(transaction.amount))}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-5">

                    {/* Amount */}
                    <div>
                        <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">
                            Amount (₹)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                            <input
                                type="number" step="0.01" min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-9 pr-4 py-3 bg-[#1f2937] border border-white/10 text-white rounded-xl text-xl font-bold focus:outline-none focus:border-emerald-500/60"
                                placeholder="0.00"
                                required
                            />
                        </div>
                        {showDiff && (
                            <p className={`text-xs mt-1.5 font-medium ${amountDiff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {amountDiff > 0 ? '▲' : '▼'} {formatINR(Math.abs(amountDiff))} difference from original
                            </p>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-gray-400 text-xs uppercase tracking-wide mb-3 block">Category</label>
                        <div className="grid grid-cols-3 gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat} type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`p-3 rounded-xl border text-left transition ${category === cat
                                            ? 'border-emerald-500/70 bg-emerald-500/10 text-emerald-400'
                                            : 'border-white/10 bg-[#1f2937] text-gray-300 hover:border-white/25'
                                        }`}
                                >
                                    <div className="text-lg mb-0.5">{CAT_EMOJI[cat] || '💰'}</div>
                                    <div className="text-xs font-medium leading-tight">{cat}</div>
                                </button>
                            ))}
                        </div>

                        {category === 'Other' && (
                            <div className="mt-3">
                                <input
                                    type="text"
                                    value={customCategory}
                                    onChange={(e) => setCustomCategory(e.target.value)}
                                    placeholder="e.g. Stationery, Auto fare, Outing..."
                                    className="w-full px-4 py-3 bg-[#1f2937] border border-emerald-500/40 text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">This will be the saved category name</p>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">Note</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a note..."
                            className="w-full px-4 py-3 bg-[#1f2937] border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500/50"
                        />
                    </div>

                    {/* Date */}
                    <div>
                        <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">Date & Time</label>
                        <input
                            type="datetime-local"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1f2937] border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500/50 [color-scheme:dark]"
                        />
                    </div>

                    {/* Balance impact preview */}
                    {showDiff && (
                        <div className="bg-[#1f2937] rounded-xl p-4 border border-white/5">
                            <p className="text-gray-400 text-xs mb-2">📊 Balance Impact</p>
                            <p className="text-gray-300 text-sm">
                                Your main balance will change by{' '}
                                <span className={`font-bold ${type === 'income' ? (amountDiff > 0 ? 'text-emerald-400' : 'text-red-400') : (amountDiff > 0 ? 'text-red-400' : 'text-emerald-400')}`}>
                                    {type === 'income'
                                        ? (amountDiff > 0 ? `+${formatINR(amountDiff)}` : formatINR(amountDiff))
                                        : (amountDiff > 0 ? `-${formatINR(amountDiff)}` : `+${formatINR(Math.abs(amountDiff))}`)}
                                </span>
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button" onClick={onClose}
                            className="flex-1 bg-[#1f2937] hover:bg-[#374151] text-gray-300 py-3 rounded-xl font-medium transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit" disabled={loading}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black py-3 rounded-xl font-bold transition disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : '✓ Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}