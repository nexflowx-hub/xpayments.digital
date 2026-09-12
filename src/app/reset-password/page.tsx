"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { xpApi } from "@/lib/api/xpApi";
import { XSymbol } from "@/components/shared/x-symbol";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const [token, setToken] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState("");
  const [confirmation, setConfirmation] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);

  React.useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token");
    setToken(value?.trim() || "");
  }, []);

  const validPassword = password.length >= 8 && password.length <= 128;
  const passwordsMatch = password === confirmation;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      toast.error("Link de redefinição inválido.");
      return;
    }

    if (!validPassword) {
      toast.error("A palavra-passe deve ter entre 8 e 128 caracteres.");
      return;
    }

    if (!passwordsMatch) {
      toast.error("As palavras-passe não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await xpApi.auth.reset(token, password);
      setCompleted(true);
      setPassword("");
      setConfirmation("");
      window.history.replaceState({}, "", "/reset-password");
      toast.success("Palavra-passe atualizada com sucesso.");
    } catch (error: any) {
      toast.error(error?.message || "O link é inválido, expirou ou já foi utilizado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-5 py-12 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-25" />
      <div className="pointer-events-none absolute left-1/4 top-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar à XPayments
        </Link>

        <Card className="border-border/60 bg-card/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3">
            <XSymbol className="h-10 w-10" />
            <div>
              <p className="text-sm font-semibold">XPayments</p>
              <p className="text-xs text-muted-foreground">Account Security</p>
            </div>
          </div>

          {token === null ? (
            <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> A validar o link…
            </div>
          ) : completed ? (
            <div className="mt-8">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight">Palavra-passe atualizada</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                O link utilizado deixou de ser válido. Já pode iniciar sessão com a nova palavra-passe.
              </p>
              <Link href="/" className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
                Ir para Sign in
              </Link>
            </div>
          ) : !token ? (
            <div className="mt-8">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight">Link inválido</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Este link de redefinição não contém um token válido. Solicite um novo link na área de login.
              </p>
              <Link href="/" className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold">
                Voltar à XPayments
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" /> Link protegido · expiração automática
                </div>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight">Definir nova palavra-passe</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Escolha uma nova palavra-passe para a sua conta. Após a alteração, este link não poderá ser reutilizado.
                </p>
              </div>

              <form onSubmit={submit} className="mt-7 space-y-4">
                <div>
                  <label className="text-xs font-medium">Nova palavra-passe</label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type={showPassword ? "text" : "password"}
                      className="px-9"
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                      aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">8–128 caracteres.</p>
                </div>

                <div>
                  <label className="text-xs font-medium">Confirmar nova palavra-passe</label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      type={showPassword ? "text" : "password"}
                      className="pl-9"
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="h-10 w-full" disabled={loading || !validPassword || !passwordsMatch}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar palavra-passe"}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </main>
  );
}
