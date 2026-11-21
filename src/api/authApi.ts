import request from "./client";
import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  GoogleAuthResponse,
  GoogleSignupRequest,
  ResetPasswordRequest,
  RecoveryEmailRequest,
} from "./types";

export const authApi = {
  login: (data: LoginRequest) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  loginStudent: (data: { identifier: string; password: string }) =>
    request<LoginResponse>("/auth/login/students", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  refresh: (data: RefreshRequest) =>
    request<LoginResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: (data: RefreshRequest) =>
    request<string>("/auth/logout", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  forgotPassword: (email: string) =>
    request<string>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    }),

  verifyResetOtp: (email: string, otp: string) =>
    request<{ token: string }>("/auth/verify-reset-otp", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
    }),

  resetPassword: (data: ResetPasswordRequest) =>
    request<string>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  googleSignIn: (idToken: string) =>
    request<GoogleAuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    }),

  googleSignUp: (data: GoogleSignupRequest) =>
    request<GoogleAuthResponse>("/auth/google/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  addRecoveryEmail: (data: RecoveryEmailRequest) =>
    request<string>("/user/recovery-email", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyRecoveryEmail: (otp: string) =>
    request<string>("/user/recovery-email/verify", {
      method: "POST",
      body: JSON.stringify({ otp: otp.trim() }),
    }),
};
