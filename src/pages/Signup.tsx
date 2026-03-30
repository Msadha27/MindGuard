import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function Signup() {
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignup = async () => {
        const { data, error } = await signUp(email, password);

        if (!error && data.user) {
            await supabase.from('wallet').insert({
                user_id: data.user.id,
                main_balance: 0,
                savings_balance: 0,
            });

            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0b0f19]">

            <div className="bg-[#111827] p-8 rounded-xl w-80 space-y-4 relative">
                {/* 🏠 BACK TO HOME */}
                <button
                    onClick={() => navigate('/')}
                    className="absolute -top-12 left-0 text-gray-500 hover:text-emerald-400 text-sm flex items-center gap-1 transition-colors"
                >
                    ← Back to Home
                </button>

                <h2 className="text-white text-xl font-bold">Sign Up</h2>

                <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-3 bg-gray-100 text-black rounded"
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full p-3 bg-gray-100 text-black rounded"
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    onClick={handleSignup}
                    className="w-full bg-emerald-500 py-2 rounded text-black font-semibold"
                >
                    Create Account
                </button>

            </div>
        </div>
    );
}