import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  ContactInquiry,
  DbUser,
  DepositRequest,
  DepositSettings,
  InvestmentPlan,
  MilestoneTier,
  PaymentSettings,
  SupportTicket,
} from '../../shared/types.js';
import { normalizeEmail } from './helpers.js';
import type { DatabaseSnapshot, DataStore } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function emptySnapshot(): DatabaseSnapshot {
  return {
    users: [],
    plans: [],
    milestones: [],
    inquiries: [],
    depositRequests: [],
    supportTickets: [],
  };
}

function normalizeSnapshot(parsed: Partial<DatabaseSnapshot>): DatabaseSnapshot {
  return {
    users: parsed.users ?? [],
    plans: parsed.plans ?? [],
    milestones: parsed.milestones ?? [],
    inquiries: parsed.inquiries ?? [],
    depositSettings: parsed.depositSettings,
    paymentSettings: parsed.paymentSettings,
    depositRequests: parsed.depositRequests ?? [],
    supportTickets: parsed.supportTickets ?? [],
  };
}

export class JsonStore implements DataStore {
  private data: DatabaseSnapshot = emptySnapshot();

  loadFromDisk(): void {
    ensureDataDir();
    if (!fs.existsSync(DB_FILE)) {
      this.data = emptySnapshot();
      return;
    }
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      this.data = normalizeSnapshot(JSON.parse(raw) as Partial<DatabaseSnapshot>);
    } catch {
      this.data = emptySnapshot();
    }
  }

  private persist(): void {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  async findUser(id: string): Promise<DbUser | null> {
    return this.data.users.find((u) => u.id === id) ?? null;
  }

  async findUserByEmail(email: string): Promise<DbUser | null> {
    const norm = normalizeEmail(email);
    return this.data.users.find((u) => normalizeEmail(u.email) === norm) ?? null;
  }

  async listUsers(): Promise<DbUser[]> {
    return [...this.data.users];
  }

  async insertUser(user: DbUser): Promise<void> {
    this.data.users.push(user);
    this.persist();
  }

  async saveUser(user: DbUser): Promise<void> {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx === -1) {
      this.data.users.push(user);
    } else {
      this.data.users[idx] = user;
    }
    this.persist();
  }

  async deleteUser(id: string): Promise<boolean> {
    const before = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u.id !== id);
    if (this.data.users.length === before) return false;
    this.persist();
    return true;
  }

  async upsertUsers(users: DbUser[]): Promise<number> {
    let count = 0;
    const byId = new Map(this.data.users.map((u) => [u.id, u]));
    for (const u of users) {
      byId.set(u.id, u);
      count++;
    }
    this.data.users = Array.from(byId.values());
    this.persist();
    return count;
  }

  async listPlans(): Promise<InvestmentPlan[]> {
    return [...this.data.plans].sort((a, b) => a.amount - b.amount);
  }

  async replacePlans(plans: InvestmentPlan[]): Promise<InvestmentPlan[]> {
    this.data.plans = [...plans].sort((a, b) => a.amount - b.amount);
    this.persist();
    return this.data.plans;
  }

  async findPlan(id: string): Promise<InvestmentPlan | null> {
    return this.data.plans.find((p) => p.id === id) ?? null;
  }

  async findPlanByTier(tier: string): Promise<InvestmentPlan | null> {
    const lower = tier.toLowerCase();
    return this.data.plans.find((p) => p.tier.toLowerCase() === lower) ?? null;
  }

  async listMilestones(): Promise<MilestoneTier[]> {
    return [...this.data.milestones].sort((a, b) => a.minInvest - b.minInvest);
  }

  async replaceMilestones(milestones: MilestoneTier[]): Promise<MilestoneTier[]> {
    this.data.milestones = [...milestones].sort((a, b) => a.minInvest - b.minInvest);
    this.persist();
    return this.data.milestones;
  }

  async listInquiries(): Promise<ContactInquiry[]> {
    return [...this.data.inquiries];
  }

  async insertInquiry(inquiry: ContactInquiry): Promise<void> {
    this.data.inquiries.unshift(inquiry);
    this.persist();
  }

  async updateInquiry(id: string, patch: Partial<ContactInquiry>): Promise<ContactInquiry | null> {
    const idx = this.data.inquiries.findIndex((q) => q.id === id);
    if (idx === -1) return null;
    this.data.inquiries[idx] = { ...this.data.inquiries[idx], ...patch };
    this.persist();
    return this.data.inquiries[idx];
  }

  async listDepositRequests(): Promise<DepositRequest[]> {
    return [...this.data.depositRequests];
  }

  async findDepositRequest(id: string): Promise<DepositRequest | null> {
    return this.data.depositRequests.find((r) => r.id === id) ?? null;
  }

  async insertDepositRequest(request: DepositRequest): Promise<void> {
    this.data.depositRequests.unshift(request);
    this.persist();
  }

  async updateDepositRequest(id: string, patch: Partial<DepositRequest>): Promise<DepositRequest | null> {
    const idx = this.data.depositRequests.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.data.depositRequests[idx] = { ...this.data.depositRequests[idx], ...patch };
    this.persist();
    return this.data.depositRequests[idx];
  }

  async countPendingDepositRequests(): Promise<number> {
    return this.data.depositRequests.filter((r) => r.status === 'pending').length;
  }

  async listSupportTickets(): Promise<SupportTicket[]> {
    return [...this.data.supportTickets];
  }

  async findSupportTicket(id: string): Promise<SupportTicket | null> {
    return this.data.supportTickets.find((t) => t.id === id) ?? null;
  }

  async insertSupportTicket(ticket: SupportTicket): Promise<void> {
    this.data.supportTickets.unshift(ticket);
    this.persist();
  }

  async updateSupportTicket(id: string, patch: Partial<SupportTicket>): Promise<SupportTicket | null> {
    const idx = this.data.supportTickets.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.data.supportTickets[idx] = { ...this.data.supportTickets[idx], ...patch };
    this.persist();
    return this.data.supportTickets[idx];
  }

  async countOpenSupportTickets(): Promise<number> {
    return this.data.supportTickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
  }

  async getPaymentSettings(): Promise<PaymentSettings | null> {
    return this.data.paymentSettings ?? null;
  }

  async getDepositSettings(): Promise<DepositSettings | null> {
    return this.data.depositSettings ?? null;
  }

  async savePaymentSettings(settings: PaymentSettings): Promise<void> {
    this.data.paymentSettings = settings;
    this.data.depositSettings = settings.deposits;
    this.persist();
  }

  async saveDepositSettings(settings: DepositSettings): Promise<void> {
    this.data.depositSettings = settings;
    this.persist();
  }

  async isEmpty(): Promise<boolean> {
    return this.data.users.length === 0 && this.data.plans.length === 0;
  }

  async clearAll(): Promise<void> {
    this.data = emptySnapshot();
    this.persist();
  }

  async seed(snapshot: DatabaseSnapshot): Promise<void> {
    this.data = normalizeSnapshot(snapshot);
    this.persist();
  }

  async exportSnapshot(): Promise<DatabaseSnapshot> {
    return normalizeSnapshot(this.data);
  }
}

export function loadJsonSnapshotFromDisk(): DatabaseSnapshot | null {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) return null;
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8').trim();
    if (raw.length <= 2) return null;
    return normalizeSnapshot(JSON.parse(raw) as Partial<DatabaseSnapshot>);
  } catch {
    return null;
  }
}
