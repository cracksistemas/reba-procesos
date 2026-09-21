"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, LockKeyhole, Mail, UserRound } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false); const [needsSetup, setNeedsSetup] = useState(false);

  // Con la base recién creada no hay usuarios: el formulario crea al primer administrador.
  useEffect(() => {
    let active = true;
    fetch("/auth/status").then((response) => response.json()).then((data: { configured?: boolean; needsSetup?: boolean; message?: string }) => {
      if (!active) return;
      setNeedsSetup(Boolean(data.needsSetup));
      if (data.configured === false) setMessage("La base de datos aún no está configurada (DATABASE_URL).");
      else if (data.message) setMessage(`No se pudo preparar la base de datos: ${data.message}`);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    const response = await fetch(needsSetup ? "/auth/setup" : "/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, fullName }) }).catch(() => null);
    if (!response?.ok) {
      const data = await response?.json().catch(() => null) as { message?: string } | null;
      setLoading(false); setMessage(data?.message ?? "No pudimos iniciar sesión. Intenta nuevamente."); return;
    }
    router.replace("/"); router.refresh();
  }

  return <form className="login-form" onSubmit={submit}>
    {needsSetup && <p role="status"><strong>Primer ingreso.</strong> Crea la cuenta del administrador del portal.</p>}
    {needsSetup && <label><span>Nombre completo</span><div className="login-input"><UserRound size={17}/><input type="text" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre y apellido"/></div></label>}
    <label><span>Correo institucional</span><div className="login-input"><Mail size={17}/><input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@rebagliatidiplomados.com"/></div></label>
    <label><span>Contraseña</span><div className="login-input"><KeyRound size={17}/><input type="password" required minLength={needsSetup ? 8 : undefined} autoComplete={needsSetup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"/></div></label>
    <button className="button button-primary" disabled={loading}>{loading ? "Procesando…" : needsSetup ? "Crear administrador" : "Ingresar"}<ArrowRight size={15}/></button>
    {message && <p role="status">{message}</p>}
    <small><LockKeyhole size={13}/> Acceso protegido con usuarios y roles del portal.</small>
  </form>;
}
