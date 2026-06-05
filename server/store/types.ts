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

export interface DatabaseSnapshot {
  users: DbUser[];
  plans: InvestmentPlan[];
  milestones: MilestoneTier[];
  inquiries: ContactInquiry[];
  depositSettings?: DepositSettings;
  paymentSettings?: PaymentSettings;
  depositRequests: DepositRequest[];
  supportTickets: SupportTicket[];
}

export interface DataStore {
  // Users
  findUser(id: string): Promise<DbUser | null>;
  findUserByEmail(email: string): Promise<DbUser | null>;
  listUsers(): Promise<DbUser[]>;
  insertUser(user: DbUser): Promise<void>;
  saveUser(user: DbUser): Promise<void>;
  deleteUser(id: string): Promise<boolean>;
  upsertUsers(users: DbUser[]): Promise<number>;

  // Plans & milestones
  listPlans(): Promise<InvestmentPlan[]>;
  replacePlans(plans: InvestmentPlan[]): Promise<InvestmentPlan[]>;
  findPlan(id: string): Promise<InvestmentPlan | null>;
  findPlanByTier(tier: string): Promise<InvestmentPlan | null>;

  listMilestones(): Promise<MilestoneTier[]>;
  replaceMilestones(milestones: MilestoneTier[]): Promise<MilestoneTier[]>;

  // Inquiries
  listInquiries(): Promise<ContactInquiry[]>;
  insertInquiry(inquiry: ContactInquiry): Promise<void>;
  updateInquiry(id: string, patch: Partial<ContactInquiry>): Promise<ContactInquiry | null>;

  // Deposit requests
  listDepositRequests(): Promise<DepositRequest[]>;
  findDepositRequest(id: string): Promise<DepositRequest | null>;
  insertDepositRequest(request: DepositRequest): Promise<void>;
  updateDepositRequest(id: string, patch: Partial<DepositRequest>): Promise<DepositRequest | null>;
  countPendingDepositRequests(): Promise<number>;

  // Support tickets
  listSupportTickets(): Promise<SupportTicket[]>;
  findSupportTicket(id: string): Promise<SupportTicket | null>;
  insertSupportTicket(ticket: SupportTicket): Promise<void>;
  updateSupportTicket(id: string, patch: Partial<SupportTicket>): Promise<SupportTicket | null>;
  countOpenSupportTickets(): Promise<number>;

  // Settings
  getPaymentSettings(): Promise<PaymentSettings | null>;
  getDepositSettings(): Promise<DepositSettings | null>;
  savePaymentSettings(settings: PaymentSettings): Promise<void>;
  saveDepositSettings(settings: DepositSettings): Promise<void>;

  // Bootstrap
  isEmpty(): Promise<boolean>;
  clearAll(): Promise<void>;
  seed(snapshot: DatabaseSnapshot): Promise<void>;
  exportSnapshot(): Promise<DatabaseSnapshot>;
}
