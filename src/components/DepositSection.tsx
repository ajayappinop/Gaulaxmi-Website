import React, { useCallback, useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowDownRight, Copy, CreditCard, ImageIcon, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../lib/auth';
import { api, ApiError } from '../lib/apiClient';
import { formatINR } from '../lib/plans';
import {
  isValidMoneyAmount,
  parsePositiveAmount,
} from '../lib/validation';
import { readImageFileAsDataUrl } from '../lib/depositScreenshot';
import type { PublicPaymentSettings } from '../../shared/types';

const DEFAULT_MIN_DEPOSIT = 1_000;

export function DepositSection({
  kycVerified,
  onViewTransactionHistory,
}: {
  kycVerified: boolean;
  onViewTransactionHistory?: () => void;
}) {
  const { submitManualDeposit, payViaGateway } = useAuth();
  const [payment, setPayment] = useState<PublicPaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [paymentScreenshotName, setPaymentScreenshotName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payingGateway, setPayingGateway] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await api.getPaymentSettings();
      setPayment(s);
    } catch {
      toast.error('Could not load deposit options');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleManualSubmit = async () => {
    const parsed = parsePositiveAmount(amount);
    if (parsed === null) {
      toast.error('Enter a valid deposit amount.');
      return;
    }
    if (!isValidMoneyAmount(parsed, { min: minDeposit })) {
      toast.error(`Minimum deposit is ${formatINR(minDeposit)}.`);
      return;
    }
    if (!utr.trim() || utr.trim().length < 6) {
      toast.error('Enter your UTR / transaction reference (min 6 characters).');
      return;
    }
    if (!paymentScreenshot) {
      toast.error('Upload a screenshot of your payment (UPI/bank confirmation).');
      return;
    }
    setSubmitting(true);
    try {
      await submitManualDeposit(
        parsed,
        utr.trim(),
        paymentScreenshot,
        paymentNote.trim() || undefined,
        paymentScreenshotName || undefined
      );
      setAmount('');
      setUtr('');
      setPaymentNote('');
      setPaymentScreenshot('');
      setPaymentScreenshotName('');
      toast.success('Deposit request submitted. Track status in Transaction History.');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not submit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGatewayPay = async () => {
    const parsed = parsePositiveAmount(amount);
    if (parsed === null) {
      toast.error('Enter a valid deposit amount.');
      return;
    }
    if (!isValidMoneyAmount(parsed, { min: minDeposit })) {
      toast.error(`Minimum deposit is ${formatINR(minDeposit)}.`);
      return;
    }
    setPayingGateway(true);
    try {
      await payViaGateway(parsed);
      setAmount('');
      toast.success('Payment successful — wallet credited.');
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Payment failed');
    } finally {
      setPayingGateway(false);
    }
  };

  const copyText = (text: string, label: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#eae0d5]/85 rounded-3xl p-6 shadow-sm text-sm text-stone-500">
        Loading deposit options…
      </div>
    );
  }

  if (!payment) return null;

  const settings = payment.deposits;
  const minDeposit = settings.minAmount ?? DEFAULT_MIN_DEPOSIT;
  const manual = settings.manualEnabled;
  const gateway = settings.gatewayEnabled;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#eae0d5]/85 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <ArrowDownRight className="w-5 h-5 text-green-600" /> Deposit Funds
        </h3>
        <p className="text-sm text-stone-500">
          Pending and completed deposits appear in{' '}
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

        {!kycVerified ? (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm font-sans">
            Deposits are disabled until KYC is submitted and approved by an admin.
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-600">
              {manual
                ? 'Pay via UPI or bank transfer using the details below, then upload a payment screenshot and your UTR for admin verification.'
                : `Pay securely via ${settings.gateway.provider} — funds are credited to your wallet after payment.`}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-muted-foreground font-sans block">
                Amount (INR)
              </label>
              <input
                type="number"
                min={minDeposit}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50"
                placeholder={`Min ${formatINR(minDeposit)}`}
              />
            </div>

            {manual && (
              <div className="space-y-4 border-t border-stone-100 pt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-4 bg-[#f8f1e8] rounded-2xl border border-[#d8cec1]">
                    <p className="text-xs font-semibold text-stone-500 uppercase mb-3">Scan to pay (UPI)</p>
                    <QRCodeSVG value={settings.manual.qrPayload || settings.manual.upiId} size={160} />
                    <button
                      type="button"
                      onClick={() => copyText(settings.manual.upiId, 'UPI ID')}
                      className="mt-3 text-xs font-semibold text-[#7b4b1d] flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" /> {settings.manual.upiId}
                    </button>
                  </div>
                  <div className="text-sm space-y-2 text-stone-700">
                    <p className="font-semibold text-stone-900">Bank details</p>
                    <p>
                      <span className="text-stone-500">Account name:</span> {settings.manual.accountName}
                    </p>
                    <p>
                      <span className="text-stone-500">Account no.:</span>{' '}
                      <button
                        type="button"
                        onClick={() => copyText(settings.manual.accountNumber, 'Account number')}
                        className="font-mono hover:text-[#7b4b1d] cursor-pointer"
                      >
                        {settings.manual.accountNumber}
                      </button>
                    </p>
                    <p>
                      <span className="text-stone-500">IFSC:</span> {settings.manual.ifsc}
                    </p>
                    <p>
                      <span className="text-stone-500">Bank:</span> {settings.manual.bankName}
                    </p>
                    <p className="text-xs text-stone-500 pt-2">{settings.manual.instructions}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground font-sans block">
                    UTR / Transaction ID *
                  </label>
                  <input
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 font-mono text-sm"
                    placeholder="e.g. 523456789012"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground font-sans block">
                    Payment screenshot *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <label className="relative flex flex-col items-center justify-center w-full sm:w-40 h-32 border-2 border-dashed border-[#d8cec1] rounded-xl bg-[#f8f1e8] cursor-pointer hover:border-[#7f4e1c]/50 transition overflow-hidden">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          void readImageFileAsDataUrl(file)
                            .then((dataUrl) => {
                              setPaymentScreenshot(dataUrl);
                              setPaymentScreenshotName(file.name);
                            })
                            .catch((err) =>
                              toast.error(err instanceof Error ? err.message : 'Invalid image')
                            );
                          e.target.value = '';
                        }}
                      />
                      {paymentScreenshot ? (
                        <img
                          src={paymentScreenshot}
                          alt="Payment proof"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-[#7b4b1d] mb-1" />
                          <span className="text-xs font-semibold text-[#7b4b1d]">Upload proof</span>
                        </>
                      )}
                    </label>
                    <div className="flex-1 text-xs text-stone-500 space-y-1">
                      <p>Upload a clear screenshot showing amount, date, and UTR/reference.</p>
                      <p>JPEG, PNG, or WebP · max 1.5 MB</p>
                      {paymentScreenshotName && (
                        <p className="font-medium text-stone-700 truncate">{paymentScreenshotName}</p>
                      )}
                      {paymentScreenshot && (
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentScreenshot('');
                            setPaymentScreenshotName('');
                          }}
                          className="text-red-600 font-semibold hover:underline cursor-pointer"
                        >
                          Remove screenshot
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-muted-foreground font-sans block">
                    Note (optional)
                  </label>
                  <input
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50 text-sm"
                    placeholder="Payment mode, payer name, etc."
                  />
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleManualSubmit()}
                  className="w-full bg-[#7f4e1c] text-white hover:bg-[#633a11] font-semibold py-3 rounded-xl transition cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Submitting…' : 'Submit deposit request'}
                </button>
              </div>
            )}

            {gateway && (
              <div className="border-t border-stone-100 pt-4 space-y-3">
                <div className="flex items-start gap-3 p-4 bg-sky-50 border border-sky-100 rounded-xl text-sm text-sky-900">
                  <CreditCard className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold capitalize">{settings.gateway.provider} payment gateway</p>
                    <p className="mt-1 text-sky-800">
                      {settings.gateway.configured
                        ? settings.gateway.testMode
                          ? 'Test mode: simulated checkout (connect live API keys in admin for production).'
                          : 'Live gateway configured — checkout will use your API integration.'
                        : 'Gateway keys not configured — test checkout will simulate a successful payment.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={payingGateway}
                  onClick={() => void handleGatewayPay()}
                  className="w-full bg-[#1e3a5f] text-white hover:bg-[#152a45] font-semibold py-3 rounded-xl transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {payingGateway ? 'Processing payment…' : `Pay ${amount ? formatINR(parsePositiveAmount(amount) ?? 0) : 'amount'} via gateway`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
