import type { PaymentSettings } from '../shared/types.js';
import { DEFAULT_DEPOSIT_SETTINGS } from './defaultDepositSettings.js';

export const DEFAULT_WITHDRAWAL_SETTINGS: PaymentSettings['withdrawals'] = {
  enabled: true,
  requireKyc: true,
  minAmount: 1,
  maxAmountPerRequest: 500_000,
  adminApprovalRequired: true,
  capitalNoticeDays: 15,
  profitWithdrawalAnytime: true,
  memberInstructions:
    'Profit withdrawals can be requested anytime. Capital withdrawals require 15 days prior notice. All requests are reviewed by admin.',
};

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  deposits: {
    ...DEFAULT_DEPOSIT_SETTINGS,
    minAmount: 1_000,
    requireKyc: true,
  },
  withdrawals: DEFAULT_WITHDRAWAL_SETTINGS,
};
