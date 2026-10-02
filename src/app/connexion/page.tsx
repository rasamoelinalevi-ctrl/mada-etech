"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShopShell } from "@/components/shop-shell";
import { api, useStore } from "@/components/store-provider";
export default function Page() {
  return (
    <ShopShell>
      <Suspense fallback={<p>Chargement…</p>}>
        <Login />
      </Suspense>
    </ShopShell>
  );
}
function Login() {
  const params = useSearchParams();
  const token = params.get("token");
  const verification = params.get("verify");
  const [mode, setMode] = useState(
      verification ? "verify" : token ? "reset" : "login",
    ),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const { refresh } = useStore();
  return (
    <div className="container page-content" style={{ maxWidth: 650 }}>
      <h1>
        {mode === "register"
          ? "Créer un compte"
          : mode === "forgot"
            ? "Mot de passe oublié"
            : mode === "reset"
              ? "Nouveau mot de passe"
              : mode === "verify"
                ? "Confirmer mon adresse e-mail"
                : "Se connecter"}
      </h1>
      <form
        className="panel"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setMessage("");
          const f = new FormData(e.currentTarget);
          try {
            const result = await api(
              "/api/auth/" + mode,
              mode === "verify"
                ? { token: verification }
                : mode === "reset"
                  ? { token, password: f.get("password") }
                  : mode === "forgot"
                    ? { email: f.get("email") }
                    : {
                        email: f.get("email"),
                        password: f.get("password"),
                        ...(mode === "register" ? { name: f.get("name") } : {}),
                      },
            );
            if (mode === "verify") {
              setMode("login");
              setMessage("Adresse confirmée. Vous pouvez vous connecter.");
            } else if (mode === "forgot") {
              setMessage(result.message);
            } else if (mode === "reset") {
              setMode("login");
              setMessage("Mot de passe modifié. Connectez-vous.");
            } else {
              if (mode === "register") await api("/api/auth/resend", {});
              await refresh();
              window.location.assign(
                params.get("next") === "/admin" ? "/admin" : "/compte",
              );
            }
          } catch (err) {
            setMessage(
              err instanceof Error ? err.message : "Service indisponible.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {mode === "register" && (
          <label className="field">
            Nom complet
            <input
              name="name"
              required
              minLength={2}
              maxLength={150}
              autoComplete="name"
            />
          </label>
        )}
        {mode !== "reset" && mode !== "verify" && (
          <label className="field">
            Adresse e-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
        )}
        {mode !== "forgot" && mode !== "verify" && (
          <label className="field">
            Mot de passe (12 caractères minimum)
            <input
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          </label>
        )}
        <button className="button dark" disabled={busy}>
          {busy ? "Veuillez patienter…" : "Continuer"}
        </button>
        {message && <p role="status">{message}</p>}
      </form>
      <div className="account-tabs">
        <button onClick={() => setMode("login")}>Connexion</button>
        <button onClick={() => setMode("register")}>Créer un compte</button>
        <button onClick={() => setMode("forgot")}>Mot de passe oublié</button>
      </div>
    </div>
  );
}
