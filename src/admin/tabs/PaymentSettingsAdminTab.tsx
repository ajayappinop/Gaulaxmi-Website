import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Settings2, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../../lib/apiClient';
import type { DepositMode, PaymentSettings } from '../../../shared/types';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { adminCard, adminTypography } from '../adminTheme';

export function PaymentSettingsAdminTab() {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [draft, setDraft] = useState<PaymentSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await api.getAdminPaymentSettings();
      setSettings(s);
      setDraft(s);
    } catch {
      toast.error('Could not load payment settings');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const saved = await api.updateAdminPaymentSettings(draft);
      setSettings(saved);
      setDraft(saved);
      toast.success('Payment settings saved');
    } catch {
      toast.error('Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const setDepositMode = (mode: DepositMode) => {
    if (!draft) return;
    setDraft({
      ...draft,
      deposits: {
        ...draft.deposits,
        mode,
        gateway: { ...draft.deposits.gateway, enabled: mode === 'gateway' },
      },
    });
  };

  if (!draft) {
    return (
      <div className="text-sm text-stone-500 py-8 text-center">Loading payment settings…</div>
    );
  }

  const d = draft.deposits;
  const w = draft.withdrawals;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Payment settings"
        subtitle="Rules and configuration for deposits, withdrawals, and gateways"
        icon={Settings2}
      />

      <section className={`${adminCard} p-5 sm:p-6 space-y-5`}>
        <div className="flex items-center gap-2">
          <ArrowDownRight className="w-5 h-5 text-green-600" />
          <h3 className="font-display font-bold text-lg text-stone-900">Deposit rules</h3>
        </div>
        <p className={adminTypography.pageDesc}>
          Members use one active deposit method at a time. Manual deposits require a payment
          screenshot and UTR; you review proof under Deposit requests. Gateway credits the wallet
          after payment.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="font-semibold text-stone-600">Minimum deposit (INR)</span>
            <input
              type="number"
              min={1}
              className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
              value={d.minAmount}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  deposits: { ...d, minAmount: Number(e.target.value) || 1000 },
                })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm pt-6">
            <input
              type="checkbox"
              checked={d.requireKyc}
              onChange={(e) =>
                setDraft({ ...draft, deposits: { ...d, requireKyc: e.target.checked } })
              }
            />
            <span className="font-semibold text-stone-600">Require verified KYC before deposit</span>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setDepositMode('manual')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition cursor-pointer ${
              d.mode === 'manual'
                ? 'bg-[#7f4e1c] text-white border-[#7f4e1c]'
                : 'bg-white border-stone-200 text-stone-600'
            }`}
          >
            Manual deposits
          </button>
          <button
            type="button"
            onClick={() => setDepositMode('gateway')}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition cursor-pointer flex items-center gap-2 ${
              d.mode === 'gateway'
                ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                : 'bg-white border-stone-200 text-stone-600'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Payment gateway
          </button>
        </div>

        {d.mode === 'manual' && (
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
            {(
              [
                ['upiId', 'UPI ID'],
                ['accountName', 'Account name'],
                ['accountNumber', 'Account number'],
                ['ifsc', 'IFSC'],
                ['bankName', 'Bank name'],
                ['qrPayload', 'UPI QR payload'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block text-sm">
                <span className="font-semibold text-stone-600">{label}</span>
                <input
                  className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                  value={d.manual[key]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      deposits: { ...d, manual: { ...d.manual, [key]: e.target.value } },
                    })
                  }
                />
              </label>
            ))}
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold text-stone-600">Instructions for members</span>
              <textarea
                className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm min-h-[72px]"
                value={d.manual.instructions}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    deposits: { ...d, manual: { ...d.manual, instructions: e.target.value } },
                  })
                }
              />
            </label>
          </div>
        )}

        {d.mode === 'gateway' && (
          <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-stone-100">
            <label className="block text-sm">
              <span className="font-semibold text-stone-600">Provider</span>
              <select
                className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
                value={d.gateway.provider}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    deposits: {
                      ...d,
                      gateway: {
                        ...d.gateway,
                        provider: e.target.value as PaymentSettings['deposits']['gateway']['provider'],
                      },
                    },
                  })
                }
              >
                <option value="razorpay">Razorpay</option>
                <option value="cashfree">Cashfree</option>
                <option value="payu">PayU</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm pt-6">
              <input
                type="checkbox"
                checked={d.gateway.testMode}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    deposits: { ...d, gateway: { ...d.gateway, testMode: e.target.checked } },
                  })
                }
              />
              <span className="font-semibold text-stone-600">Test mode (simulate payments)</span>
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-stone-600">API Key ID</span>
              <input
                className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono"
                value={d.gateway.keyId}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    deposits: { ...d, gateway: { ...d.gateway, keyId: e.target.value } },
                  })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-stone-600">API Key secret</span>
              <input
                type="password"
                className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono"
                value={d.gateway.keySecret}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    deposits: { ...d, gateway: { ...d.gateway, keySecret: e.target.value } },
                  })
                }
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="font-semibold text-stone-600">Webhook secret</span>
              <input
                type="password"
                className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm font-mono"
                value={d.gateway.webhookSecret}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    deposits: { ...d, gateway: { ...d.gateway, webhookSecret: e.target.value } },
                  })
                }
              />
            </label>
          </div>
        )}
      </section>

      <section className={`${adminCard} p-5 sm:p-6 space-y-5`}>
        <div className="flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-[#7f4e1c]" />
          <h3 className="font-display font-bold text-lg text-stone-900">Withdrawal rules</h3>
        </div>
        <p className={adminTypography.pageDesc}>
          Shown to members in the wallet. All withdrawal requests still require admin approval when
          enabled below.
        </p>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={w.enabled}
              onChange={(e) =>
                setDraft({ ...draft, withdrawals: { ...w, enabled: e.target.checked } })
              }
            />
            <span className="font-semibold text-stone-600">Allow members to request withdrawals</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={w.requireKyc}
              onChange={(e) =>
                setDraft({ ...draft, withdrawals: { ...w, requireKyc: e.target.checked } })
              }
            />
            <span className="font-semibold text-stone-600">Require verified KYC</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={w.adminApprovalRequired}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  withdrawals: { ...w, adminApprovalRequired: e.target.checked },
                })
              }
            />
            <span className="font-semibold text-stone-600">Admin approval required</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={w.profitWithdrawalAnytime}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  withdrawals: { ...w, profitWithdrawalAnytime: e.target.checked },
                })
              }
            />
            <span className="font-semibold text-stone-600">Profit withdrawal anytime</span>
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-stone-600">Minimum withdrawal (INR)</span>
            <input
              type="number"
              min={1}
              className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
              value={w.minAmount}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  withdrawals: { ...w, minAmount: Number(e.target.value) || 1 },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-stone-600">Maximum per request (INR)</span>
            <input
              type="number"
              min={1}
              className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
              value={w.maxAmountPerRequest}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  withdrawals: {
                    ...w,
                    maxAmountPerRequest: Number(e.target.value) || 500_000,
                  },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-stone-600">Capital withdrawal notice (days)</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm"
              value={w.capitalNoticeDays}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  withdrawals: { ...w, capitalNoticeDays: Number(e.target.value) || 0 },
                })
              }
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="font-semibold text-stone-600">Instructions shown to members</span>
            <textarea
              className="mt-1 w-full border border-stone-200 rounded-lg px-3 py-2 text-sm min-h-[80px]"
              value={w.memberInstructions}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  withdrawals: { ...w, memberInstructions: e.target.value },
                })
              }
            />
          </label>
        </div>
      </section>

      <button
        type="button"
        disabled={saving || JSON.stringify(settings) === JSON.stringify(draft)}
        onClick={() => void save()}
        className="px-5 py-2.5 rounded-xl bg-[#7f4e1c] text-white text-sm font-semibold hover:bg-[#633a11] disabled:opacity-50 cursor-pointer"
      >
        {saving ? 'Saving…' : 'Save all payment settings'}
      </button>
    </div>
  );
}
