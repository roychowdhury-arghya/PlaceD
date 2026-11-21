import React, { useState } from 'react';
import {
  UserCheck,
  FileText,
  Upload,
  Save,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  Calendar,
  GraduationCap,
  Award,
  Link as LinkIcon,
  BookOpen,
} from 'lucide-react';
import { authApi } from '../../api/authApi';

interface StudentProfileViewProps {
  emailVerified?: boolean;
  studentId?: string;
  profileName: string;
  profileEmail: string;
  profilePhone: string;
  profileBranch: string;
  setProfileBranch: (v: string) => void;
  profileCgpa: string;
  setProfileCgpa: (v: string) => void;
  profileBacklogs: string;
  setProfileBacklogs: (v: string) => void;
  profileYearOfAdmission: string;
  setProfileYearOfAdmission: (v: string) => void;
  profileDob: string;
  setProfileDob: (v: string) => void;
  profileSkills: string;
  setProfileSkills: (v: string) => void;
  profileResumeUrl: string;
  setProfileResumeUrl: (v: string) => void;
  profileResume: string;
  setProfileResume: (v: string) => void;
  uploadedResumeName: string;
  uploadedResumeFile: File | null;
  uploadedCVName: string;
  uploadedCVFile: File | null;
  handleResumeUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCVUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProfile: (e: React.FormEvent) => void;
  onGoToAts: () => void;
  initialRecoveryEmail?: string;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  emailVerified,
  studentId,
  profileName,
  profileEmail,
  profilePhone,
  profileBranch,
  setProfileBranch,
  profileCgpa,
  setProfileCgpa,
  profileBacklogs,
  setProfileBacklogs,
  profileYearOfAdmission,
  setProfileYearOfAdmission,
  profileDob,
  setProfileDob,
  profileSkills,
  setProfileSkills,
  profileResumeUrl,
  setProfileResumeUrl,
  profileResume,
  setProfileResume,
  uploadedResumeName,
  uploadedResumeFile,
  uploadedCVName,
  uploadedCVFile,
  handleResumeUpload,
  handleCVUpload,
  handleSaveProfile,
  onGoToAts,
  initialRecoveryEmail,
}) => {
  // Recovery Email state
  const [savedRecoveryEmail, setSavedRecoveryEmail] = useState<string>(
    () => localStorage.getItem('recoveryEmail') || initialRecoveryEmail || ''
  );
  const [isUpdatingRecovery, setIsUpdatingRecovery] = useState<boolean>(false);
  const [newRecoveryEmail, setNewRecoveryEmail] = useState('');
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryOtp, setRecoveryOtp] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'input' | 'otp'>('input');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const handleStartRecoverySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = newRecoveryEmail.trim().toLowerCase();
    if (!targetEmail || !recoveryPassword.trim()) {
      setRecoveryError('Please enter both your new recovery email and current account password.');
      return;
    }
    if (targetEmail === profileEmail.toLowerCase().trim()) {
      setRecoveryError('Recovery email must be different from your primary account email.');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError('');
    setRecoveryMessage('');
    try {
      const msg = await authApi.addRecoveryEmail({
        recoveryEmail: targetEmail,
        password: recoveryPassword,
      });
      setRecoveryMessage(msg || `We sent a 6-digit code to ${targetEmail}. Enter it below to confirm.`);
      setRecoveryStep('otp');
    } catch (err: any) {
      setRecoveryError(err?.message || 'Unable to initiate recovery email verification. Check your current password.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleVerifyRecoveryOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(recoveryOtp.trim())) {
      setRecoveryError('Please enter a valid 6-digit verification code.');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError('');
    try {
      const msg = await authApi.verifyRecoveryEmail(recoveryOtp.trim());
      const confirmedEmail = newRecoveryEmail.trim().toLowerCase();
      setSavedRecoveryEmail(confirmedEmail);
      localStorage.setItem('recoveryEmail', confirmedEmail);
      setRecoveryMessage(msg || 'Recovery email successfully verified and saved.');
      setIsUpdatingRecovery(false);
      setRecoveryStep('input');
      setNewRecoveryEmail('');
      setRecoveryPassword('');
      setRecoveryOtp('');
    } catch (err: any) {
      setRecoveryError(err?.message || 'Invalid or expired 6-digit code. Please try again.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page Header */}
      <div className="sp-page-header">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight flex items-center gap-3">
              <UserCheck size={28} className="text-blue-600 shrink-0" />
              Candidate Placement Profile
            </h1>
            {studentId && (
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-full border border-slate-200">
                Reg: {studentId}
              </span>
            )}
          </div>
          <p className="sp-page-subtitle">
            Manage your academic records, placement metrics, resume documents, and secondary recovery email.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
        {/* Section 1: Official Institutional Account Identity (Read-Only) */}
        <div className="sp-card flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display flex items-center gap-2">
              <Lock size={16} className="text-slate-500" />
              1. Institutional Account Identity (Official Record • Read-Only)
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1.5">
              <Lock size={12} /> Managed by Placement Administration
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                Full Name
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={profileName}
                className="input-field bg-slate-50/80 text-slate-700 cursor-not-allowed border-slate-200 font-semibold"
                title="Institutional full name as registered in the university database."
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Primary Institutional Email</label>
                {emailVerified === true ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold border border-emerald-200 flex items-center gap-1 shadow-2xs">
                    <CheckCircle2 size={12} className="text-emerald-600" /> Verified Email
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-extrabold border border-blue-200 flex items-center gap-1 shadow-2xs">
                    <Mail size={12} className="text-blue-600" /> Primary Account Email
                  </span>
                )}
              </div>
              <input
                type="email"
                readOnly
                disabled
                value={profileEmail}
                className="input-field bg-slate-50/80 text-slate-700 cursor-not-allowed border-slate-200 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                Registration Number
              </label>
              <input
                type="text"
                readOnly
                disabled
                value={studentId || ''}
                className="input-field bg-slate-50/80 text-slate-700 cursor-not-allowed border-slate-200 font-mono font-bold"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Phone size={15} className="text-slate-500" /> Contact Mobile Number
              </label>
              <input
                type="tel"
                readOnly
                disabled
                value={profilePhone}
                className="input-field bg-slate-50/80 text-slate-700 cursor-not-allowed border-slate-200 font-mono font-semibold"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
            Note: Primary institutional identity credentials (Name, Roll Number, Official Email, Mobile) are bound to your student record and cannot be changed here. To request an update, contact the institutional Training &amp; Placement Office (TPO).
          </p>
        </div>

        {/* Section 2: Academic Metrics & Placement Credentials (Editable in Backend) */}
        <div className="sp-card flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display flex items-center gap-2">
              <GraduationCap size={18} className="text-blue-600" />
              2. Academic Records &amp; Placement Metrics (Editable)
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5">
              <Award size={13} className="text-blue-600" /> Recruiter Evaluation Metrics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen size={15} className="text-blue-600" /> Branch / Department
              </label>
              <select
                value={profileBranch}
                onChange={(e) => setProfileBranch(e.target.value)}
                className="input-field font-semibold"
                required
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Electrical">Electrical</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Cumulative CGPA (0.0 - 10.0)</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                max="10"
                value={profileCgpa}
                onChange={(e) => setProfileCgpa(e.target.value)}
                className="input-field font-semibold"
                placeholder="e.g. 8.75"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700">Active Course Backlogs</label>
              <input
                type="number"
                required
                min="0"
                value={profileBacklogs}
                onChange={(e) => setProfileBacklogs(e.target.value)}
                className="input-field font-semibold"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar size={15} className="text-blue-600" /> Year of Admission
              </label>
              <select
                value={profileYearOfAdmission}
                onChange={(e) => setProfileYearOfAdmission(e.target.value)}
                className="input-field font-semibold"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar size={15} className="text-blue-600" /> Date of Birth
              </label>
              <input
                type="date"
                value={profileDob}
                onChange={(e) => setProfileDob(e.target.value)}
                className="input-field font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700">
              Technical Skills Catalog (Comma separated)
            </label>
            <input
              type="text"
              value={profileSkills}
              onChange={(e) => setProfileSkills(e.target.value)}
              placeholder="React, TypeScript, Java, Spring Boot, PostgreSQL, Docker..."
              className="input-field font-semibold"
            />
          </div>
        </div>

        {/* Section 3: Resume Documents & ATS Plain Text */}
        <div className="glass-card p-6 sm:p-7 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 flex-wrap gap-2">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2.5">
              <FileText size={22} className="text-blue-600" />
              3. Resume Document &amp; ATS Overview
            </h3>
            <span className="sp-badge sp-badge-primary">ATS Compatible</span>
          </div>

          {/* Public Resume URL */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <LinkIcon size={15} className="text-blue-600" /> Public Resume URL / Cloud Storage Link
            </label>
            <input
              type="url"
              value={profileResumeUrl}
              onChange={(e) => setProfileResumeUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/... or https://your-portfolio.com/resume.pdf"
              className="input-field font-mono text-xs sm:text-sm font-medium"
            />
            <span className="text-[11px] text-slate-400">
              Direct cloud link saved in institutional database for hiring companies to view your portfolio.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Resume Upload */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-blue-300 transition-all flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                    <Upload size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm font-display">Primary Resume Document</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">PDF, DOC, DOCX • Max 5 MB</p>
                  </div>
                </div>
                {uploadedResumeName && (
                  <span className="sp-badge sp-badge-success flex items-center gap-1 shrink-0">
                    <CheckCircle2 size={13} /> Uploaded
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/60">
                <label className="btn btn-secondary h-10 w-full rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2">
                  <Upload size={14} />
                  <span>{uploadedResumeName ? 'Change Resume File' : 'Choose Resume File'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                </label>

                {uploadedResumeName ? (
                  <div className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs mt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate max-w-[200px]" title={uploadedResumeName}>
                        📄 {uploadedResumeName}
                      </span>
                      {uploadedResumeFile && (
                        <span className="font-mono text-[11px] text-slate-500 font-semibold">
                          {(uploadedResumeFile.size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={onGoToAts}
                      className="btn btn-primary h-8 w-full rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 mt-1"
                    >
                      <Sparkles size={13} /> Analyze in ATS Tool →
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium text-center py-1">No resume file selected yet.</p>
                )}
              </div>
            </div>

            {/* Academic CV Upload */}
            <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-indigo-300 transition-all flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0 border border-indigo-100 shadow-2xs">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm font-display">Full Academic Curriculum Vitae (CV)</h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">PDF, DOC, DOCX • Max 5 MB</p>
                  </div>
                </div>
                {uploadedCVName && (
                  <span className="sp-badge sp-badge-success flex items-center gap-1 shrink-0">
                    <CheckCircle2 size={13} /> Uploaded
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/60">
                <label className="btn btn-secondary h-10 w-full rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-2">
                  <FileText size={14} />
                  <span>{uploadedCVName ? 'Change CV File' : 'Choose Full CV File'}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleCVUpload}
                    className="hidden"
                  />
                </label>

                {uploadedCVName ? (
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs mt-1">
                    <span className="font-bold text-slate-900 truncate max-w-[200px]" title={uploadedCVName}>
                      📑 {uploadedCVName}
                    </span>
                    {uploadedCVFile && (
                      <span className="font-mono text-[11px] text-slate-500 font-semibold">
                        {(uploadedCVFile.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium text-center py-1">No full CV file selected yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Plain Text Overview Textarea */}
          <div className="flex flex-col gap-2.5 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-sm font-bold text-slate-800 font-display">
                Resume Plain Text Overview
              </label>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                ● Syncs with ATS Scorer
              </span>
            </div>
            <textarea
              rows={4}
              value={profileResume}
              onChange={(e) => setProfileResume(e.target.value)}
              placeholder="Paste your plain text resume summary, work experience, and project highlights for ATS analysis..."
              className="input-field font-sans leading-relaxed text-slate-800 resize-none min-h-[110px]"
            />
          </div>
        </div>

        {/* Section 4: Account Security & Secondary Recovery Email */}
        <div className="sp-card flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" />
                4. Account Security &amp; Secondary Recovery Email
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Used to deliver 6-digit security recovery codes if you log in from an untrusted device or forget your credentials.
              </p>
            </div>
          </div>

          {recoveryMessage && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{recoveryMessage}</span>
            </div>
          )}

          {recoveryError && (
            <div className="p-3.5 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-medium flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{recoveryError}</span>
            </div>
          )}

          {/* Show already saved recovery email card when present and not currently updating */}
          {savedRecoveryEmail && !isUpdatingRecovery ? (
            <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck size={22} />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                      Configured Secondary Email
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 font-mono break-all">
                    {savedRecoveryEmail}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsUpdatingRecovery(true);
                  setRecoveryStep('input');
                  setNewRecoveryEmail('');
                  setRecoveryPassword('');
                  setRecoveryOtp('');
                  setRecoveryError('');
                  setRecoveryMessage('');
                }}
                className="recovery-btn-secondary shrink-0 text-xs font-bold"
              >
                <Mail size={14} />
                Update Email with Code
              </button>
            </div>
          ) : (
            /* Update or configure recovery email with 6-digit code verification */
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col gap-4">
              {recoveryStep === 'input' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Mail size={16} className="text-blue-600" />
                      {savedRecoveryEmail ? 'Update Recovery Email Address' : 'Set Secondary Recovery Email'}
                    </h4>
                    {savedRecoveryEmail && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUpdatingRecovery(false);
                          setRecoveryError('');
                          setRecoveryMessage('');
                        }}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800"
                      >
                        ✕ Cancel
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">New Recovery Email</label>
                      <input
                        type="email"
                        value={newRecoveryEmail}
                        onChange={(e) => setNewRecoveryEmail(e.target.value)}
                        placeholder="secondary.personal@example.com"
                        className="input-field"
                      />
                      <span className="text-[11px] text-slate-400">Must be different from your institutional login address.</span>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700">Account Authorization Password</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={recoveryPassword}
                          onChange={(e) => setRecoveryPassword(e.target.value)}
                          placeholder="Current password"
                          className="input-field flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleStartRecoverySetup}
                          disabled={recoveryLoading || !newRecoveryEmail || !recoveryPassword}
                          className="recovery-btn-primary shrink-0 text-xs font-bold"
                        >
                          {recoveryLoading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                          Send 6-Digit Code
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400">Password is required to prevent unauthorized secondary updates.</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Step 2: Enter 6-digit OTP */
                <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 text-center sm:text-left">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center justify-center sm:justify-start gap-2">
                      <Mail size={16} className="text-blue-600" />
                      Enter 6-Digit Code sent to {newRecoveryEmail}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Check your inbox or spam folder. The code expires in 10 minutes.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      maxLength={6}
                      value={recoveryOtp}
                      onChange={(e) => setRecoveryOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="input-field text-center font-mono font-bold tracking-widest text-lg w-32 h-11"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyRecoveryOtp}
                      disabled={recoveryLoading || recoveryOtp.length !== 6}
                      className="recovery-btn-primary h-11 px-5 text-xs font-bold whitespace-nowrap flex items-center gap-1.5"
                    >
                      {recoveryLoading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      Confirm Code
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryStep('input');
                        setRecoveryOtp('');
                        setRecoveryError('');
                      }}
                      className="recovery-btn-secondary h-11 px-3 text-xs"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="btn btn-primary h-12 px-8 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 transition-all"
          >
            <Save size={18} />
            Save Academic Credentials &amp; Placement Profile
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentProfileView;
