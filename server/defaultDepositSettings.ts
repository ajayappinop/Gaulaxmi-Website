import type { DepositSettings } from '../shared/types.js';
export const DEFAULT_DEPOSIT_SETTINGS: DepositSettings = {
  mode: 'manual',
  minAmount: 1_000,
  requireKyc: true,
  manual: {
    upiId: 'gaulaxmi@upi',
    accountName: 'Gaulaxmi Dairy LLP',
    accountNumber: '123456789012',
    ifsc: 'HDFC0001234',
    bankName: 'HDFC Bank',
    instructions:
      'Transfer the exact deposit amount via UPI or bank transfer, upload a payment screenshot, and submit your UTR / transaction reference below.',
    qrPayload: 'upi://pay?pa=gaulaxmi@upi&pn=Gaulaxmi&cu=INR',
  },
  gateway: {
    provider: 'razorpay',
    enabled: false,
    keyId: '',
    keySecret: '',
    webhookSecret: '',
    testMode: true,
  },
};
