"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Bell, BookOpen, Building2, ChevronDown, FileText, FolderKanban, GitBranch, Home, Menu, Search, Settings, ShieldCheck, Workflow, X } from "lucide-react";

const nav = [
  { href: "/", label: "Inicio", icon: Home }, { href: "/procesos", label: "Procesos", icon: FolderKanban },
  { href: "/areas", label: "Áreas", icon: Building2 }, { href: "/flujogramas", label: "Flujogramas", icon: Workflow }, { href: "/mapa", label: "Mapa de procesos", icon: GitBranch },
  { href: "/revisiones", label: "Revisiones", icon: ShieldCheck, badge: 5 }, { href: "/indicadores", label: "Indicadores", icon: BarChart3 },
  { href: "/documentos", label: "Documentos", icon: FileText },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); const [open, setOpen] = useState(false);
  if (pathname === "/ingreso") return <>{children}</>;
  return <div className="app-shell">
    {open && <button className="sidebar-scrim" aria-label="Cerrar menú" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand"><div className="brand-mark" aria-hidden="true"><span>R</span></div><div><strong>REBA</strong><small>PROCESOS</small></div><button className="icon-button mobile-only" aria-label="Cerrar menú" onClick={() => setOpen(false)}><X size={20}/></button></div>
      <nav aria-label="Navegación principal"><p className="nav-label">GESTIÓN</p>{nav.map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); const Icon = item.icon; return <Link key={item.href} href={item.href} className={`nav-item ${active ? "active" : ""}`} onClick={() => setOpen(false)}><Icon size={19}/><span>{item.label}</span>{item.badge && <em>{item.badge}</em>}</Link>; })}<p className="nav-label nav-label-admin">SISTEMA</p><Link href="/administracion" className={`nav-item ${pathname.startsWith("/administracion") ? "active" : ""}`} onClick={() => setOpen(false)}><Settings size={19}/><span>Administración</span></Link></nav>
      <div className="sidebar-help"><BookOpen size={18}/><div><strong>Centro de ayuda</strong><span>Guías y convenciones</span></div></div>
      <div className="sidebar-user"><div className="avatar">AS</div><div><strong>Andrea Salazar</strong><span>Administradora</span></div><ChevronDown size={16}/></div>
    </aside>
    <div className="main-column"><header className="topbar"><button className="icon-button menu-button" aria-label="Abrir menú" onClick={() => setOpen(true)}><Menu size={21}/></button><div className="global-search"><Search size={18}/><span>Buscar procesos, áreas o responsables…</span><kbd>⌘ K</kbd></div><div className="topbar-actions"><button className="icon-button" aria-label="Notificaciones"><Bell size={20}/><span className="notification-dot"/></button><div className="topbar-avatar">AS</div></div></header><main className="page-wrap">{children}</main></div>
  </div>;
}
