import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LayoutDashboard, CalendarCheck, Users, Settings, Wifi, WifiOff, X, Menu } from 'lucide-react'
import { whatsappApi } from '../services/api'

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/appointments', icon: CalendarCheck,   label: 'Agendamentos' },
  { to: '/clients',      icon: Users,           label: 'Clientes' },
  { to: '/settings',     icon: Settings,        label: 'Configurações' },
]

export default function Layout() {
  const [wpStatus, setWpStatus]   = useState('loading')
  const [menuOpen, setMenuOpen]   = useState(false)

  useEffect(() => {
    const check = () =>
      whatsappApi.getStatus().then(r => setWpStatus(r.data.status)).catch(() => setWpStatus('error'))
    check()
    const iv = setInterval(check, 8000)
    return () => clearInterval(iv)
  }, [])

  const isReady = wpStatus === 'ready'

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1a1a26] flex items-center justify-between">
        <span className="text-lg font-bold text-emerald-400 tracking-wide">Agenda</span>
        {/* Close button mobile only */}
        <button
          className="md:hidden text-zinc-500 hover:text-white p-1"
          onClick={() => setMenuOpen(false)}
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#16161f]'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* WhatsApp status */}
      <div className="px-4 py-4 border-t border-[#1a1a26]">
        <div className={`flex items-center gap-2 text-xs font-medium ${isReady ? 'text-emerald-400' : 'text-zinc-600'}`}>
          {isReady ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{isReady ? 'WhatsApp ativo' : 'WhatsApp inativo'}</span>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0b12]">

      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-56 bg-[#0d0d15] border-r border-[#1a1a26] flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-64 bg-[#0d0d15] border-r border-[#1a1a26] flex flex-col">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0d0d15] border-b border-[#1a1a26] shrink-0">
          <span className="text-base font-bold text-emerald-400 tracking-wide">Agenda</span>
          <button
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-[#16161f] transition-colors"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
