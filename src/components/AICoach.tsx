// AICoach.tsx
import { useEffect, useState } from 'react';
import { formatINR } from '../utils/currency';
import { Bot, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

export function AICoach({ transactions, settings }: any) {
    const income = transactions.filter((t: any) => t.type === 'income').reduce((s: any, t: any) => s + Number(t.amount), 0);
    const expense = transactions.filter((t: any) => t.type === 'expense').reduce((s: any, t: any) => s + Number(t.amount), 0);
    const savings = income - expense;
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);

    const getLocalAdvice = () => {
        if (transactions.length === 0) return "👋 Welcome! Start by adding your income to get personalized financial advice.";
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;
        const snacksSpend = transactions.filter((t: any) => t.type === 'expense' && t.category === 'Snacks').reduce((s: any, t: any) => s + Number(t.amount), 0);
        const totalExpense = expense;

        let tips = [];
        if (expense > income) tips.push("🚨 You're spending more than you earn. Review your expenses urgently.");
        else if (savingsRate < 10) tips.push("💡 Try to save at least 20% of your income — you're currently at " + savingsRate.toFixed(0) + "%.");
        else if (savingsRate >= 30) tips.push("🌟 Excellent! You're saving " + savingsRate.toFixed(0) + "% of your income. Keep it up!");
        else tips.push("✅ Good job saving " + savingsRate.toFixed(0) + "% of your income. Aim for 30% as a student!");

        if (snacksSpend > 0 && totalExpense > 0 && (snacksSpend / totalExpense) > 0.2)
            tips.push("🍿 Snacks are taking up " + ((snacksSpend / totalExpense) * 100).toFixed(0) + "% of your spending. Consider cooking more at home.");

        if (settings?.spending_limit > 0 && expense > settings.spending_limit * 0.9)
            tips.push("⚠️ You're near or over your monthly spending limit of " + formatINR(settings.spending_limit) + ".");

        return tips.join('\n\n');
    };

    useEffect(() => {
        setAdvice(getLocalAdvice());
    }, [transactions.length]);

    const fetchAIAdvice = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ income, expense }),
            });
            const data = await res.json();
            setAdvice(data.advice);
        } catch {
            setAdvice(getLocalAdvice());
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: TrendingUp, label: 'Income', val: income, color: 'text-emerald-400' },
                    { icon: TrendingDown, label: 'Expense', val: expense, color: 'text-red-400' },
                    { icon: PiggyBank, label: 'Net Savings', val: savings, color: savings >= 0 ? 'text-amber-400' : 'text-red-400' },
                ].map(({ icon: Icon, label, val, color }) => (
                    <div key={label} className="bg-[#1f2937] rounded-xl p-3 text-center">
                        <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                        <p className="text-gray-500 text-xs">{label}</p>
                        <p className={`${color} font-bold text-sm`}>{formatINR(val)}</p>
                    </div>
                ))}
            </div>

            <div className="bg-[#1f2937] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-5 h-5 text-emerald-400" />
                    <p className="text-white font-semibold text-sm">Financial Advice</p>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{advice || 'Loading advice...'}</p>
            </div>

            <button onClick={fetchAIAdvice} disabled={loading}
                className="w-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 py-3 rounded-xl text-sm font-medium transition disabled:opacity-50">
                {loading ? '🤔 Thinking...' : '✨ Get AI Advice'}
            </button>
        </div>
    );
}