import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Shield,
  GraduationCap,
  ArrowRight,
  LogIn,
  UserPlus,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Award,
  Sparkles,
  BarChart2,
  FileCheck2,
  Users,
  CalendarDays,
  Briefcase,
  ExternalLink,
  CheckCircle2,
  Clock3,
  Phone,
  Key,
  ShieldCheck,
  AlertCircle,
  MapPin
} from 'lucide-react';

import type { Student, Recruiter } from '../mockData';
import { alumniApi, type Alumni, type AlumniRegistrationRequest } from '../api/alumniApi';
import { authApi } from '../api/authApi';
import { studentApi } from '../api/studentApi';
import { recruiterApi } from '../api/recruiterApi';
import { userApi } from '../api/userApi';
import { publicApi } from '../api/publicApi';
import type { LookupItem } from '../api/types';
import { Footer } from './Footer';
import './Auth.css';

interface AuthProps {
  students: Student[];
  recruiters: Recruiter[];
  alumni: Alumni[];

  onLogin: (
    role: 'student' | 'admin' | 'recruiter' | 'alumni',
    id?: string
  ) => void;

  onAlumniLogin: (
    requestData: {
      email: string;
      password: string;
    }
  ) => Promise<void>;

  onRegister: (newStudent: Student) => void;
  onRegisterRecruiter: (newRecruiter: Recruiter) => void;
  onRegisterAlumni: (
    requestData: AlumniRegistrationRequest
  ) => Promise<void>;

  onSeedData?: () => void;
}

export type AuthRole =
  | 'student'
  | 'admin'
  | 'recruiter'
  | 'alumni';

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '805534281016-uqe0vb3eqq2le1rvopilq5plo8ik5mkk.apps.googleusercontent.com';

const ensureGoogleScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google?.accounts?.id) return Promise.resolve(true);

  return new Promise((resolve) => {
    let script = document.getElementById('google-gsi-client') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const checkInterval = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        clearInterval(checkInterval);
        resolve(true);
      }
    }, 100);

    script.addEventListener('load', () => {
      clearInterval(checkInterval);
      resolve(true);
    });

    script.addEventListener('error', () => {
      clearInterval(checkInterval);
      resolve(false);
    });

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(Boolean((window as any).google?.accounts?.id));
    }, 4000);
  });
};

export const Auth: React.FC<AuthProps> = ({
  students,
  recruiters,
  alumni,
  onLogin,
  onRegister,
  onRegisterRecruiter,
  onRegisterAlumni
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const queryToken = searchParams.get('token') || '';
  const initialMode: 'login' | 'register' | 'forgot-password' | 'reset-password' =
    queryToken || window.location.pathname.startsWith('/reset-password') || searchParams.get('mode') === 'reset-password'
      ? 'reset-password'
      : searchParams.get('mode') === 'forgot-password'
        ? 'forgot-password'
        : searchParams.get('mode') === 'register'
          ? 'register'
          : 'login';

  const [authMode, setAuthMode] = useState<
    'login' | 'register' | 'forgot-password' | 'reset-password'
  >(initialMode);
  const [resetToken, setResetToken] = useState<string>(queryToken);

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCodeEmail, setForgotCodeEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotStatusMsg, setForgotStatusMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [forgotStep, setForgotStep] = useState<'tutorial' | 'form'>('tutorial');

  // Reset password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetStatusMsg, setResetStatusMsg] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Google authentication states
  const [showGoogleSignupModal, setShowGoogleSignupModal] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleFirstName, setGoogleFirstName] = useState('');
  const [googleLastName, setGoogleLastName] = useState('');
  const [googleRole, setGoogleRole] = useState<'STUDENT' | 'RECRUITER' | 'ALUMNI'>('STUDENT');
  const [googlePhone, setGooglePhone] = useState('');
  const [googleCollegeId, setGoogleCollegeId] = useState('');
  const [googleStudentRegNo, setGoogleStudentRegNo] = useState('');
  const [googleStudentDept, setGoogleStudentDept] = useState('Computer Science');
  const [googleStudentYear, setGoogleStudentYear] = useState('2024');
  const [availableCompanies, setAvailableCompanies] = useState<LookupItem[]>([]);
  const [googleCompanyId, setGoogleCompanyId] = useState('');
  const [googleDesignation, setGoogleDesignation] = useState('Technical Recruiter');
  const [googleIndustry, setGoogleIndustry] = useState('');
  const [googleAlumniRegNo, setGoogleAlumniRegNo] = useState('');
  const [googleLocation, setGoogleLocation] = useState('');
  const [googleBio, setGoogleBio] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [googleButtonRendered, setGoogleButtonRendered] = useState(false);

  const [activeRole, setActiveRole] =
    useState<AuthRole>('student');

  /* =========================================================
     COMMON STATE
  ========================================================= */

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [verificationEmail, setVerificationEmail] = useState('');
  const [, setVerificationUserId] = useState<number | null>(null);
  const [commonPhone, setCommonPhone] = useState('');
  const [collegeId, setCollegeId] = useState('1');
  const [availableColleges, setAvailableColleges] = useState<LookupItem[]>([]);

  useEffect(() => {
    publicApi.getColleges()
      .then((colleges) => {
        if (Array.isArray(colleges) && colleges.length > 0) {
          setAvailableColleges(colleges);
          setCollegeId((prev) => prev || String(colleges[0].id));
          setGoogleCollegeId((prev) => prev || String(colleges[0].id));
        }
      })
      .catch(() => { });

    publicApi.getCompanies()
      .then((companies) => {
        if (Array.isArray(companies) && companies.length > 0) {
          setAvailableCompanies(companies);
          setGoogleCompanyId((prev) => prev || String(companies[0].id));
        }
      })
      .catch(() => { });
  }, []);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressCountry, setAddressCountry] = useState('India');
  const [addressPostalCode, setAddressPostalCode] = useState('');
  const [alumniStudentRegnNo, setAlumniStudentRegnNo] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState<number[]>([]);
  void onRegisterAlumni;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setResendCooldown((seconds) => Math.max(0, seconds - 1)),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  const handleAuthError = (err: any, email: string, fallback: string) => {
    if (err?.status === 403) {
      setVerificationEmail(email.trim().toLowerCase());
      setError('Your email address is not verified. Verify it or request a new verification email.');
      return;
    }
    setError(err?.message || fallback);
  };

  const handleResendVerification = async () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentAttempts = resendAttempts.filter((time) => time > oneHourAgo);
    if (resendCooldown > 0) return;
    if (recentAttempts.length >= 3) {
      setError('You have reached the resend limit. Please try again after an hour.');
      return;
    }
    const targetEmail = verificationEmail.trim();
    if (!targetEmail) {
      setError('Please enter your email or contact the placement administrator to resend your verification email.');
      return;
    }
    try {
      const updatedAttempts = [...recentAttempts, now];
      setResendAttempts(updatedAttempts);
      localStorage.setItem('placed_verification_resend_attempts', JSON.stringify(updatedAttempts));
      setResendCooldown(60);
      await userApi.resendVerification(targetEmail);
      setError('A new verification email has been sent. Please check your inbox and spam folder.');
    } catch (err: any) {
      handleAuthError(err, targetEmail, 'Unable to resend verification email.');
    }
  };

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('placed_verification_resend_attempts') || '[]');
      if (Array.isArray(saved)) {
        const validAttempts = saved.filter((value) => typeof value === 'number' && value > Date.now() - 60 * 60 * 1000);
        setResendAttempts(validAttempts);
        const latestAttempt = validAttempts.length ? Math.max(...validAttempts) : 0;
        if (latestAttempt) {
          setResendCooldown(Math.max(0, 60 - Math.floor((Date.now() - latestAttempt) / 1000)));
        }
      }
      const savedUserId = Number(localStorage.getItem('placed_verification_user_id'));
      if (Number.isInteger(savedUserId) && savedUserId > 0) {
        setVerificationUserId(savedUserId);
        setVerificationEmail(localStorage.getItem('placed_verification_email') || '');
      }
    } catch {
      setResendAttempts([]);
    }
  }, []);

  const buildBaseUserRequest = (
    fullName: string,
    email: string,
    password: string,
    role: 'STUDENT' | 'ALUMNI' | 'RECRUITER' | 'TPO',
    phone: string
  ) => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) throw new Error('Please enter your full name.');
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
    const middleName = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
    const numericCollegeId = Number(collegeId);
    if (!Number.isInteger(numericCollegeId) || numericCollegeId <= 0) {
      throw new Error('Enter the College ID assigned by your placement administrator.');
    }
    if (!addressLine1.trim() || !addressCity.trim() || !addressState.trim() ||
      !addressCountry.trim() || !addressPostalCode.trim()) {
      throw new Error('Complete the required address and college details.');
    }
    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      throw new Error('Enter a valid 10-digit mobile number.');
    }
    return {
      nameRequest: { pronounce: 'They', firstName, middleName, lastName },
      addressRequest: {
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim(),
        city: addressCity.trim(),
        state: addressState.trim(),
        country: addressCountry.trim(),
        postalCode: addressPostalCode.trim(),
      },
      email: email.trim().toLowerCase(),
      password,
      role,
      phone: phone.trim(),
      college_id: numericCollegeId,
    };
  };

  const createBaseUser = async (
    fullName: string,
    email: string,
    password: string,
    role: 'STUDENT' | 'ALUMNI' | 'RECRUITER' | 'TPO',
    phone: string
  ) => userApi.register(buildBaseUserRequest(fullName, email, password, role, phone));

  const completeRegistration = async (userId: number, email: string) => {
    setVerificationUserId(userId);
    localStorage.setItem('placed_verification_user_id', String(userId));
    localStorage.setItem('placed_verification_email', email.toLowerCase().trim());
    setVerificationEmail(email.toLowerCase().trim());
    setAuthMode('login');
    setSearchParams({ mode: 'login' });
    setError('Your account has been created. A verification email has been sent. Please check your inbox (and spam folder) to verify your email before logging in.');
  };

  useEffect(() => {
    const isResetPath = window.location.pathname.startsWith('/reset-password');
    const token = searchParams.get('token');
    const modeParam = searchParams.get('mode');

    if (token) {
      if (isResetPath || modeParam === 'reset-password') {
        setResetToken(token);
        setAuthMode('reset-password');
        return;
      }
      userApi.confirmVerificationToken(token)
        .then((message) => {
          if (typeof message !== 'string' || !message.toLowerCase().includes('email verified') || message.toLowerCase().includes('not verified')) {
            throw new Error('Verification was not successful.');
          }
          setError('Your email has been verified. You can now sign in.');
          setVerificationEmail('');
          setVerificationUserId(null);
          localStorage.removeItem('placed_verification_user_id');
          localStorage.removeItem('placed_verification_email');
          setSearchParams({ mode: 'login' });
        })
        .catch(() => setError('This verification link is invalid or expired.'));
    } else if (
      modeParam === 'register' ||
      modeParam === 'login' ||
      modeParam === 'forgot-password' ||
      modeParam === 'reset-password'
    ) {
      setAuthMode(modeParam);
    }
  }, [searchParams, setSearchParams]);

  const handleModeChange = (
    mode: 'login' | 'register' | 'forgot-password' | 'reset-password'
  ) => {
    setAuthMode(mode);
    setSearchParams({ mode });
    setError('');
    setForgotStatusMsg('');
    setForgotErrorMsg('');
    setResetStatusMsg('');
    setResetErrorMsg('');
    if (mode === 'forgot-password') {
      setForgotStep('tutorial');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotStatusMsg('');
    const targetEmail = forgotEmail.trim().toLowerCase();
    if (!targetEmail) {
      setForgotErrorMsg('Please enter your account email address.');
      return;
    }

    setIsForgotLoading(true);
    try {
      await authApi.forgotPassword(targetEmail);
      setForgotStatusMsg(
        'If an account exists for this email, a password recovery link has been sent to this registered address. If requested from an unrecognized device, a 6-digit code was dispatched to your secondary recovery email.'
      );
      setForgotCodeEmail(targetEmail);
    } catch {
      setForgotStatusMsg(
        'If an account exists for this email, a password recovery link has been sent to this registered address. If requested from an unrecognized device, a 6-digit code was dispatched to your secondary recovery email.'
      );
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleVerifyResetOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    const targetEmail = forgotCodeEmail.trim().toLowerCase();
    const otp = forgotOtp.trim();

    if (!targetEmail) {
      setForgotErrorMsg('Please provide your PlaceD account email.');
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      setForgotErrorMsg('Please enter a valid 6-digit OTP code.');
      return;
    }

    setIsOtpVerifying(true);
    try {
      const res = await authApi.verifyResetOtp(targetEmail, otp);
      if (res && res.token) {
        setResetToken(res.token);
        setAuthMode('reset-password');
        setForgotOtp('');
      } else {
        throw new Error('Verification failed. Reset token was not returned.');
      }
    } catch (err: any) {
      setForgotErrorMsg(err?.message || 'This code is invalid or has expired (max 5 tries, 10 minutes limit).');
    } finally {
      setIsOtpVerifying(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMsg('');
    setResetStatusMsg('');

    if (newPassword !== confirmPassword) {
      setResetErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,72}$/;
    if (!passwordRegex.test(newPassword)) {
      setResetErrorMsg(
        'Password must be 8 to 72 characters long, containing at least 1 uppercase letter, 1 number, and 1 special character.'
      );
      return;
    }

    if (!resetToken) {
      setResetErrorMsg('Reset token is missing or has expired. Please request a new password recovery link.');
      return;
    }

    setIsResetting(true);
    try {
      await authApi.resetPassword({
        token: resetToken,
        newPassword
      });
      setResetStatusMsg('Password successfully changed! Redirecting to sign in...');
      setTimeout(() => {
        setAuthMode('login');
        setError('Password successfully changed for your account. Please log in.');
        setResetStatusMsg('');
        setNewPassword('');
        setConfirmPassword('');
        setResetToken('');
      }, 1500);
    } catch (err: any) {
      setResetErrorMsg(err?.message || 'This reset link is invalid or has expired (15 minutes limit).');
    } finally {
      setIsResetting(false);
    }
  };

  const processGoogleIdToken = async (idToken: string) => {
    setGoogleLoading(true);
    setError('');
    setGoogleError('');
    try {
      const res = await authApi.googleSignIn(idToken);
      if (res.status === 'SIGNED_IN') {
        if (res.token) localStorage.setItem('token', res.token);
        if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
        if (res.email) localStorage.setItem('userEmail', res.email.toLowerCase().trim());
        const rawRole = (res.role || 'STUDENT').toUpperCase();
        let resolvedRole: AuthRole = 'student';
        if (rawRole === 'TPO' || rawRole === 'ADMIN') {
          resolvedRole = 'admin';
        } else if (rawRole === 'RECRUITER') {
          resolvedRole = 'recruiter';
        } else if (rawRole === 'ALUMNI') {
          resolvedRole = 'alumni';
        }
        localStorage.setItem('role', resolvedRole === 'admin' ? 'admin' : res.role || 'STUDENT');
        let resolvedId: string | undefined = undefined;
        if (resolvedRole === 'student' && res.email) {
          try {
            const all = await studentApi.getAll();
            const found = all.find((s) => s.email?.toLowerCase().trim() === res.email?.toLowerCase().trim());
            if (found) {
              resolvedId = String(found.id);
              localStorage.setItem('studentId', resolvedId);
            }
          } catch { }
        }
        onLogin(resolvedRole, resolvedId);
      } else if (res.status === 'REGISTRATION_REQUIRED') {
        if (activeRole === 'admin') {
          setError('No registered TPO / Admin account found for this Google email. TPO accounts must be registered by institutional administration first.');
          return;
        }
        setGoogleIdToken(idToken);
        setGoogleEmail(res.email || '');
        setGoogleFirstName(res.firstName || '');
        setGoogleLastName(res.lastName || '');
        // Auto-fill from form if already typed
        setGoogleRole(activeRole.toUpperCase() as any);
        if (commonPhone || regPhone) setGooglePhone(commonPhone || regPhone);
        if (collegeId) setGoogleCollegeId(collegeId);
        else if (availableColleges.length > 0) setGoogleCollegeId(String(availableColleges[0].id));
        if (regRegistrationNumber) setGoogleStudentRegNo(regRegistrationNumber);
        if (regBranch) setGoogleStudentDept(regBranch);
        else setGoogleStudentDept('Computer Science');
        if (regYearOfAdmission) setGoogleStudentYear(regYearOfAdmission);
        else setGoogleStudentYear(new Date().getFullYear().toString());
        if (recCompany) {
          const matched = availableCompanies.find(
            (c) => c.name.toLowerCase() === recCompany.toLowerCase()
          );
          if (matched) setGoogleCompanyId(String(matched.id));
          else if (availableCompanies.length > 0) setGoogleCompanyId(String(availableCompanies[0].id));
        } else if (availableCompanies.length > 0) {
          setGoogleCompanyId(String(availableCompanies[0].id));
        }
        if (alumniStudentRegnNo) setGoogleAlumniRegNo(alumniStudentRegnNo);
        if (addressCity) setGoogleLocation(addressCity);
        setShowGoogleSignupModal(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Google sign-in failed. Please verify credentials or try standard login.');
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const setupGsi = async () => {
      if (authMode !== 'login') return;
      const loaded = await ensureGoogleScript();
      if (!loaded || isCancelled) return;

      const google = (window as any).google;
      if (!google?.accounts?.id) return;

      try {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            if (response?.credential) {
              await processGoogleIdToken(response.credential);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        const targetId = `google-btn-${activeRole}`;
        const container = document.getElementById(targetId);
        if (container) {
          container.innerHTML = '';
          google.accounts.id.renderButton(container, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            shape: 'rectangular',
            text: 'signin_with',
            logo_alignment: 'left',
            width: Math.min(380, Math.max(280, container.clientWidth || 340)),
          });
          setGoogleButtonRendered(true);
        }
      } catch (err) {
        console.warn('Google GSI initialization error:', err);
      }
    };

    setGoogleButtonRendered(false);
    const timer = setTimeout(() => {
      setupGsi();
    }, 50);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activeRole, authMode]);

  const handleGoogleSignInClick = async () => {
    setGoogleError('');
    setError('');
    setGoogleLoading(true);

    try {
      const loaded = await ensureGoogleScript();
      const google = (window as any).google;

      if (!loaded || !google?.accounts?.id) {
        setError(
          'Google Sign-In library could not be loaded. Please check your internet connection or disable ad-blockers and try again.'
        );
        return;
      }

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          if (response?.credential) {
            await processGoogleIdToken(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          const reason =
            notification.getNotDisplayedReason?.() ||
            notification.getSkippedReason?.() ||
            'one-tap-suppressed';
          console.warn('Google prompt not displayed:', reason);

          const targetId = `google-btn-${activeRole}`;
          const container = document.getElementById(targetId);
          if (container) {
            container.innerHTML = '';
            google.accounts.id.renderButton(container, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: 'signin_with',
              logo_alignment: 'left',
              width: Math.min(380, Math.max(280, container.clientWidth || 340)),
            });
            setGoogleButtonRendered(true);
          }

          setError(
            'Google One Tap was suppressed on localhost (' +
            reason +
            '). Please click the official Google button directly, and ensure http://localhost:5173 is added to Authorized JavaScript origins in Google Cloud Console.'
          );
        }
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to start Google sign-in.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleError('');
    setGoogleLoading(true);

    try {
      const payload: any = {
        idToken: googleIdToken,
        role: googleRole,
        collegeId: Number(googleCollegeId || availableColleges[0]?.id || 1),
        phone: googlePhone.trim(),
        firstName: googleFirstName.trim(),
        lastName: googleLastName.trim(),
      };

      if (googleRole === 'STUDENT') {
        if (!/^\d{12}$/.test(googleStudentRegNo.trim())) {
          throw new Error('MAKAUT Student Registration Number must be exactly 12 digits.');
        }
        payload.student = {
          registrationNumber: googleStudentRegNo.trim(),
          department: googleStudentDept || 'Computer Science',
          yearOfAdmission: googleStudentYear.trim() || String(new Date().getFullYear()),
        };
      } else if (googleRole === 'RECRUITER') {
        const finalCompanyId = googleCompanyId || (availableCompanies[0]?.id ? String(availableCompanies[0].id) : '');
        if (!finalCompanyId) {
          throw new Error('Please select your affiliated company.');
        }
        payload.recruiter = {
          companyId: Number(finalCompanyId),
          designation: googleDesignation.trim() || 'Technical Recruiter',
          industry: googleIndustry.trim() || undefined,
        };
      } else if (googleRole === 'ALUMNI') {
        if (!/^\d{12}$/.test(googleAlumniRegNo.trim())) {
          throw new Error('Alumni MAKAUT Registration Number must be exactly 12 digits.');
        }
        payload.alumni = {
          studentRegistrationNumber: googleAlumniRegNo.trim(),
          location: googleLocation.trim() || undefined,
          bio: googleBio.trim() || undefined,
        };
      }

      const res = await authApi.googleSignUp(payload);
      if (res.token) localStorage.setItem('token', res.token);
      if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
      if (res.email || googleEmail) localStorage.setItem('userEmail', (res.email || googleEmail).toLowerCase().trim());
      const resolvedRole = (res.role || googleRole).toLowerCase() as AuthRole;
      localStorage.setItem('role', res.role || googleRole);
      setShowGoogleSignupModal(false);
      onLogin(resolvedRole, googleRole === 'STUDENT' ? googleStudentRegNo.trim() : undefined);
    } catch (err: any) {
      setGoogleError(err?.message || 'Google registration failed. Please review your input.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRoleChange = (role: AuthRole) => {
    setActiveRole(role);
    setError('');
    setShowPassword(false);
  };

  /* =========================================================
     STUDENT LOGIN / REGISTRATION
  ========================================================= */

  const [studentRegNo, setStudentRegNo] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRegistrationNumber, setRegRegistrationNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const [regBranch, setRegBranch] = useState<
    | 'Computer Science'
    | 'Information Technology'
    | 'Electronics'
    | 'Mechanical'
    | 'Electrical'
  >('Computer Science');

  const [regCgpa, setRegCgpa] = useState('8.0');
  const [regYearOfAdmission, setRegYearOfAdmission] = useState('');
  const [regSkills, setRegSkills] = useState('React, TypeScript, JavaScript');
  const [regResume, setRegResume] = useState('');

  /* =========================================================
     ALUMNI REGISTRATION
  ========================================================= */

  const [alumniName, setAlumniName] = useState('');
  const [alumniEmail, setAlumniEmail] = useState('');
  const [alumniPassword, setAlumniPassword] = useState('');
  const [alumniGraduationYear, setAlumniGraduationYear] = useState(
    new Date().getFullYear().toString()
  );
  const [alumniCompany, setAlumniCompany] = useState('');
  const [alumniCurrentRole, setAlumniCurrentRole] = useState('');
  const [alumniDepartment, setAlumniDepartment] = useState<
    | 'Computer Science'
    | 'Information Technology'
    | 'Electronics'
    | 'Mechanical'
    | 'Electrical'
  >('Information Technology');
  const [alumniLinkedIn, setAlumniLinkedIn] = useState('');

  /* =========================================================
     RECRUITER LOGIN / REGISTRATION
  ========================================================= */

  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [recruiterPassword, setRecruiterPassword] = useState('');
  const [recName, setRecName] = useState('');
  const [recCompany, setRecCompany] = useState('');
  const [recDesignation, setRecDesignation] = useState('Technical Recruiter');
  const [recEmail, setRecEmail] = useState('');
  const [recPassword, setRecPassword] = useState('');

  /* =========================================================
     ADMIN CREDENTIALS
  ========================================================= */

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');

  /* =========================================================
     STUDENT SUBMIT
  ========================================================= */

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authMode === 'login') {
      const loginInput = studentRegNo.trim();

      if (!loginInput) {
        setError('Please enter your student email or MAKAUT registration number.');
        return;
      }

      setIsSubmitting(true);

      try {
        const res = await authApi.loginStudent({
          identifier: loginInput,
          password: studentPassword,
        });
        if (res?.role !== 'STUDENT') {
          throw new Error('This account is not registered with the Student role.');
        }

        if (res?.token) {
          localStorage.setItem('token', res.token);
          if (res.refreshToken) {
            localStorage.setItem('refreshToken', res.refreshToken);
          }
          localStorage.setItem('role', res.role || 'STUDENT');
          if (loginInput.includes('@')) {
            localStorage.setItem('userEmail', loginInput.toLowerCase().trim());
          }

          // The backend student profile is keyed by the 12-digit registration number.
          let resolvedStudentId = loginInput;
          if (!/^\d{12}$/.test(loginInput)) {
            const allStudents = await studentApi.getAll();
            const found = allStudents.find(
              (student) => student.email?.toLowerCase().trim() === loginInput.toLowerCase()
            );
            if (!found) throw new Error('Your student account has no linked student profile. Contact the placement administrator.');
            resolvedStudentId = String(found.id);
          }

          localStorage.setItem('studentId', resolvedStudentId);
          onLogin('student', resolvedStudentId);
        } else {
          throw new Error('The backend did not return an access token. Please try again.');
        }
      } catch (err: any) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('role');
        handleAuthError(err, loginInput, 'Invalid student credentials.');
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    /* =====================================================
       STUDENT REGISTRATION
    ===================================================== */

    if (
      !regName.trim() ||
      !regEmail.trim() ||
      !regRegistrationNumber.trim() ||
      !regPassword ||
      !regPhone.trim()
    ) {
      setError(
        'Please fill in all required fields.'
      );
      return;
    }

    const cleanedPhone = regPhone.trim();
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      setError('Mobile number must be a valid 10-digit number starting with 6, 7, 8, or 9.');
      return;
    }

    const normalizedEmail = regEmail.toLowerCase().trim();
    const rawRegNo = regRegistrationNumber.trim();
    const numericRegNo = rawRegNo.replace(/\D/g, '');

    if (numericRegNo.length !== 12) {
      setError('Registration number must be exactly 12 digits (e.g. 241000110549).');
      return;
    }

    if (!/^[a-zA-Z ]+$/.test(regName.trim())) {
      setError('Name must contain only letters and spaces.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (
      students.some(
        (s) =>
          s.registrationNumber
            ?.toLowerCase()
            .trim() === numericRegNo || String(s.id).trim() === numericRegNo
      )
    ) {
      setError(
        'An account with this registration number is already registered.'
      );
      return;
    }

    if (
      students.some(
        (s) =>
          s.email
            .toLowerCase()
            .trim() === normalizedEmail
      )
    ) {
      setError(
        'An account with this email is already registered.'
      );
      return;
    }

    const cgpaNum = parseFloat(regCgpa);

    if (
      Number.isNaN(cgpaNum) ||
      cgpaNum < 0 ||
      cgpaNum > 10
    ) {
      setError(
        'CGPA must be a valid number between 0 and 10.'
      );
      return;
    }

    const newStudent: Student = {
      id: numericRegNo,

      name: regName.trim(),

      email: normalizedEmail,

      phone: cleanedPhone,

      registrationNumber: numericRegNo,

      password: regPassword,

      branch: regBranch,

      cgpa: cgpaNum,

      backlogs: 0,

      placementStatus: 'Unplaced',

      placedCompany: undefined,

      placedPackage: undefined,

      resumeScore: 85,

      skills: regSkills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),

      projectsCount: 0,

      resumeText: regResume,

      applications: [],

      department: regBranch
    };

    setIsSubmitting(true);
    try {
      if (!regResume.trim() || !/^https?:\/\//i.test(regResume.trim())) {
        throw new Error('Enter a valid public resume URL (https://...).');
      }
      const baseUser = await createBaseUser(newStudent.name, normalizedEmail, regPassword, 'STUDENT', cleanedPhone);
      await studentApi.add({
        id: numericRegNo,
        department: newStudent.department,
        cgpa: newStudent.cgpa,
        activeBacklogs: 0,
        resumeUrl: regResume.trim(),
        yearOfAdmission: regYearOfAdmission.trim(),
        userId: baseUser.id,
      });

      onRegister({ ...newStudent, userId: baseUser.id, yearOfAdmission: regYearOfAdmission.trim() });
      setStudentRegNo(normalizedEmail);
      setStudentPassword('');
      await completeRegistration(baseUser.id, normalizedEmail);
    } catch (err: any) {
      setError(err?.message || 'Student registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     ALUMNI SUBMIT
  ========================================================= */

  const handleAlumniSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authMode === 'login') {
      const loginEmail = alumniEmail.trim();

      if (!loginEmail || !alumniPassword) {
        setError('Please enter your alumni email address and password.');
        return;
      }

      setIsSubmitting(true);

      try {
        const res = await authApi.login({
          email: loginEmail,
          password: alumniPassword,
          role: 'ALUMNI',
        });
        if (res?.role !== 'ALUMNI') {
          throw new Error('This account is not registered with the Alumni role.');
        }

        if (res?.token) {
          localStorage.setItem('token', res.token);
          if (res.refreshToken) {
            localStorage.setItem('refreshToken', res.refreshToken);
          }
          localStorage.setItem('role', res.role || 'ALUMNI');

          const allAlumni = await alumniApi.getAll();
          const foundAlumni = allAlumni.find(
            (a) => a.email.toLowerCase().trim() === loginEmail.toLowerCase()
          );
          if (!foundAlumni) throw new Error('Your account has no linked alumni profile. Contact the placement administrator.');
          const resolvedAlumniId = String(foundAlumni.id);

          localStorage.setItem('alumniId', resolvedAlumniId);
          onLogin('alumni', resolvedAlumniId);
        } else {
          throw new Error('The backend did not return an access token. Please try again.');
        }
      } catch (err: any) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('role');
        localStorage.removeItem('alumniId');
        handleAuthError(err, loginEmail, 'Invalid alumni credentials.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    /* =====================================================
       ALUMNI REGISTRATION VALIDATION
    ===================================================== */

    if (
      !alumniName.trim() ||
      !alumniEmail.trim() ||
      !alumniPassword ||
      !alumniGraduationYear.trim() ||
      !alumniCompany.trim() ||
      !alumniCurrentRole.trim() ||
      !alumniDepartment.trim()
    ) {
      setError('Please fill in all required alumni fields.');
      return;
    }

    const normalizedEmail = alumniEmail.toLowerCase().trim();

    if (
      alumni.some(
        (a) => a.email.toLowerCase().trim() === normalizedEmail
      )
    ) {
      setError('An alumni account with this email is already registered.');
      return;
    }

    if (
      students.some(
        (s) => s.email.toLowerCase().trim() === normalizedEmail
      )
    ) {
      setError('This email is already registered as a student account.');
      return;
    }

    const graduationYear = parseInt(alumniGraduationYear, 10);
    const currentYear = new Date().getFullYear();

    if (
      Number.isNaN(graduationYear) ||
      graduationYear < 1950 ||
      graduationYear > currentYear
    ) {
      setError(`Graduation year must be between 1950 and ${currentYear}.`);
      return;
    }

    if (
      alumniLinkedIn.trim() &&
      !(
        alumniLinkedIn.trim().startsWith('http://') ||
        alumniLinkedIn.trim().startsWith('https://')
      )
    ) {
      setError('LinkedIn URL should start with http:// or https://.');
      return;
    }

    const registrationRequest: AlumniRegistrationRequest = {
      name: alumniName.trim(),
      email: normalizedEmail,
      password: alumniPassword,
      graduationYear,
      currentCompany: alumniCompany.trim(),
      currentRole: alumniCurrentRole.trim(),
      department: alumniDepartment,
      linkedIn: alumniLinkedIn.trim(),
    };

    try {
      setIsSubmitting(true);
      if (!/^\d{12}$/.test(alumniStudentRegnNo.trim())) {
        throw new Error('Enter the 12-digit registration number of your existing student record.');
      }
      const baseUser = await createBaseUser(alumniName.trim(), normalizedEmail, alumniPassword, 'ALUMNI', commonPhone);
      await alumniApi.addDetails({
        userId: baseUser.id,
        studentRegnNo: alumniStudentRegnNo.trim(),
        bio: `${registrationRequest.currentRole} at ${registrationRequest.currentCompany}; graduated ${graduationYear}; department: ${registrationRequest.department}`,
        location: addressCity.trim(),
        linkedinUrl: registrationRequest.linkedIn,
      });
      setAlumniEmail(normalizedEmail);
      setStudentPassword('');
      await completeRegistration(baseUser.id, normalizedEmail);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Unable to register alumni.'
      );
    } finally {
      setIsSubmitting(false);
    }

    setAlumniName('');
    setAlumniPassword('');
    setAlumniGraduationYear(currentYear.toString());
    setAlumniCompany('');
    setAlumniCurrentRole('');
    setAlumniDepartment('Information Technology');
    setAlumniLinkedIn('');
  };

  /* =========================================================
     RECRUITER SUBMIT
  ========================================================= */

  const handleRecruiterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authMode === 'login') {
      setIsSubmitting(true);

      try {
        const identifier = recruiterEmail.trim();
        const res = await authApi.login({
          email: identifier,
          password: recruiterPassword,
          role: 'RECRUITER',
        });
        if (res?.role !== 'RECRUITER') {
          throw new Error('This account is not registered with the Recruiter role.');
        }

        if (!res?.token) throw new Error('The backend did not return an access token. Please try again.');
        localStorage.setItem('token', res.token);
        if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
        localStorage.setItem('role', res.role || 'RECRUITER');

        const allRecruiters = await recruiterApi.getAll();
        const realRecruiter = allRecruiters.find(
          (recruiter) => recruiter.email.toLowerCase().trim() === identifier.toLowerCase().trim()
        );
        if (!realRecruiter) {
          throw new Error('Your account has no linked recruiter profile. Contact the placement administrator.');
        }
        if (realRecruiter.recruiterStatus !== 'APPROVED') {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('role');
          if (realRecruiter.recruiterStatus === 'REJECTED') {
            setError('Your recruiter account request has been rejected by TPO.');
          } else {
            setError('Your recruiter account is pending TPO approval. Please wait for the TPO to approve your account before logging in.');
          }
          return;
        }
        localStorage.setItem('recruiterId', String(realRecruiter.id));
        onLogin('recruiter', String(realRecruiter.id));
      } catch (err: any) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('role');
        localStorage.removeItem('recruiterId');
        handleAuthError(err, recruiterEmail, 'Invalid recruiter credentials.');
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (
      !recName.trim() ||
      !recCompany.trim() ||
      !recEmail.trim() ||
      !recPassword
    ) {
      setError('Please fill in all required recruiter fields.');
      return;
    }

    const normalizedEmail = recEmail.toLowerCase().trim();

    if (
      recruiters.some(
        (r) => r.email.toLowerCase().trim() === normalizedEmail
      )
    ) {
      setError('A recruiter with this email is already registered.');
      return;
    }

    const newRecruiter: Recruiter = {
      id: `rec_${Math.random().toString(36).substring(2, 11)}`,
      name: recName.trim(),
      email: normalizedEmail,
      password: recPassword,
      companyName: recCompany.trim(),
      designation: recDesignation.trim() || 'Recruiter',
      recruiterStatus: 'PENDING',
    };

    setIsSubmitting(true);
    try {
      const baseUser = await createBaseUser(recName.trim(), normalizedEmail, recPassword, 'RECRUITER', commonPhone);
      const createdRecruiter = await recruiterApi.register({
        userId: baseUser.id,
        companyName: recCompany.trim(),
        designation: newRecruiter.designation,
      });

      onRegisterRecruiter({
        ...newRecruiter,
        id: String(createdRecruiter.id),
        recruiterStatus: createdRecruiter.recruiterStatus,
      });
      setRecruiterEmail(normalizedEmail);
      setRecruiterPassword('');
      await completeRegistration(baseUser.id, normalizedEmail);
      setError('Recruiter account created. A verification email was requested; TPO approval is also required before recruiter access.');
    } catch (err: any) {
      setError(err?.message || 'Recruiter registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     ADMIN SUBMIT
  ========================================================= */

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authMode === 'login') {
      setIsSubmitting(true);

      try {
        const res = await authApi.login({
          email: adminEmail.trim(),
          password: adminPassword,
          role: 'TPO',
        });
        if (res?.role !== 'TPO') {
          throw new Error('This account is not registered with the TPO role.');
        }

        if (res?.token) {
          localStorage.setItem('token', res.token);
          if (res.refreshToken) {
            localStorage.setItem('refreshToken', res.refreshToken);
          }
          localStorage.setItem('role', res.role || 'TPO');
          onLogin('admin');
        } else {
          throw new Error('No token returned from backend.');
        }
      } catch (err: any) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('role');
        handleAuthError(err, adminEmail, 'Unable to log in as administrator.');
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (!adminName.trim() || !adminEmail.trim() || !adminPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedEmail = adminEmail.toLowerCase().trim();
      const baseUser = await createBaseUser(adminName.trim(), normalizedEmail, adminPassword, 'TPO', commonPhone);
      await userApi.registerTpo(baseUser.id);
      setAdminEmail(normalizedEmail);
      setAdminPassword('');
      await completeRegistration(baseUser.id, normalizedEmail);
    } catch (err: any) {
      setError(err?.message || 'TPO Admin registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCollegeAndAddressSection = (showPhoneField?: boolean) => (
    <div className="pt-3 mt-3 border-t border-[#D0E4F5]">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-[#18577F]" />
        <span className="text-xs font-bold text-[#071923] uppercase tracking-wider">
          College & Address Information
        </span>
      </div>

      <div className="auth-input-group mb-3">
        <label className="auth-input-label">Affiliated College *</label>
        <div className="auth-input-box">
          <GraduationCap size={16} className="auth-input-icon" />
          {availableColleges.length > 0 ? (
            <select
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              className="auth-input-field"
              required
            >
              {availableColleges.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              required
              min="1"
              value={collegeId}
              onChange={(e) => setCollegeId(e.target.value)}
              placeholder="Enter College ID (e.g. 1)"
              className="auth-input-field"
            />
          )}
        </div>
      </div>

      {showPhoneField && (
        <div className="auth-input-group mb-3">
          <label className="auth-input-label">Mobile Number (10 Digits) *</label>
          <div className="auth-input-box">
            <Phone size={16} className="auth-input-icon" />
            <input
              type="tel"
              required
              maxLength={10}
              value={commonPhone}
              onChange={(e) => setCommonPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              className="auth-input-field font-mono"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div className="auth-input-group">
          <label className="auth-input-label">Address Line 1 *</label>
          <div className="auth-input-box">
            <input
              type="text"
              required
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Street / Flat / Locality"
              className="auth-input-field"
            />
          </div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">Address Line 2 (Optional)</label>
          <div className="auth-input-box">
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Apartment / Landmark"
              className="auth-input-field"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <div className="auth-input-group">
          <label className="auth-input-label">City *</label>
          <div className="auth-input-box">
            <input
              type="text"
              required
              value={addressCity}
              onChange={(e) => setAddressCity(e.target.value)}
              placeholder="Kolkata"
              className="auth-input-field"
            />
          </div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">State *</label>
          <div className="auth-input-box">
            <input
              type="text"
              required
              value={addressState}
              onChange={(e) => setAddressState(e.target.value)}
              placeholder="West Bengal"
              className="auth-input-field"
            />
          </div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">PIN Code *</label>
          <div className="auth-input-box">
            <input
              type="text"
              required
              maxLength={6}
              value={addressPostalCode}
              onChange={(e) => setAddressPostalCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="700001"
              className="auth-input-field font-mono"
            />
          </div>
        </div>
        <div className="auth-input-group">
          <label className="auth-input-label">Country *</label>
          <div className="auth-input-box">
            <input
              type="text"
              required
              value={addressCountry}
              onChange={(e) => setAddressCountry(e.target.value)}
              placeholder="India"
              className="auth-input-field"
            />
          </div>
        </div>
      </div>
    </div>
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="auth-page-container">
      <div
        id="login-section"
        className="auth-section-wrapper py-12"
      >
        <div className="auth-split-container">

          {/* =================================================
              LEFT VISUAL PANEL
          ================================================= */}

          <div className="auth-visual-panel">
            <div className="auth-visual-header">

              <span className="auth-visual-badge">
                <Sparkles size={14} />
                Unified Placement Engine
              </span>

              <h2 className="auth-visual-title">
                Elevate Campus Placements
              </h2>

              <p className="auth-visual-desc">
                Streamline recruitment drives,
                score candidate resumes with AI,
                and track placement pipelines
                in real-time.
              </p>
            </div>

            <div className="auth-feature-list">

              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <FileCheck2 size={20} />
                </div>

                <div className="auth-feature-text">
                  <h4>
                    AI ATS Resume Scorer
                  </h4>

                  <p>
                    Instant resume keyword
                    scoring against corporate
                    cutoffs.
                  </p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <BarChart2 size={20} />
                </div>

                <div className="auth-feature-text">
                  <h4>
                    Real-Time Pipeline
                  </h4>

                  <p>
                    Stage-by-stage candidate
                    promotion from online tests
                    to HR offers.
                  </p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Users size={20} />
                </div>

                <div className="auth-feature-text">
                  <h4>
                    Recruiter CRM
                  </h4>

                  <p>
                    Manage companies, recruiters,
                    drives and candidate selection.
                  </p>
                </div>
              </div>

              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <Award size={20} />
                </div>

                <div className="auth-feature-text">
                  <h4>
                    Alumni Network
                  </h4>

                  <p>
                    Connect students with alumni
                    for career advice, blogs and
                    referrals.
                  </p>
                </div>
              </div>
            </div>

            <div className="auth-visual-footer">

              <div className="auth-footer-stat">
                <span>95%</span>
                <span>Placement Rate</span>
              </div>

              <div className="auth-footer-stat">
                <span>300+</span>
                <span>Corporate Partners</span>
              </div>

              <div className="auth-footer-stat">
                <span>5000+</span>
                <span>Active Candidates</span>
              </div>

            </div>
          </div>

          {/* =================================================
              RIGHT FORM PANEL
          ================================================= */}

          <div className="auth-form-panel">

            <div>

              {/* =================================================
                  LOGIN / REGISTER SWITCH
              ================================================= */}

              {authMode === 'forgot-password' || authMode === 'reset-password' ? (
                <div className="recovery-top-stepper-bar">
                  <button
                    type="button"
                    onClick={() => {
                      if (authMode === 'forgot-password' && forgotStep === 'form') {
                        setForgotStep('tutorial');
                      } else {
                        handleModeChange('login');
                      }
                    }}
                    className="recovery-btn-secondary"
                  >
                    {authMode === 'forgot-password' && forgotStep === 'form' ? '← Back to Instructions' : '← Back to Sign In'}
                  </button>

                  {authMode === 'forgot-password' ? (
                    <div className="recovery-step-pill-group">
                      <button
                        type="button"
                        onClick={() => setForgotStep('tutorial')}
                        className={`recovery-step-pill-btn ${forgotStep === 'tutorial' ? 'active' : ''
                          }`}
                      >
                        Step 1 • Instructions
                      </button>
                      <button
                        type="button"
                        onClick={() => setForgotStep('form')}
                        className={`recovery-step-pill-btn ${forgotStep === 'form' ? 'active' : ''
                          }`}
                      >
                        Step 2 • Recovery
                      </button>
                    </div>
                  ) : (
                    <span className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-blue-700 uppercase tracking-wider flex items-center justify-center shadow-2xs">
                      Reset Password
                    </span>
                  )}
                </div>
              ) : (
                <div className="auth-mode-switcher">

                  <button
                    type="button"
                    onClick={() => {
                      handleModeChange('login');
                    }}
                    className={`auth-mode-btn ${authMode === 'login'
                      ? 'active'
                      : ''
                      }`}
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleModeChange(
                        'register'
                      );
                    }}
                    className={`auth-mode-btn ${authMode === ('register' as 'login' | 'register')
                      ? 'active'
                      : ''
                      }`}
                  >
                    Register New Account
                  </button>

                </div>
              )}

              {/* =================================================
                  ROLE SELECTOR
              ================================================= */}

              {(authMode === 'login' || authMode === 'register') && (
                <>
                  <div className="role-grid-header">
                    <label>
                      Select Portal Role
                    </label>
                  </div>

                  <div className="role-grid-4">

                    {/* Student */}

                    <button
                      type="button"
                      onClick={() =>
                        handleRoleChange(
                          'student'
                        )
                      }
                      className={`role-card-item ${activeRole === 'student'
                        ? 'active'
                        : ''
                        }`}
                    >
                      <GraduationCap
                        size={18}
                        className="role-card-icon"
                      />

                      <span className="role-card-title">
                        Student
                      </span>
                    </button>

                    {/* Admin */}

                    <button
                      type="button"
                      onClick={() =>
                        handleRoleChange(
                          'admin'
                        )
                      }
                      className={`role-card-item ${activeRole === 'admin'
                        ? 'active'
                        : ''
                        }`}
                    >
                      <Shield
                        size={18}
                        className="role-card-icon"
                      />

                      <span className="role-card-title">
                        TPO / Admin
                      </span>
                    </button>

                    {/* Recruiter */}

                    <button
                      type="button"
                      onClick={() =>
                        handleRoleChange(
                          'recruiter'
                        )
                      }
                      className={`role-card-item ${activeRole === 'recruiter'
                        ? 'active'
                        : ''
                        }`}
                    >
                      <Building2
                        size={18}
                        className="role-card-icon"
                      />

                      <span className="role-card-title">
                        Recruiter
                      </span>
                    </button>

                    {/* Alumni */}

                    <button
                      type="button"
                      onClick={() =>
                        handleRoleChange(
                          'alumni'
                        )
                      }
                      className={`role-card-item ${activeRole === 'alumni'
                        ? 'active'
                        : ''
                        }`}
                    >
                      <Award
                        size={18}
                        className="role-card-icon"
                      />

                      <span className="role-card-title">
                        Alumni
                      </span>
                    </button>

                  </div>
                </>
              )}

              {/* =================================================
                  ERROR / STATUS MESSAGE
              ================================================= */}

              {error && (
                <div
                  className={`auth-error-banner ${error.toLowerCase().includes(
                    'successfully'
                  ) ||
                    error.toLowerCase().includes(
                      'waiting'
                    ) ||
                    error.toLowerCase().includes(
                      'approval'
                    )
                    ? 'auth-success-banner'
                    : ''
                    }`}
                >
                  <span className="auth-error-dot" />

                  <span>{error}</span>
                  {verificationEmail && (
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isSubmitting || resendCooldown > 0 || resendAttempts.filter((time) => time > Date.now() - 60 * 60 * 1000).length >= 3}
                      className="ml-2 underline font-semibold disabled:opacity-50"
                    >
                      {resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : resendAttempts.filter((time) => time > Date.now() - 60 * 60 * 1000).length >= 3
                          ? 'Resend limit reached'
                          : 'Resend verification email'}
                    </button>
                  )}
                </div>
              )}

              {/* =================================================
                  FORGOT PASSWORD VIEW
              ================================================= */}
              {authMode === 'forgot-password' && (
                <>
                  {/* Window 1: Tutorial / Instructions Card (Resume Analyzer & Stage Visualizer style) */}
                  {forgotStep === 'tutorial' && (
                    <div className="recovery-flow-card animate-fade-in">
                      {/* Card Header (rp-modal-header style) */}
                      <div className="recovery-flow-header">
                        <div className="recovery-header-left">
                          <div className="recovery-header-icon-badge">
                            <Key size={24} />
                          </div>
                          <div className="recovery-header-text">
                            <h3 className="recovery-flow-title">
                              Password Recovery Instructions
                            </h3>
                            <p className="recovery-flow-subtitle">
                              Please review how account recovery works before continuing:
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Body (rp-modal-body style) */}
                      <div className="recovery-flow-body">
                        {/* Point 1: Direct Link Stage Card (sp-stage-card-active style) */}
                        <div className="recovery-stage-card recovery-stage-card-active">
                          <div className="flex items-center justify-between gap-3">
                            <div className="recovery-stage-number-badge bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100">
                              1
                            </div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                              <Mail size={14} className="text-blue-600" /> Direct Link Option
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <h4 className="text-base font-extrabold text-slate-900 font-display">
                              1. Direct Password Recovery Link
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                              Enter your registered email address and click the send button. If an account exists with this email, you will receive a direct password recovery link to your registered email address.
                            </p>
                          </div>
                        </div>

                        {/* Point 2: 6-Digit Code Stage Card (sp-stage-card style) */}
                        <div className="recovery-stage-card recovery-stage-card-upcoming">
                          <div className="flex items-center justify-between gap-3">
                            <div className="recovery-stage-number-badge bg-slate-800 text-white shadow-sm ring-4 ring-slate-100">
                              2
                            </div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                              <ShieldCheck size={14} className="text-indigo-600" /> Secondary Email OTP
                            </span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <h4 className="text-base font-extrabold text-slate-900 font-display">
                              2. Have a 6-Digit Code to the Secondary Email?
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                              If requested from an unrecognized device, a 6-digit code is dispatched to your secondary email. On the next screen, you can enter your registered primary email and the 6-digit code sent to your secondary email.
                            </p>
                          </div>
                        </div>

                        {/* Important Note Callout */}
                        <div className="p-5 sm:p-6 rounded-2xl bg-rose-50/50 text-slate-700 flex items-start gap-4">
                          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertCircle size={18} />
                          </div>
                          <div className="flex flex-col gap-1 text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong className="font-extrabold text-rose-600 block text-xs sm:text-sm">
                              Important Note on Secondary Email:
                            </strong>
                            <span>
                              A secondary recovery email can only be added or updated in <strong className="text-slate-800">Profile Settings</strong> by a signed-in user.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer (rp-modal-footer style) */}
                      <div className="recovery-flow-footer">
                        <button
                          type="button"
                          onClick={() => handleModeChange('login')}
                          className="recovery-btn-secondary"
                        >
                          ← Back to Sign In
                        </button>

                        <button
                          type="button"
                          onClick={() => setForgotStep('form')}
                          className="recovery-btn-primary"
                        >
                          Continue to Recovery Form →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Window 2: Account Password Recovery Action Form Card (Resume Analyzer & Stage Visualizer style) */}
                  {forgotStep === 'form' && (
                    <div className="recovery-flow-card animate-fade-in">
                      {/* Card Header (rp-modal-header style) */}
                      <div className="recovery-flow-header">
                        <div className="recovery-header-left">
                          <div className="recovery-header-icon-badge">
                            <Key size={24} />
                          </div>
                          <div className="recovery-header-text">
                            <h3 className="recovery-flow-title">
                              Account Password Recovery
                            </h3>
                            <p className="recovery-flow-subtitle">
                              Enter your registered email to get the recovery link or code, or verify below.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Body (rp-modal-body style) */}
                      <div className="recovery-flow-body">
                        {forgotStatusMsg && (
                          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 flex items-start gap-3 leading-relaxed font-semibold shadow-2xs">
                            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                            <span>{forgotStatusMsg}</span>
                          </div>
                        )}

                        {forgotErrorMsg && (
                          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 flex items-start gap-3 font-semibold shadow-2xs">
                            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                            <span>{forgotErrorMsg}</span>
                          </div>
                        )}

                        {/* Mini Card 1: Get Recovery Link / Code (rp-candidate-card style) */}
                        <div className="recovery-mini-card">
                          <div className="flex items-center gap-2 pb-1">
                            <Mail size={16} className="text-blue-600" />
                            <h4 className="text-sm font-extrabold text-slate-900 font-display uppercase tracking-wider">
                              Get Recovery Link / Code
                            </h4>
                          </div>

                          <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-3.5">
                            <div className="flex flex-col gap-1.5">
                              <label className="recovery-field-label">
                                <Mail size={14} className="text-blue-600" />
                                Registered Account Email
                              </label>
                              <div className="recovery-input-wrapper">
                                <Mail size={18} className="text-slate-400 shrink-0" />
                                <input
                                  type="email"
                                  required
                                  value={forgotEmail}
                                  onChange={(e) => setForgotEmail(e.target.value)}
                                  placeholder="student@university.edu or user@example.com"
                                  className="recovery-input-field"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={isForgotLoading || !forgotEmail.trim()}
                              className="recovery-btn-primary w-full h-12 text-sm"
                            >
                              {isForgotLoading ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  Sending Recovery Link or Code...
                                </>
                              ) : (
                                <>
                                  <Mail size={16} />
                                  Send Password Recovery Link / Code
                                </>
                              )}
                            </button>
                          </form>
                        </div>

                        {/* Divider */}
                        <div className="relative my-2 flex items-center justify-center">
                          <div className="border-t border-slate-200 w-full" />
                          <span className="bg-white px-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider shrink-0">
                            or verify with code
                          </span>
                          <div className="border-t border-slate-200 w-full" />
                        </div>

                        {/* Mini Card 2: Verify 6-Digit Code (rp-candidate-card style) */}
                        <div className="recovery-mini-card">
                          <div className="flex items-center gap-2 pb-1">
                            <ShieldCheck size={16} className="text-indigo-600" />
                            <h4 className="text-sm font-extrabold text-slate-900 font-display uppercase tracking-wider">
                              Verify 6-Digit Code
                            </h4>
                          </div>

                          <div className="flex flex-col gap-0.5">
                            <h4 className="text-sm font-extrabold text-slate-900 font-display">
                              Have a 6-digit recovery code?
                            </h4>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                              Enter your registered primary email and the 6-digit code sent to your secondary email:
                            </p>
                          </div>

                          <form onSubmit={handleVerifyResetOtpSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              <div className="flex flex-col gap-1.5">
                                <label className="recovery-field-label">
                                  <Mail size={14} className="text-indigo-600" />
                                  Registered Primary Email
                                </label>
                                <div className="recovery-input-wrapper">
                                  <Mail size={16} className="text-slate-400 shrink-0" />
                                  <input
                                    type="email"
                                    required
                                    value={forgotCodeEmail}
                                    onChange={(e) => setForgotCodeEmail(e.target.value)}
                                    placeholder="Account email"
                                    className="recovery-input-field"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="recovery-field-label">
                                  <ShieldCheck size={14} className="text-indigo-600" />
                                  6-Digit Code
                                </label>
                                <div className="recovery-input-wrapper">
                                  <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={forgotOtp}
                                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    className="recovery-input-field text-center font-mono font-black tracking-widest text-base"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={isOtpVerifying || !forgotCodeEmail.trim() || forgotOtp.trim().length !== 6}
                              className="recovery-btn-primary w-full h-12 text-sm"
                            >
                              {isOtpVerifying ? (
                                <>
                                  <Loader2 size={16} className="animate-spin" />
                                  Verifying Code...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={16} />
                                  Verify Code & Set New Password
                                </>
                              )}
                            </button>
                          </form>
                        </div>
                      </div>

                      {/* Card Footer (rp-modal-footer style) */}
                      <div className="recovery-flow-footer">
                        <button
                          type="button"
                          onClick={() => setForgotStep('tutorial')}
                          className="recovery-btn-secondary"
                        >
                          ← Back to Instructions
                        </button>

                        <button
                          type="button"
                          onClick={() => handleModeChange('login')}
                          className="recovery-btn-secondary"
                        >
                          Back to Sign In →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* =================================================
                  RESET PASSWORD VIEW
              ================================================= */}
              {authMode === 'reset-password' && (
                <div className="recovery-flow-card animate-fade-in">
                  {/* Card Header (rp-modal-header style) */}
                  <div className="recovery-flow-header">
                    <div className="recovery-header-left">
                      <div className="recovery-header-icon-badge">
                        <Key size={24} />
                      </div>
                      <div className="recovery-header-text">
                        <h3 className="recovery-flow-title">
                          Create New Password
                        </h3>
                        <p className="recovery-flow-subtitle">
                          Please choose a strong password for your PlaceD account.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="recovery-flow-body">
                    {resetStatusMsg && (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs sm:text-sm text-emerald-800 flex items-start gap-3 font-semibold shadow-2xs">
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{resetStatusMsg}</span>
                      </div>
                    )}

                    {resetErrorMsg && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 flex items-start gap-3 font-semibold shadow-2xs">
                        <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                        <span>{resetErrorMsg}</span>
                      </div>
                    )}

                    <form onSubmit={handleResetPasswordSubmit} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="recovery-field-label">
                          New Password
                        </label>
                        <div className="recovery-input-wrapper">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="recovery-input-field"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-slate-400 hover:text-blue-600 p-1 cursor-pointer shrink-0"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="recovery-field-label">
                          Confirm New Password
                        </label>
                        <div className="recovery-input-wrapper">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="recovery-input-field"
                          />
                        </div>
                      </div>

                      {/* Password Requirements Checklist Box (ATS Scorecard style) */}
                      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-1.5 border-slate-200 text-xs font-medium flex flex-col gap-2 shadow-2xs">
                        <span className="font-extrabold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                          <ShieldCheck size={16} className="text-blue-600" />
                          Password Policy Requirements:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                          <span className={newPassword.length >= 8 && newPassword.length <= 72 ? 'text-emerald-700 font-bold flex items-center gap-1.5' : 'text-slate-500 flex items-center gap-1.5'}>
                            <CheckCircle2 size={13} className={newPassword.length >= 8 && newPassword.length <= 72 ? 'text-emerald-600' : 'text-slate-400'} />
                            8 to 72 characters in length
                          </span>
                          <span className={/[A-Z]/.test(newPassword) ? 'text-emerald-700 font-bold flex items-center gap-1.5' : 'text-slate-500 flex items-center gap-1.5'}>
                            <CheckCircle2 size={13} className={/[A-Z]/.test(newPassword) ? 'text-emerald-600' : 'text-slate-400'} />
                            At least one uppercase letter (A-Z)
                          </span>
                          <span className={/[0-9]/.test(newPassword) ? 'text-emerald-700 font-bold flex items-center gap-1.5' : 'text-slate-500 flex items-center gap-1.5'}>
                            <CheckCircle2 size={13} className={/[0-9]/.test(newPassword) ? 'text-emerald-600' : 'text-slate-400'} />
                            At least one number (0-9)
                          </span>
                          <span className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-700 font-bold flex items-center gap-1.5' : 'text-slate-500 flex items-center gap-1.5'}>
                            <CheckCircle2 size={13} className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-600' : 'text-slate-400'} />
                            At least one special character
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isResetting || !newPassword || !confirmPassword}
                        className="recovery-btn-primary w-full h-12 text-sm mt-2"
                      >
                        {isResetting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Updating Password...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={18} />
                            Confirm & Save New Password
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Card Footer */}
                  <div className="recovery-flow-footer">
                    <button
                      type="button"
                      onClick={() => handleModeChange('login')}
                      className="recovery-btn-secondary"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </div>
              )}

              {(authMode === 'login' || authMode === 'register') && (
                <>

                  {/* =================================================
                  STUDENT
              ================================================= */}

                  {activeRole === 'student' && (
                    <form
                      onSubmit={
                        handleStudentSubmit
                      }
                    >
                      {authMode === 'login' ? (
                        <>
                          <div className="auth-input-group">

                            <label className="auth-input-label">
                              Email Address or Registration Number
                            </label>

                            <div className="auth-input-box">

                              <Mail
                                size={18}
                                className="auth-input-icon"
                              />

                              <input
                                type="text"
                                required
                                value={
                                  studentRegNo
                                }
                                onChange={(e) =>
                                  setStudentRegNo(
                                    e.target.value
                                  )
                                }
                                placeholder="student@example.com or 241000110549"
                                className="auth-input-field"
                              />

                            </div>
                          </div>

                          <div className="auth-input-group">
                            <div className="flex items-center justify-between mb-1">
                              <label className="auth-input-label mb-0">
                                Password
                              </label>
                              <button
                                type="button"
                                onClick={() => handleModeChange('forgot-password')}
                                className="text-xs text-[#18577F] hover:text-[#0A1F2D] font-bold cursor-pointer"
                              >
                                Forgot Password?
                              </button>
                            </div>

                            <div className="auth-input-box">

                              <input
                                type={
                                  showPassword
                                    ? 'text'
                                    : 'password'
                                }
                                required
                                value={
                                  studentPassword
                                }
                                onChange={(e) =>
                                  setStudentPassword(
                                    e.target.value
                                  )
                                }
                                placeholder="••••••••"
                                className="auth-input-field"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setShowPassword(
                                    (value) =>
                                      !value
                                  )
                                }
                                className="text-[#5F96BE] hover:text-[#18577F]"
                              >
                                {showPassword ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>

                            </div>
                          </div>

                          <button
                            type="submit"
                            className="auth-submit-btn mt-3 mb-1"
                            disabled={
                              isSubmitting
                            }
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2
                                  size={18}
                                  className="animate-spin"
                                />
                                Authenticating…
                              </>
                            ) : (
                              <>
                                Sign In as Student
                                <ArrowRight
                                  size={18}
                                />
                              </>
                            )}
                          </button>

                          <div className="relative my-6 flex items-center justify-center">
                            <div className="border-t border-[#D0E4F5] w-full" />
                            <span className="bg-white px-3.5 text-[11px] text-[#5F96BE] uppercase font-bold tracking-wider shrink-0">
                              or continue with
                            </span>
                            <div className="border-t border-[#D0E4F5] w-full" />
                          </div>

                          <div className="w-full flex flex-col items-center justify-center min-h-[46px] pt-1">
                            <div id="google-btn-student" className="w-full flex justify-center" />
                            {!googleButtonRendered && (
                              <button
                                type="button"
                                onClick={handleGoogleSignInClick}
                                disabled={googleLoading || isSubmitting}
                                className="w-full h-11 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
                              >
                                {googleLoading ? (
                                  <Loader2 size={16} className="animate-spin text-[#18577F]" />
                                ) : (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                    <path
                                      fill="#4285F4"
                                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                      fill="#34A853"
                                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                      fill="#FBBC05"
                                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                      fill="#EA4335"
                                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                  </svg>
                                )}
                                <span>Sign In with Google</span>
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="auth-form-scrollable">

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Full Name
                              </label>

                              <div className="auth-input-box">

                                <input
                                  type="text"
                                  required
                                  value={regName}
                                  onChange={(e) =>
                                    setRegName(
                                      e.target.value
                                    )
                                  }
                                  placeholder="Aravind Sharma"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Registration Number
                              </label>

                              <div className="auth-input-box">

                                <input
                                  type="text"
                                  required
                                  value={
                                    regRegistrationNumber
                                  }
                                  onChange={(e) =>
                                    setRegRegistrationNumber(
                                      e.target.value
                                    )
                                  }
                                  placeholder="241000110xxx"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Email Address
                              </label>

                              <div className="auth-input-box">

                                <Mail
                                  size={16}
                                  className="auth-input-icon"
                                />

                                <input
                                  type="email"
                                  required
                                  value={regEmail}
                                  onChange={(e) =>
                                    setRegEmail(
                                      e.target.value
                                    )
                                  }
                                  placeholder="user@univ.edu"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Mobile Number
                              </label>

                              <div className="auth-input-box">

                                <Phone
                                  size={16}
                                  className="auth-input-icon"
                                />

                                <input
                                  type="tel"
                                  required
                                  maxLength={10}
                                  value={regPhone}
                                  onChange={(e) => {
                                    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setRegPhone(clean);
                                    setCommonPhone(clean);
                                  }}
                                  placeholder="9876543210"
                                  className="auth-input-field font-mono"
                                />

                              </div>
                            </div>

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Password
                              </label>

                              <div className="auth-input-box">

                                <input
                                  type="password"
                                  required
                                  value={regPassword}
                                  onChange={(e) =>
                                    setRegPassword(
                                      e.target.value
                                    )
                                  }
                                  placeholder="••••••••"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Department / Branch
                              </label>

                              <div className="auth-input-box">

                                <select
                                  value={regBranch}
                                  onChange={(e) =>
                                    setRegBranch(
                                      e.target.value as typeof regBranch
                                    )
                                  }
                                  className="auth-input-field"
                                >
                                  <option value="Computer Science">
                                    Computer Science
                                  </option>

                                  <option value="Information Technology">
                                    Information Technology
                                  </option>

                                  <option value="Electronics">
                                    Electronics
                                  </option>

                                  <option value="Mechanical">
                                    Mechanical
                                  </option>

                                  <option value="Electrical">
                                    Electrical
                                  </option>
                                </select>

                              </div>
                            </div>

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                CGPA (0 - 10)
                              </label>

                              <div className="auth-input-box">

                                <input
                                  type="number"
                                  step="0.01"
                                  required
                                  value={regCgpa}
                                  onChange={(e) =>
                                    setRegCgpa(
                                      e.target.value
                                    )
                                  }
                                  min="0"
                                  max="10"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                          </div>

                          <div className="auth-input-group mb-3">
                            <label className="auth-input-label">Year of Admission *</label>
                            <input type="number" required min="1950" max={new Date().getFullYear()}
                              value={regYearOfAdmission}
                              onChange={(e) => setRegYearOfAdmission(e.target.value)}
                              placeholder="e.g. 2024" className="auth-input-field" />
                          </div>

                          <div className="auth-input-group">

                            <label className="auth-input-label">
                              Technical Skills
                            </label>

                            <div className="auth-input-box">

                              <input
                                type="text"
                                value={regSkills}
                                onChange={(e) =>
                                  setRegSkills(
                                    e.target.value
                                  )
                                }
                                placeholder="React, TypeScript, Python, SQL"
                                className="auth-input-field"
                              />

                            </div>
                          </div>



                          <div className="auth-input-group">

                            <label className="auth-input-label">
                              Public Resume URL *
                            </label>

                            <div className="auth-input-box">

                              <input
                                type="url"
                                required
                                value={regResume}
                                onChange={(e) => setRegResume(e.target.value)}
                                placeholder="https://drive.google.com/..."
                                className="auth-input-field"
                              />

                            </div>
                          </div>

                          {renderCollegeAndAddressSection(false)}

                          <button
                            type="submit"
                            className="auth-submit-btn mt-4"
                            disabled={
                              isSubmitting
                            }
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2
                                  size={18}
                                  className="animate-spin"
                                />
                                Creating Account…
                              </>
                            ) : (
                              <>
                                Register Student Profile
                                <UserPlus
                                  size={18}
                                />
                              </>
                            )}
                          </button>

                        </div>
                      )}
                    </form>
                  )}

                  {/* =================================================
                  ALUMNI
              ================================================= */}

                  {activeRole === 'alumni' && (
                    <form
                      onSubmit={
                        handleAlumniSubmit
                      }
                    >

                      {authMode === 'login' ? (
                        <>

                          <div className="auth-input-group">

                            <label className="auth-input-label">
                              Alumni Email
                            </label>

                            <div className="auth-input-box">

                              <Mail
                                size={18}
                                className="auth-input-icon"
                              />

                              <input
                                type="email"
                                required
                                value={alumniEmail}
                                onChange={(e) =>
                                  setAlumniEmail(
                                    e.target.value
                                  )
                                }
                                placeholder="alumni@example.com"
                                className="auth-input-field"
                              />

                            </div>
                          </div>

                          <div className="auth-input-group">
                            <div className="flex items-center justify-between mb-1">
                              <label className="auth-input-label mb-0">
                                Password
                              </label>
                              <button
                                type="button"
                                onClick={() => handleModeChange('forgot-password')}
                                className="text-xs text-[#18577F] hover:text-[#0A1F2D] font-bold cursor-pointer"
                              >
                                Forgot Password?
                              </button>
                            </div>

                            <div className="auth-input-box">

                              <input
                                type={
                                  showPassword
                                    ? 'text'
                                    : 'password'
                                }
                                required
                                value={
                                  alumniPassword
                                }
                                onChange={(e) =>
                                  setAlumniPassword(
                                    e.target.value
                                  )
                                }
                                placeholder="••••••••"
                                className="auth-input-field"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setShowPassword(
                                    (value) =>
                                      !value
                                  )
                                }
                                className="text-[#5F96BE] hover:text-[#18577F]"
                              >
                                {showPassword ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>

                            </div>
                          </div>

                          <button
                            type="submit"
                            className="auth-submit-btn mt-3 mb-1"
                            disabled={
                              isSubmitting
                            }
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2
                                  size={18}
                                  className="animate-spin"
                                />
                                Signing In…
                              </>
                            ) : (
                              <>
                                Sign In as Alumni
                                <ArrowRight
                                  size={18}
                                />
                              </>
                            )}
                          </button>

                          <div className="relative my-6 flex items-center justify-center">
                            <div className="border-t border-[#D0E4F5] w-full" />
                            <span className="bg-white px-3.5 text-[11px] text-[#5F96BE] uppercase font-bold tracking-wider shrink-0">
                              or continue with
                            </span>
                            <div className="border-t border-[#D0E4F5] w-full" />
                          </div>

                          <div className="w-full flex flex-col items-center justify-center min-h-[46px] pt-1">
                            <div id="google-btn-alumni" className="w-full flex justify-center" />
                            {!googleButtonRendered && (
                              <button
                                type="button"
                                onClick={handleGoogleSignInClick}
                                disabled={googleLoading || isSubmitting}
                                className="w-full h-11 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
                              >
                                {googleLoading ? (
                                  <Loader2 size={16} className="animate-spin text-[#18577F]" />
                                ) : (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                    <path
                                      fill="#4285F4"
                                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                      fill="#34A853"
                                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                      fill="#FBBC05"
                                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                      fill="#EA4335"
                                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                  </svg>
                                )}
                                <span>Sign In with Google</span>
                              </button>
                            )}
                          </div>

                        </>
                      ) : (
                        <div className="auth-form-scrollable">

                          {/* Name + Email */}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Full Name *
                              </label>

                              <div className="auth-input-box">

                                <input
                                  type="text"
                                  required
                                  value={
                                    alumniName
                                  }
                                  onChange={(e) =>
                                    setAlumniName(
                                      e.target.value
                                    )
                                  }
                                  placeholder="Rahul Sharma"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Email Address *
                              </label>

                              <div className="auth-input-box">

                                <Mail
                                  size={16}
                                  className="auth-input-icon"
                                />

                                <input
                                  type="email"
                                  required
                                  value={
                                    alumniEmail
                                  }
                                  onChange={(e) =>
                                    setAlumniEmail(
                                      e.target.value
                                    )
                                  }
                                  placeholder="rahul@gmail.com"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                          </div>

                          <div className="auth-input-group mb-3">
                            <label className="auth-input-label">Existing Student Registration Number *</label>
                            <input type="text" inputMode="numeric" maxLength={12} required value={alumniStudentRegnNo}
                              onChange={(e) => setAlumniStudentRegnNo(e.target.value.replace(/\D/g, '').slice(0, 12))}
                              placeholder="12-digit registration number linked to your student record"
                              className="auth-input-field" />
                          </div>

                          {/* Password + Graduation Year */}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Password *
                              </label>

                              <div className="auth-input-box">

                                <input
                                  type={
                                    showPassword
                                      ? 'text'
                                      : 'password'
                                  }
                                  required
                                  value={
                                    alumniPassword
                                  }
                                  onChange={(e) =>
                                    setAlumniPassword(
                                      e.target.value
                                    )
                                  }
                                  placeholder="••••••••"
                                  className="auth-input-field"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPassword(
                                      (value) =>
                                        !value
                                    )
                                  }
                                  className="text-gray-400 hover:text-gray-200 transition-colors"
                                >
                                  {showPassword ? (
                                    <EyeOff size={16} />
                                  ) : (
                                    <Eye size={16} />
                                  )}
                                </button>

                              </div>
                            </div>

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Graduation Year *
                              </label>

                              <div className="auth-input-box">

                                <CalendarDays
                                  size={16}
                                  className="auth-input-icon"
                                />

                                <input
                                  type="number"
                                  required
                                  min="1950"
                                  max={
                                    new Date().getFullYear()
                                  }
                                  value={
                                    alumniGraduationYear
                                  }
                                  onChange={(e) =>
                                    setAlumniGraduationYear(
                                      e.target.value
                                    )
                                  }
                                  placeholder="2024"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                          </div>

                          {/* Company + Role */}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Current Company *
                              </label>

                              <div className="auth-input-box">

                                <Building2
                                  size={16}
                                  className="auth-input-icon"
                                />

                                <input
                                  type="text"
                                  required
                                  value={
                                    alumniCompany
                                  }
                                  onChange={(e) =>
                                    setAlumniCompany(
                                      e.target.value
                                    )
                                  }
                                  placeholder="Google"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Current Role *
                              </label>

                              <div className="auth-input-box">

                                <Briefcase
                                  size={16}
                                  className="auth-input-icon"
                                />

                                <input
                                  type="text"
                                  required
                                  value={
                                    alumniCurrentRole
                                  }
                                  onChange={(e) =>
                                    setAlumniCurrentRole(
                                      e.target.value
                                    )
                                  }
                                  placeholder="Software Engineer"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                          </div>

                          {/* Department */}

                          <div className="auth-input-group">

                            <label className="auth-input-label">
                              Department *
                            </label>

                            <div className="auth-input-box">

                              <select
                                required
                                value={
                                  alumniDepartment
                                }
                                onChange={(e) =>
                                  setAlumniDepartment(
                                    e.target.value as typeof alumniDepartment
                                  )
                                }
                                className="auth-input-field"
                              >

                                <option value="Computer Science">
                                  Computer Science
                                </option>

                                <option value="Information Technology">
                                  Information Technology
                                </option>

                                <option value="Electronics">
                                  Electronics
                                </option>

                                <option value="Mechanical">
                                  Mechanical
                                </option>

                                <option value="Electrical">
                                  Electrical
                                </option>

                              </select>

                            </div>
                          </div>

                          {/* LinkedIn */}

                          <div className="auth-input-group">

                            <label className="auth-input-label">
                              LinkedIn Profile
                            </label>

                            <div className="auth-input-box">

                              <ExternalLink
                                size={16}
                                className="auth-input-icon"
                              />

                              <input
                                type="url"
                                value={
                                  alumniLinkedIn
                                }
                                onChange={(e) =>
                                  setAlumniLinkedIn(
                                    e.target.value
                                  )
                                }
                                placeholder="https://linkedin.com/in/your-profile"
                                className="auth-input-field"
                              />

                            </div>
                          </div>

                          {renderCollegeAndAddressSection(true)}

                          <button
                            type="submit"
                            className="auth-submit-btn mt-4"
                            disabled={
                              isSubmitting
                            }
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2
                                  size={18}
                                  className="animate-spin"
                                />
                                Submitting…
                              </>
                            ) : (
                              <>
                                Submit Alumni Registration
                                <UserPlus
                                  size={18}
                                />
                              </>
                            )}
                          </button>

                        </div>
                      )}

                    </form>
                  )}

                  {/* =================================================
                  RECRUITER
              ================================================= */}

                  {activeRole === 'recruiter' && (
                    <form
                      onSubmit={
                        handleRecruiterSubmit
                      }
                    >

                      {authMode === 'login' ? (
                        <>
                          <div className="auth-input-group">

                            <label className="auth-input-label">
                              Work Email Address
                            </label>

                            <div className="auth-input-box">

                              <Mail
                                size={18}
                                className="auth-input-icon"
                              />

                              <input
                                type="email"
                                required
                                value={
                                  recruiterEmail
                                }
                                onChange={(e) =>
                                  setRecruiterEmail(
                                    e.target.value
                                  )
                                }
                                placeholder="you@company.com"
                                className="auth-input-field"
                              />

                            </div>
                          </div>

                          <div className="auth-input-group">
                            <div className="flex items-center justify-between mb-1">
                              <label className="auth-input-label mb-0">
                                Password
                              </label>
                              <button
                                type="button"
                                onClick={() => handleModeChange('forgot-password')}
                                className="text-xs text-[#18577F] hover:text-[#0A1F2D] font-bold cursor-pointer"
                              >
                                Forgot Password?
                              </button>
                            </div>

                            <div className="auth-input-box">

                              <input
                                type={
                                  showPassword
                                    ? 'text'
                                    : 'password'
                                }
                                required
                                value={
                                  recruiterPassword
                                }
                                onChange={(e) =>
                                  setRecruiterPassword(
                                    e.target.value
                                  )
                                }
                                placeholder="••••••••"
                                className="auth-input-field"
                              />

                              <button
                                type="button"
                                onClick={() =>
                                  setShowPassword(
                                    (value) =>
                                      !value
                                  )
                                }
                                className="text-[#5F96BE] hover:text-[#18577F]"
                              >
                                {showPassword ? (
                                  <EyeOff size={16} />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>

                            </div>
                          </div>

                          <div className="auth-alumni-info-card my-3">
                            <div className="flex items-start gap-3">
                              <Clock3
                                size={20}
                                className="shrink-0 text-amber-500"
                              />
                              <div>
                                <strong>
                                  TPO Approval Required
                                </strong>
                                <p>
                                  Recruiter accounts must be approved by the TPO before you can sign in.
                                </p>
                              </div>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="auth-submit-btn mt-3 mb-1"
                            disabled={
                              isSubmitting
                            }
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2
                                  size={18}
                                  className="animate-spin"
                                />
                                Authenticating…
                              </>
                            ) : (
                              <>
                                Sign In as Recruiter
                                <ArrowRight
                                  size={18}
                                />
                              </>
                            )}
                          </button>

                          <div className="relative my-6 flex items-center justify-center">
                            <div className="border-t border-[#D0E4F5] w-full" />
                            <span className="bg-white px-3.5 text-[11px] text-[#5F96BE] uppercase font-bold tracking-wider shrink-0">
                              or continue with
                            </span>
                            <div className="border-t border-[#D0E4F5] w-full" />
                          </div>

                          <div className="w-full flex flex-col items-center justify-center min-h-[46px] pt-1">
                            <div id="google-btn-recruiter" className="w-full flex justify-center" />
                            {!googleButtonRendered && (
                              <button
                                type="button"
                                onClick={handleGoogleSignInClick}
                                disabled={googleLoading || isSubmitting}
                                className="w-full h-11 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
                              >
                                {googleLoading ? (
                                  <Loader2 size={16} className="animate-spin text-[#18577F]" />
                                ) : (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                    <path
                                      fill="#4285F4"
                                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                      fill="#34A853"
                                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                      fill="#FBBC05"
                                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                      fill="#EA4335"
                                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                  </svg>
                                )}
                                <span>Sign In with Google</span>
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="auth-form-scrollable">

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Full Name
                              </label>

                              <div className="auth-input-box">

                                <input
                                  type="text"
                                  required
                                  value={recName}
                                  onChange={(e) =>
                                    setRecName(
                                      e.target.value
                                    )
                                  }
                                  placeholder="Ananya Iyer"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Company Name
                              </label>

                              <div className="auth-input-box">

                                <Building2
                                  size={16}
                                  className="auth-input-icon"
                                />

                                <input
                                  type="text"
                                  required
                                  value={
                                    recCompany
                                  }
                                  onChange={(e) =>
                                    setRecCompany(
                                      e.target.value
                                    )
                                  }
                                  placeholder="Google / Microsoft"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Work Email
                              </label>

                              <div className="auth-input-box">

                                <Mail
                                  size={16}
                                  className="auth-input-icon"
                                />

                                <input
                                  type="email"
                                  required
                                  value={
                                    recEmail
                                  }
                                  onChange={(e) =>
                                    setRecEmail(
                                      e.target.value
                                    )
                                  }
                                  placeholder="you@company.com"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                            <div className="auth-input-group">

                              <label className="auth-input-label">
                                Password
                              </label>

                              <div className="auth-input-box">

                                <input
                                  type="password"
                                  required
                                  value={
                                    recPassword
                                  }
                                  onChange={(e) =>
                                    setRecPassword(
                                      e.target.value
                                    )
                                  }
                                  placeholder="••••••••"
                                  className="auth-input-field"
                                />

                              </div>
                            </div>

                          </div>

                          <div className="auth-input-group">

                            <label className="auth-input-label">
                              Designation
                            </label>

                            <div className="auth-input-box">

                              <input
                                type="text"
                                value={
                                  recDesignation
                                }
                                onChange={(e) =>
                                  setRecDesignation(
                                    e.target.value
                                  )
                                }
                                placeholder="Technical Recruiter / HR Lead"
                                className="auth-input-field"
                              />

                            </div>
                          </div>

                          <div className="auth-alumni-info-card my-3">
                            <div className="flex items-start gap-3">
                              <CheckCircle2
                                size={20}
                                className="shrink-0 text-blue-500"
                              />
                              <div>
                                <strong>
                                  Recruiter Registration
                                </strong>
                                <p>
                                  Your company must already exist in PlaceD. Your registration will be submitted to the TPO for approval. You will only be able to access the Recruiter Portal after your account is approved by TPO.
                                </p>
                              </div>
                            </div>
                          </div>

                          {renderCollegeAndAddressSection(true)}

                          <button
                            type="submit"
                            className="auth-submit-btn mt-4"
                            disabled={
                              isSubmitting
                            }
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2
                                  size={18}
                                  className="animate-spin"
                                />
                                Creating Account…
                              </>
                            ) : (
                              <>
                                Register Company Recruiter
                                <UserPlus
                                  size={18}
                                />
                              </>
                            )}
                          </button>

                        </div>
                      )}

                    </form>
                  )}

                  {/* =================================================
                  ADMIN
              ================================================= */}

                  {activeRole === 'admin' && (
                    <form onSubmit={handleAdminSubmit}>
                      {authMode === 'register' ? (
                        <div className="auth-form-scrollable">
                          <div className="auth-input-group">
                            <label className="auth-input-label">Full Name</label>
                            <div className="auth-input-box">
                              <UserPlus size={18} className="auth-input-icon" />
                              <input
                                type="text"
                                required
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                placeholder="Dr. Placement Officer"
                                className="auth-input-field"
                              />
                            </div>
                          </div>

                          <div className="auth-input-group">
                            <label className="auth-input-label">Admin Email Address</label>
                            <div className="auth-input-box">
                              <Mail size={18} className="auth-input-icon" />
                              <input
                                type="email"
                                required
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                placeholder="tpo@university.edu"
                                className="auth-input-field"
                              />
                            </div>
                          </div>

                          <div className="auth-input-group">
                            <label className="auth-input-label">Password</label>
                            <div className="auth-input-box">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                placeholder="••••••••"
                                className="auth-input-field"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="text-[#5F96BE] hover:text-[#18577F]"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          {renderCollegeAndAddressSection(true)}

                          <button
                            type="submit"
                            className="auth-submit-btn mt-4"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                Registering...
                              </>
                            ) : (
                              <>
                                Register TPO Admin
                                <UserPlus size={18} />
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="auth-input-group">
                            <label className="auth-input-label">Admin Email Address</label>
                            <div className="auth-input-box">
                              <Mail size={18} className="auth-input-icon" />
                              <input
                                type="email"
                                required
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                placeholder="tpo@university.edu"
                                className="auth-input-field"
                              />
                            </div>
                          </div>

                          <div className="auth-input-group">
                            <div className="flex items-center justify-between mb-1">
                              <label className="auth-input-label mb-0">Admin Password</label>
                              <button
                                type="button"
                                onClick={() => handleModeChange('forgot-password')}
                                className="text-xs text-[#18577F] hover:text-[#0A1F2D] font-bold cursor-pointer"
                              >
                                Forgot Password?
                              </button>
                            </div>
                            <div className="auth-input-box">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                placeholder="••••••••"
                                className="auth-input-field"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="text-[#5F96BE] hover:text-[#18577F]"
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <button
                            type="submit"
                            className="auth-submit-btn mt-3 mb-1"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 size={18} className="animate-spin" />
                                Authenticating…
                              </>
                            ) : (
                              <>
                                Authenticate TPO Admin
                                <LogIn size={18} />
                              </>
                            )}
                          </button>

                          <div className="relative my-6 flex items-center justify-center">
                            <div className="border-t border-[#D0E4F5] w-full" />
                            <span className="bg-white px-3.5 text-[11px] text-[#5F96BE] uppercase font-bold tracking-wider shrink-0">
                              or continue with
                            </span>
                            <div className="border-t border-[#D0E4F5] w-full" />
                          </div>

                          <div className="w-full flex flex-col items-center justify-center min-h-[46px] pt-1">
                            <div id="google-btn-admin" className="w-full flex justify-center" />
                            {!googleButtonRendered && (
                              <button
                                type="button"
                                onClick={handleGoogleSignInClick}
                                disabled={googleLoading || isSubmitting}
                                className="w-full h-11 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
                              >
                                {googleLoading ? (
                                  <Loader2 size={16} className="animate-spin text-[#18577F]" />
                                ) : (
                                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                    <path
                                      fill="#4285F4"
                                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                      fill="#34A853"
                                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                      fill="#FBBC05"
                                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                    />
                                    <path
                                      fill="#EA4335"
                                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                    />
                                  </svg>
                                )}
                                <span>Sign In with Google</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </form>
                  )}
                </>
              )}

              {showGoogleSignupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in overflow-y-auto">
                  <div className="recovery-flow-card max-w-2xl w-full my-auto shadow-2xl overflow-hidden border border-slate-200">
                    {/* Card Header (rp-modal-header / recovery-flow-header style) */}
                    <div className="recovery-flow-header">
                      <div className="recovery-header-left">
                        <div
                          className="recovery-header-icon-badge"
                          style={{ background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)' }}
                        >
                          <Sparkles size={24} />
                        </div>
                        <div className="recovery-header-text">
                          <h3 className="recovery-flow-title">
                            Complete Your PlaceD Registration
                          </h3>
                          <p className="recovery-flow-subtitle">
                            Google verification successful. Please provide your institutional records below.
                          </p>
                        </div>
                      </div>

                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black tracking-wide shrink-0 hidden sm:inline-flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 size={13} className="text-emerald-600" /> Google Verified
                      </span>
                    </div>

                    <form onSubmit={handleGoogleSignupSubmit} className="flex flex-col m-0 p-0">
                      {/* Card Body (rp-modal-body / recovery-flow-body style) */}
                      <div className="recovery-flow-body max-h-[72vh] overflow-y-auto">
                        {googleError && (
                          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs sm:text-sm text-rose-800 flex items-start gap-3 font-semibold shadow-2xs">
                            <AlertCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
                            <span>{googleError}</span>
                          </div>
                        )}

                        {/* Stage Card 1: Verified Identity & Contact Details (recovery-stage-card-active style) */}
                        <div className="recovery-stage-card recovery-stage-card-active">
                          <div className="flex items-center justify-between gap-3">
                            <div className="recovery-stage-number-badge bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-100">
                              1
                            </div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                              <Mail size={14} className="text-blue-600" /> Verified Identity &amp; Contact
                            </span>
                          </div>

                          <div className="flex flex-col gap-3.5 pt-1">
                            {/* Verified Email Banner */}
                            <div className="flex flex-col gap-1.5">
                              <label className="recovery-field-label">
                                <Mail size={13} className="text-blue-600" />
                                Verified Google Account Email
                              </label>
                              <div className="recovery-input-wrapper bg-slate-50 border-slate-200 cursor-not-allowed">
                                <Mail size={18} className="text-slate-400 shrink-0" />
                                <input
                                  type="email"
                                  disabled
                                  value={googleEmail}
                                  className="recovery-input-field text-slate-500 cursor-not-allowed"
                                />
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                                  <CheckCircle2 size={11} className="text-emerald-600" /> Verified
                                </span>
                              </div>
                            </div>

                            {/* First & Last Name */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1.5">
                                <label className="recovery-field-label">First Name</label>
                                <div className="recovery-input-wrapper">
                                  <input
                                    type="text"
                                    required
                                    value={googleFirstName}
                                    onChange={(e) => setGoogleFirstName(e.target.value)}
                                    placeholder="John"
                                    className="recovery-input-field"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="recovery-field-label">Last Name</label>
                                <div className="recovery-input-wrapper">
                                  <input
                                    type="text"
                                    required
                                    value={googleLastName}
                                    onChange={(e) => setGoogleLastName(e.target.value)}
                                    placeholder="Doe"
                                    className="recovery-input-field"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Mobile Phone & Account Role */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex flex-col gap-1.5">
                                <label className="recovery-field-label">
                                  <Phone size={13} className="text-blue-600" />
                                  Mobile Phone
                                </label>
                                <div className="recovery-input-wrapper font-mono">
                                  <Phone size={16} className="text-slate-400 shrink-0" />
                                  <input
                                    type="tel"
                                    required
                                    maxLength={15}
                                    value={googlePhone}
                                    onChange={(e) => setGooglePhone(e.target.value.replace(/\D/g, '').slice(0, 15))}
                                    placeholder="9876543210"
                                    className="recovery-input-field font-mono"
                                  />
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="recovery-field-label">Account Role</label>
                                <div className="recovery-input-wrapper">
                                  <select
                                    value={googleRole}
                                    onChange={(e) => setGoogleRole(e.target.value as any)}
                                    className="recovery-input-field cursor-pointer bg-transparent"
                                  >
                                    <option value="STUDENT">Student</option>
                                    <option value="RECRUITER">Recruiter</option>
                                    <option value="ALUMNI">Alumni</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* University College */}
                            <div className="flex flex-col gap-1.5">
                              <label className="recovery-field-label">
                                <Building2 size={13} className="text-blue-600" />
                                University College
                              </label>
                              <div className="recovery-input-wrapper">
                                <select
                                  value={googleCollegeId}
                                  onChange={(e) => setGoogleCollegeId(e.target.value)}
                                  className="recovery-input-field cursor-pointer bg-transparent"
                                >
                                  {availableColleges.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Stage Card 2: Role-Specific Details (recovery-stage-card-upcoming style) */}
                        <div className="recovery-stage-card recovery-stage-card-upcoming">
                          <div className="flex items-center justify-between gap-3">
                            <div className="recovery-stage-number-badge bg-slate-800 text-white shadow-sm ring-4 ring-slate-100">
                              2
                            </div>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                              {googleRole === 'STUDENT' && (
                                <>
                                  <GraduationCap size={14} className="text-indigo-600" /> Student Academic Profile
                                </>
                              )}
                              {googleRole === 'RECRUITER' && (
                                <>
                                  <Building2 size={14} className="text-indigo-600" /> Recruiter Company Profile
                                </>
                              )}
                              {googleRole === 'ALUMNI' && (
                                <>
                                  <Award size={14} className="text-indigo-600" /> Alumni Verification Profile
                                </>
                              )}
                            </span>
                          </div>

                          <div className="flex flex-col gap-3.5 pt-1">
                            {/* STUDENT DETAILS */}
                            {googleRole === 'STUDENT' && (
                              <>
                                <div className="flex flex-col gap-1.5">
                                  <label className="recovery-field-label">
                                    <GraduationCap size={13} className="text-indigo-600" />
                                    MAKAUT Registration Number (12 Digits)
                                  </label>
                                  <div className="recovery-input-wrapper font-mono">
                                    <input
                                      type="text"
                                      required
                                      maxLength={12}
                                      value={googleStudentRegNo}
                                      onChange={(e) => setGoogleStudentRegNo(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                      placeholder="210123456789"
                                      className="recovery-input-field font-mono"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1.5">
                                    <label className="recovery-field-label">Department / Branch</label>
                                    <div className="recovery-input-wrapper">
                                      <select
                                        value={googleStudentDept}
                                        onChange={(e) => setGoogleStudentDept(e.target.value)}
                                        className="recovery-input-field cursor-pointer bg-transparent"
                                      >
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Information Technology">Information Technology</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Mechanical">Mechanical</option>
                                        <option value="Electrical">Electrical</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1.5">
                                    <label className="recovery-field-label">Year of Admission</label>
                                    <div className="recovery-input-wrapper font-mono">
                                      <input
                                        type="text"
                                        required
                                        maxLength={4}
                                        value={googleStudentYear}
                                        onChange={(e) => setGoogleStudentYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="2024"
                                        className="recovery-input-field font-mono"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* RECRUITER DETAILS */}
                            {googleRole === 'RECRUITER' && (
                              <>
                                <div className="flex flex-col gap-1.5">
                                  <label className="recovery-field-label">
                                    <Building2 size={13} className="text-indigo-600" />
                                    Affiliated Hiring Company
                                  </label>
                                  <div className="recovery-input-wrapper">
                                    <select
                                      value={googleCompanyId}
                                      onChange={(e) => setGoogleCompanyId(e.target.value)}
                                      className="recovery-input-field cursor-pointer bg-transparent"
                                    >
                                      {availableCompanies.map((comp) => (
                                        <option key={comp.id} value={comp.id}>
                                          {comp.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1.5">
                                    <label className="recovery-field-label">Professional Designation</label>
                                    <div className="recovery-input-wrapper">
                                      <input
                                        type="text"
                                        required
                                        value={googleDesignation}
                                        onChange={(e) => setGoogleDesignation(e.target.value)}
                                        placeholder="Talent Acquisition Lead"
                                        className="recovery-input-field"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1.5">
                                    <label className="recovery-field-label">Industry Domain</label>
                                    <div className="recovery-input-wrapper">
                                      <input
                                        type="text"
                                        value={googleIndustry}
                                        onChange={(e) => setGoogleIndustry(e.target.value)}
                                        placeholder="Information Technology"
                                        className="recovery-input-field"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            {/* ALUMNI DETAILS */}
                            {googleRole === 'ALUMNI' && (
                              <>
                                <div className="flex flex-col gap-1.5">
                                  <label className="recovery-field-label">
                                    <Award size={13} className="text-indigo-600" />
                                    Past MAKAUT Registration Number (12 Digits)
                                  </label>
                                  <div className="recovery-input-wrapper font-mono">
                                    <input
                                      type="text"
                                      required
                                      maxLength={12}
                                      value={googleAlumniRegNo}
                                      onChange={(e) => setGoogleAlumniRegNo(e.target.value.replace(/\D/g, '').slice(0, 12))}
                                      placeholder="190123456789"
                                      className="recovery-input-field font-mono"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="flex flex-col gap-1.5">
                                    <label className="recovery-field-label">Current Work Location</label>
                                    <div className="recovery-input-wrapper">
                                      <input
                                        type="text"
                                        value={googleLocation}
                                        onChange={(e) => setGoogleLocation(e.target.value)}
                                        placeholder="Bengaluru, India"
                                        className="recovery-input-field"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1.5">
                                    <label className="recovery-field-label">Professional Bio / Title</label>
                                    <div className="recovery-input-wrapper">
                                      <input
                                        type="text"
                                        value={googleBio}
                                        onChange={(e) => setGoogleBio(e.target.value)}
                                        placeholder="Senior Software Engineer"
                                        className="recovery-input-field"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Important Note Callout (Matching instruction card) */}
                        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 text-slate-700 flex items-start gap-4">
                          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertCircle size={18} />
                          </div>
                          <div className="flex flex-col gap-1 text-xs sm:text-sm leading-relaxed text-slate-600">
                            <strong className="font-extrabold text-blue-700 block text-xs sm:text-sm">
                              Important Note on Registration Data:
                            </strong>
                            <span>
                              Your university roll number and department will be linked to institutional placement eligibility criteria, verified applications, and recruitment drives.
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer (recovery-flow-footer style) */}
                      <div className="recovery-flow-footer">
                        <button
                          type="button"
                          onClick={() => setShowGoogleSignupModal(false)}
                          className="recovery-btn-secondary"
                        >
                          ← Cancel
                        </button>

                        <button
                          type="submit"
                          disabled={googleLoading}
                          className="recovery-btn-primary"
                        >
                          {googleLoading ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Complete PlaceD Registration →
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};                                                      