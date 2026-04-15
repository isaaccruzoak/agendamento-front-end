import { useState, useEffect } from 'react'
import { dashboardApi } from '../services/api'

const SERVICES = [
  'Corte de cabelo', 'Manicure', 'Pedicure', 'Coloração', 'Hidratação',
  'Escova', 'Sobrancelha', 'Maquiagem', 'Massagem', 'Limpeza de pele',
  'Consulta', 'Outro'
]

export default function AppointmentForm({ onSubmit, onCancel, initialDate = '', loading = false }) {
  const [freeSlots, setFreeSlots] = useState([])
  const [form, setForm] = useState({
    name:              '',
    phone:             '',
    service:           '',
    date:              initialDate,
    time:              '',
    price:             '',
    reminders_enabled: true,
    custom_message:    '',
  })

  useEffect(() => {
    if (form.date) {
      dashboardApi.getFreeSlots(form.date)
        .then(r => setFreeSlots(r.data.freeSlots))
        .catch(() => setFreeSlots([]))
    }
  }, [form.date])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const formatPhone = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2)  return `(${d}`
    if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  }

  const handleSubmit = e => {
    e.preventDefault()
    onSubmit({
      name:              form.name.trim(),
      phone:             form.phone.replace(/\D/g, ''),
      service:           form.service,
      date:              form.date,
      time:              form.time,
      price:             parseFloat(form.price) || 0,
      reminders_enabled: form.reminders_enabled,
      custom_message:    form.custom_message,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Client info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nome *</label>
          <input
            className="input" placeholder="João da Silva" required
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Telefone / WhatsApp *</label>
          <input
            className="input" placeholder="(11) 99999-9999" required
            value={formatPhone(form.phone)}
            onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
          />
        </div>
      </div>
      <p className="text-xs text-zinc-600 -mt-2">
        Se o cliente já existir pelo telefone, será vinculado automaticamente.
      </p>

      {/* Service */}
      <div>
        <label className="label">Serviço *</label>
        <select className="input" value={form.service} onChange={e => set('service', e.target.value)} required>
          <option value="">Selecione o serviço</option>
          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Data *</label>
          <input
            type="date" className="input"
            value={form.date}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => { set('date', e.target.value); set('time', '') }}
            required
          />
        </div>
        <div>
          <label className="label">Hora *</label>
          {freeSlots.length > 0 ? (
            <select className="input" value={form.time} onChange={e => set('time', e.target.value)} required>
              <option value="">Selecione</option>
              {freeSlots.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input type="time" className="input" value={form.time}
              onChange={e => set('time', e.target.value)} required />
          )}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="label">Valor (R$)</label>
        <input type="number" className="input" placeholder="0,00" min="0" step="0.01"
          value={form.price} onChange={e => set('price', e.target.value)} />
      </div>

      {/* Reminders */}
      <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3">
        <input type="checkbox" id="rem" checked={form.reminders_enabled}
          onChange={e => set('reminders_enabled', e.target.checked)}
          className="w-4 h-4 accent-emerald-500 cursor-pointer" />
        <label htmlFor="rem" className="text-sm font-medium text-emerald-400 cursor-pointer">
          Enviar lembretes automáticos via WhatsApp
        </label>
      </div>

      {form.reminders_enabled && (
        <div>
          <label className="label">Mensagem personalizada (opcional)</label>
          <textarea className="input resize-none" rows={3}
            placeholder="Deixe em branco para usar a mensagem padrão..."
            value={form.custom_message}
            onChange={e => set('custom_message', e.target.value)}
          />
          <p className="text-xs text-zinc-600 mt-1">
            Variáveis: {'{nome}'} {'{data}'} {'{hora}'} {'{servico}'}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2 border-t border-[#1e1e2c]">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Salvando...' : 'Confirmar Agendamento'}
        </button>
      </div>
    </form>
  )
}
