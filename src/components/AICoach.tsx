import { useEffect, useState } from 'react';
import { formatINR } from '../utils/currency';

export function AICoach({ transactions }: any) {

    const income = transactions
        .filter((t: any) => t.type === 'income')
        .reduce((s: any, t: any) => s + Number(t.amount), 0);

    const expense = transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((s: any, t: any) => s + Number(t.amount), 0);

    const savings = income - expense;
    const [advice, setAdvice] = useState("");

    useEffect(() => {
        async function fetchAI() {
            const res = await fetch('/api/api', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ income, expense }),
            });

            const data = await res.json();
            setAdvice(data.advice);
        }

        fetchAI();
    }, []);
    return (
        <div className="text-gray-300 space-y-2">

            <p>💰 Income: <span className="text-white">{formatINR(income)}</span></p>
            <p>💸 Expense: <span className="text-white">{formatINR(expense)}</span></p>
            <p>🏦 Savings: <span className="text-white">{formatINR(savings)}</span></p>

            <div className="bg-emerald-500/20 p-3 rounded mt-3">
                {expense > income
                    ? "🚨 You are overspending!"
                    : "✅ Your finances are stable"}
            </div>

        </div>
    );
}