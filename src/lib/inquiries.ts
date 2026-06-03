import { api } from './apiClient';
import type { ContactInquiry, InquiryStatus } from '../../shared/types';

export type { ContactInquiry, InquiryStatus };

let cachedInquiries: ContactInquiry[] = [];

export async function loadInquiries(): Promise<ContactInquiry[]> {
  try {
    cachedInquiries = await api.getAdminInquiries();
    return cachedInquiries;
  } catch {
    return cachedInquiries;
  }
}

export function getCachedInquiries(): ContactInquiry[] {
  return cachedInquiries;
}

export async function addInquiry(data: {
  fullname: string;
  phone: string;
  email: string;
  planId: string;
  message: string;
}): Promise<ContactInquiry> {
  const inquiry = await api.createInquiry(data);
  cachedInquiries = [inquiry, ...cachedInquiries];
  return inquiry;
}

export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<void> {
  const updated = await api.updateInquiryStatus(id, status);
  cachedInquiries = cachedInquiries.map((q) => (q.id === id ? updated : q));
}
