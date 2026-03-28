import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Lock, Unlock, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { formatINR } from '../utils/currency';

type WalletRow = Database['public']['Tables']['wallet']['Row'];

interface SavingsManagerProps {
  wallet: WalletRow;
  onClose: () => void;
  onComplete: () => void;
}

type ActionType = 'deposit' | 'withdraw';
type WithdrawStep = 'initial' | 'warning' | 'confirmation' | 'final';

export function SavingsManager({
  wallet,
  onClose,
  onComplete,
}: SavingsManagerProps) {
  const { user } = useAuth();
  const [action, setAction] = useState<ActionType>('deposit');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>('initial');

  const handleDeposit = async () => {
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      const numAmount = parseFloat(amount);
      if (numAmount <= 0) {
        setError('Amount must be greater than 0');
        setLoading(false);
        return;
      }

      if (Number(wallet.main_balance) < numAmount) {
        setError('Insufficient balance in main wallet');
        setLoading(false);
        return;
      }

      await supabase
        .from('wallet')
        .update({
          main_balance: Number(wallet.main_balance) - numAmount,
          savings_balance: Number(wallet.savings_balance) + numAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawInitial = () => {
    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (Number(wallet.savings_balance) < numAmount) {
      setError('Insufficient balance in savings');
      return;
    }

    setError('');
    setWithdrawStep('warning');
  };

  const handleWithdrawWarning = () => {
    setWithdrawStep('confirmation');
  };

  const handleWithdrawConfirmation = () => {
    setWithdrawStep('final');
  };

  const handleWithdrawFinal = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const numAmount = parseFloat(amount);

      await supabase
        .from('wallet')
        .update({
          main_balance: Number(wallet.main_balance) + numAmount,
          savings_balance: Number(wallet.savings_balance) - numAmount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderWithdrawWarningStep = () => {
    switch (withdrawStep) {
      case 'warning':
        return (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6">
            <div className="flex items-start space-x-4 mb-6">
              <AlertTriangle className="w-12 h-12 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-yellow-900 mb-2">
                  Warning: Savings Access
                </h3>
                <p className="text-yellow-800 text-lg">
                  This is your savings. Don't touch unless absolutely necessary.
                  Your financial security depends on maintaining these funds.
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setWithdrawStep('initial');
                  setAmount('');
                }}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                Cancel - Keep My Savings Safe
              </button>
              <button
                onClick={handleWithdrawWarning}
                className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        );

      case 'confirmation':
        return (
          <div className="bg-orange-50 border-2 border-orange-400 rounded-xl p-6">
            <div className="flex items-start space-x-4 mb-6">
              <ShieldAlert className="w-12 h-12 text-orange-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-orange-900 mb-2">
                  Are You Sure?
                </h3>
                <p className="text-orange-800 text-lg mb-4">
                  You are about to break into your savings. This should only be
                  done in emergencies.
                </p>
                <p className="text-orange-700 font-semibold">
                  Withdrawing: {formatINR(parseFloat(amount))}
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setWithdrawStep('initial');
                  setAmount('');
                }}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                No, Go Back
              </button>
              <button
                onClick={handleWithdrawConfirmation}
                className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition"
              >
                Yes, Continue
              </button>
            </div>
          </div>
        );

      case 'final':
        return (
          <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6">
            <div className="flex items-start space-x-4 mb-6">
              <Unlock className="w-12 h-12 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-red-900 mb-2">
                  Final Warning!
                </h3>
                <p className="text-red-800 text-lg mb-4">
                  You are reducing your financial safety. This withdrawal will
                  impact your savings goal and long-term security.
                </p>
                <p className="text-red-700 font-bold text-xl">
                  Amount: {formatINR(parseFloat(amount))}
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setWithdrawStep('initial');
                  setAmount('');
                }}
                className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                Cancel - Protect My Savings
              </button>
              <button
                onClick={handleWithdrawFinal}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-amber-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Lock className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Manage Savings</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-700 font-medium mb-1">
                Main Balance
              </p>
              <p className="text-2xl font-bold text-blue-900">
                {formatINR(Number(wallet.main_balance))}
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-sm text-amber-700 font-medium mb-1">
                Savings Balance
              </p>
              <p className="text-2xl font-bold text-amber-900">
                {formatINR(Number(wallet.savings_balance))}
              </p>
            </div>
          </div>

          {withdrawStep === 'initial' ? (
            <>
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => {
                    setAction('deposit');
                    setError('');
                  }}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${action === 'deposit'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  Deposit to Savings
                </button>
                <button
                  onClick={() => {
                    setAction('withdraw');
                    setError('');
                  }}
                  className={`flex-1 py-3 rounded-lg font-semibold transition ${action === 'withdraw'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                  Withdraw from Savings
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={
                      action === 'deposit'
                        ? handleDeposit
                        : handleWithdrawInitial
                    }
                    disabled={loading}
                    className={`flex-1 px-6 py-3 ${action === 'deposit'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                      } text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loading
                      ? 'Processing...'
                      : action === 'deposit'
                        ? 'Deposit'
                        : 'Withdraw'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            renderWithdrawWarningStep()
          )}
        </div>
      </div>
    </div>
  );
}
