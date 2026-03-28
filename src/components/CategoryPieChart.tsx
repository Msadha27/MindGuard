import { PieChart, Pie, Cell, Tooltip } from 'recharts';

export function CategoryPieChart({ transactions }: any) {

    const data: any = {};

    transactions.forEach((t: any) => {
        if (t.type === 'expense') {
            data[t.category] = (data[t.category] || 0) + Number(t.amount);
        }
    });

    const chartData = Object.keys(data).map(k => ({
        name: k,
        value: data[k]
    }));

    const COLORS = ['#34d399', '#60a5fa', '#f472b6', '#facc15', '#fb7185'];

    return (
        <PieChart width={300} height={300}>
            <Pie data={chartData} dataKey="value">
                {chartData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
            </Pie>
            <Tooltip />
        </PieChart>
    );
}