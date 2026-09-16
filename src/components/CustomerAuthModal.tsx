// src/components/CustomerAuthModal.tsx
// Modal for customer auth with two modes:
//   Sign In:  phone → OTP → login  (404 = offer to create account)
//   Register: name + email + phone → OTP → register → auto-login

import { useState, useEffect, useCallback, useRef } from "react";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { ClipLoader } from "react-spinners";
import OtpInput from "react-otp-input";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";

// ── Brand tokens ─────────────────────────────────────────────────────────────
const DEEP_GREEN = "#34433d";

// ── MSG91 Widget Configuration (Fetched dynamically from backend at runtime) ───
let cachedMsg91Config: { widgetId: string; tokenAuth: string } | null = null;
let pendingConfigPromise: Promise<{ widgetId: string; tokenAuth: string }> | null = null;

const fetchMsg91Config = async (): Promise<{ widgetId: string; tokenAuth: string }> => {
  if (cachedMsg91Config && cachedMsg91Config.widgetId && cachedMsg91Config.tokenAuth) {
    return cachedMsg91Config;
  }
  if (pendingConfigPromise) {
    return pendingConfigPromise;
  }
  pendingConfigPromise = api
    .get("/auth/mobile/widget-config")
    .then((res) => {
      cachedMsg91Config = {
        widgetId: res.data?.widgetId || (import.meta.env.VITE_MSG91_WIDGET_ID as string) || "",
        tokenAuth: res.data?.tokenAuth || (import.meta.env.VITE_MSG91_TOKEN_AUTH as string) || "",
      };
      return cachedMsg91Config;
    })
    .catch((err) => {
      console.warn("Could not fetch MSG91 config from backend, using env fallback", err);
      return {
        widgetId: (import.meta.env.VITE_MSG91_WIDGET_ID as string) || "",
        tokenAuth: (import.meta.env.VITE_MSG91_TOKEN_AUTH as string) || "",
      };
    })
    .finally(() => {
      pendingConfigPromise = null;
    });

  return pendingConfigPromise;
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Mode = "sign-in" | "register";
type Step = "form" | "otp";

// ── OTP input style ───────────────────────────────────────────────────────────
const OTP_CLASS =
  "!w-14 !h-14 md:!w-16 md:!h-16 border-2 border-slate-200 rounded-2xl text-center " +
  "text-2xl font-black text-slate-900 bg-white focus:outline-none " +
  "focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 shadow-xs transition-all duration-200";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CustomerAuthModal({ open, onClose }: Props) {
  const { checkAuthStatus } = useAuth();
  useBodyScrollLock(open);

  const [mode, setMode] = useState<Mode>("sign-in");
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);

  // Form fields
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Inline phone validation error
  const [phoneError, setPhoneError] = useState("");

  // Blocked state — set when the entered phone belongs to an admin account
  const [adminBlocked, setAdminBlocked] = useState(false);

  // OTP
  const [otp, setOtp] = useState("");
  const [reqId, setReqId] = useState("");
  const [timer, setTimer] = useState(0);

  // Refs for Enter key focus navigation
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Pre-fetch MSG91 configuration from backend on modal open
  useEffect(() => {
    if (open) {
      fetchMsg91Config();
    }
  }, [open]);

  // ── Timer countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const formatTimer = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Reset state ────────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep("form");
    setPhone("");
    setName("");
    setEmail("");
    setOtp("");
    setReqId("");
    setTimer(0);
    setPhoneError("");
    setAdminBlocked(false);
  }, []);

  const handleClose = () => { reset(); onClose(); };

  const switchMode = (m: Mode) => { reset(); setMode(m); };

  // ── Phone validation helper ─────────────────────────────────────────────────
  const validatePhone = (value: string): boolean => {
    if (value.trim().length === 0) {
      setPhoneError("Mobile number is required");
      return false;
    }
    if (value.trim().length !== 10) {
      setPhoneError("Mobile number must be exactly 10 digits");
      return false;
    }
    if (!/^[6-9][0-9]{9}$/.test(value.trim())) {
      setPhoneError("Enter a valid Indian mobile number (starts with 6–9)");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
    // Clear error live once user has a valid 10-digit number
    if (phoneError) {
      if (digits.length === 10 && /^[6-9][0-9]{9}$/.test(digits)) {
        setPhoneError("");
      } else if (digits.length < 10) {
        setPhoneError("");
      }
    }
  };

  // ── MSG91 browser call ─────────────────────────────────────────────────────
  const callMsg91 = async (endpoint: string, body: Record<string, unknown>) => {
    const config = await fetchMsg91Config();
    const r = await fetch(`https://control.msg91.com/api/v5/widget/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenAuth: config.tokenAuth, widgetId: config.widgetId, ...body }),
    });
    const text = await r.text();
    try { return JSON.parse(text) as { type: string; message?: string; [k: string]: unknown }; }
    catch { return { type: "error", message: text }; }
  };

  // ── Step 1: Validate form + send OTP ──────────────────────────────────────
  const handleSendOtp = async () => {
    if (!validatePhone(phone)) return;
    if (mode === "register") {
      if (!name.trim() || name.trim().length < 2) {
        toast.error("Enter your full name (at least 2 characters)", { id: "name-invalid" });
        return;
      }
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        toast.error("Enter a valid email address", { id: "email-invalid" });
        return;
      }
    }
    try {
      setLoading(true);

      // For sign-in: verify the phone exists in the DB BEFORE wasting an OTP
      if (mode === "sign-in") {
        try {
          await api.post("/auth/mobile/check-phone", { phone: phone.trim() });
        } catch (err: unknown) {
          const e = err as { response?: { data?: { message?: string; code?: string } } };
          const code = e?.response?.data?.code;
          if (code === "ADMIN_ROLE") {
            // Admin/superadmin accounts must use the Admin Portal — block silently
            setAdminBlocked(true);
          } else if (code === "NO_ACCOUNT") {
            toast.error("No account found with this number. Please create an account.", {
              id: "no-account",
              duration: 4000,
            });
            const savedPhone = phone;
            reset();
            setMode("register");
            setPhone(savedPhone);
          } else {
            toast.error(e?.response?.data?.message ?? "Could not verify number. Try again.", { id: "check-fail" });
          }
          return;
        }
      }

      const data = await callMsg91("sendOtp", { identifier: `91${phone.trim()}` });
      if (data.type !== "success") {
        toast.error(data.message ?? "Failed to send OTP", { id: "otp-fail" });
        return;
      }
      // MSG91 sendOtp returns the reqId in data.message
      setReqId((data.message ?? "") as string);
      toast.success("OTP sent to your mobile!", { id: "otp-sent" });
      setOtp("");
      setStep("otp");
      setTimer(120); // 2 minutes resend cooldown
    } catch {
      toast.error("Failed to send OTP. Check your connection.", { id: "otp-fail" });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP → call backend login or register ───────────────────
  const handleVerifyOtp = async () => {
    if (otp.length !== 4) {
      toast.error("Enter the complete 4-digit OTP", { id: "otp-incomplete" });
      return;
    }
    try {
      setLoading(true);

      // Browser verifies OTP with MSG91 → gets JWT access token
      const verifyData = await callMsg91("verifyOtp", { reqId, otp });
      if (verifyData.type !== "success") {
        toast.error(verifyData.message ?? "Invalid or expired OTP", { id: "otp-verify-fail" });
        return;
      }
      const accessToken = (verifyData.message ?? "") as string;
      if (!accessToken) {
        toast.error("Verification failed. Please try again.", { id: "otp-no-token" });
        return;
      }

      if (mode === "sign-in") {
        const res = await api.post("/auth/mobile/login", { phone: phone.trim(), accessToken });
        toast.success(res.data.message ?? "Welcome back!", { id: "login-ok" });
        await checkAuthStatus();
        handleClose();
      } else {
        const res = await api.post("/auth/mobile/register", {
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim(),
          accessToken,
        });
        toast.success(res.data.message ?? "Account created! Welcome.", { id: "register-ok" });
        await checkAuthStatus();
        handleClose();
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; code?: string } } };
      const msg = e?.response?.data?.message;
      const code = e?.response?.data?.code;

      if (code === "NO_ACCOUNT") {
        const savedPhone = phone;
        toast.error("No account found. Please create an account.", { id: "no-account", duration: 4000 });
        reset();
        setMode("register");
        setPhone(savedPhone);
      } else if (code === "DUPLICATE") {
        toast.error("Account already exists. Please sign in instead.", { id: "duplicate", duration: 4000 });
        const savedPhone = phone;
        reset();
        setMode("sign-in");
        setPhone(savedPhone);
      } else {
        toast.error(msg ?? "Something went wrong. Please try again.", { id: "otp-verify-fail" });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ─────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (timer > 0) return;
    try {
      setLoading(true);
      const data = await callMsg91("retryOtp", { reqId });
      if (data.type !== "success") {
        toast.error(data.message ?? "Failed to resend OTP", { id: "resend-fail" });
        return;
      }
      if (data.message) setReqId(data.message as string);
      toast.success("OTP resent!", { id: "otp-resent" });
      setOtp("");
      setTimer(120); // 2 minutes resend cooldown
    } catch {
      toast.error("Failed to resend OTP.", { id: "resend-fail" });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const title = step === "otp"
    ? "Verify OTP"
    : mode === "sign-in" ? "Sign In" : "Create Account";

  const subtitle = step === "otp"
    ? `Enter the 4-digit code sent to +91 ${phone}`
    : mode === "sign-in"
      ? "Enter your registered mobile number to proceed"
      : "Sign up with your details to start shopping";

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-[100]">
      <DialogBackdrop className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100/80 p-7 md:p-9 pt-14 md:pt-16 relative overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Top Decorative Subtle Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-200 z-10 cursor-pointer"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5" strokeWidth={2} />
          </button>

          {/* ── Admin account blocked screen ──────────────────────────────── */}
          {adminBlocked && (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shadow-inner">
                <ShieldExclamationIcon className="w-8 h-8 text-rose-500" strokeWidth={1.8} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
                  This mobile number belongs to an administrative profile.
                  Please log in through the primary <span className="font-bold text-slate-900">Admin Portal</span>.
                </p>
              </div>

              <div className="w-full rounded-2xl border border-rose-100 bg-rose-50/70 p-3.5 text-xs text-rose-700 flex items-start gap-2.5 text-left leading-snug">
                <ShieldExclamationIcon className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" strokeWidth={2} />
                <span>Superadmin & Admin accounts require email and password authentication on the secure portal.</span>
              </div>

              <button
                onClick={() => { setAdminBlocked(false); setPhone(""); }}
                className="w-full h-11 text-xs font-bold uppercase tracking-wider rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-2 mt-1"
              >
                <ArrowLeftIcon className="w-4 h-4" strokeWidth={2.2} />
                Try a different number
              </button>
            </div>
          )}

          {/* Mode toggle (only on form step, hidden when admin-blocked) */}
          {!adminBlocked && step === "form" && (
            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl mb-7 border border-slate-200/60 shadow-inner">
              <button
                onClick={() => switchMode("sign-in")}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer ${
                  mode === "sign-in"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode("register")}
                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer ${
                  mode === "register"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Header — hidden when admin-blocked */}
          {!adminBlocked && (
            <div className="text-center mb-6">
              
              <h2 className="text-2xl font-black tracking-tight text-slate-950">{title}</h2>
              <p className="text-xs font-medium text-slate-500 mt-1 max-w-xs mx-auto">{subtitle}</p>
            </div>
          )}

          {/* ── Form step ────────────────────────────────────────────────── */}
          {!adminBlocked && step === "form" && (
            <div className="flex flex-col gap-4">
              {/* Register: name + email */}
              {mode === "register" && (
                <>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" strokeWidth={2} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          emailRef.current?.focus();
                        }
                      }}
                      placeholder="Full name *"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all duration-200"
                      autoFocus
                    />
                  </div>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" strokeWidth={2} />
                    <input
                      ref={emailRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.toLowerCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          phoneRef.current?.focus();
                        }
                      }}
                      placeholder="Email address (optional)"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 transition-all duration-200"
                    />
                  </div>
                </>
              )}

              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <div className={`relative flex items-stretch border rounded-2xl overflow-hidden transition-all duration-200 ${
                  phoneError
                    ? "border-rose-400 focus-within:ring-4 focus-within:ring-rose-500/10 bg-rose-50/30"
                    : "border-slate-200 focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-900/10 bg-slate-50/50 focus-within:bg-white"
                }`}>
                  <div className="flex items-center gap-1.5 px-3.5 text-xs font-bold text-slate-700 bg-slate-100/80 border-r border-slate-200/80 select-none">
                    <PhoneIcon className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                    +91
                  </div>
                  <input
                    ref={phoneRef}
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={() => phone.length > 0 && validatePhone(phone)}
                    placeholder="Mobile number *"
                    className="flex-1 px-3.5 py-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendOtp();
                      }
                    }}
                    autoFocus={mode === "sign-in"}
                  />
                  {/* Live digit counter */}
                  {phone.length > 0 && (
                    <span className={`flex items-center pr-3.5 text-[11px] font-mono font-bold select-none gap-1 ${
                      phone.length === 10 ? "text-emerald-600" : "text-slate-400"
                    }`}>
                      {phone.length === 10 && <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />}
                      {phone.length}/10
                    </span>
                  )}
                </div>

                {/* Inline error message */}
                {phoneError && (
                  <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-0.5 pl-1 animate-fadeIn">
                    <ShieldExclamationIcon className="w-3.5 h-3.5 flex-shrink-0 text-rose-500" strokeWidth={2} />
                    {phoneError}
                  </p>
                )}
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full h-12 font-bold text-xs uppercase tracking-wider rounded-2xl text-white shadow-md hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 cursor-pointer flex items-center justify-center mt-2 bg-slate-900 hover:bg-slate-800"
              >
                {loading ? <ClipLoader color="white" size={18} /> : "Send OTP"}
              </button>
            </div>
          )}

          {/* ── OTP step ─────────────────────────────────────────────────── */}
          {!adminBlocked && step === "otp" && (
            <div className="flex flex-col gap-6 pt-1">
              <OtpInput
                value={otp}
                onChange={setOtp}
                numInputs={4}
                shouldAutoFocus
                renderInput={(props) => (
                  <input
                    {...props}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    className={OTP_CLASS}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && otp.length === 4) {
                        e.preventDefault();
                        handleVerifyOtp();
                      }
                      if (props.onKeyDown) props.onKeyDown(e);
                    }}
                  />
                )}
                containerStyle={{ width: "100%", display: "flex", justifyContent: "center", gap: "12px" }}
              />

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 4}
                className="w-full h-12 font-bold text-xs uppercase tracking-wider rounded-2xl text-white shadow-md hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 cursor-pointer flex items-center justify-center bg-slate-900 hover:bg-slate-800"
              >
                {loading
                  ? <ClipLoader color="white" size={18} />
                  : mode === "sign-in" ? "Sign In" : "Create Account"}
              </button>

              <div className="flex flex-col items-center gap-2 pt-1 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium">
                  Didn't receive the code?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={timer > 0 || loading}
                    className="font-bold text-slate-900 hover:underline disabled:opacity-50 transition cursor-pointer"
                  >
                    {timer > 0 ? `Resend in ${formatTimer(timer)}` : "Resend OTP"}
                  </button>
                </p>

                <button
                  type="button"
                  onClick={() => { setStep("form"); setOtp(""); }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 transition flex items-center gap-1 cursor-pointer mt-1"
                >
                  <ArrowLeftIcon className="w-3.5 h-3.5" strokeWidth={2.2} />
                  {mode === "register" ? "Edit details" : "Change mobile number"}
                </button>
              </div>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
