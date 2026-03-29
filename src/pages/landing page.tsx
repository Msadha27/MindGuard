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
                    Master Your Money Journey 💰
                </h2>

                <p className="text-gray-400 max-w-xl mx-auto mb-8">
                    MindGuard provides the ultimate tools to track every rupee, visualize your spending trends, and build your savings vault with precision.
                </p>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 px-6 py-3 rounded-xl text-black font-semibold text-lg hover:scale-105 transition"
                >
                    Start Your Wealth Journey 🚀
                </button>
            </section>

            {/* FEATURES */}
            <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 pb-20">

                <Feature 
                    title="Real-time Tracking" 
                    desc="Log income and expenses instantly with categorized entries and historical logs." 
                />
                <Feature 
                    title="Deep Analytics" 
                    desc="Interactive charts and monthly breakdowns to help you understand where your money goes." 
                />
                <Feature 
                    title="Savings Vault" 
                    desc="Set aside money in a dedicated vault and watch your net worth grow over time." 
                />
                <Feature 
                    title="Smart Limits" 
                    desc="Configure monthly spending caps and category-wise budgets to prevent overspending." 
                />

            </section>

            {/* HOW IT WORKS */}
            <section className="px-6 pb-20 text-center">
                <h3 className="text-2xl font-semibold mb-10">Total Financial Clarity</h3>

                <div className="grid md:grid-cols-3 gap-6">

                    <Step 
                        title="1. Log Everything" 
                        desc="Quickly add your transactions as they happen to keep data accurate." 
                    />
                    <Step 
                        title="2. View Trends" 
                        desc="Use our visual dashboard to see spending patterns across categories." 
                    />
                    <Step 
                        title="3. Save & Grow" 
                        desc="Transfer surplus to your savings vault and hit your financial goals." 
                    />

                </div>
            </section>

            {/* PRICING */}
            <section className="px-6 pb-20 text-center">
                <h3 className="text-2xl font-semibold mb-10">Choose Your Plan</h3>

                <div className="max-w-md mx-auto bg-[#111827] p-8 rounded-2xl border border-white/10 shadow-2xl">

                    <h4 className="text-xl font-bold mb-2">Ultimate Plan</h4>
                    <p className="text-4xl font-bold mb-4">₹99/month</p>

                    <ul className="text-gray-400 space-y-3 mb-8 text-left max-w-[200px] mx-auto">
                        <li>✔ Advanced Data Export</li>
                        <li>✔ Custom Budget Limits</li>
                        <li>✔ Detailed Savings Goals</li>
                        <li>✔ Ad-free Experience</li>
                        <li>✔ Priority Support</li>
                    </ul>

                    <button className="w-full bg-emerald-500 py-3 rounded-xl text-black font-bold hover:bg-emerald-400 transition">
                        Get Unlimited Access
                    </button>
                </div>
            </section>

            {/* CTA */}
            <section className="text-center pb-20">
                <h3 className="text-3xl font-bold mb-4">
                    Ready for financial freedom?
                </h3>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 px-8 py-4 rounded-xl text-black font-bold text-lg"
                >
                    Launch Your Dashboard 🚀
                </button>
            </section>

        </div>
    );
}

/* COMPONENTS */

function Feature({ title, desc }: any) {
    return (
        <div className="bg-[#111827] p-6 rounded-xl border border-white/10 hover:border-emerald-500/50 transition-all duration-300">
            <h4 className="text-lg font-semibold mb-3 text-emerald-400">{title}</h4>
            <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}

function Step({ title, desc }: any) {
    return (
        <div className="bg-[#111827] p-8 rounded-xl border border-white/10 relative">
            <h4 className="font-bold text-xl mb-3">{title}</h4>
            <p className="text-gray-400">{desc}</p>
        </div>
    );
}