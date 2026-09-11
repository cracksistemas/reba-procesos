import Link from "next/link";
export default function NotFound(){return <div className="card empty-state"><h1>Proceso no encontrado</h1><p>El código solicitado no existe o ya no está disponible.</p><Link href="/procesos" className="button button-primary">Volver al catálogo</Link></div>}
