import { getStore } from '../store/index.js';
import { findDbUser } from './users.js';
import { newId } from '../utils.js';
import type {
  PaginatedSupportTickets,
  SupportTicket,
  SupportTicketCategory,
  SupportTicketStatus,
} from '../../shared/types.js';

export type SupportTicketFilterStatus = 'all' | SupportTicketStatus;

const VALID_CATEGORIES: SupportTicketCategory[] = [
  'general',
  'wallet',
  'kyc',
  'investment',
  'deposit',
  'withdrawal',
  'technical',
];

export async function countOpenSupportTickets(): Promise<number> {
  return getStore().countOpenSupportTickets();
}

export async function createSupportTicket(
  userId: string,
  body: { category: string; subject: string; message: string }
): Promise<SupportTicket> {
  const user = await findDbUser(userId);
  if (!user) throw new Error('User not found');

  const category = String(body.category || 'general').trim() as SupportTicketCategory;
  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error('Invalid ticket category');
  }

  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();
  if (subject.length < 3) throw new Error('Subject must be at least 3 characters');
  if (subject.length > 120) throw new Error('Subject must be 120 characters or less');
  if (message.length < 10) throw new Error('Please describe your issue in at least 10 characters');
  if (message.length > 2000) throw new Error('Message must be 2000 characters or less');

  const now = new Date().toISOString();
  const ticket: SupportTicket = {
    id: newId('tkt_'),
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    category,
    subject,
    message,
    status: 'open',
    createdAt: now,
    updatedAt: now,
  };

  await getStore().insertSupportTicket(ticket);
  return ticket;
}

export async function getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
  const tickets = await getStore().listSupportTickets();
  return tickets
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function querySupportTickets(opts: {
  status: SupportTicketFilterStatus;
  search: string;
  page: number;
  pageSize: number;
}): Promise<PaginatedSupportTickets> {
  let rows = await getStore().listSupportTickets();
  const q = opts.search.trim().toLowerCase();
  if (opts.status !== 'all') {
    rows = rows.filter((r) => r.status === opts.status);
  }
  if (q) {
    rows = rows.filter(
      (r) =>
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.message.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.adminReply || '').toLowerCase().includes(q)
    );
  }
  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const total = rows.length;
  const pageSize = Math.max(1, Math.min(50, opts.pageSize));
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.max(1, Math.min(opts.page, totalPages));
  const start = (page - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export async function updateSupportTicket(
  ticketId: string,
  body: { status?: string; adminReply?: string },
  adminEmail: string
): Promise<SupportTicket | null> {
  const store = getStore();
  const current = await store.findSupportTicket(ticketId);
  if (!current) return null;

  const status = body.status
    ? (String(body.status).trim() as SupportTicketStatus)
    : undefined;
  const validStatuses: SupportTicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];
  if (status && !validStatuses.includes(status)) {
    throw new Error('Invalid ticket status');
  }

  const reply = body.adminReply !== undefined ? String(body.adminReply).trim() : undefined;
  if (reply !== undefined && reply.length > 2000) {
    throw new Error('Reply must be 2000 characters or less');
  }

  const nextReply = reply !== undefined ? reply : current.adminReply;
  if (
    status &&
    (status === 'resolved' || status === 'closed') &&
    !nextReply
  ) {
    throw new Error('Add a reply before marking the ticket resolved or closed');
  }

  const now = new Date().toISOString();
  const patch: Partial<SupportTicket> = { updatedAt: now };

  if (status) {
    patch.status = status;
    if (status === 'resolved' || status === 'closed') {
      patch.resolvedAt = now;
    }
  }

  if (reply !== undefined) {
    if (reply.length > 0) {
      patch.adminReply = reply;
      patch.repliedAt = now;
      patch.repliedBy = adminEmail;
    } else {
      patch.adminReply = undefined;
      patch.repliedAt = undefined;
      patch.repliedBy = undefined;
    }
  }

  return store.updateSupportTicket(ticketId, patch);
}
