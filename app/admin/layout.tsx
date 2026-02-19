'use client';

import {
  useEffect,
  useState,
} from 'react';

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
} from 'lucide-react';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';

type MenuItem = {
  label: string;
  href?: string;
  icon?: any;
  permission?: string;
  children?: MenuItem[];
};

type SystemProfile = {
  systemName: string;
  systemDescription?: string;
  logoUrl?: string;
  location?: string;
  fiscalYear?: {
    id: number;
    year: number;
    isActive: boolean;
  };
};

const SYSTEM_PROFILE_CACHE_KEY = 'system_profile_cache_v1';
const SYSTEM_PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [permissions, setPermissions] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // ✅ SYSTEM PROFILE STATE
  const [systemProfile, setSystemProfile] =
    useState<SystemProfile | null>(null);

  // Add global styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
      
      * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-slide-in {
        animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      .scrollbar-thin::-webkit-scrollbar {
        width: 4px;
      }

      .scrollbar-thin::-webkit-scrollbar-track {
        background: transparent;
      }

      .scrollbar-thin::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.3);
        border-radius: 2px;
      }

      .scrollbar-thin::-webkit-scrollbar-thumb:hover {
        background: rgba(148, 163, 184, 0.5);
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  /* ================= LOAD SESSION DATA ================= */
  useEffect(() => {
    const storedPermissions = sessionStorage.getItem('permissions');
    const storedUser = sessionStorage.getItem('user');

    if (!storedPermissions || !storedUser) {
      router.replace('/login');
      return;
    }

    setPermissions(JSON.parse(storedPermissions));
    setUser(JSON.parse(storedUser));
  }, [router]);

  /* ================= LOAD SYSTEM PROFILE ================= */
  useEffect(() => {
    const loadSystemProfile = async () => {
      let hasFreshCache = false;

      try {
        const cachedRaw = sessionStorage.getItem(SYSTEM_PROFILE_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw) as {
            data?: SystemProfile;
            ts?: number;
          };

          if (cached?.data) {
            setSystemProfile(cached.data);
          }

          if (
            cached?.data &&
            typeof cached.ts === 'number' &&
            Date.now() - cached.ts < SYSTEM_PROFILE_CACHE_TTL_MS
          ) {
            hasFreshCache = true;
          }
        }
      } catch {
        sessionStorage.removeItem(SYSTEM_PROFILE_CACHE_KEY);
      }

      if (hasFreshCache) return;

      try {
        const res = await api.get('/system-profile');
        const profile = res.data?.data as SystemProfile | undefined;

        if (profile) {
          setSystemProfile(profile);
          sessionStorage.setItem(
            SYSTEM_PROFILE_CACHE_KEY,
            JSON.stringify({
              data: profile,
              ts: Date.now(),
            })
          );
        }
      } catch {
        console.warn('Failed to load system profile');
      }
    };

    loadSystemProfile();
  }, []);

  const hasPermission = (permission?: string) =>
    !permission || permissions.includes(permission);

  const MENU: MenuItem[] = [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      permission: 'DASHBOARD_VIEW',
    },
    {
      label: 'Budget Preparation',
      icon: Wallet,
      children: [
        {
          label: 'Budget Allocation',
          href: '/admin/budget-preparation/allocation',
          permission: 'BUDGET_ALLOCATION_VIEW',
        },
        {
          label: 'Total Budget Management',
          href: '/admin/budget-preparation/total',
          permission: 'BUDGET_TOTAL_VIEW',
        },
      ],
    },
    {
      label: 'Procurement',
      icon: ClipboardList,
      children: [
        {
          label: 'Procurement Request',
          href: '/admin/procurement/request',
          permission: 'PROCUREMENT_REQUEST_VIEW',
        },
        {
          label: 'Manage Procurement',
          href: '/admin/procurement/manage',
          permission: 'PROCUREMENT_MANAGE_VIEW',
        },
      ],
    },
    {
      label: 'Data Setup',
      icon: Database,
      children: [
        {
          label: 'Manage Classification',
          href: '/admin/data-setup/classification',
          permission: 'CLASSIFICATION_VIEW',
        },
        {
          label: 'Object of Expenditures',
          href: '/admin/data-setup/object-expenditures',
          permission: 'OBJECT_EXPENDITURES_VIEW',
        },
      ],
    },
    {
      label: 'Programs Management',
      href: '/admin/programs',
      icon: FolderKanban,
      permission: 'PROGRAMS_VIEW',
    },
    {
      label: 'User Management',
      href: '/admin/users',
      icon: Users,
      permission: 'USERS_VIEW',
    },
    {
      label: 'Roles & Permissions',
      href: '/admin/roles',
      icon: Shield,
      permission: 'ROLES_VIEW',
    },
    {
      label: 'System Settings',
      icon: Settings,
      permission: 'SYSTEM_SETTINGS_VIEW',
      children: [
        { label: 'Fiscal Year', href: '/admin/system-settings/fiscal-year' },
        { label: 'System Profile', href: '/admin/system-settings/system-profile' },
        { label: 'SK Officials', href: '/admin/system-settings/sk-officials' },
      ],
    },
    {
      label: 'Reports',
      icon: BarChart3,
      permission: 'REPORTS_VIEW',
      children: [
        { label: 'Report Data', href: '/admin/reports/data' },
        { label: 'Procurement Report', href: '/admin/reports/procurement' },
        { label: 'Accomplishment Report', href: '/admin/reports/accomplishment' },
        { label: 'Financial Report', href: '/admin/reports/financial' },
      ],
    },
  ];

  const filteredMenu = MENU.filter((item) =>
    item.children
      ? item.children.some((c) => hasPermission(c.permission))
      : hasPermission(item.permission)
  );

  // Enhanced dynamic page title logic
  const getCurrentPage = () => {
    // Check for exact matches first
    for (const item of filteredMenu) {
      if (item.href && pathname === item.href) {
        return item.label;
      }
      
      // Check children for exact match
      if (item.children) {
        for (const child of item.children) {
          if (child.href && pathname === child.href) {
            return child.label;
          }
        }
      }
    }

    // Check for partial matches (startsWith)
    for (const item of filteredMenu) {
      if (item.href && pathname.startsWith(item.href)) {
        return item.label;
      }
      
      // Check children for partial match
      if (item.children) {
        for (const child of item.children) {
          if (child.href && pathname.startsWith(child.href)) {
            return child.label;
          }
        }
      }
    }

    // Default fallback
    return 'Dashboard';
  };

  const currentPage = getCurrentPage();

  const handleLogout = () => {
    sessionStorage.clear();
    router.replace('/login');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ================= SIDEBAR ================= */}
      <aside
        className={`${
          collapsed ? 'w-20' : 'w-72'
        } bg-white border-r border-slate-100 flex flex-col transition-all duration-300 relative`}
      >
        {/* -------- HEADER -------- */}
        <div className="px-5 pt-7 pb-6 mb-2">
          <div className="flex items-start justify-between">
            {/* LEFT: BRAND */}
            <div className="flex flex-col items-center flex-1 text-center gap-3">
              {/* LOGO */}
              <div className="relative">
                <div className="flex h-30 w-30 items-center justify-center rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                  {systemProfile?.logoUrl ? (
                    <img
                      src={systemProfile.logoUrl}
                      alt={systemProfile.systemName}
                      className="h-50 w-50 object-contain"
                    />
                  ) : (
                    <span className="text-slate-600 font-medium text-lg">
                      {systemProfile?.systemName?.charAt(0) ?? 'S'}   
                    </span>
                  )}
                </div>
              </div>

              {/* TEXT */}
              {!collapsed && (
                <div className="space-y-1 max-w-full animate-slide-in">
                  <p className="text-sm font-medium text-slate-700 truncate px-2">
                    {systemProfile?.systemName ?? 'System'}
                  </p>

             <p className="text-xs text-slate-400 px-2 leading-relaxed line-clamp-2 break-words">
  {systemProfile?.systemDescription ?? 'Management Platform'}
</p>


                  {systemProfile?.location && (
                    <p className="text-[11px] text-slate-400 leading-relaxed truncate px-2">
                      📍 {systemProfile.location}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: COLLAPSE ICON */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-2 shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors duration-200"
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        {/* -------- MENU -------- */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-thin pb-4">
          {filteredMenu.map((item, index) => {
            const Icon = item.icon;
            const hasChildren = !!item.children;
            const active = item.href
              ? pathname.startsWith(item.href)
              : item.children?.some((c) =>
                  pathname.startsWith(c.href!)
                );
            const isOpen = openMenu === item.label;

            return (
              <div key={item.label} className="animate-slide-in" style={{ animationDelay: `${index * 0.03}s` }}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      setOpenMenu(isOpen ? null : item.label);
                    } else if (item.href) {
                      router.push(item.href);
                    }
                  }}
                  className={`group relative flex w-full items-center gap-3 rounded-xl
                    ${collapsed ? 'justify-center px-3' : 'px-3.5'}
                    py-2.5 text-sm font-medium transition-all duration-200
                    ${
                      active
                        ? 'bg-slate-100 text-slate-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-slate-600 rounded-r-full"></div>
                  )}
                  
                  {Icon && (
                    <Icon
                      size={18}
                      className={`transition-colors ${
                        active
                          ? 'text-slate-600'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                      strokeWidth={active ? 2 : 1.5}
                    />
                  )}

                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">
                        {item.label}
                      </span>
                      {hasChildren && (
                        <ChevronRight
                          size={14}
                          className={`transition-transform duration-200 text-slate-400 ${
                            isOpen ? 'rotate-90' : ''
                          }`}
                        />
                      )}
                    </>
                  )}
                </button>

                {hasChildren && isOpen && !collapsed && (
                  <div className="mt-0.5 space-y-0.5 pl-10 animate-slide-in">
                    {item.children!
                      .filter((c) =>
                        hasPermission(c.permission)
                      )
                      .map((child) => {
                        const childActive =
                          pathname.startsWith(child.href!);

                        return (
                          <button
                            key={child.href}
                            onClick={() =>
                              router.push(child.href!)
                            }
                            className={`flex w-full rounded-lg px-3.5 py-2 text-sm transition-all duration-200
                              ${
                                childActive
                                  ? 'bg-slate-50 text-slate-700 font-medium'
                                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                              }`}
                          >
                            {child.label}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* -------- LOGOUT -------- */}
        <div className="px-3 pb-4 pt-2 border-t border-slate-100">
          <button
            onClick={() => setLogoutOpen(true)}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl py-2.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors duration-200"
          >
            <LogOut size={16} strokeWidth={2} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ================= MAIN ================= */}
      <div className="w-screen h-screen flex overflow-hidden">
        <div className="flex flex-1 flex-col w-full overflow-hidden">
          {/* -------- HEADER -------- */}
          <header className="flex-shrink-0 w-full bg-white px-12 lg:px-16 xl:px-20 py-5 flex items-center justify-between border-b border-slate-100">
            <div>
              <h1 className="text-xl font-medium text-slate-700">
                {currentPage}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {systemProfile?.fiscalYear?.year && `Fiscal Year ${systemProfile.fiscalYear.year}`}
              </p>
            </div>

            {user && (
              <div className="flex items-center gap-3.5">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {user.role?.name}
                  </p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-medium text-sm border border-slate-200">
                  {user.fullName?.charAt(0)}
                </div>
              </div>
            )}
          </header>

          {/* -------- MAIN CONTENT -------- */}
          <main className="flex-1 w-full overflow-y-auto overflow-x-hidden px-12 lg:px-16 xl:px-20 py-8 bg-slate-50">
            {children}
          </main>

          {/* -------- FOOTER -------- */}
          <footer className="flex-shrink-0 w-full bg-white px-12 lg:px-16 xl:px-20 py-4 text-xs text-slate-400 text-center border-t border-slate-100">
            © {new Date().getFullYear()}{' '}
            <span className="font-medium text-slate-600">
              {systemProfile?.systemName ?? 'System'}
            </span>
            {systemProfile?.fiscalYear?.year
              ? ` · FY ${systemProfile.fiscalYear.year}`
              : ''}
            . All rights reserved.
          </footer>
        </div>
      </div>

      {/* ================= LOGOUT MODAL ================= */}
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
  );
}
