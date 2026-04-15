import { useState } from 'react'

export default function ClientForm({ onSubmit, onCancel, initial = {}, loading = false }) {
  const [form, setForm] = useState({
    name:  initial.name  || '',
    phone: initial.phone || '',
    notes: initial.notes || '',
  })

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
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nome completo *</label>
        <input className="input" placeholder="João da Silva" required
          value={form.name} onChange={e => set('name', e.target.value)} />
      </div>

      <div>
        <label className="label">Telefone/WhatsApp *</label>
        <input className="input" placeholder="(11) 99999-9999" required
          value={formatPhone(form.phone)}
          onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
        />
        <p className="text-xs text-zinc-600 mt-1">Número será usado para envio de lembretes</p>
      </div>

      <div>
        <label className="label">Observações</label>
        <textarea className="input resize-none" rows={3}
          placeholder="Preferências, alergias, observações..."
          value={form.notes} onChange={e => set('notes', e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-[#1e1e2c]">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Salvando...' : initial.id ? 'Salvar Alterações' : 'Cadastrar Cliente'}
        </button>
      </div>
    </form>
  )
}
