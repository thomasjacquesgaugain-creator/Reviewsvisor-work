import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";
import { useTranslation } from "react-i18next";

type IncomingState = { email?: string };

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmailOtp() {
  
  const navigate = useNavigate();
  const location = useLocation();

  const { user, loading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState<string>(() => {
    const fromState = (location.state as IncomingState | null)?.email;
    if (fromState) return fromState;
    return sessionStorage.getItem("pending_verification_email") || "";
  });

  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Confirmation dialog state + which destination it should navigate to on confirm
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaveDestination, setLeaveDestination] = useState<"/inscription" | "/connexion">("/inscription");

  useEffect(() => {
    if (email) return;
    if (authLoading) return; 
    if (user?.email) {
      setEmail(user.email);
    } else {
     
      navigate("/inscription", { replace: true });
    }
  }, [email, authLoading, user?.email, navigate]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.trim().length < 6) {
      setError(t("auth.codeMinDigits"));
      return;
    }

    setError(null);
    setVerifying(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp.trim(),
        type: "signup",
      });

      if (verifyError) {
        setError(
          verifyError.message?.toLowerCase().includes("expired")
            ? t("auth.codeExpired")
            : t("auth.codeInvalid"),
        );
        return;
      }

      if (!data.user) {
        setError(t("errors.generic"));
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_status: "email_verified", updated_at: new Date().toISOString() })
        .eq("id", data.user.id);

      if (profileError) {
        console.warn("Failed to update onboarding_status:", profileError.message);
      }

      sessionStorage.removeItem("pending_verification_email");
      navigate("/inscription/etablissement");
    } catch (err) {
      console.error("Unexpected OTP verification error:", err);
      setError(t("errors.generic"));
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (resendError) {
        toast.error(resendError.message || t("errors.generic"));
      } else {
        toast.success(t("auth.resendCodeSuccess"));
        startCooldown();
      }
    } catch (err) {
      console.error("Unexpected resend error:", err);
      toast.error(t("errors.generic"));
    } finally {
      setResending(false);
    }
  }

  async function handleLeave(destination: "/inscription" | "/connexion") {
    setLeaving(true);
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem("pending_verification_email");
      navigate(destination, { replace: true });
    } catch (err) {
      console.error("Error signing out:", err);
      toast.error(t("errors.generic"));
      setLeaving(false);
    }
  }

  // Opens the confirmation dialog instead of leaving immediately
  function requestLeave(destination: "/inscription" | "/connexion") {
    setLeaveDestination(destination);
    setShowLeaveConfirm(true);
  }

  function confirmLeave() {
    setShowLeaveConfirm(false);
    handleLeave(leaveDestination);
  }

  if (authLoading || !email) return null; 

  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-12">
      <button
        type="button"
        onClick={() => requestLeave("/inscription")}
        disabled={leaving}
        className="fixed top-[15px] left-[24px] z-50 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 disabled:opacity-50"
        aria-label={t("common.back")}
      >
        <ArrowLeft size={28} color="#2F6BFF" strokeWidth={2.5} />
      </button>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200 to-yellow-200 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-bl from-blue-300 to-cyan-300 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full blur-2xl opacity-25" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
        <Card className="w-full bg-white/90 dark:bg-white/[0.05] backdrop-blur-sm dark:backdrop-blur-xl border-0 dark:border dark:border-white/[0.08] shadow-xl dark:shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="space-y-2 text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("auth.verifyEmailTitle")}
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t("auth.codeSentTo")}
              <br />
              <strong className="text-foreground">{email}</strong>
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("auth.verificationCode")}
                </Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="h-14 text-center text-2xl tracking-[0.5em] bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl dark:text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={verifying || otp.trim().length < 6}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("auth.verifying")}
                  </>
                ) : (
                  t("auth.verify")
                )}
              </Button>

              <div className="text-center pt-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("auth.didntReceiveCode")}{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={cooldown > 0 || resending}
                    className="text-primary font-medium hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    {cooldown > 0
                      ? t("auth.resendIn", { seconds: cooldown })
                      : resending
                      ? t("auth.sendingCode")
                      : t("auth.resendCode")}
                  </button>
                </p>
              </div>

              <div className="text-center pt-2 border-t border-border/50 mt-2 space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("auth.wrongEmail")}{" "}
                  <button
                    type="button"
                    onClick={() => requestLeave("/inscription")}
                    disabled={leaving}
                    className="text-primary font-medium hover:underline disabled:opacity-50"
                  >
                    {t("auth.restartSignup")}
                  </button>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("auth.haveActiveAccount")}{" "}
                  <button
                    type="button"
                    onClick={() => requestLeave("/connexion")}
                    disabled={leaving}
                    className="text-primary font-medium hover:underline disabled:opacity-50"
                  >
                    {t("auth.signIn")}
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("auth.confirmLeaveTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("auth.confirmLeaveMessage")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={leaving}>
              {t("auth.confirmLeaveCancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmLeave} disabled={leaving}>
              {t("auth.confirmLeaveConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}