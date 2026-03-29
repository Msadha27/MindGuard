import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Wallet, PiggyBank } from 'lucide-react';
import { formatINR } from '../utils/currency';

interface QuickTopUpProps {
    type: 'main' | 'savings';
    wallet: any;
    onClose: () => void;
    onComplete: () => void;
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

export function QuickTopUp({ type, wallet, onClose, onComplete }: QuickTopUpProps) {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isMain = type === 'main';
    const currentBal = isMain ? Number(wallet.main_balance) : Number(wallet.savings_balance);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) { setError('Enter a valid amount'); return; }
        setError('');
        setLoading(true);

        try {
            const update = isMain
                ? { main_balance: currentBal + numAmount, updated_at: new Date().toISOString() }
                : { savings_balance: currentBal + numAmount, updated_at: new Date().toISOString() };

            await supabase.from('wallet').update(update).eq('user_id', user.id);

            // Log as income transaction for tracking
            await supabase.from('transactions').insert({
                user_id: user.id,
                amount: numAmount,
                type: 'income',
                category: isMain ? 'Wallet Top-Up' : 'Savings Top-Up',
                description: note || `Direct ${isMain ? 'wallet' : 'savings'} top-up`,
                date: new Date().toISOString(),
            });

            onComplete();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-[#111827] rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl">

                {/* Header */}
                <div className={`${isMain ? 'bg-blue-600' : 'bg-amber-600'} p-5 rounded-t-2xl flex justify-between items-center`}>
                    <div className="flex items-center gap-3">
                        {isMain ? <Wallet className="w-6 h-6" /> : <PiggyBank className="w-6 h-6" />}
                        <div>
                            <h2 className="text-lg font-bold">
                                Top-Up {isMain ? 'Main Wallet' : 'Savings Vault'}
                            </h2>
                            <p className="text-white/70 text-xs">Add money directly</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="p-5 space-y-4">

                    {/* Current Balance */}
                    <div className={`${isMain ? 'bg-blue-500/10 border-blue-500/20' : 'bg-amber-500/10 border-amber-500/20'} border rounded-xl p-4`}>
                        <p className="text-gray-400 text-xs mb-1">Current Balance</p>
                        <p className={`text-2xl font-bold ${isMain ? 'text-blue-400' : 'text-amber-400'}`}>
                            {formatINR(currentBal)}
                        </p>
                    </div>

                    {/* Quick amounts */}
                    <div>
                        <p className="text-gray-400 text-xs mb-2 uppercase tracking-wide">Quick Add</p>
                        <div className="grid grid-cols-4 gap-2">
                            {QUICK_AMOUNTS.map(qa => (
                                <button key={qa} type="button" onClick={() => setAmount(qa.toString())}
                                    className={`py-2 rounded-lg text-sm font-semibold transition ${amount === qa.toString()
                                        ? (isMain ? 'bg-blue-500 text-white' : 'bg-amber-500 text-black')
                                        : 'bg-[#1f2937] text-gray-300 hover:bg-[#374151]'}`}>
                                    ₹{qa >= 1000 ? (qa / 1000) + 'k' : qa}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom amount */}
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">Custom Amount (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                <input type="number" step="0.01" min="0" value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3 bg-[#1f2937] border border-white/10 text-white rounded-xl font-bold text-lg focus:outline-none focus:border-emerald-500/50"
                                    placeholder="0.00" />
                            </div>
                        </div>
                        <div>
                            <label className="text-gray-400 text-xs uppercase tracking-wide mb-2 block">Note (optional)</label>
                            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                                placeholder="e.g. Monthly pocket money received"
                                className="w-full px-4 py-3 bg-[#1f2937] border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-emerald-500/50" />
                        </div>

                        {amount && (
                            <div className="bg-[#1f2937] rounded-xl p-3 flex justify-between text-sm">
                                <span className="text-gray-400">New balance will be</span>
                                <span className={`font-bold ${isMain ? 'text-blue-400' : 'text-amber-400'}`}>
                                    {formatINR(currentBal + (parseFloat(amount) || 0))}
                                </span>
                            </div>
                        )}

                        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}

                        <div className="flex gap-3 pt-1">
                            <button type="button" onClick={onClose}
                                className="flex-1 bg-[#1f2937] hover:bg-[#374151] text-gray-300 py-3 rounded-xl font-medium transition">
                                Cancel
                            </button>
                            <button type="submit" disabled={loading}
                                className={`flex-1 ${isMain ? 'bg-blue-500 hover:bg-blue-600' : 'bg-amber-500 hover:bg-amber-600'} ${isMain ? 'text-white' : 'text-black'} py-3 rounded-xl font-bold transition disabled:opacity-50`}>
                                {loading ? 'Adding...' : `Add ${amount ? formatINR(parseFloat(amount) || 0) : '₹'}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}