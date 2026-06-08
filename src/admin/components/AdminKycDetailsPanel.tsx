import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import type { KycDetails } from '../../../shared/types';
import { isKycImageDataUrl } from '../../lib/kycDocumentUpload';

function isKycPdfDataUrl(dataUrl: string): boolean {
  return dataUrl.startsWith('data:application/pdf');
}

function DetailRow({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className="text-stone-500 block text-xs font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-sm text-stone-800 mt-0.5 block">{value}</span>
    </div>
  );
}

export function AdminKycDocumentPreview({
  docFileUrl,
  docFileName,
}: {
  docFileUrl?: string;
  docFileName?: string;
}) {
  if (!docFileUrl) {
    return (
      <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 p-5 text-center">
        <FileText className="w-8 h-8 text-stone-400 mx-auto mb-2" />
        <p className="text-sm text-stone-600 font-medium">No document preview available</p>
        {docFileName && <p className="text-xs text-stone-500 mt-1 font-mono">{docFileName}</p>}
        <p className="text-xs text-stone-400 mt-2">
          Older submissions may only include the filename without an attached image.
        </p>
      </div>
    );
  }

  if (isKycImageDataUrl(docFileUrl)) {
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 flex justify-center">
          <img
            src={docFileUrl}
            alt={docFileName || 'Submitted identity document'}
            className="max-h-80 max-w-full rounded-lg object-contain shadow-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
          {docFileName && <span className="font-mono">{docFileName}</span>}
          <a
            href={docFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#7f4e1c] font-semibold hover:underline"
          >
            Open full size <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  if (isKycPdfDataUrl(docFileUrl)) {
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden">
          <iframe
            src={docFileUrl}
            title={docFileName || 'Submitted identity document'}
            className="w-full h-80 bg-white"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
          {docFileName && <span className="font-mono">{docFileName}</span>}
          <a
            href={docFileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#7f4e1c] font-semibold hover:underline"
          >
            Open PDF <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
      <p>Unsupported document format.</p>
      {docFileName && <p className="text-xs font-mono mt-1">{docFileName}</p>}
    </div>
  );
}

export function AdminKycDetailsPanel({
  details,
  reviewedBy,
  reviewedAt,
  rejectionReason,
}: {
  details: KycDetails;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}) {
  return (
    <div className="space-y-4">
      <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DetailRow label="Legal name" value={details.fullName} />
        <DetailRow label="Date of birth" value={details.dob} />
        <DetailRow label="Gender" value={details.gender} />
        <DetailRow label="Phone" value={details.phone} />
        <DetailRow label="Document type" value={details.docType} />
        <DetailRow label="Document number" value={<span className="font-mono">{details.docNumber}</span>} />
        <DetailRow
          label="Address"
          value={`${details.address}, ${details.city}, ${details.state} — ${details.pincode}`}
          className="sm:col-span-2 lg:col-span-3"
        />
        <DetailRow
          label="Submitted at"
          value={new Date(details.submittedAt).toLocaleString('en-IN')}
        />
        {reviewedBy && <DetailRow label="Reviewed by" value={reviewedBy} />}
        {reviewedAt && (
          <DetailRow label="Reviewed at" value={new Date(reviewedAt).toLocaleString('en-IN')} />
        )}
      </dl>

      {rejectionReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Rejection reason</p>
          <p className="text-sm text-red-800 mt-1">{rejectionReason}</p>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
          Submitted identity document
        </p>
        <AdminKycDocumentPreview docFileUrl={details.docFileUrl} docFileName={details.docFileName} />
      </div>
    </div>
  );
}
