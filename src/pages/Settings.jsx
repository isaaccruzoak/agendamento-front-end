import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Save, Wifi, WifiOff, RefreshCw, Send, Camera } from 'lucide-react'
import { settingsApi, whatsappApi } from '../services/api'
import QrCameraScanner from '../components/QrCameraScanner'

export default function Settings() {
  const [settings, setSettings]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [wpStatus, setWpStatus]       = useState('loading')
  const [qrCode, setQrCode]           = useState(null)
  const [wpLoading, setWpLoading]     = useState(false)
  const [testPhone, setTestPhone]     = useState('')
  const [testMsg, setTestMsg]         = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [showCamera, setShowCamera]   = useState(false)

  useEffect(() => {
    settingsApi.get()
      .then(r => setSettings(r.data))
      .catch(() => toast.error('Erro ao carregar configurações'))
      .finally(() => setLoading(false))
    checkWpStatus()
  }, [])

  const checkWpStatus = () => {
    whatsappApi.getStatus()
      .then(r => {
        setWpStatus(r.data.status)
        if (r.data.status === 'qr' && r.data.qr) setQrCode(r.data.qr)
        else setQrCode(null)
      })
      .catch(() => setWpStatus('error'))
  }

  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsApi.update(settings)
      toast.success('Configurações salvas!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleConnect = async () => {
    setWpLoading(true)
    try {
      await whatsappApi.connect()
      toast.success('Iniciando conexão...')
      setTimeout(() => { checkWpStatus(); setWpLoading(false) }, 3000)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao conectar')
      setWpLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Desconectar o WhatsApp?')) return
    setWpLoading(true)
    try {
      await whatsappApi.disconnect()
      toast.success('WhatsApp desconectado')
      setQrCode(null)
      checkWpStatus()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao desconectar')
    } finally {
      setWpLoading(false)
    }
  }

  const handleSendTest = async () => {
    if (!testPhone) { toast.error('Informe o número de destino'); return }
    setTestLoading(true)
    try {
      await whatsappApi.sendTest({ phone: testPhone, message: testMsg || 'Teste de mensagem do AgendaPro!' })
      toast.success('Mensagem de teste enviada!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar mensagem de teste')
    } finally {
      setTestLoading(false)
    }
  }

  const isReady = wpStatus === 'ready'

  const statusInfo = {
    ready:        { label: 'Conectado',          color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    qr:           { label: 'Aguardando QR Code', color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
    connecting:   { label: 'Conectando...',       color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20' },
    disconnected: { label: 'Desconectado',        color: 'text-zinc-500',    bg: 'bg-[#16161f]',      border: 'border-[#2a2a3a]' },
    error:        { label: 'Erro de conexão',     color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
    unavailable:  { label: 'Indisponível',        color: 'text-zinc-600',    bg: 'bg-[#16161f]',      border: 'border-[#2a2a3a]' },
    loading:      { label: 'Verificando...',      color: 'text-zinc-600',    bg: 'bg-[#16161f]',      border: 'border-[#2a2a3a]' },
  }[wpStatus] || { label: wpStatus, color: 'text-zinc-500', bg: 'bg-[#16161f]', border: 'border-[#2a2a3a]' }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-[#111119] rounded-xl animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl">
      {showCamera && (
        <QrCameraScanner
          onDetect={(data) => {
            toast.success('QR Code detectado! Aguarde a conexão...')
            setShowCamera(false)
            setTimeout(checkWpStatus, 3000)
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Configurações</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Personalize o sistema de agendamento</p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={14} />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* WhatsApp Sender */}
      <section className="card space-y-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Número Remetente</h2>
        <div>
          <label className="label">Número que irá enviar as mensagens</label>
          <input
            className="input" placeholder="5511999999999"
            value={settings?.whatsapp_sender_phone ?? ''}
            onChange={e => set('whatsapp_sender_phone', e.target.value.replace(/\D/g, ''))}
          />
          <p className="text-xs text-zinc-600 mt-1.5">Somente dígitos com código do país. Ex: 5511999999999</p>
        </div>
      </section>

      {/* Working Hours */}
      <section className="card space-y-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Horário de Funcionamento</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Abertura</label>
            <input
              type="number" className="input" min="0" max="23"
              value={settings?.working_hours_start ?? 8}
              onChange={e => set('working_hours_start', e.target.value)}
            />
            <p className="text-xs text-zinc-600 mt-1">Hora de início (0–23)</p>
          </div>
          <div>
            <label className="label">Encerramento</label>
            <input
              type="number" className="input" min="1" max="24"
              value={settings?.working_hours_end ?? 18}
              onChange={e => set('working_hours_end', e.target.value)}
            />
            <p className="text-xs text-zinc-600 mt-1">Hora de fim (1–24)</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="card space-y-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Preço Padrão</h2>
        <div>
          <label className="label">Valor por horário (R$)</label>
          <input
            type="number" className="input" min="0" step="0.01" placeholder="100.00"
            value={settings?.price_per_slot ?? ''}
            onChange={e => set('price_per_slot', e.target.value)}
          />
          <p className="text-xs text-zinc-600 mt-1">Usado para cálculo do potencial perdido no dashboard</p>
        </div>
      </section>

      {/* Reminder Messages */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Mensagens de Lembrete</h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox" id="reminders_enabled"
              checked={settings?.reminders_enabled === 'true' || settings?.reminders_enabled === true}
              onChange={e => set('reminders_enabled', String(e.target.checked))}
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
            <label htmlFor="reminders_enabled" className="text-xs font-medium text-zinc-400 cursor-pointer">
              Lembretes automáticos ativos
            </label>
          </div>
        </div>

        <p className="text-xs text-zinc-600">
          Variáveis:{' '}
          {['{nome}', '{data}', '{hora}', '{servico}'].map(v => (
            <code key={v} className="bg-[#1a1a24] border border-[#2a2a3a] px-1.5 py-0.5 rounded text-zinc-400 mr-1">{v}</code>
          ))}
        </p>

        <div>
          <label className="label">Lembrete 1 dia antes</label>
          <textarea
            className="input resize-none" rows={3}
            value={settings?.reminder_message_1day ?? ''}
            onChange={e => set('reminder_message_1day', e.target.value)}
          />
        </div>

        <div>
          <label className="label">Lembrete 1 hora antes</label>
          <textarea
            className="input resize-none" rows={3}
            value={settings?.reminder_message_1hour ?? ''}
            onChange={e => set('reminder_message_1hour', e.target.value)}
          />
        </div>
      </section>

      {/* WhatsApp */}
      <section className="card space-y-4">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">WhatsApp</h2>

        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${statusInfo.bg} ${statusInfo.border}`}>
          <div className={`flex items-center gap-2 font-medium text-sm ${statusInfo.color}`}>
            {isReady ? <Wifi size={14} /> : <WifiOff size={14} />}
            {statusInfo.label}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={checkWpStatus}
              className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-[#1e1e2c] rounded-lg transition-colors"
              title="Atualizar status"
            >
              <RefreshCw size={12} />
            </button>
            {isReady ? (
              <button className="btn-secondary text-xs" onClick={handleDisconnect} disabled={wpLoading}>
                Desconectar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button className="btn-primary text-xs" onClick={handleConnect} disabled={wpLoading}>
                  {wpLoading ? 'Aguarde...' : 'Conectar'}
                </button>
                <button
                  className="btn-secondary text-xs"
                  title="Escanear QR com câmera"
                  onClick={() => setShowCamera(true)}
                >
                  <Camera size={13} />
                </button>
              </div>
            )}
          </div>
        </div>

        {qrCode && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-zinc-400 font-medium">Escaneie o QR Code com o WhatsApp</p>
            <div className="p-3 bg-white rounded-xl shadow-lg">
              <img src={qrCode} alt="QR Code WhatsApp" className="w-56 h-56" />
            </div>
            <p className="text-xs text-zinc-600 text-center">
              WhatsApp → Dispositivos vinculados → Vincular dispositivo
            </p>
            <button
              className="btn-secondary text-xs gap-2"
              onClick={() => setShowCamera(true)}
            >
              <Camera size={14} />
              Escanear com câmera
            </button>
          </div>
        )}

        {isReady && (
          <div className="space-y-3 pt-2 border-t border-[#1e1e2c]">
            <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">Mensagem de teste</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Número destino</label>
                <input
                  className="input" placeholder="5511999999999"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div>
                <label className="label">Mensagem</label>
                <input
                  className="input" placeholder="Texto de teste..."
                  value={testMsg}
                  onChange={e => setTestMsg(e.target.value)}
                />
              </div>
            </div>
            <button className="btn-secondary text-xs" onClick={handleSendTest} disabled={testLoading}>
              <Send size={13} />
              {testLoading ? 'Enviando...' : 'Enviar Teste'}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
