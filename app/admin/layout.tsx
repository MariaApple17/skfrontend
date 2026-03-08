'use client'

import { useEffect, useState } from 'react'

import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Database,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
  Wallet,
  Briefcase
} from 'lucide-react'

import { usePathname, useRouter } from 'next/navigation'

import api from '@/components/lib/api'
import AlertModal from '@/components/reusable/modal/AlertModal'

type MenuItem = {
  label: string
  href?: string
  icon?: any
  permission?: string
  children?: MenuItem[]
}

type SystemProfile = {
  systemName: string
  systemDescription?: string
  logoUrl?: string
  location?: string
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {

  const pathname = usePathname()
  const router = useRouter()

  const [permissions, setPermissions] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const [systemProfile, setSystemProfile] =
    useState<SystemProfile | null>(null)

  const [activeFiscalYear, setActiveFiscalYear] =
    useState<number | null>(null)

  /* LOAD ACTIVE FISCAL YEAR */

  useEffect(() => {

    const loadActiveFiscalYear = async () => {

      try {

        const res = await api.get('/fiscal-years')
        const fiscalYears = res.data?.data ?? []

        const active = fiscalYears.find((fy: any) => fy.isActive)

        if (active) setActiveFiscalYear(active.year)

      } catch {
        console.warn('Failed to load active fiscal year')
      }

    }

    loadActiveFiscalYear()

  }, [])

  /* LOAD SESSION */

  useEffect(() => {

    const storedPermissions = sessionStorage.getItem('permissions')
    const storedUser = sessionStorage.getItem('user')

    if (!storedPermissions || !storedUser) {
      router.replace('/login')
      return
    }

    setPermissions(JSON.parse(storedPermissions))
    setUser(JSON.parse(storedUser))

  }, [router])

  /* LOAD SYSTEM PROFILE */

  useEffect(() => {

    const loadSystemProfile = async () => {

      try {

        const res = await api.get('/system-profile')

        if (res.data?.data) {
          setSystemProfile(res.data.data)
        }

      } catch {
        console.warn('Failed to load system profile')
      }

    }

    loadSystemProfile()

  }, [])

  const hasPermission = (permission?: string) =>
    !permission || permissions.includes(permission)

  /* MENU */

  const MENU: MenuItem[] = [

    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      permission: 'DASHBOARD_VIEW'
    },

    {
      label: 'Budget Preparation',
      icon: Wallet,
      children: [
        { label: 'Budget Allocation', href: '/admin/budget-preparation/allocation' },
        { label: 'Total Budget Management', href: '/admin/budget-preparation/total' }
      ]
    },

    {
      label: 'Procurement',
      icon: ClipboardList,
      children: [
        { label: 'Procurement Request', href: '/admin/procurement/request' },
        { label: 'Manage Procurement', href: '/admin/procurement/manage' }
      ]
    },

    {
      label: 'Data Setup',
      icon: Database,
      children: [
        { label: 'Manage Classification', href: '/admin/data-setup/classification' },
        { label: 'Object of Expenditures', href: '/admin/data-setup/object-expenditures' }
      ]
    },

    {
      label: 'Plantilla of SK',
      href: '/admin/sk-plantilla',
      icon: Briefcase
    },

    {
      label: 'Programs Management',
      icon: FolderKanban,
      children: [
        { label: 'Create Program', href: '/admin/programs' },
        { label: 'Program Approval', href: '/admin/programs/approval' }
      ]
    },

    {
      label: 'User Management',
      href: '/admin/users',
      icon: Users
    },

    {
      label: 'Roles & Permissions',
      href: '/admin/roles',
      icon: Shield
    },

    {
      label: 'System Settings',
      icon: Settings,
      children: [
        { label: 'Fiscal Year', href: '/admin/system-settings/fiscal-year' },
        { label: 'System Profile', href: '/admin/system-settings/system-profile' },
        { label: 'SK Officials', href: '/admin/system-settings/sk-officials' }
      ]
    },

    {
      label: 'Reports',
      icon: BarChart3,
      children: [
        { label: 'Report Data', href: '/admin/reports/data' },
        { label: 'Procurement Report', href: '/admin/reports/procurement' },
        { label: 'Accomplishment Report', href: '/admin/reports/accomplishment' },
        { label: 'Financial Report', href: '/admin/reports/financial' }
      ]
    }

  ]

  const filteredMenu = MENU

  const getCurrentPage = () => {

    for (const item of filteredMenu) {

      if (item.href && pathname.startsWith(item.href)) {
        return item.label
      }

      if (item.children) {

        for (const child of item.children) {

          if (child.href && pathname.startsWith(child.href)) {
            return child.label
          }

        }

      }

    }

    return 'Dashboard'

  }

  const currentPage = getCurrentPage()

  const handleLogout = () => {
    sessionStorage.clear()
    router.replace('/login')
  }

  return (

    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* SIDEBAR */}

      <aside className={`${collapsed ? 'w-20' : 'w-72'} 
      bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
      text-slate-200 flex flex-col transition-all duration-300`}>

        <div className="px-5 pt-7 pb-6">

          <div className="flex items-start justify-between">

            <div className="flex flex-col items-center flex-1 gap-3">

              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/5 border border-white/10">

                {systemProfile?.logoUrl ? (
                  <img
                    src={systemProfile.logoUrl}
                    className="h-14 w-14 object-contain"
                  />
                ) : (
                  <span className="text-white text-xl font-semibold">
                    {systemProfile?.systemName?.charAt(0) ?? 'S'}
                  </span>
                )}

              </div>

              {!collapsed && (
                <>
                  <p className="text-xs text-slate-400">
                    {activeFiscalYear && `Fiscal Year ${activeFiscalYear}`}
                  </p>

                  <p className="text-xs text-slate-400 text-center">
                    {systemProfile?.systemDescription}
                  </p>
                </>
              )}

            </div>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

          </div>

        </div>

        {/* MENU */}

        <nav className="flex-1 px-3 space-y-1">

          {filteredMenu.map((item) => {

            const Icon = item.icon
            const hasChildren = !!item.children
            const isOpen = openMenu === item.label

            const active = item.href
              ? pathname.startsWith(item.href)
              : item.children?.some((c) =>
                  pathname.startsWith(c.href!)
                )

            return (

              <div key={item.label}>

                <button
                  onClick={() => {

                    if (hasChildren) {
                      setOpenMenu(isOpen ? null : item.label)
                    }

                    else if (item.href) {
                      router.push(item.href)
                    }

                  }}
                  className={`group relative flex w-full items-center gap-3 rounded-xl
                  ${collapsed ? 'justify-center px-3' : 'px-4'}
                  py-3 text-sm font-medium transition-all
                  ${active
                    ? 'bg-white/10 text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >

                  {Icon && (
                    <Icon
                      size={18}
                      className={`${active
                        ? 'text-blue-400'
                        : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                  )}

                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>

                      {hasChildren && (
                        <ChevronRight
                          size={14}
                          className={`${isOpen ? 'rotate-90' : ''}`}
                        />
                      )}
                    </>
                  )}

                </button>

                {hasChildren && isOpen && !collapsed && (

                  <div className="pl-10 space-y-1 mt-1">

                    {item.children!.map((child) => {

                      const childActive =
                        pathname.startsWith(child.href!)

                      return (

                        <button
                          key={child.href}
                          onClick={() => router.push(child.href!)}
                          className={`flex w-full rounded-lg px-3 py-2 text-sm
                          ${childActive
                            ? 'bg-white/10 text-white'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >

                          {child.label}

                        </button>

                      )

                    })}

                  </div>

                )}

              </div>

            )

          })}

        </nav>

        {/* LOGOUT */}

        <div className="p-4 border-t border-slate-800">

          <button
            onClick={() => setLogoutOpen(true)}
            className="flex items-center gap-2 w-full justify-center py-2 rounded-lg bg-white/5 hover:bg-white/10"
          >

            <LogOut size={16} />

            {!collapsed && 'Logout'}

          </button>

        </div>

      </aside>

      {/* MAIN */}

      <div className="flex-1 flex flex-col">

        {/* NEW NAVBAR DESIGN */}

        <header className="flex items-center justify-between px-10 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">

          <div className="flex items-center gap-4">

            <h1 className="text-xl font-semibold bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent">
              {currentPage}
            </h1>

            {activeFiscalYear && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                FY {activeFiscalYear}
              </span>
            )}

          </div>

          {user && (

            <div className="flex items-center gap-3">

              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-700">
                  {user.fullName}
                </p>
                <p className="text-xs text-slate-400">
                  {user.role?.name}
                </p>
              </div>

              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-semibold shadow-md">
                {user.fullName?.charAt(0)}
              </div>

            </div>

          )}

        </header>

        <main className="flex-1 p-10 overflow-y-auto">
          {children}
        </main>

      </div>

      <AlertModal
        open={logoutOpen}
        type="warning"
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        showCancel
        onConfirm={handleLogout}
        onClose={() => setLogoutOpen(false)}
      />

    </div>

  )
}