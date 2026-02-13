'use client';

import {
  useEffect,
  useState,
} from 'react';

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

  // ================= SYSTEM PROFILE =================
  const [systemProfile, setSystemProfile] = useState<SystemProfile | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Email validation
  const [emailTouched, setEmailTouched] = useState(false);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const showEmailError = emailTouched && email && !isValidEmail;

  // Mount animation
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load system profile
  useEffect(() => {
    const loadSystemProfile = async () => {
      try {
        const res = await api.get('/system-profile');
        if (res.data?.success) {
          setSystemProfile(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load system profile', err);
      }
    };

    loadSystemProfile();
  }, []);

  // Handle Enter key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !loading && email && password) {
        handleLogin();
      }
    };
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [email, password, loading]);

  const handleLogin = async () => {
    if (!isValidEmail) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Login failed');
      }

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
      setError(
        err?.response?.data?.message ||
        err.message ||
        'Invalid email or password'
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = email && password && isValidEmail;

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700" />
      </div>

      <div 
        className={`
          relative w-full max-w-md
          transition-all duration-700 ease-out
          ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        <div className="rounded-3xl bg-white/80 backdrop-blur-xl p-10 shadow-[0_20px_80px_rgba(0,0,0,0.12)] border border-white/20">
          
          {/* Logo with animation */}
          <div className="mb-8 flex justify-center">
            <div 
              className={`
                relative transition-all duration-700 delay-100
                ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
              `}
            >
              <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-xl opacity-20 animate-pulse" />
              <div className="relative bg-linear-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                {systemProfile?.logoUrl ? (
                  <img
                    src={systemProfile.logoUrl}
                    alt={systemProfile.systemName}
                    width={64}
                    height={64}
                    className="relative z-10"
                  />
                ) : (
                  <span className="relative z-10 text-white text-2xl font-bold">
                    {systemProfile?.systemName?.charAt(0) ?? 'S'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Header */}
          <div 
            className={`
              mb-8 text-center
              transition-all duration-700 delay-200
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <h1 className="text-3xl font-bold bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              {systemProfile?.systemName ?? 'Welcome Back'}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {systemProfile?.systemDescription ?? 'Sign in to access your dashboard'}
            </p>
          </div>

          {/* Form */}
          <div 
            className={`
              space-y-5
              transition-all duration-700 delay-300
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {/* Email Input */}
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
                <div className="flex items-center gap-1.5 text-xs text-red-500">
                  <AlertCircle className="w-3 h-3" />
                  <span>Please enter a valid email address</span>
                </div>
              )}
              {emailTouched && isValidEmail && (
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Valid email</span>
                </div>
              )}
            </div>

            {/* Password Input */}
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
                className="absolute right-3 top-9.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading || !isFormValid}
              className="
                group relative mt-2 w-full rounded-xl py-3.5 text-sm font-semibold
                bg-linear-to-r from-blue-600 to-indigo-600
                text-white shadow-lg shadow-blue-500/30
                hover:shadow-xl hover:shadow-blue-500/40
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                transition-all duration-200
              "
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </div>

          {/* Footer accent */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="h-1 w-12 rounded-full bg-linear-to-r from-yellow-400 to-amber-400 shadow-lg shadow-yellow-400/30" />
            <p className="text-xs text-slate-400">
              Secured by {systemProfile?.systemName ?? 'System'}
            </p>
          </div>
        </div>

        {/* System Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            {systemProfile?.systemName}
            {systemProfile?.fiscalYear?.year
              ? ` • FY ${systemProfile.fiscalYear.year}`
              : ''}
          </p>
          <p className="mt-1 text-xs text-slate-300">
            © {new Date().getFullYear()} All rights reserved
          </p>
          {systemProfile?.location && (
            <p className="mt-1 text-xs text-slate-300">
              {systemProfile.location}
            </p>
          )}
        </div>
      </div>

      {/* Error Modal */}
      <AlertModal
        open={!!error}
        type="error"
        title="Login Failed"
        message={error}
        confirmText="Try Again"
        onConfirm={() => setError('')}
        onClose={() => setError('')}
      />

      {/* Success Modal */}
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
