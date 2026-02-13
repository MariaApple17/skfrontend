'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  usePathname,
  useRouter,
} from 'next/navigation';

import AlertModal from '@/components/reusable/modal/AlertModal';

interface AuthGuardProps {
  children: React.ReactNode;
}

/* ================= CONFIG ================= */

const PUBLIC_ROUTES = ['/login'];
const DEFAULT_REDIRECT = '/admin/dashboard';

/**
 * Route → Required Permission
 * Must match sidebar + backend permissions
 */
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/admin/dashboard': 'DASHBOARD_VIEW',

  '/admin/budget-preparation/allocation': 'BUDGET_ALLOCATION_VIEW',
  '/admin/budget-preparation/total': 'BUDGET_TOTAL_VIEW',

  '/admin/procurement/request': 'PROCUREMENT_REQUEST_VIEW',
  '/admin/procurement/manage': 'PROCUREMENT_MANAGE_VIEW',

  '/admin/data-setup/fiscal-year': 'FISCAL_YEAR_VIEW',
  '/admin/data-setup/classification': 'CLASSIFICATION_VIEW',
  '/admin/data-setup/object-expenditures': 'OBJECT_EXPENDITURES_VIEW',

  '/admin/programs': 'PROGRAMS_VIEW',
  '/admin/users': 'USERS_VIEW',
  '/admin/roles': 'ROLES_VIEW',
};

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

      const token = sessionStorage.getItem('token');
      const storedPermissions = sessionStorage.getItem('permissions');

      /* ================= PUBLIC ROUTES ================= */
      if (isPublicRoute) {
        if (token) {
          router.replace(DEFAULT_REDIRECT);
          return;
        }
        setLoading(false);
        return;
      }

      /* ================= AUTH CHECK ================= */
      if (!token || !storedPermissions) {
        sessionStorage.clear();
        router.replace('/login');
        return;
      }

      const permissions: string[] = JSON.parse(storedPermissions);

      /* ================= PERMISSION CHECK ================= */
      const requiredPermission = Object.entries(ROUTE_PERMISSIONS).find(
        ([route]) => pathname.startsWith(route)
      )?.[1];

      if (requiredPermission && !permissions.includes(requiredPermission)) {
        router.replace('/403'); // or DEFAULT_REDIRECT
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router, pathname]);

  if (loading) return null;

  return (
    <>
      {children}

      <AlertModal
        open={!!error}
        type="error"
        title="Session Error"
        message={error ?? ''}
        confirmText="Go to Login"
        onConfirm={() => {
          sessionStorage.clear();
          router.replace('/login');
        }}
        onClose={() => {
          sessionStorage.clear();
          router.replace('/login');
        }}
      />
    </>
  );
};

export default AuthGuard;
