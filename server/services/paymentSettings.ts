import { readDb, updateDb } from '../db.js';
import { DEFAULT_DEPOSIT_SETTINGS } from '../defaultDepositSettings.js';
import { DEFAULT_PAYMENT_SETTINGS } from '../defaultPaymentSettings.js';
import type {
  DepositSettings,
  PaymentSettings,
  PublicDepositSettings,
  PublicPaymentSettings,
  PublicWithdrawalSettings,
  WithdrawalSettings,
} from '../../shared/types.js';

export function getPaymentSettingsFromDb(): PaymentSettings {
  const db = readDb();
  if (db.paymentSettings) return db.paymentSettings;
  const legacy = db.depositSettings;
  if (legacy) {
    return {
      deposits: {
        ...legacy,
        minAmount: legacy.minAmount ?? DEFAULT_DEPOSIT_SETTINGS.minAmount,
        requireKyc: legacy.requireKyc ?? true,
      },
      withdrawals: DEFAULT_PAYMENT_SETTINGS.withdrawals,
      updatedAt: legacy.updatedAt,
    };
  }
  return { ...DEFAULT_PAYMENT_SETTINGS };
}

export function ensurePaymentSettings(): PaymentSettings {
  const db = readDb();
  let changed = false;
  if (!db.paymentSettings) {
    db.paymentSettings = getPaymentSettingsFromDb();
    if (!db.paymentSettings.updatedAt) {
      db.paymentSettings.updatedAt = new Date().toISOString();
    }
    changed = true;
  }
  if (!db.depositRequests) {
    db.depositRequests = [];
    changed = true;
  }
  if (changed) {
    updateDb((d) => {
      d.paymentSettings = db.paymentSettings;
      d.depositRequests = db.depositRequests;
    });
  }
  return getPaymentSettingsFromDb();
}

export function getDepositSettingsFromDb(): DepositSettings {
  return ensurePaymentSettings().deposits;
}

export function savePaymentSettings(next: PaymentSettings): PaymentSettings {
  const saved: PaymentSettings = {
    deposits: {
      ...next.deposits,
      mode: next.deposits.mode === 'gateway' ? 'gateway' : 'manual',
      gateway: {
        ...next.deposits.gateway,
        enabled: next.deposits.mode === 'gateway',
      },
      minAmount: Math.max(1, Number(next.deposits.minAmount) || 1000),
      requireKyc: next.deposits.requireKyc !== false,
      updatedAt: new Date().toISOString(),
    },
    withdrawals: {
      ...next.withdrawals,
      enabled: next.withdrawals.enabled !== false,
      requireKyc: next.withdrawals.requireKyc !== false,
      minAmount: Math.max(1, Number(next.withdrawals.minAmount) || 1),
      maxAmountPerRequest: Math.max(
        1,
        Number(next.withdrawals.maxAmountPerRequest) || 500_000
      ),
      adminApprovalRequired: next.withdrawals.adminApprovalRequired !== false,
      capitalNoticeDays: Math.max(0, Number(next.withdrawals.capitalNoticeDays) || 0),
      profitWithdrawalAnytime: next.withdrawals.profitWithdrawalAnytime !== false,
    },
    updatedAt: new Date().toISOString(),
  };
  updateDb((db) => {
    db.paymentSettings = saved;
    db.depositSettings = saved.deposits;
  });
  return saved;
}

export function saveDepositSettings(next: DepositSettings): DepositSettings {
  const current = ensurePaymentSettings();
  const saved = savePaymentSettings({ ...current, deposits: next });
  return saved.deposits;
}

export function toPublicDepositSettings(settings: DepositSettings): PublicDepositSettings {
  const manualEnabled = settings.mode === 'manual';
  const gatewayEnabled = settings.mode === 'gateway';
  const gw = settings.gateway;
  const configured = gatewayEnabled && !!(gw.keyId?.trim() && gw.keySecret?.trim());
  return {
    mode: settings.mode,
    manualEnabled,
    gatewayEnabled,
    manual: settings.manual,
    gateway: {
      provider: gw.provider,
      configured: configured || (gatewayEnabled && gw.testMode),
      testMode: gw.testMode,
    },
    minAmount: settings.minAmount ?? DEFAULT_DEPOSIT_SETTINGS.minAmount,
    requireKyc: settings.requireKyc !== false,
  };
}

export function toPublicWithdrawalSettings(
  settings: WithdrawalSettings
): PublicWithdrawalSettings {
  return { ...settings };
}

export function toPublicPaymentSettings(settings: PaymentSettings): PublicPaymentSettings {
  return {
    deposits: toPublicDepositSettings(settings.deposits),
    withdrawals: toPublicWithdrawalSettings(settings.withdrawals),
  };
}

export function getMinDepositAmount(): number {
  return getDepositSettingsFromDb().minAmount ?? DEFAULT_DEPOSIT_SETTINGS.minAmount;
}

export function validateWithdrawalAmount(amount: number, balance: number): string | null {
  const w = ensurePaymentSettings().withdrawals;
  if (!w.enabled) return 'Withdrawals are temporarily disabled by admin';
  if (!Number.isFinite(amount) || amount < w.minAmount) {
    return `Minimum withdrawal is ₹${w.minAmount.toLocaleString('en-IN')}`;
  }
  if (amount > w.maxAmountPerRequest) {
    return `Maximum per request is ₹${w.maxAmountPerRequest.toLocaleString('en-IN')}`;
  }
  if (amount > balance) return 'Insufficient balance';
  return null;
}
