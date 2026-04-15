import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import {
  CalendarCheck, DollarSign, Clock, TrendingDown,
  Plus, ChevronLeft, ChevronRight, Send, XCircle, CheckCircle
} from 'lucide-react'
import { dashboardApi, appointmentsApi, whatsappApi } from '../services/api'
import Modal from '../components/Modal'
import AppointmentForm from '../components/AppointmentForm'
import StatusBadge from '../components/StatusBadge'

function todayStr() {
  return format(new Date(), 'yyyy-MM-dd')
}

export default function Dashboard() {
  const [date, setDate]       = useState(todayStr())
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    dashboardApi.getStats(date)
      .then(r => setData(r.data))
      .catch(() => toast.error('Erro ao carregar dashboard'))
      .finally(() => setLoading(false))
  }, [date])

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

  const handleSendReminder = async (id) => {
    try {
      await whatsappApi.sendReminder(id, '1_day')
      toast.success('Lembrete enviado!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Falha ao enviar lembrete')
    }
  }

  const shiftDate = (days) => {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + days)
    setDate(format(d, 'yyyy-MM-dd'))
  }

  const stats  = data?.stats
  const appts  = data?.appointments || []
  const isToday = date === todayStr()

  const fmtCurrency = (v) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  const fmtDateTitle = () => {
    if (!date) return ''
    try { return format(new Date(date + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR }) }
    catch { return date }
  }

  const statCards = stats ? [
    {
      label: 'Agendamentos',
      value: stats.bookedSlots,
      sub: `de ${stats.totalSlots} horários`,
      icon: CalendarCheck,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      bar: stats.occupancyRate,
      barColor: 'bg-blue-500',
    },
    {
      label: 'Faturamento Prev.',
      value: fmtCurrency(stats.potentialRevenue),
      sub: 'previsto do dia',
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Horários Livres',
      value: stats.freeSlots,
      sub: 'disponíveis',
      icon: Clock,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Potencial Perdido',
      value: fmtCurrency(stats.potentialLost),
      sub: `${stats.freeSlots} slots vazios`,
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  ] : []

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white capitalize">{fmtDateTitle()}</h1>
          {isToday && <p className="text-xs text-emerald-400 font-medium mt-0.5">Hoje</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#111119] border border-[#1e1e2c] rounded-lg p-1">
            <button onClick={() => shiftDate(-1)} className="p-1.5 hover:bg-[#1a1a24] rounded-md transition-colors text-zinc-400 hover:text-white">
              <ChevronLeft size={15} />
            </button>
            <input
              type="date" value={date}
              onChange={e => setDate(e.target.value)}
              className="text-sm bg-transparent text-zinc-300 border-0 outline-none px-1"
            />
            <button onClick={() => shiftDate(1)} className="p-1.5 hover:bg-[#1a1a24] rounded-md transition-colors text-zinc-400 hover:text-white">
              <ChevronRight size={15} />
            </button>
          </div>
          <button className="btn-primary" onClick={() => setShowNew(true)}>
            <Plus size={15} /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-[#111119]" />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, sub, icon: Icon, color, bg, bar, barColor }) => (
            <div key={label} className="card hover:border-[#2a2a3a] transition-colors">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">{label}</p>
                  <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{sub}</p>
                </div>
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon size={17} className={color} />
                </div>
              </div>
              {bar !== undefined && (
                <div className="mt-3">
                  <div className="bg-[#1a1a24] rounded-full h-1">
                    <div className={`${barColor} h-1 rounded-full transition-all`} style={{ width: `${bar}%` }} />
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">{bar}% ocupado</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time slots */}
        <div className="card space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Grade de Horários</h2>

          {loading ? (
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => <div key={i} className="h-9 bg-[#1a1a24] rounded-lg animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-1.5">
              {stats?.allSlotsList?.map(({ hour, booked }) => {
                const appt = appts.find(a => a.time === hour)
                return (
                  <div key={hour}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm border ${
                      booked
                        ? 'bg-blue-500/5 border-blue-500/15'
                        : 'bg-emerald-500/5 border-emerald-500/10'
                    }`}
                  >
                    <span className={`font-mono text-xs font-bold w-10 shrink-0 ${booked ? 'text-blue-400' : 'text-emerald-500'}`}>
                      {hour}
                    </span>
                    {booked && appt ? (
                      <span className="text-zinc-400 text-xs truncate">{appt.client_name}</span>
                    ) : (
                      <span className="text-emerald-600 text-xs">Livre</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Appointment list */}
        <div className="lg:col-span-2 card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Agendamentos do Dia</h2>
            <span className="text-xs text-zinc-600">{appts.length} agendamento{appts.length !== 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-[#1a1a24] rounded-xl animate-pulse" />)}
            </div>
          ) : appts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarCheck size={36} className="text-zinc-800 mb-3" />
              <p className="text-zinc-600 text-sm">Nenhum agendamento neste dia</p>
              <button className="btn-primary mt-4 text-xs" onClick={() => setShowNew(true)}>
                <Plus size={13} /> Criar Agendamento
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {appts.map(a => (
                <div key={a.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[#1e1e2c] hover:border-[#2a2a3a] hover:bg-[#141420] transition-colors"
                >
                  <div className="w-12 shrink-0">
                    <p className="text-sm font-bold text-emerald-400 font-mono">{a.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{a.client_name}</p>
                    <p className="text-xs text-zinc-500 truncate">{a.service}</p>
                  </div>
                  {a.price > 0 && (
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(a.price)}
                    </span>
                  )}
                  <StatusBadge status={a.status} />
                  {a.status === 'scheduled' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button title="Enviar lembrete" onClick={() => handleSendReminder(a.id)}
                        className="p-1.5 text-zinc-600 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors">
                        <Send size={13} />
                      </button>
                      <button title="Marcar como concluído" onClick={() => handleComplete(a.id)}
                        className="p-1.5 text-zinc-600 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors">
                        <CheckCircle size={13} />
                      </button>
                      <button title="Cancelar agendamento" onClick={() => handleCancel(a.id)}
                        className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <XCircle size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Novo Agendamento">
        <AppointmentForm
          initialDate={date}
          onSubmit={handleNewAppt}
          onCancel={() => setShowNew(false)}
          loading={saving}
        />
      </Modal>
    </div>
  )
}
