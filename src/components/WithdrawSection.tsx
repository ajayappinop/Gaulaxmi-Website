import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUpRight, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { api, ApiError } from '../lib/apiClient';
import { formatINR } from '../lib/plans';
import type { PublicWithdrawalSettings } from '../../shared/types';
import { isValidMoneyAmount, parsePositiveAmount } from '../lib/validation';

export function WithdrawSection({
  kycVerified,
  kycStatus,
  balance,
  onViewTransactionHistory,
}: {
  kycVerified: boolean;
  kycStatus?: string;
  balance: number;
  onViewTransactionHistory?: () => void;
}) {
  const { withdraw } = useAuth();
  const [rules, setRules] = useState<PublicWithdrawalSettings | null>(null);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      const pay = await api.getPaymentSettings();
      setRules(pay.withdrawals);
    } catch {
      toast.error('Could not load withdrawal rules');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleWithdraw = async () => {
    if (!rules?.enabled) {
      toast.error('Withdrawals are temporarily disabled.');
      return;
    }
    if (rules.requireKyc && !kycVerified) {
      toast.error('Complete KYC and wait for admin approval before withdrawing.');
      return;
    }
    const parsed = parsePositiveAmount(amount);
    if (parsed === null) {
      toast.error('Enter a valid withdrawal amount.');
      return;
    }
    if (!isValidMoneyAmount(parsed, { min: rules.minAmount })) {
      toast.error(`Minimum withdrawal is ${formatINR(rules.minAmount)}.`);
      return;
    }
    if (parsed > rules.maxAmountPerRequest) {
      toast.error(`Maximum per request is ${formatINR(rules.maxAmountPerRequest)}.`);
      return;
    }
    if (parsed > balance) {
      toast.error('Insufficient balance.');
      return;
    }
    setSubmitting(true);
    try {
      await withdraw(parsed);
      setAmount('');
      toast.success('Withdrawal request submitted. Track status in Transaction History.');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  };

  const canWithdraw =
    rules?.enabled && (!rules.requireKyc || kycVerified);

  return (
    <div className="bg-white border border-[#eae0d5]/85 rounded-3xl p-6 shadow-sm space-y-4 max-w-xl">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <ArrowUpRight className="w-5 h-5 text-bark" /> Withdraw Funds
      </h3>
      <p className="text-sm text-stone-500">
        Pending and completed withdrawals appear in{' '}
        {onViewTransactionHistory ? (
          <button
            type="button"
            onClick={onViewTransactionHistory}
            className="font-semibold text-[#7f4e1c] hover:underline cursor-pointer"
          >
            Transaction History
          </button>
        ) : (
          <span className="font-semibold text-[#7f4e1c]">Transaction History</span>
        )}
        .
      </p>

      {rules?.memberInstructions && (
        <div className="flex gap-2 p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700">
          <Info className="w-4 h-4 shrink-0 text-stone-500 mt-0.5" />
          <p>{rules.memberInstructions}</p>
        </div>
      )}

      {rules && (
        <ul className="text-xs text-stone-500 space-y-1 list-disc pl-4">
          <li>
            Min {formatINR(rules.minAmount)} · Max {formatINR(rules.maxAmountPerRequest)} per request
          </li>
          {rules.capitalNoticeDays > 0 && (
            <li>Capital withdrawal: {rules.capitalNoticeDays}-day prior notice</li>
          )}
          {rules.profitWithdrawalAnytime && <li>Profit withdrawal: anytime</li>}
          {rules.adminApprovalRequired && <li>All requests require admin approval</li>}
        </ul>
      )}

      {!canWithdraw ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-sans">
          {!rules?.enabled
            ? 'Withdrawals are disabled by admin.'
            : userKycMessage(kycVerified, kycStatus)}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-muted-foreground font-sans block">
              Amount (INR)
            </label>
            <input
              type="number"
              min={rules?.minAmount ?? 1}
              max={Math.min(balance, rules?.maxAmountPerRequest ?? balance)}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50"
              placeholder="e.g. 5000"
            />
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleWithdraw()}
            className="w-full bg-bark text-white font-semibold py-3 rounded-xl transition hover:opacity-90 cursor-pointer disabled:opacity-60"
          >
            {submitting ? 'Submitting…' : 'Request Withdrawal'}
          </button>
        </>
      )}
    </div>
  );
}

function userKycMessage(kycVerified: boolean, kycStatus?: string) {
  if (kycVerified) return '';
  if (kycStatus === 'submitted') {
    return 'Withdrawals are disabled while your KYC is under admin review.';
  }
  return 'Withdrawals are disabled until KYC is submitted and approved by an admin.';
}
