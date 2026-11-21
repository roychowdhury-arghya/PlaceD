import React from 'react';
import {
  AlertCircle,
  ShieldAlert,
  Mail,
  UserX,
  RefreshCw,
} from 'lucide-react';

interface StudentNotFoundViewProps {
  onLogout: () => void;
  onRetry: () => void;
  isRetryingSync: boolean;
  userEmail?: string;
  studentId?: string;
}

export const StudentNotFoundView: React.FC<StudentNotFoundViewProps> = ({
  onLogout,
  onRetry,
  isRetryingSync,
  userEmail,
  studentId,
}) => {
  const displayEmail =
    userEmail ||
    localStorage.getItem('userEmail') ||
    studentId ||
    'Authenticated Google User';

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="recovery-flow-card max-w-2xl w-full">
        {/* Card Header */}
        <div className="recovery-flow-header">
          <div className="recovery-header-left">
            <div
              className="recovery-header-icon-badge"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' }}
            >
              <UserX size={24} />
            </div>
            <div className="recovery-header-text">
              <h3 className="recovery-flow-title">
                Student Profile Not Found
              </h3>
              <p className="recovery-flow-subtitle">
                Institutional candidate academic record missing from database
              </p>
            </div>
          </div>

          <span className="px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black tracking-wide shrink-0 hidden sm:inline-flex items-center gap-1.5">
            <AlertCircle size={13} className="text-rose-600" /> Unlinked Account
          </span>
        </div>

        {/* Card Body */}
        <div className="recovery-flow-body">
          {/* Point 1: Active Alert Stage Card */}
          <div
            className="recovery-stage-card recovery-stage-card-active"
            style={{
              background: 'linear-gradient(145deg, #fef2f2 0%, #ffffff 100%)',
              border: '2px solid #f87171',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="recovery-stage-number-badge bg-rose-600 text-white shadow-md shadow-rose-500/30 ring-4 ring-rose-100">
                1
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-rose-600" /> Authentication Verified
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="text-base font-extrabold text-slate-900 font-display">
                1. Signed In as Student (Unlinked Profile)
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Your credentials were recognized with the <strong className="text-slate-900">STUDENT</strong> role, but no active candidate record is linked to this account in the institutional database. This occurs if your profile was removed, reset during maintenance, or not yet initialized by the administration.
              </p>
            </div>
          </div>

          {/* Point 2: Session Identity Details */}
          <div className="recovery-stage-card recovery-stage-card-upcoming">
            <div className="flex items-center justify-between gap-3">
              <div className="recovery-stage-number-badge bg-slate-800 text-white shadow-sm ring-4 ring-slate-100">
                2
              </div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <Mail size={14} className="text-indigo-600" /> Active Session Details
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-base font-extrabold text-slate-900 font-display">
                2. Verified Authentication Session
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Account Email
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 break-all">
                    {displayEmail}
                  </span>
                </div>
                <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Database Row Status
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-rose-600 flex items-center gap-1.5">
                    <UserX size={14} /> Missing from Student Table
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Important Note Callout */}
          <div className="p-5 sm:p-6 rounded-2xl bg-rose-50/50 text-slate-700 flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle size={18} />
            </div>
            <div className="flex flex-col gap-1 text-xs sm:text-sm leading-relaxed text-slate-600">
              <strong className="font-extrabold text-rose-600 block text-xs sm:text-sm">
                Important Note on Academic Records:
              </strong>
              <span>
                A secondary or primary student candidate record (roll number, department, CGPA) can only be created, linked, or restored in the institutional placement database by your <strong className="text-slate-800">Training &amp; Placement Officer (TPO)</strong> or system administrator.
              </span>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="recovery-flow-footer">
          <button
            type="button"
            onClick={onLogout}
            className="recovery-btn-secondary"
          >
            ← Sign Out &amp; Return to Login
          </button>

          <button
            type="button"
            onClick={onRetry}
            disabled={isRetryingSync}
            className="recovery-btn-primary"
          >
            <RefreshCw size={14} className={isRetryingSync ? 'animate-spin' : ''} />
            {isRetryingSync ? 'Checking Database...' : 'Retry Profile Sync →'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default StudentNotFoundView;
