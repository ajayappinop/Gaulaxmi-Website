export type FieldErrors = Record<string, string>;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Returns 10-digit Indian mobile (no country code) */
export function normalizeIndianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function isValidIndianPhone(phone: string): boolean {
  const digits = normalizeIndianPhone(phone);
  return /^[6-9]\d{9}$/.test(digits);
}

export function formatIndianPhoneDisplay(phone: string): string {
  const digits = normalizeIndianPhone(phone);
  if (digits.length !== 10) return phone.trim();
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && /^[\p{L}\s.'-]+$/u.test(trimmed);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

export function isValidMoneyAmount(
  amount: number,
  { min = 1, max = 50_000_000 }: { min?: number; max?: number } = {}
): boolean {
  return Number.isFinite(amount) && amount >= min && amount <= max && Math.round(amount) === amount;
}

export function parsePositiveAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount);
}

export function validatePan(number: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(number.trim());
}

export function validateAadhaar(number: string): boolean {
  return /^\d{12}$/.test(number.replace(/\s/g, ''));
}

export function validatePassport(number: string): boolean {
  return /^[A-Z][0-9]{7}$/i.test(number.trim());
}

export function validateDocNumber(docType: string, docNumber: string): boolean {
  switch (docType) {
    case 'PAN':
      return validatePan(docNumber);
    case 'Aadhaar':
      return validateAadhaar(docNumber);
    case 'Passport':
      return validatePassport(docNumber);
    default:
      return docNumber.trim().length >= 4;
  }
}

export function isAdult(dob: string): boolean {
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18;
}

export function validateContactInquiry(data: {
  fullname: string;
  phone: string;
  email: string;
  planId: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (!isValidName(data.fullname)) {
    errors.fullname = 'Enter your full name (at least 2 letters).';
  }
  if (!isValidIndianPhone(data.phone)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  }
  if (data.email.trim() && !isValidEmail(data.email)) {
    errors.email = 'Enter a valid email address or leave this field empty.';
  }
  if (!data.planId) {
    errors.plan = 'Please select an investment plan.';
  }
  return errors;
}

export function validateAuthLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

export function validateAuthRegister(
  name: string,
  email: string,
  password: string,
  confirmPassword: string,
  termsAccepted: boolean
): FieldErrors {
  const errors: FieldErrors = {};
  if (!isValidName(name)) errors.name = 'Enter your full name (at least 2 letters).';
  if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!isValidPassword(password)) errors.password = 'Password must be at least 6 characters.';
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';
  if (!termsAccepted) errors.terms = 'Please accept the terms to continue.';
  return errors;
}
