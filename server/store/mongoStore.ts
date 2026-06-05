import type { Db, Document } from 'mongodb';
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
import { fromMongoDoc, idFilter, normalizeEmail, settingsFilter, toMongoDoc } from './helpers.js';
import type { DatabaseSnapshot, DataStore } from './types.js';

const COL = {
  users: 'users',
  plans: 'plans',
  milestones: 'milestones',
  inquiries: 'inquiries',
  depositRequests: 'deposit_requests',
  supportTickets: 'support_tickets',
  settings: 'settings',
} as const;

const SETTINGS = {
  payment: 'payment_settings',
  deposit: 'deposit_settings',
} as const;

export class MongoStore implements DataStore {
  constructor(private db: Db) {}

  async ensureIndexes(): Promise<void> {
    await Promise.all([
      this.db.collection(COL.users).createIndex({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } }),
      this.db.collection(COL.users).createIndex({ role: 1 }),
      this.db.collection(COL.depositRequests).createIndex({ userId: 1, submittedAt: -1 }),
      this.db.collection(COL.depositRequests).createIndex({ status: 1 }),
      this.db.collection(COL.supportTickets).createIndex({ userId: 1, createdAt: -1 }),
      this.db.collection(COL.supportTickets).createIndex({ status: 1 }),
      this.db.collection(COL.inquiries).createIndex({ createdAt: -1 }),
    ]);
  }

  async findUser(id: string): Promise<DbUser | null> {
    const doc = await this.db.collection(COL.users).findOne(idFilter(id));
    return doc ? fromMongoDoc<DbUser>(doc) : null;
  }

  async findUserByEmail(email: string): Promise<DbUser | null> {
    const norm = normalizeEmail(email);
    const doc = await this.db.collection(COL.users).findOne({ email: norm });
    return doc ? fromMongoDoc<DbUser>(doc) : null;
  }

  async listUsers(): Promise<DbUser[]> {
    const docs = await this.db.collection(COL.users).find().toArray();
    return docs.map((d) => fromMongoDoc<DbUser>(d));
  }

  async insertUser(user: DbUser): Promise<void> {
    await this.db.collection(COL.users).insertOne(toMongoDoc(user));
  }

  async saveUser(user: DbUser): Promise<void> {
    await this.db.collection(COL.users).replaceOne(idFilter(user.id), toMongoDoc(user), {
      upsert: true,
    });
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db.collection(COL.users).deleteOne(idFilter(id));
    return result.deletedCount > 0;
  }

  async upsertUsers(users: DbUser[]): Promise<number> {
    if (users.length === 0) return 0;
    const ops = users.map((u) => ({
      replaceOne: {
        filter: idFilter(u.id),
        replacement: toMongoDoc(u),
        upsert: true,
      },
    }));
    const result = await this.db.collection(COL.users).bulkWrite(ops);
    return result.upsertedCount + result.modifiedCount;
  }

  async listPlans(): Promise<InvestmentPlan[]> {
    const docs = await this.db.collection(COL.plans).find().sort({ amount: 1 }).toArray();
    return docs.map((d) => fromMongoDoc<InvestmentPlan>(d));
  }

  async replacePlans(plans: InvestmentPlan[]): Promise<InvestmentPlan[]> {
    const sorted = [...plans].sort((a, b) => a.amount - b.amount);
    const col = this.db.collection(COL.plans);
    await col.deleteMany({});
    if (sorted.length > 0) {
      await col.insertMany(sorted.map(toMongoDoc));
    }
    return sorted;
  }

  async findPlan(id: string): Promise<InvestmentPlan | null> {
    const doc = await this.db.collection(COL.plans).findOne(idFilter(id));
    return doc ? fromMongoDoc<InvestmentPlan>(doc) : null;
  }

  async findPlanByTier(tier: string): Promise<InvestmentPlan | null> {
    const doc = await this.db
      .collection(COL.plans)
      .findOne({ tier: { $regex: new RegExp(`^${tier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    return doc ? fromMongoDoc<InvestmentPlan>(doc) : null;
  }

  async listMilestones(): Promise<MilestoneTier[]> {
    const docs = await this.db.collection(COL.milestones).find().sort({ minInvest: 1 }).toArray();
    return docs.map((d) => fromMongoDoc<MilestoneTier>(d));
  }

  async replaceMilestones(milestones: MilestoneTier[]): Promise<MilestoneTier[]> {
    const sorted = [...milestones].sort((a, b) => a.minInvest - b.minInvest);
    const col = this.db.collection(COL.milestones);
    await col.deleteMany({});
    if (sorted.length > 0) {
      await col.insertMany(sorted.map(toMongoDoc));
    }
    return sorted;
  }

  async listInquiries(): Promise<ContactInquiry[]> {
    const docs = await this.db.collection(COL.inquiries).find().sort({ createdAt: -1 }).toArray();
    return docs.map((d) => fromMongoDoc<ContactInquiry>(d));
  }

  async insertInquiry(inquiry: ContactInquiry): Promise<void> {
    await this.db.collection(COL.inquiries).insertOne(toMongoDoc(inquiry));
  }

  async updateInquiry(id: string, patch: Partial<ContactInquiry>): Promise<ContactInquiry | null> {
    const col = this.db.collection(COL.inquiries);
    const existing = await col.findOne(idFilter(id));
    if (!existing) return null;
    const next = { ...fromMongoDoc<ContactInquiry>(existing), ...patch };
    await col.replaceOne(idFilter(id), toMongoDoc(next));
    return next;
  }

  async listDepositRequests(): Promise<DepositRequest[]> {
    const docs = await this.db.collection(COL.depositRequests).find().sort({ submittedAt: -1 }).toArray();
    return docs.map((d) => fromMongoDoc<DepositRequest>(d));
  }

  async findDepositRequest(id: string): Promise<DepositRequest | null> {
    const doc = await this.db.collection(COL.depositRequests).findOne(idFilter(id));
    return doc ? fromMongoDoc<DepositRequest>(doc) : null;
  }

  async insertDepositRequest(request: DepositRequest): Promise<void> {
    await this.db.collection(COL.depositRequests).insertOne(toMongoDoc(request));
  }

  async updateDepositRequest(id: string, patch: Partial<DepositRequest>): Promise<DepositRequest | null> {
    const col = this.db.collection(COL.depositRequests);
    const existing = await col.findOne(idFilter(id));
    if (!existing) return null;
    const next = { ...fromMongoDoc<DepositRequest>(existing), ...patch };
    await col.replaceOne(idFilter(id), toMongoDoc(next));
    return next;
  }

  async countPendingDepositRequests(): Promise<number> {
    return this.db.collection(COL.depositRequests).countDocuments({ status: 'pending' });
  }

  async listSupportTickets(): Promise<SupportTicket[]> {
    const docs = await this.db.collection(COL.supportTickets).find().sort({ createdAt: -1 }).toArray();
    return docs.map((d) => fromMongoDoc<SupportTicket>(d));
  }

  async findSupportTicket(id: string): Promise<SupportTicket | null> {
    const doc = await this.db.collection(COL.supportTickets).findOne(idFilter(id));
    return doc ? fromMongoDoc<SupportTicket>(doc) : null;
  }

  async insertSupportTicket(ticket: SupportTicket): Promise<void> {
    await this.db.collection(COL.supportTickets).insertOne(toMongoDoc(ticket));
  }

  async updateSupportTicket(id: string, patch: Partial<SupportTicket>): Promise<SupportTicket | null> {
    const col = this.db.collection(COL.supportTickets);
    const existing = await col.findOne(idFilter(id));
    if (!existing) return null;
    const next = { ...fromMongoDoc<SupportTicket>(existing), ...patch };
    await col.replaceOne(idFilter(id), toMongoDoc(next));
    return next;
  }

  async countOpenSupportTickets(): Promise<number> {
    return this.db.collection(COL.supportTickets).countDocuments({
      status: { $in: ['open', 'in_progress'] },
    });
  }

  async getPaymentSettings(): Promise<PaymentSettings | null> {
    const doc = await this.db.collection(COL.settings).findOne(settingsFilter(SETTINGS.payment));
    return doc?.value ? (doc.value as PaymentSettings) : null;
  }

  async getDepositSettings(): Promise<DepositSettings | null> {
    const doc = await this.db.collection(COL.settings).findOne(settingsFilter(SETTINGS.deposit));
    return doc?.value ? (doc.value as DepositSettings) : null;
  }

  async savePaymentSettings(settings: PaymentSettings): Promise<void> {
    const col = this.db.collection(COL.settings);
    await col.replaceOne(
      settingsFilter(SETTINGS.payment),
      { _id: SETTINGS.payment, value: settings } as Document,
      { upsert: true }
    );
    await col.replaceOne(
      settingsFilter(SETTINGS.deposit),
      { _id: SETTINGS.deposit, value: settings.deposits } as Document,
      { upsert: true }
    );
  }

  async saveDepositSettings(settings: DepositSettings): Promise<void> {
    await this.db.collection(COL.settings).replaceOne(
      settingsFilter(SETTINGS.deposit),
      { _id: SETTINGS.deposit, value: settings } as Document,
      { upsert: true }
    );
  }

  async isEmpty(): Promise<boolean> {
    const [users, plans] = await Promise.all([
      this.db.collection(COL.users).countDocuments(),
      this.db.collection(COL.plans).countDocuments(),
    ]);
    return users === 0 && plans === 0;
  }

  async clearAll(): Promise<void> {
    await Promise.all([
      this.db.collection(COL.users).deleteMany({}),
      this.db.collection(COL.plans).deleteMany({}),
      this.db.collection(COL.milestones).deleteMany({}),
      this.db.collection(COL.inquiries).deleteMany({}),
      this.db.collection(COL.depositRequests).deleteMany({}),
      this.db.collection(COL.supportTickets).deleteMany({}),
      this.db.collection(COL.settings).deleteMany({}),
    ]);
  }

  async seed(snapshot: DatabaseSnapshot): Promise<void> {
    await Promise.all([
      snapshot.users.length
        ? this.db.collection(COL.users).insertMany(snapshot.users.map(toMongoDoc))
        : Promise.resolve(),
      snapshot.plans.length
        ? this.db.collection(COL.plans).insertMany(snapshot.plans.map(toMongoDoc))
        : Promise.resolve(),
      snapshot.milestones.length
        ? this.db.collection(COL.milestones).insertMany(snapshot.milestones.map(toMongoDoc))
        : Promise.resolve(),
      snapshot.inquiries.length
        ? this.db.collection(COL.inquiries).insertMany(snapshot.inquiries.map(toMongoDoc))
        : Promise.resolve(),
      snapshot.depositRequests.length
        ? this.db.collection(COL.depositRequests).insertMany(snapshot.depositRequests.map(toMongoDoc))
        : Promise.resolve(),
      snapshot.supportTickets.length
        ? this.db.collection(COL.supportTickets).insertMany(snapshot.supportTickets.map(toMongoDoc))
        : Promise.resolve(),
    ]);
    if (snapshot.paymentSettings) {
      await this.savePaymentSettings(snapshot.paymentSettings);
    } else if (snapshot.depositSettings) {
      await this.saveDepositSettings(snapshot.depositSettings);
    }
  }

  async exportSnapshot(): Promise<DatabaseSnapshot> {
    const [users, plans, milestones, inquiries, depositRequests, supportTickets, paymentSettings, depositSettings] =
      await Promise.all([
        this.listUsers(),
        this.listPlans(),
        this.listMilestones(),
        this.listInquiries(),
        this.listDepositRequests(),
        this.listSupportTickets(),
        this.getPaymentSettings(),
        this.getDepositSettings(),
      ]);
    return {
      users,
      plans,
      milestones,
      inquiries,
      depositSettings: depositSettings ?? undefined,
      paymentSettings: paymentSettings ?? undefined,
      depositRequests,
      supportTickets,
    };
  }
}
