import bcrypt from 'bcryptjs';
import type { DbUser } from '../shared/types.js';
import type { Database } from './db.js';
import { DEFAULT_PLANS } from './defaultPlans.js';
import { DEFAULT_MILESTONES } from './defaultMilestones.js';

export async function buildSeedDatabase(): Promise<Database> {
  const adminHash = await bcrypt.hash('admin123', 10);

  const adminSeed: DbUser = {
    id: 'gaulaxmi_admin',
    role: 'admin',
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
      transactions: [],
      referrals: [],
      referralLink: 'https://gaulaxmi.com/ref/ajayapp',
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
      investments: [],
      transactions: [],
      referrals: [],
      referralLink: 'https://gaulaxmi.com/ref/vikram',
      phone: '9922881100',
    },
  ];

  const memberHash = await bcrypt.hash('member123', 10);
  const users: DbUser[] = [
    adminSeed,
    ...members.map((m) => ({
      ...m,
      passwordHash: memberHash,
      referrals: m.referrals ?? [],
      investments: m.investments ?? [],
      transactions: m.transactions ?? [],
    })),
  ];

  return {
    users,
    plans: [...DEFAULT_PLANS],
    milestones: [...DEFAULT_MILESTONES],
    inquiries: [],
  };
}
