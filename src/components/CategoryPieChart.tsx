import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PieChart, Pie, Cell as PieCell, Tooltip as PieTooltip, Legend } from 'recharts';
import { formatINR } from '../utils/currency';

const COLORS = ['#34d399', '#60a5fa', '#f472b6', '#facc15', '#fb7185', '#a78bfa', '#f97316'];
const CAT_EMOJI: Record<string, string> = {
    Snacks: '🍿', Food: '🍽️', Academics: '📚', Beauty: '💄', Household: '🏠',
    Transport: '🚌', Entertainment: '🎬', Health: '💊', Other: '💰',
};

export function SpendingChart({ transactions }: any) {
    const categoryData: Record<string, number> = {};
    transactions.forEach((t: any) => {
        if (t.type === 'expense') categoryData[t.category] = (categoryData[t.category] || 0) + Number(t.amount);
    });

    const data = Object.entries(categoryData)
        .sort(([, a], [, b]) => b - a)
        .map(([category, amount], i) => ({ category: `${CAT_EMOJI[category] || '💰'} ${category}`, amount, fill: COLORS[i % COLORS.length] }));

    if (data.length === 0) return (
        <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No expense data yet</div>
    );

    return (
        <div className="w-full h-[280px]">
            <ResponsiveContainer>
                <BarChart data={data} margin={{ left: 10, right: 10 }}>
                    <XAxis dataKey="category" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                        contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                        formatter={(val: any) => [formatINR(val), 'Spent']} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export function CategoryPieChart({ transactions }: any) {
    const data: Record<string, number> = {};
    transactions.forEach((t: any) => {
        if (t.type === 'expense') data[t.category] = (data[t.category] || 0) + Number(t.amount);
    });

    const chartData = Object.entries(data).map(([name, value]) => ({ name: `${CAT_EMOJI[name] || '💰'} ${name}`, value }));

    if (chartData.length === 0) return (
        <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No data yet</div>
    );

    return (
        <PieChart width={300} height={280}>
            <Pie data={chartData} dataKey="value" cx={150} cy={120} outerRadius={90}>
                {chartData.map((_, i) => <PieCell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <PieTooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                formatter={(val: any) => [formatINR(val), 'Spent']} />
            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
        </PieChart>
    );
}