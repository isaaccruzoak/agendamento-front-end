const STATUS_MAP = {
  scheduled: { label: 'Agendado',  cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  completed: { label: 'Concluído', cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  cancelled: { label: 'Cancelado', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  no_show:   { label: 'Faltou',    cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
}

export default function StatusBadge({ status }) {
  const { label, cls } = STATUS_MAP[status] || { label: status, cls: 'bg-zinc-800 text-zinc-400 border-zinc-700' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {label}
    </span>
  )
}
