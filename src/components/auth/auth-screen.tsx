"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/stores/auth";
import { useUi } from "@/stores/ui";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowRight, ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldCheck, Zap, Globe2,
  Loader2, User as UserIcon, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useT } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { XSymbol } from "@/components/shared/x-symbol";
import { cn } from "@/lib/utils";

// ---- Schemas ----
const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});
type LoginValues = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Min 8 characters"),
  companyName: z.string().min(2, "Enter your organization name"),
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms" }),
  }),
});
type RegisterValues = z.infer<typeof registerSchema>;

type AuthMode = "login" | "register";

function BrandedPanel() {
  const t = useT();
  return (
    <div className="relative hidden overflow-hidden bg-background lg:flex lg:w-1/2">
      <div className="absolute inset-0 bg-radial-blue" />
      <div className="absolute inset-0 bg-grid mask-fade-b opacity-40" />
      <motion.div
        className="absolute left-[15%] top-[18%] h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        animate={{ y: [0, -20, 0], x: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[12%] right-[12%] h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"
        animate={{ y: [0, 18, 0], x: [0, -10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative z-10 flex flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <XSymbol className="h-9 w-9" />
          <span className="text-lg font-semibold tracking-tight">XPayments</span>
        </div>
        <div className="max-w-md">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-balance text-4xl font-semibold leading-tight tracking-tight"
          >
            {t("auth.brandedTitle")}{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              {t("auth.brandedAccent")}
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-muted-foreground"
          >
            {t("auth.brandedSubtitle")}
          </motion.p>
          <div className="mt-8 flex flex-col gap-3">
            {[
              { icon: Zap, text: t("auth.feature1") },
              { icon: Globe2, text: t("auth.feature2") },
              { icon: ShieldCheck, text: t("auth.feature3") },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 text-sm text-muted-foreground"
              >
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-4 w-4" />
                </div>
                {f.text}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span>© 2026 XPayments, Inc.</span>
          <span>·</span>
          <span>Security</span>
          <span>·</span>
          <span>Privacy</span>
        </div>
      </div>
    </div>
  );
}

/** Segmented toggle between Sign in / Create account */
function ModeToggle({ mode, onChange }: { mode: AuthMode; onChange: (m: AuthMode) => void }) {
  const t = useT();
  return (
    <div className="relative grid grid-cols-2 rounded-lg border border-border/60 bg-muted/40 p-1">
      {(["login", "register"] as AuthMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            "relative z-10 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            mode === m ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {mode === m && (
            <motion.div
              layoutId="auth-mode-pill"
              className="absolute inset-0 -z-10 rounded-md bg-primary shadow-sm"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          {m === "login" ? t("auth.tabLogin") : t("auth.tabRegister")}
        </button>
      ))}
    </div>
  );
}

export function AuthScreen() {
  const { appView, setAppView } = useUi();
  const { login, register } = useAuth();
  const t = useT();
  const [mode, setMode] = React.useState<AuthMode>("login");
  const [showPwd, setShowPwd] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "merchant@xpayments.digital", password: "demo1234" },
  });
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", companyName: "", terms: false as unknown as true },
  });

  const isForgot = appView === "forgot";
  const isReset = appView === "reset";

  async function onLogin(values: LoginValues) {
    setLoading(true);
    try {
      const user = await login(values.email, values.password, !!loginForm.getValues("remember" as never) || false);
      toast.success(`${t("auth.welcomeBack")}, ${user.name.split(" ")[0]}`);
      setAppView(user.role === "admin" ? "admin" : "merchant");
    } catch {
      toast.error(t("auth.signinFailed"), { description: t("auth.signinFailedDesc") });
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(values: RegisterValues) {
    setLoading(true);
    try {
      const user = await register({
        name: values.name,
        email: values.email,
        password: values.password,
        companyName: values.companyName,
      });
      toast.success(t("auth.registerSuccess"), { description: t("auth.registerSuccessDesc") });
      setAppView(user.role === "admin" ? "admin" : "merchant");
    } catch {
      toast.error(t("auth.registerFailed"), { description: t("auth.registerFailedDesc") });
    } finally {
      setLoading(false);
    }
  }

  async function onForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success(t("auth.resetSent"), { description: t("auth.resetSentDesc") });
    setAppView("login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <BrandedPanel />
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <XSymbol className="h-8 w-8" />
            <span className="text-lg font-semibold">XPayments</span>
          </div>

          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={() => setAppView("landing")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> {t("auth.backHome")}
            </button>
            <LanguageSwitcher />
          </div>

          {/* Forgot / Reset screens */}
          {(isForgot || isReset) && (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">
                {isForgot ? t("auth.forgotTitle") : t("auth.resetTitle")}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isForgot ? t("auth.forgotSubtitle") : t("auth.resetSubtitle")}
              </p>
              <form onSubmit={onForgot} className="mt-8 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">{t("auth.email")}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" type="email" placeholder="you@company.com" autoComplete="email" required />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="h-10 gap-1.5">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{isForgot ? t("auth.forgotBtn") : t("auth.resetBtn")} <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
              <button onClick={() => setAppView("login")} className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> {t("auth.backSignin")}
              </button>
            </>
          )}

          {/* Login / Register screens */}
          {!isForgot && !isReset && (
            <>
              <ModeToggle mode={mode} onChange={setMode} />

              <div className="mt-6 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  {mode === "login" ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                      <h1 className="text-2xl font-semibold tracking-tight">{t("auth.loginTitle")}</h1>
                      <p className="mt-1.5 text-sm text-muted-foreground">{t("auth.loginSubtitle")}</p>

                      <form onSubmit={loginForm.handleSubmit(onLogin)} className="mt-6 flex flex-col gap-4">
                        <Field label={t("auth.email")} error={loginForm.formState.errors.email?.message}>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-9" type="email" placeholder="you@company.com" autoComplete="email" {...loginForm.register("email")} />
                          </div>
                        </Field>
                        <Field
                          label={t("auth.password")}
                          error={loginForm.formState.errors.password?.message}
                          action={
                            <button type="button" onClick={() => setAppView("forgot")} className="text-xs text-primary transition hover:underline">
                              {t("auth.forgot")}
                            </button>
                          }
                        >
                          <PasswordInput show={showPwd} onToggle={() => setShowPwd((s) => !s)} autoComplete="current-password" {...loginForm.register("password")} />
                        </Field>
                        <div className="flex items-center gap-2">
                          <Checkbox id="remember" defaultChecked />
                          <label htmlFor="remember" className="text-xs text-muted-foreground">{t("auth.remember")}</label>
                        </div>
                        <Button type="submit" disabled={loading} className="mt-1 h-10 gap-1.5">
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t("auth.signinBtn")} <ArrowRight className="h-4 w-4" /></>}
                        </Button>
                      </form>

                      <div className="my-6 flex items-center gap-3">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
                        <Separator className="flex-1" />
                      </div>

                      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                        <p className="text-xs font-medium text-foreground">{t("auth.demoTitle")}</p>
                        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                          <p><span className="text-muted-foreground/70">{t("auth.demoMerchant")}:</span> merchant@xpayments.digital / demo1234</p>
                          <p><span className="text-muted-foreground/70">{t("auth.demoAdmin")}:</span> admin@xpayments.digital / demo1234</p>
                        </div>
                      </div>

                      <p className="mt-6 text-center text-xs text-muted-foreground">
                        {t("auth.noAccount")}{" "}
                        <button onClick={() => setMode("register")} className="text-primary transition hover:underline">
                          {t("auth.createAccountLink")}
                        </button>
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                      <h1 className="text-2xl font-semibold tracking-tight">{t("auth.registerTitle")}</h1>
                      <p className="mt-1.5 text-sm text-muted-foreground">{t("auth.registerSubtitle")}</p>

                      <form onSubmit={registerForm.handleSubmit(onRegister)} className="mt-6 flex flex-col gap-4">
                        <Field label={t("auth.fullName")} error={registerForm.formState.errors.name?.message}>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-9" autoComplete="name" placeholder={t("auth.fullNamePlaceholder")} {...registerForm.register("name")} />
                          </div>
                        </Field>
                        <Field label={t("auth.email")} error={registerForm.formState.errors.email?.message}>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-9" type="email" placeholder="you@company.com" autoComplete="email" {...registerForm.register("email")} />
                          </div>
                        </Field>
                        <Field label={t("auth.companyName")} error={registerForm.formState.errors.companyName?.message}>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input className="pl-9" autoComplete="organization" placeholder={t("auth.companyPlaceholder")} {...registerForm.register("companyName")} />
                          </div>
                        </Field>
                        <Field label={t("auth.password")} error={registerForm.formState.errors.password?.message}>
                          <PasswordInput show={showPwd} onToggle={() => setShowPwd((s) => !s)} autoComplete="new-password" {...registerForm.register("password")} />
                        </Field>
                        <div className="flex items-start gap-2">
                          <Checkbox id="terms" onCheckedChange={(v) => registerForm.setValue("terms", v as true)} />
                          <label htmlFor="terms" className="text-xs leading-relaxed text-muted-foreground">
                            I agree to the <a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">Terms</a> and <a href="#" onClick={(e) => e.preventDefault()} className="text-primary hover:underline">Privacy Policy</a>.
                          </label>
                        </div>
                        {registerForm.formState.errors.terms && (
                          <p className="-mt-2 text-xs text-rose-400">{registerForm.formState.errors.terms.message as string}</p>
                        )}
                        <Button type="submit" disabled={loading} className="mt-1 h-10 gap-1.5">
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t("auth.createAccount")} <ArrowRight className="h-4 w-4" /></>}
                        </Button>
                      </form>

                      <p className="mt-6 text-center text-xs text-muted-foreground">
                        {t("auth.haveAccount")}{" "}
                        <button onClick={() => setMode("login")} className="text-primary transition hover:underline">
                          {t("auth.signInLink")}
                        </button>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ---- Small field primitives ----
function Field({
  label, error, action, children,
}: { label: string; error?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-foreground">{label}</label>
        {action}
      </div>
      {children}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}

function PasswordInput({
  show, onToggle, ...props
}: { show: boolean; onToggle: () => void } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input type={show ? "text" : "password"} className="px-9" placeholder="••••••••" {...(props as any)} />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
