import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Login() {
    const { signIn, user } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user]);

    const handleLogin = async () => {
        const { error } = await signIn(email, password);

        if (!error) {
            navigate('/dashboard');
        } else {
            alert(error.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">

            <div className="bg-[#111827] p-8 rounded-2xl w-80 space-y-5 shadow-xl border border-white/10 relative">
                {/* 🏠 BACK TO HOME */}
                <button 
                  onClick={() => navigate('/')}
                  className="absolute -top-12 left-0 text-gray-500 hover:text-emerald-400 text-sm flex items-center gap-1 transition-colors"
                >
                  ← Back to Home
                </button>

                {/* 🔥 LOGO + BRAND */}
                <div className="flex flex-col items-center gap-2">

                    <img
                        src="/icon.png"
                        alt="logo"
                        className="w-14 h-14 rounded-xl shadow-lg shadow-emerald-500/30"
                    />

                    <h1 className="text-white text-xl font-bold">MindGuard</h1>
                    <p className="text-gray-400 text-sm">Welcome back 👋</p>

                </div>

                {/* INPUTS */}
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-3 bg-gray-100 text-black rounded-lg"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-3 bg-gray-100 text-black rounded-lg"
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/* BUTTON */}
                <button
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-emerald-400 to-teal-500 py-2 rounded-lg text-black font-semibold hover:scale-105 transition"
                >
                    Login
                </button>

                {/* SIGNUP LINK */}
                <p className="text-gray-400 text-sm text-center">
                    Don’t have an account?{' '}
                    <span
                        onClick={() => navigate('/signup')}
                        className="text-emerald-400 cursor-pointer"
                    >
                        Sign up
                    </span>
                </p>

            </div>
        </div>
    );
}