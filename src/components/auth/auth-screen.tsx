"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/stores/auth";
import { useUi } from "@/stores/ui";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, Mail, Lock, Eye, EyeOff, ShieldCheck, Zap, Globe2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Min 6 characters"),
});
type LoginValues = z.infer<typeof loginSchema>;

function BrandedPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-background lg:flex lg:w-1/2">
      <div className="absolute inset-0 bg-radial-blue" />
      <div className="absolute inset-0 bg-grid mask-fade-b opacity-40" />
      {/* floating orbs */}
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
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
            <span className="text-base font-bold text-white">X</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">XPayments</span>
        </div>
        <div className="max-w-md">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-balance text-4xl font-semibold leading-tight tracking-tight"
          >
            Payments infrastructure for the{" "}
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              global economy
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-4 text-muted-foreground"
          >
            Accept cards, Pix, MBWay and crypto. Manage FX, treasury and risk —
            all in one enterprise platform trusted by fintechs worldwide.
          </motion.p>
          <div className="mt-8 flex flex-col gap-3">
            {[
              { icon: Zap, text: "99.99% uptime, 42ms median latency" },
              { icon: Globe2, text: "120+ currencies, 45 countries" },
              { icon: ShieldCheck, text: "PCI DSS Level 1, SOC 2 Type II" },
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
          <span>© 2025 XPayments, Inc.</span>
          <span>·</span>
          <span>Security</span>
          <span>·</span>
          <span>Privacy</span>
        </div>
      </div>
    </div>
  );
}

export function AuthScreen() {
  const { appView, setAppView } = useUi();
  const { login } = useAuth();
  const [showPwd, setShowPwd] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "merchant@xpayments.digital", password: "demo1234" },
  });

  const isLogin = appView === "login";
  const isForgot = appView === "forgot";
  const isReset = appView === "reset";

  async function onLogin(values: LoginValues) {
    setLoading(true);
    try {
      const user = await login(values.email, values.password, !!form.getValues("remember" as never) || false);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      setAppView(user.role === "admin" ? "admin" : "merchant");
    } catch {
      toast.error("Sign in failed", { description: "Check your credentials and try again." });
    } finally {
      setLoading(false);
    }
  }

  async function onForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    toast.success("Reset link sent", { description: "Check your inbox for instructions." });
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
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60">
                <span className="text-sm font-bold text-white">X</span>
              </div>
              <span className="text-lg font-semibold">XPayments</span>
            </div>
          </div>

          <button
            onClick={() => setAppView("landing")}
            className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </button>

          {isLogin && (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Sign in to your account</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Welcome back. Enter your credentials to access the dashboard.
              </p>

              <form onSubmit={form.handleSubmit(onLogin)} className="mt-8 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="you@company.com"
                      {...form.register("email")}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-xs text-rose-400">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-foreground">Password</label>
                    <button
                      type="button"
                      onClick={() => setAppView("forgot")}
                      className="text-xs text-primary transition hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type={showPwd ? "text" : "password"}
                      className="px-9"
                      placeholder="••••••••"
                      {...form.register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-xs text-rose-400">{form.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" defaultChecked />
                  <label htmlFor="remember" className="text-xs text-muted-foreground">
                    Remember me for 30 days
                  </label>
                </div>
                <Button type="submit" disabled={loading} className="mt-1 h-10 gap-1.5">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">or</span>
                <Separator className="flex-1" />
              </div>

              <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                <p className="text-xs font-medium text-foreground">Demo credentials</p>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <p><span className="text-muted-foreground/70">Merchant:</span> merchant@xpayments.digital / demo1234</p>
                  <p><span className="text-muted-foreground/70">Admin:</span> admin@xpayments.digital / demo1234</p>
                </div>
              </div>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                New to XPayments?{" "}
                <button onClick={() => setAppView("landing")} className="text-primary transition hover:underline">
                  Request access
                </button>
              </p>
            </>
          )}

          {isForgot && (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your email and we'll send you a reset link.
              </p>
              <form onSubmit={onForgot} className="mt-8 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" type="email" placeholder="you@company.com" required />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="h-10 gap-1.5">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send reset link <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
              <button onClick={() => setAppView("login")} className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
              </button>
            </>
          )}

          {isReset && (
            <>
              <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Choose a strong password for your account.</p>
              <form onSubmit={onForgot} className="mt-8 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="px-9" type="password" placeholder="••••••••" required />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="h-10 gap-1.5">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Update password <ArrowRight className="h-4 w-4" /></>}
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
