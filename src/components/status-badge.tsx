import { ProcessStatus, statusTone } from "@/lib/data";
export function StatusBadge({ status }: { status: ProcessStatus }) {
  return <span className={`status status-${statusTone[status]}`}><span aria-hidden="true" />{status}</span>;
}
