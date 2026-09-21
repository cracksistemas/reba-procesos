"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, UserPlus, X } from "lucide-react";

type Assignment = { role: string; area: string | null };
type User = { id: string; email: string; fullName: string; isActive: boolean; lastSignInAt: string | null; assignments: Assignment[] };
type Catalog = { roles: { code: string; name: string; description: string | null }[]; areas: { code: string; name: string }[] };
type Draft = { id: string | null; email: string; fullName: string; password: string; isActive: boolean; assignments: Assignment[] };

const emptyDraft: Draft = { id: null, email: "", fullName: "", password: "", isActive: true, assignments: [{ role: "reader", area: null }] };
// superadmin y process_admin gobiernan todo el portal; el resto puede limitarse a un área.
const globalRoles = ["superadmin", "process_admin"];

async function fetchUsers(): Promise<(Catalog & { users: User[]; currentUserId: string }) | { message: string }> {
  const response = await fetch("/api/admin/users").catch(() => null);
  const data = await response?.json().catch(() => null);
  return response?.ok ? data : { message: data?.message ?? "No se pudo cargar la lista de usuarios." };
}

export function UsersManager() {
  const [users, setUsers] = useState<User[]>([]); const [catalog, setCatalog] = useState<Catalog>({ roles: [], areas: [] });
  const [currentUserId, setCurrentUserId] = useState(""); const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState(""); const [formError, setFormError] = useState(""); const [saving, setSaving] = useState(false); const [loaded, setLoaded] = useState(false);

  const apply = useCallback((result: Awaited<ReturnType<typeof fetchUsers>>) => {
    setLoaded(true);
    if ("message" in result) { setError(result.message); return; }
    setUsers(result.users); setCatalog({ roles: result.roles, areas: result.areas }); setCurrentUserId(result.currentUserId); setError("");
  }, []);
  useEffect(() => { let active = true; fetchUsers().then((result) => { if (active) apply(result); }); return () => { active = false; }; }, [apply]);

  const roleName = (code: string) => catalog.roles.find((role) => role.code === code)?.name ?? code;
  const areaName = (code: string | null) => code ? catalog.areas.find((area) => area.code === code)?.name ?? code : "Todas las áreas";
  function updateAssignment(index: number, change: Partial<Assignment>) {
    setDraft((current) => current && { ...current, assignments: current.assignments.map((item, position) => position === index ? { ...item, ...change, ...(change.role && globalRoles.includes(change.role) ? { area: null } : {}) } : item) });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!draft) return;
    setSaving(true); setFormError("");
    const body = { email: draft.email, fullName: draft.fullName, isActive: draft.isActive, assignments: draft.assignments, ...(draft.password ? { password: draft.password } : {}) };
    const response = await fetch(draft.id ? `/api/admin/users/${draft.id}` : "/api/admin/users", { method: draft.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    setSaving(false);
    if (!response?.ok) { const data = await response?.json().catch(() => null); setFormError(data?.message ?? "No se pudo guardar el usuario."); return; }
    setDraft(null); apply(await fetchUsers());
  }

  if (loaded && error) return <section className="card"><div className="card-header"><div><h2>Usuarios y roles</h2><p>{error}</p></div></div></section>;

  return <section className="card">
    <div className="card-header"><div><h2>Usuarios y roles</h2><p>Crea cuentas, cambia contraseñas y asigna permisos por área.</p></div>{!draft && <button className="button button-primary" onClick={() => { setFormError(""); setDraft(emptyDraft); }}><UserPlus size={15}/> Nuevo usuario</button>}</div>

    {draft && <form className="subarea-form" onSubmit={save}>
      <div className="form-grid">
        <label><span>Nombre completo</span><input required value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}/></label>
        <label><span>Correo</span><input type="email" required value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })}/></label>
        <label><span>{draft.id ? "Nueva contraseña (opcional)" : "Contraseña"}</span><input type="password" autoComplete="new-password" minLength={8} required={!draft.id} value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} placeholder={draft.id ? "Dejar vacío para no cambiarla" : "Mínimo 8 caracteres"}/></label>
        <label><span>Estado</span><select className="filter-select" value={draft.isActive ? "1" : "0"} disabled={draft.id === currentUserId} onChange={(e) => setDraft({ ...draft, isActive: e.target.value === "1" })}><option value="1">Activo</option><option value="0">Desactivado</option></select></label>
        <div className="form-span"><label><span>Roles</span></label>
          {draft.assignments.map((assignment, index) => <div key={index} className="user-role-row">
            <select className="filter-select" aria-label="Rol" value={assignment.role} onChange={(e) => updateAssignment(index, { role: e.target.value })}>{catalog.roles.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}</select>
            <select className="filter-select" aria-label="Área" value={assignment.area ?? ""} disabled={globalRoles.includes(assignment.role)} onChange={(e) => updateAssignment(index, { area: e.target.value || null })}><option value="">Todas las áreas</option>{catalog.areas.map((area) => <option key={area.code} value={area.code}>{area.name}</option>)}</select>
            <button type="button" className="icon-button" aria-label="Quitar rol" onClick={() => setDraft({ ...draft, assignments: draft.assignments.filter((_, position) => position !== index) })}><Trash2 size={15}/></button>
          </div>)}
          <button type="button" className="text-button" onClick={() => setDraft({ ...draft, assignments: [...draft.assignments, { role: "reader", area: null }] })}><Plus size={14}/> Añadir rol</button>
        </div>
      </div>
      {formError && <p className="form-error" role="alert">{formError}</p>}
      <div className="form-actions"><button type="button" className="button button-ghost" onClick={() => setDraft(null)}><X size={15}/> Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? "Guardando…" : draft.id ? "Guardar cambios" : "Crear usuario"}</button></div>
    </form>}

    <div className="table-wrap"><table className="data-table"><thead><tr><th>Usuario</th><th>Roles</th><th>Estado</th><th>Último ingreso</th><th/></tr></thead><tbody>
      {users.map((user) => <tr key={user.id}>
        <td><span className="table-primary">{user.fullName || "Sin nombre"}</span><span className="table-secondary">{user.email}</span></td>
        <td>{user.assignments.length ? user.assignments.map((item) => <span key={`${item.role}-${item.area}`} className="table-secondary">{roleName(item.role)} · {areaName(item.area)}</span>) : <span className="table-secondary">Sin roles</span>}</td>
        <td>{user.isActive ? "Activo" : "Desactivado"}</td>
        <td>{user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" }) : "Nunca"}</td>
        <td className="table-actions"><button className="icon-button" aria-label={`Editar ${user.email}`} title="Editar" onClick={() => { setFormError(""); setDraft({ id: user.id, email: user.email, fullName: user.fullName, password: "", isActive: user.isActive, assignments: user.assignments }); }}><Pencil size={15}/></button></td>
      </tr>)}
      {loaded && !users.length && <tr><td colSpan={5}>Aún no hay usuarios.</td></tr>}
    </tbody></table></div>
  </section>;
}
