import React from 'react';
import { ShieldCheck } from 'lucide-react';

export type KycCertificateStatus = 'approved' | 'pending' | 'rejected';

export function buildKycCertificateId(userId: string, phone?: string): string {
  const suffix = (phone || '').replace(/\D/g, '').slice(-4) || '0000';
  return `GLX-KYC-${(userId || '00000').slice(0, 5).toUpperCase()}-${suffix}`;
}

export function KycInvestorCertificate({
  accountName,
  certificateId,
  status,
  issuedAt,
  rejectionReason,
}: {
  accountName: string;
  certificateId: string;
  status: KycCertificateStatus;
  issuedAt: string;
  rejectionReason?: string;
}) {
  const issuedLabel = new Date(issuedAt).toLocaleString();
  const isApproved = status === 'approved';

  return (
    <div className="py-4 sm:py-6 font-sans">
      <div className="max-w-xl mx-auto bg-gradient-to-br from-stone-50 to-stone-100/40 border-2 border-[#7f4e1c]/15 rounded-3xl p-6 sm:p-8 relative shadow-lg overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-[0.07] pointer-events-none -mr-10 -mb-10 text-[#7f4e1c]">
          <ShieldCheck className="w-64 h-64" strokeWidth={1} />
        </div>

        <div className="flex justify-between items-start gap-4 border-b border-stone-200 pb-5 mb-5 relative z-10">
          <div className="space-y-1">
            <div
              className={`text-[9px] font-mono tracking-widest uppercase font-bold px-2.5 py-0.5 rounded-full inline-block border ${
                isApproved
                  ? 'text-[#7f4e1c] bg-amber-50 border-amber-200/50'
                  : status === 'rejected'
                  ? 'text-red-700 bg-red-50 border-red-200'
                  : 'text-amber-800 bg-amber-100 border-amber-300'
              }`}
            >
              {isApproved ? 'PASSED VERIFICATION' : status === 'rejected' ? 'VERIFICATION FAILED' : 'SUBMISSION RECEIVED'}
            </div>
            <h3 className="font-display font-bold text-lg text-stone-900 mt-1">GauLaxmi Investor Certificate</h3>
            <p className="text-[11px] text-stone-600">
              {isApproved
                ? 'Automated KYC regulatory compliance verification passed.'
                : status === 'rejected'
                ? 'Your submission was not approved. See the reason below and resubmit corrected documents.'
                : 'Your documents are under admin review. You will be notified once verification is complete.'}
            </p>
          </div>
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center border shrink-0 shadow-inner ${
              isApproved
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : status === 'rejected'
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}
          >
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm relative z-10">
          <div>
            <span className="text-[10px] uppercase text-stone-400 font-semibold block tracking-wider font-mono">
              VERIFIED ACCOUNT NAME
            </span>
            <span className="font-display font-bold text-stone-800 text-sm uppercase">{accountName}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-stone-400 font-semibold block tracking-wider font-mono">
              SECURITY CERTIFICATE ID
            </span>
            <span className="font-mono font-bold text-stone-800 text-sm break-all">{certificateId}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-stone-400 font-semibold block tracking-wider font-mono">
              KYC STATUS
            </span>
            {isApproved ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-bold mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                APPROVED
              </span>
            ) : status === 'rejected' ? (
              <div className="mt-0.5 space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-red-700 font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  REJECTED
                </span>
                {rejectionReason?.trim() && (
                  <p className="text-xs text-red-800 leading-relaxed bg-red-50 border border-red-100 rounded-lg px-2.5 py-2">
                    {rejectionReason.trim()}
                  </p>
                )}
              </div>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-bold mt-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                PENDING REVIEW
              </span>
            )}
          </div>
          <div>
            <span className="text-[10px] uppercase text-stone-400 font-semibold block tracking-wider font-mono">
              ISSUED TIMESTAMP
            </span>
            <span className="font-mono text-xs text-stone-600 font-medium">{issuedLabel}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-stone-300 mt-6 pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <p className="text-[10px] text-stone-500 leading-relaxed max-w-xs">
            {isApproved
              ? 'Compliance check status: ACTIVE. Deposits, passive pool earnings, and transaction networks are fully authorized.'
              : status === 'rejected'
              ? 'Compliance check status: REJECTED. Update your details and submit again for review.'
              : 'Compliance check status: QUEUED. An admin will review your submission shortly.'}
          </p>
          <div className="text-right shrink-0">
            <span className="text-[9px] font-mono uppercase text-stone-400 font-medium block">Digital Stamp</span>
            <span className="font-serif italic text-sm font-semibold text-[#7f4e1c]">GauLaxmi Sec.</span>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-stone-500 font-sans">
        Tired of updating information? Contact our helpdesk at{' '}
        <a href="mailto:support@gaulaxmi.com" className="font-semibold text-[#7f4e1c] underline">
          support@gaulaxmi.com
        </a>{' '}
        to request document changes.
      </p>
    </div>
  );
}
