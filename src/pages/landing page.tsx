import { useNavigate } from 'react-router-dom';

export function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0b0f19] text-white">

            {/* NAVBAR */}
            <nav className="flex justify-between items-center p-6 border-b border-white/10">
                <div className="flex items-center gap-4">

                    <img
                        src="/icon.png"
                        alt="logo"
                        className="w-10 h-10 md:w-14 md:h-14"
                    />

                    <h1 className="text-2xl md:text-3xl font-bold tracking-wide">
                        MindGuard
                    </h1>

                </div>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-emerald-500 px-4 py-2 rounded-lg text-black font-semibold"
                >
                    Get Started
                </button>
            </nav>

            {/* HERO */}
            <section className="text-center py-20 px-6">
                <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                    Take Control of Your Money 💰
                </h2>

                <p className="text-gray-400 max-w-xl mx-auto mb-8">
                    MindGuard helps you track, control, and optimize your spending with AI-powered insights.
                </p>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3 rounded-xl text-black font-semibold text-lg hover:scale-105 transition"
                >
                    Start Tracking Now 🚀
                </button>
            </section>

            {/* FEATURES */}
            <section className="grid md:grid-cols-3 gap-6 px-6 pb-20">

                <Feature title="Track Expenses" desc="Monitor every rupee you spend easily." />
                <Feature title="Smart Analytics" desc="Visual insights into your spending habits." />
                <Feature title="AI Coach" desc="Get smart financial advice instantly." />

            </section>

            {/* HOW IT WORKS */}
            <section className="px-6 pb-20 text-center">
                <h3 className="text-2xl font-semibold mb-10">How It Works</h3>

                <div className="grid md:grid-cols-3 gap-6">

                    <Step title="Add Transactions" desc="Log your income & expenses quickly." />
                    <Step title="Analyze Spending" desc="View charts and trends." />
                    <Step title="Improve Finances" desc="Follow AI suggestions." />

                </div>
            </section>

            {/* PRICING */}
            <section className="px-6 pb-20 text-center">
                <h3 className="text-2xl font-semibold mb-10">Pricing</h3>

                <div className="max-w-md mx-auto bg-[#111827] p-6 rounded-2xl border border-white/10">

                    <h4 className="text-xl font-bold mb-2">Pro Plan</h4>
                    <p className="text-3xl font-bold mb-4">₹99/month</p>

                    <ul className="text-gray-400 space-y-2 mb-6">
                        <li>✔ Advanced Analytics</li>
                        <li>✔ AI Financial Advice</li>
                        <li>✔ Unlimited Tracking</li>
                    </ul>

                    <button className="bg-emerald-500 px-5 py-2 rounded-lg text-black font-semibold">
                        Upgrade Now
                    </button>
                </div>
            </section>

            {/* CTA */}
            <section className="text-center pb-20">
                <h3 className="text-3xl font-bold mb-4">
                    Ready to take control?
                </h3>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3 rounded-xl text-black font-semibold"
                >
                    Get Started 🚀
                </button>
            </section>

        </div>
    );
}

/* COMPONENTS */

function Feature({ title, desc }: any) {
    return (
        <div className="bg-[#111827] p-6 rounded-xl border border-white/10 hover:scale-105 transition">
            <h4 className="text-lg font-semibold mb-2">{title}</h4>
            <p className="text-gray-400">{desc}</p>
        </div>
    );
}

function Step({ title, desc }: any) {
    return (
        <div className="bg-[#111827] p-6 rounded-xl border border-white/10">
            <h4 className="font-semibold mb-2">{title}</h4>
            <p className="text-gray-400">{desc}</p>
        </div>
    );
}