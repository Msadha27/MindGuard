import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { formatINR } from '../utils/currency';

export function SpendingChart({ transactions }: any) {

    const categoryData: any = {};

    transactions.forEach((t: any) => {
        if (t.type === 'expense') {
            categoryData[t.category] =
                (categoryData[t.category] || 0) + Number(t.amount);
        }
    });

    const data = Object.keys(categoryData).map((key) => ({
        category: key,
        amount: categoryData[key],
    }));

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer>
                <BarChart data={data}>
                    <XAxis dataKey="category" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip formatter={(val: any) => formatINR(val)} />
                    <Bar dataKey="amount" fill="#34d399" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}