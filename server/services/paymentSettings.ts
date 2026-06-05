import { getStore } from '../store/index.js';
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

async function resolvePaymentSettings(): Promise<PaymentSettings> {
  const store = getStore();
  const payment = await store.getPaymentSettings();
  if (payment) return payment;

  const legacy = await store.getDepositSettings();
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

export async function getPaymentSettingsFromDb(): Promise<PaymentSettings> {
  return resolvePaymentSettings();
}

export async function ensurePaymentSettings(): Promise<PaymentSettings> {
  const store = getStore();
  const current = await resolvePaymentSettings();
  const payment = await store.getPaymentSettings();

  if (!payment) {
    await store.savePaymentSettings(current);
  }
  return resolvePaymentSettings();
}

export async function getDepositSettingsFromDb(): Promise<DepositSettings> {
  return (await ensurePaymentSettings()).deposits;
}

export async function savePaymentSettings(next: PaymentSettings): Promise<PaymentSettings> {
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
  await getStore().savePaymentSettings(saved);
  return saved;
}

export async function saveDepositSettings(next: DepositSettings): Promise<DepositSettings> {
  const current = await ensurePaymentSettings();
  const saved = await savePaymentSettings({ ...current, deposits: next });
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

export async function getMinDepositAmount(): Promise<number> {
  return (await getDepositSettingsFromDb()).minAmount ?? DEFAULT_DEPOSIT_SETTINGS.minAmount;
}

export async function validateWithdrawalAmount(amount: number, balance: number): Promise<string | null> {
  const w = (await ensurePaymentSettings()).withdrawals;
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
