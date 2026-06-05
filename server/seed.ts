import bcrypt from 'bcryptjs';
import type { DbUser } from '../shared/types.js';
import type { DatabaseSnapshot } from './store/types.js';
import { DEFAULT_PLANS } from './defaultPlans.js';
import { DEFAULT_MILESTONES } from './defaultMilestones.js';
import { DEFAULT_PAYMENT_SETTINGS } from './defaultPaymentSettings.js';
import type { AdminPermission } from '../shared/adminPermissions.js';

export async function buildSeedDatabase(): Promise<DatabaseSnapshot> {
  const [adminHash, staffHash, memberHash] = await Promise.all([
    bcrypt.hash('admin123', 10),
    bcrypt.hash('staff123', 10),
    bcrypt.hash('member123', 10),
  ]);

  const staffPermissions: AdminPermission[] = [
    'overview',
    'users',
    'kyc',
    'deposit_requests',
    'support_tickets',
    'inquiries',
  ];

  const adminSeed: DbUser = {
    id: 'gaulaxmi_admin',
    role: 'admin',
    adminRole: 'super_admin',
    name: 'Gaulaxmi Admin',
    email: 'admin@gaulaxmi.io',
    passwordHash: adminHash,
    balance: 0,
    walletAddress: '0xadmin0000000000000000000000000000000001',
    isKycVerified: true,
    kycStatus: 'verified',
    investments: [],
    transactions: [],
    referrals: [],
    referralLink: 'https://gaulaxmi.com/ref/admin',
    phone: '',
  };

  const staffAdmin: DbUser = {
    id: 'staff_admin_1',
    role: 'admin',
    adminRole: 'staff',
    adminPermissions: staffPermissions,
    name: 'Support Staff',
    email: 'staff@gaulaxmi.io',
    passwordHash: staffHash,
    balance: 0,
    walletAddress: '0xstaff00000000000000000000000000000002',
    isKycVerified: true,
    kycStatus: 'verified',
    investments: [],
    transactions: [],
    referrals: [],
    referralLink: 'https://gaulaxmi.com/ref/staff',
    phone: '9000000001',
  };

  const members: Omit<DbUser, 'passwordHash'>[] = [
    {
      id: 'admin_test_1',
      role: 'member',
      name: 'Ajay Appinop',
      email: 'ajay@appinop.com',
      balance: 247000,
      walletAddress: '0x3c5b98df78faef67b7890ef9a3f9eef68f0003ca',
      isKycVerified: false,
      kycStatus: 'submitted',
      kycVerificationNumber: 'GLX-KYC-ADMIN-3210',
      kycDetails: {
        fullName: 'Ajay Appinop',
        dob: '1995-04-12',
        gender: 'Male',
        phone: '9876543210',
        docType: 'PAN',
        docNumber: 'ABCDE1234F',
        docFileName: 'pan_national_document.jpg',
        address: 'Malviya Nagar, 12 SFS Flat',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302017',
        submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      kycHistory: [
        {
          id: 'kycsub_seed_ajay_1',
          status: 'submitted',
          certificateId: 'GLX-KYC-ADMIN-3210',
          submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          details: {
            fullName: 'Ajay Appinop',
            dob: '1995-04-12',
            gender: 'Male',
            phone: '9876543210',
            docType: 'PAN',
            docNumber: 'ABCDE1234F',
            docFileName: 'pan_national_document.jpg',
            address: 'Malviya Nagar, 12 SFS Flat',
            city: 'Jaipur',
            state: 'Rajasthan',
            pincode: '302017',
            submittedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
          },
        },
      ],
      investments: [],
      transactions: [
        {
          id: 'tx_seed_ajay_dep',
          type: 'deposit',
          amount: 50000,
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          status: 'pending',
          details: 'Manual deposit — UTR: HDFC998877665544 (pending approval)',
          depositRequestId: 'dep_seed_ajay_1',
        },
      ],
      referrals: [],
      referralLink: 'https://gaulaxmi.com/ref/ajayapp',
      phone: '9876543210',
    },
    {
      id: 'demo_user_2',
      role: 'member',
      name: 'Vikram Singh',
      email: 'vikram@gaulaxmi.io',
      balance: 15400,
      walletAddress: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
      isKycVerified: true,
      kycStatus: 'verified',
      kycVerificationNumber: 'GLX-KYC-DEMO2-1100',
      kycDetails: {
        fullName: 'Vikram Singh',
        dob: '1988-08-20',
        gender: 'Male',
        phone: '9922881100',
        docType: 'Aadhaar',
        docNumber: '123456789012',
        docFileName: 'aadhaar_card.jpg',
        address: 'Sector 12, MG Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        submittedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
      kycHistory: [
        {
          id: 'kycsub_seed_vikram_1',
          status: 'verified',
          certificateId: 'GLX-KYC-DEMO2-1100',
          submittedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          reviewedAt: new Date(Date.now() - 86400000 * 29).toISOString(),
          reviewedBy: 'admin@gaulaxmi.io',
          details: {
            fullName: 'Vikram Singh',
            dob: '1988-08-20',
            gender: 'Male',
            phone: '9922881100',
            docType: 'Aadhaar',
            docNumber: '123456789012',
            docFileName: 'aadhaar_card.jpg',
            address: 'Sector 12, MG Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            submittedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          },
        },
      ],
      investments: [
        {
          id: 'inv_seed_vikram_1',
          planId: DEFAULT_PLANS[0]?.id,
          planName: DEFAULT_PLANS[0]?.tier ?? 'Starter',
          amount: DEFAULT_PLANS[0]?.amount ?? 10000,
          date: new Date(Date.now() - 86400000 * 14).toISOString(),
        },
      ],
      transactions: [
        {
          id: 'tx_seed_vikram_wd',
          type: 'withdrawal',
          amount: 2000,
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'pending',
          details: 'Profit withdrawal request',
        },
      ],
      referrals: [],
      referralLink: 'https://gaulaxmi.com/ref/vikram',
      phone: '9922881100',
    },
  ];

  const users: DbUser[] = [
    adminSeed,
    staffAdmin,
    ...members.map((m) => ({
      ...m,
      passwordHash: memberHash,
      referrals: m.referrals ?? [],
      investments: m.investments ?? [],
      transactions: m.transactions ?? [],
    })),
  ];

  const now = new Date().toISOString();
  const firstPlan = DEFAULT_PLANS[0];

  return {
    users,
    plans: [...DEFAULT_PLANS],
    milestones: [...DEFAULT_MILESTONES],
    inquiries: [
      {
        id: 'inq_seed_1',
        fullname: 'Ramesh Patel',
        phone: '9811122233',
        email: 'ramesh@example.com',
        planId: firstPlan?.id ?? 'starter',
        planLabel: firstPlan ? `${firstPlan.tier} — ₹${firstPlan.amount.toLocaleString('en-IN')}` : 'Starter',
        message: 'Interested in the wellness investment plan. Please call back.',
        status: 'new',
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
      {
        id: 'inq_seed_2',
        fullname: 'Sunita Devi',
        phone: '8877665544',
        email: 'sunita@example.com',
        planId: DEFAULT_PLANS[1]?.id ?? 'growth',
        planLabel: DEFAULT_PLANS[1]
          ? `${DEFAULT_PLANS[1].tier} — ₹${DEFAULT_PLANS[1].amount.toLocaleString('en-IN')}`
          : 'Growth',
        message: 'Need details on monthly returns and KYC process.',
        status: 'contacted',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ],
    paymentSettings: {
      ...DEFAULT_PAYMENT_SETTINGS,
      updatedAt: now,
    },
    depositSettings: {
      ...DEFAULT_PAYMENT_SETTINGS.deposits,
      updatedAt: now,
    },
    depositRequests: [
      {
        id: 'dep_seed_ajay_1',
        userId: 'admin_test_1',
        userName: 'Ajay Appinop',
        userEmail: 'ajay@appinop.com',
        amount: 50000,
        channel: 'manual',
        status: 'pending',
        transactionId: 'tx_seed_ajay_dep',
        utr: 'HDFC998877665544',
        paymentNote: 'NEFT from HDFC savings',
        submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    supportTickets: [
      {
        id: 'tkt_seed_1',
        userId: 'demo_user_2',
        userName: 'Vikram Singh',
        userEmail: 'vikram@gaulaxmi.io',
        category: 'wallet',
        subject: 'Withdrawal pending for 24 hours',
        message: 'I submitted a withdrawal yesterday but it still shows pending. Can you check?',
        status: 'open',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'tkt_seed_2',
        userId: 'admin_test_1',
        userName: 'Ajay Appinop',
        userEmail: 'ajay@appinop.com',
        category: 'kyc',
        subject: 'KYC approval status',
        message: 'Submitted PAN document 4 hours ago. How long does verification take?',
        status: 'in_progress',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        adminReply: 'We are reviewing your documents. You will hear back within 24 hours.',
        repliedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        repliedBy: 'staff@gaulaxmi.io',
      },
    ],
  };
}
