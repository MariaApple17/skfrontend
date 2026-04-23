'use client';

import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import api from '@/components/lib/api';
import AlertModal from '@/components/reusable/modal/AlertModal';
import FlatInput from '@/components/reusable/ui/FlatInput';

interface SystemProfile {
  systemName: string;
  systemDescription?: string;
  logoUrl?: string;
  location?: string;
  fiscalYear?: {
    year: number;
  };
}

export default function LoginPage() {
  const router = useRouter();

  const [systemProfile, setSystemProfile] = useState<SystemProfile | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [emailTouched, setEmailTouched] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showEmailError = emailTouched && email && !isValidEmail;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadSystemProfile = async () => {
      try {
        const res = await api.get('/system-profile');
        if (res.data?.success) {
          setSystemProfile(res.data.data);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadSystemProfile();
  }, []);

  const handleLogin = async () => {
    if (!isValidEmail) {
      setError('Please enter a valid email');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });

      if (!res.data?.success) throw new Error(res.data?.message);

      sessionStorage.setItem('token', res.data.data.token);

      sessionStorage.setItem(
        'permissions',
        JSON.stringify(res.data.data.user.role.permissions)
      );

      sessionStorage.setItem(
        'user',
        JSON.stringify(res.data.data.user)
      );

      setSuccess(true);

      setTimeout(() => {
        router.replace('/admin/dashboard');
      }, 1200);

    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid login');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email && password && isValidEmail;

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 overflow-hidden bg-gradient-to-br from-black via-slate-900 to-indigo-950">

      {/* Animated background blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-30 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-[120px] opacity-30 animate-pulse delay-700" />

      {/* LEFT BRANDING */}
      <div
        className={`
        hidden lg:flex flex-col justify-center px-20 text-white
        transition-all duration-1000
        ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}
      `}
      >
        <div className="flex items-center gap-4 mb-10">

          {systemProfile?.logoUrl ? (
            <img
              src={systemProfile.logoUrl}
              alt="logo"
              className="w-20 h-20 object-contain"
            />
          ) : (
            <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center text-3xl font-bold">
              SK
            </div>
          )}

          <h1 className="text-4xl font-bold">
            {systemProfile?.systemName ?? 'SK360'}
          </h1>

        </div>

        <h2 className="text-6xl font-bold leading-tight max-w-2xl">
          Empowering Youth Through
          <span className="block text-red-500">
            Transparent Leadership
          </span>
        </h2>

        {/* Philippine flag accent */}
        <div className="mt-8 w-40 h-1.5 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-blue-600 shadow-lg shadow-red-500/30" />

        <p className="mt-8 text-lg text-slate-300 max-w-xl leading-relaxed">
          {systemProfile?.systemDescription ??
            'A digital platform for managing SK budgets, programs, and reports while promoting transparency and accountability.'}
        </p>
        Bongbong, Trinidad, Bohol
      </div>

      {/* LOGIN SECTION */}
      <div className="flex items-center justify-center p-8">

        <div
          className={`
          w-full max-w-xl
          transition-all duration-500
          ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
        `}
        >

          <div
            className="
            backdrop-blur-xl
            bg-white/80
            border border-white/20
            rounded-3xl
            p-14
            shadow-[0_30px_120px_rgba(0,0,0,0.35)]
          "
          >

            {/* LOGIN HEADER */}
            <div className="text-center mb-8">

              {systemProfile?.logoUrl && (
                <div className="flex justify-center mb-4">
                  <img
                    src={systemProfile.logoUrl}
                    alt="logo"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              )}

              <h1 className="text-3xl font-bold text-slate-800">
                Official Login
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Access the SK360 dashboard
              </p>

            </div>

            {/* FORM */}
            <div className="space-y-3">

              <div className="space-y-1">
                <FlatInput
                  label="Email"
                  type="email"
                  placeholder="user@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  icon={Mail}
                />

                {showEmailError && (
                  <div className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3" />
                    Invalid email
                  </div>
                )}

                {emailTouched && isValidEmail && (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="w-3 h-3" />
                    Valid email
                  </div>
                )}
              </div>

              <div className="relative">
                <FlatInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={Lock}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-slate-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <button
                onClick={handleLogin}
                disabled={!isFormValid || loading}
                className="
                w-full mt-4 py-4 rounded-xl text-white font-semibold
                bg-gradient-to-r from-blue-600 to-indigo-600
                hover:shadow-xl hover:shadow-blue-500/40
                transition-all duration-300
              "
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

            </div>

            <div className="mt-8 text-center text-xs text-slate-500">
              Secured by {systemProfile?.systemName ?? 'System'}
            </div>

          </div>

          {/* SYSTEM INFO */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {systemProfile?.systemName}
            {systemProfile?.fiscalYear?.year &&
              ` • FY ${systemProfile.fiscalYear.year}`}
          </div>

        </div>

      </div>

      <AlertModal
        open={!!error}
        type="error"
        title="Login Failed"
        message={error}
        confirmText="Try Again"
        onConfirm={() => setError('')}
        onClose={() => setError('')}
      />

      <AlertModal
        open={success}
        type="success"
        title="Login Successful"
        message="Redirecting to dashboard..."
        confirmText="Continue"
        onConfirm={() => router.replace('/admin/dashboard')}
        onClose={() => router.replace('/admin/dashboard')}
      />

    </div>
  );
}