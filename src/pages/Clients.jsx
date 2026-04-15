import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, User } from 'lucide-react'
import { clientsApi } from '../services/api'
import Modal from '../components/Modal'
import ClientForm from '../components/ClientForm'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    clientsApi.getAll()
      .then(r => setClients(r.data))
      .catch(() => toast.error('Erro ao carregar clientes'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (form) => {
    setSaving(true)
    try {
      await clientsApi.create(form)
      toast.success('Cliente cadastrado!')
      setShowNew(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar cliente')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (form) => {
    setSaving(true)
    try {
      await clientsApi.update(editing.id, form)
      toast.success('Cliente atualizado!')
      setEditing(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao atualizar cliente')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Remover "${name}"? Os agendamentos vinculados também serão excluídos.`)) return
    try {
      await clientsApi.remove(id)
      toast.success('Cliente removido')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao remover cliente')
    }
  }

  const fmtPhone = (p = '') => {
    const d = p.replace(/\D/g, '')
    if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
    if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
    return p
  }

  const fmtDate = (d) => {
    try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }) }
    catch { return d }
  }

  const filtered = clients.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name?.toLowerCase().includes(q) || c.phone?.includes(q)
  })

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Clientes</h1>
          <p className="text-xs text-zinc-500 mt-0.5">{clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>
          <Plus size={15} /> Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="card py-3.5">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input
            className="input pl-8 text-xs"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
            <User size={36} className="text-zinc-800 mb-3" />
            <p className="text-zinc-600 text-sm">
              {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
            </p>
            {!search && (
              <button className="btn-primary mt-4 text-xs" onClick={() => setShowNew(true)}>
                <Plus size={13} /> Cadastrar Cliente
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e1e2c]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">Observações</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-600 uppercase tracking-wide">Desde</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr
                  key={c.id}
                  className={`border-b border-[#161620] hover:bg-[#141420] transition-colors ${idx === filtered.length - 1 ? 'border-0' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-emerald-400">{c.name?.[0]?.toUpperCase()}</span>
                      </div>
                      <span className="font-semibold text-white text-sm">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{fmtPhone(c.phone)}</td>
                  <td className="px-4 py-3 text-zinc-600 text-xs max-w-xs truncate">{c.notes || <span className="text-zinc-800">—</span>}</td>
                  <td className="px-4 py-3 text-zinc-600 text-xs">{fmtDate(c.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button title="Editar" onClick={() => setEditing(c)}
                        className="p-1.5 text-zinc-700 hover:text-zinc-300 hover:bg-[#1e1e2c] rounded-lg transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button title="Remover" onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-zinc-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Novo Cliente">
        <ClientForm onSubmit={handleCreate} onCancel={() => setShowNew(false)} loading={saving} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar Cliente">
        <ClientForm initial={editing || {}} onSubmit={handleUpdate} onCancel={() => setEditing(null)} loading={saving} />
      </Modal>
    </div>
  )
}
