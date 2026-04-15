import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { Plus, Search, Send, XCircle, CheckCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import { appointmentsApi, whatsappApi } from '../services/api'
import Modal from '../components/Modal'
import AppointmentForm from '../components/AppointmentForm'
import StatusBadge from '../components/StatusBadge'

const STATUS_OPTIONS = [
  { value: '',           label: 'Todos' },
  { value: 'scheduled',  label: 'Agendado' },
  { value: 'completed',  label: 'Concluído' },
  { value: 'cancelled',  label: 'Cancelado' },
  { value: 'no_show',    label: 'Faltou' },
]

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading]           = useState(true)
  const [showNew, setShowNew]           = useState(false)
  const [saving, setSaving]             = useState(false)
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom]         = useState('')
  const [dateTo, setDateTo]             = useState('')
  const [logsModal, setLogsModal]       = useState(null)
  const [logs, setLogs]                 = useState([])
  const [logsLoading, setLogsLoading]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params = {}
    if (statusFilter) params.status   = statusFilter
    if (dateFrom)     params.dateFrom = dateFrom
    if (dateTo)       params.dateTo   = dateTo
    appointmentsApi.getAll(params)
      .then(r => setAppointments(r.data))
      .catch(() => toast.error('Erro ao carregar agendamentos'))
      .finally(() => setLoading(false))
  }, [statusFilter, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  const handleNewAppt = async (form) => {
    setSaving(true)
    try {
      await appointmentsApi.create(form)
      toast.success('Agendamento criado!')
      setShowNew(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao criar agendamento')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (id) => {
    if (!confirm('Cancelar este agendamento?')) return
    try {
      await appointmentsApi.cancel(id)
      toast.success('Agendamento cancelado')
      load()
    } catch { toast.error('Erro ao cancelar') }
  }

  const handleComplete = async (id) => {
    try {
      await appointmentsApi.update(id, { status: 'completed' })
      toast.success('Marcado como concluído')
      load()
    } catch { toast.error('Erro ao atualizar') }
  }

  const handleNoShow = async (id) => {
    try {
      await appointmentsApi.update(id, { status: 'no_show' })
      toast.success('Marcado como faltou')
      load()
    } catch { toast.error('Erro ao atualizar') }
  }

  const handleSendReminder = async (id) => {
    try {
      await whatsappApi.sendReminder(id, '1_day')
      toast.success('Lembrete enviado!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Falha ao enviar lembrete')
    }
  }

  const openLogs = async (appt) => {
    setLogsModal({ id: appt.id, clientName: appt.client_name })
    setLogs([])
    setLogsLoading(true)
    try {
      const r = await appointmentsApi.getLogs(appt.id)
      setLogs(r.data)
    } catch { toast.error('Erro ao carregar logs') }
    finally { setLogsLoading(false) }
  }

  const fmtDate = (d) => {
    try { return format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR }) }
    catch { return d }
  }

  const fmtCurrency = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  const filtered = appointments.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return a.client_name?.toLowerCase().includes(q) || a.service?.toLowerCase().includes(q)
  })

  const hasFilters = statusFilter || dateFrom || dateTo || search

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Agendamentos</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Gerencie todos os seus agendamentos</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={15} /> Novo
        </button>
      </div>

      {/* Filters */}
      <div className="card py-3.5">
        <div className="flex flex-wrap gap-2.5">
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              className="input pl-8 text-xs"
              placeholder="Buscar por cliente ou serviço..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="relative">
            <select
              className="input pr-7 appearance-none text-xs"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
          </div>

          <input type="date" className="input text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="De" />
          <input type="date" className="input text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Até" />

          {hasFilters && (
            <button
              className="btn-secondary text-xs"
              onClick={() => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo('') }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="space-y-px p-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-[#1a1a24] rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-zinc-600 text-sm">Nenhum agendamento encontrado</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2c]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">Hora</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">Serviço</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, idx) => (
                <tr
                  key={a.id}
                  className={`border-b border-[#161620] hover:bg-[#141420] transition-colors ${idx === filtered.length - 1 ? 'border-0' : ''}`}
                >
                  <td className="px-4 py-3 text-zinc-400 text-xs">{fmtDate(a.date)}</td>
                  <td className="px-4 py-3 font-mono text-emerald-400 text-xs font-bold">{a.time}</td>
                  <td className="px-4 py-3 font-semibold text-white text-sm">{a.client_name}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{a.service}</td>
                  <td className="px-4 py-3 text-emerald-400 text-xs font-medium">
                    {a.price > 0 ? fmtCurrency(a.price) : <span className="text-zinc-700">—</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button title="Ver logs" onClick={() => openLogs(a)}
                        className="p-1.5 text-zinc-700 hover:text-zinc-300 hover:bg-[#1e1e2c] rounded-lg transition-colors">
                        <Search size={12} />
                      </button>
                      {a.status === 'scheduled' && (
                        <>
                          <button title="Enviar lembrete" onClick={() => handleSendReminder(a.id)}
                            className="p-1.5 text-zinc-700 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                            <Send size={12} />
                          </button>
                          <button title="Concluído" onClick={() => handleComplete(a.id)}
                            className="p-1.5 text-zinc-700 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                            <CheckCircle size={12} />
                          </button>
                          <button title="Faltou" onClick={() => handleNoShow(a.id)}
                            className="p-1.5 text-zinc-700 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors">
                            <AlertTriangle size={12} />
                          </button>
                          <button title="Cancelar" onClick={() => handleCancel(a.id)}
                            className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                            <XCircle size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Novo Agendamento">
        <AppointmentForm onSubmit={handleNewAppt} onCancel={() => setShowNew(false)} loading={saving} />
      </Modal>

      <Modal open={!!logsModal} onClose={() => setLogsModal(null)} title={`Lembretes — ${logsModal?.clientName || ''}`}>
        {logsLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-[#1a1a24] rounded animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-6">Nenhum lembrete enviado ainda.</p>
        ) : (
          <div className="space-y-2">
            {logs.map(l => (
              <div key={l.id} className="flex items-start justify-between text-sm bg-[#16161f] border border-[#1e1e2c] rounded-lg px-3 py-2.5">
                <div>
                  <span className="font-medium text-zinc-300 text-xs capitalize">{l.reminder_type.replace('_', ' ')}</span>
                  {l.message && <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">{l.message}</p>}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className={`text-xs font-semibold ${l.status === 'sent' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {l.status === 'sent' ? 'Enviado' : 'Falhou'}
                  </span>
                  <p className="text-xs text-zinc-600 mt-0.5">{format(new Date(l.sent_at), 'dd/MM HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
