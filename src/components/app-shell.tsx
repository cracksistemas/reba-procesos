"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, Bell, BookOpen, FileText, FolderKanban, GitBranch, Home, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search, Settings, ShieldCheck, X } from "lucide-react";

const nav = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/biblioteca", label: "Biblioteca de procesos", icon: FolderKanban, aliases: ["/areas", "/procesos", "/flujogramas"] },
  { href: "/mapa", label: "Mapa institucional", icon: GitBranch },
  { href: "/revisiones", label: "Revisiones", icon: ShieldCheck, badge: 5 }, { href: "/indicadores", label: "Indicadores", icon: BarChart3 },
  { href: "/documentos", label: "Documentos y normativa", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false); const [collapsed, setCollapsed] = useState(false);
  const router = useRouter(); const [userEmail, setUserEmail] = useState("");
  useEffect(() => { setUserEmail("admin@rebagliatidiplomados.com"); }, [pathname]);
  async function signOut() { await fetch("/auth/local/logout", { method:"POST" }); router.replace("/ingreso"); router.refresh(); }
  const userName = "Gerencia"; const userInitial = userName.charAt(0).toUpperCase();
  if (pathname === "/ingreso") return <>{children}</>;
  return <div className={`app-shell ${collapsed ? "sidebar-is-collapsed" : ""}`}>
    {open && <button className="sidebar-scrim" aria-label="Cerrar menú" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? "sidebar-open" : ""} ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="brand"><div className="brand-mark" aria-hidden="true"><span>R</span></div><div className="brand-copy"><strong>REBA</strong><small>PROCESOS</small></div><button className="icon-button sidebar-collapse-button" aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"} title={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"} aria-expanded={!collapsed} onClick={() => setCollapsed((current) => !current)}>{collapsed ? <PanelLeftOpen size={18}/> : <PanelLeftClose size={18}/>}</button><button className="icon-button mobile-only" aria-label="Cerrar menú" onClick={() => setOpen(false)}><X size={20}/></button></div>
      <nav aria-label="Navegación principal"><p className="nav-label">GESTIÓN</p>{nav.map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href) || item.aliases?.some((alias) => pathname.startsWith(alias)); const Icon = item.icon; return <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`} title={collapsed ? item.label : undefined} onClick={() => setOpen(false)}><Icon size={19}/><span>{item.label}</span>{item.badge && <em>{item.badge}</em>}</Link>; })}<p className="nav-label nav-label-admin">SISTEMA</p><Link href="/administracion" className={`nav-item ${pathname.startsWith("/administracion") ? "active" : ""}`} title={collapsed ? "Administración" : undefined} onClick={() => setOpen(false)}><Settings size={19}/><span>Administración</span></Link></nav>
      <div className="sidebar-help"><BookOpen size={18}/><div><strong>Centro de ayuda</strong><span>Guías y convenciones</span></div></div>
      <div className="sidebar-user"><div className="avatar">{userInitial}</div><div><strong>{userName}</strong><span>{userEmail}</span></div><button className="icon-button" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={signOut}><LogOut size={16}/></button></div>
    </aside>
    <div className="main-column"><header className="topbar"><button className="icon-button menu-button" aria-label="Abrir menú" onClick={() => setOpen(true)}><Menu size={21}/></button><Link href="/biblioteca" className="global-search" aria-label="Buscar en la biblioteca de procesos"><Search size={18}/><span>Buscar por código, proceso, área o responsable…</span><kbd>⌘ K</kbd></Link><div className="topbar-actions"><button className="icon-button" aria-label="Notificaciones"><Bell size={20}/><span className="notification-dot"/></button><div className="topbar-avatar">{userInitial}</div></div></header><main className="page-wrap">{children}</main></div>
  </div>;
}
