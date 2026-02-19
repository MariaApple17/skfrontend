'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

// ─── TYPES ────────────────────────────────────────────────────────────────────
type SystemProfile = {
  id: number;
  systemName: string;
  systemDescription?: string;
  logoUrl?: string;
  location?: string;
};
type SKOfficial = {
  id: number;
  position: string;
  fullName: string;
  responsibility?: string;
  profileImageUrl?: string;
  isActive: boolean;
};
type CategorySummary = {
  category: 'ADMINISTRATIVE' | 'YOUTH';
  cap: number;
  planned: number;
  allocated: number;
  used: number;
  remainingFromCap: number;
};
type ClassificationLimit = {
  classificationId: number;
  classificationCode: string;
  classificationName: string;
  category: string;
  limitAmount: number;
  allocated: number;
  used: number;
  remaining: number;
};
type Allocation = {
  allocationId: number;
  category: string;
  classificationCode: string;
  classificationName: string;
  objectCode: string;
  objectName: string;
  allocatedAmount: number;
  usedAmount: number;
};
type Program = {
  programId: number;
  programCode: string;
  programName: string;
  totalAllocated: number;
  totalUsed: number;
  allocations: Allocation[];
};
type BudgetData = {
  fiscalYear: { id: number; year: number; isActive: boolean };
  budget: { id: number; totalAmount: number; administrativeAmount: number; youthAmount: number };
  systemProfile: SystemProfile;
  skOfficials: SKOfficial[];
  categorySummary: CategorySummary[];
  classificationLimits: ClassificationLimit[];
  programs: Program[];
  generatedAt: string;
};

// ─── API — no year param, always fetches active FY ────────────────────────────
const BASE = process.env.NEXT_PUBLIC_API_URL ?? '';
async function fetchActiveBudget(): Promise<BudgetData | null> {
  try {
    const res = await fetch(`${BASE}/public/transparency/budget-plan`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? (json.data as BudgetData) : null;
  } catch { return null; }
}

// ─── FORMATTERS ───────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000_000) return `₱${+(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `₱${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `₱${+(n / 1_000).toFixed(1)}K`;
  return `₱${n.toLocaleString()}`;
}
function full(n: number): string { return '₱' + n.toLocaleString('en-PH'); }
function pct(a: number, b: number): number { return b > 0 ? Math.round((a / b) * 100) : 0; }
function inits(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ─── HOOKS ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); o.disconnect(); } },
      { threshold, rootMargin: '0px 0px -30px 0px' }
    );
    o.observe(el); return () => o.disconnect();
  }, [threshold]);
  return { ref, vis };
}

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, vis } = useInView();
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function WipeBar({ value, color }: { value: number; color: string }) {
  const { ref, vis } = useInView(0.4);
  return (
    <div ref={ref} className="h-1.5 w-full bg-black/8 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-[width] duration-[1200ms] ease-out`} style={{ width: vis ? `${Math.max(value, value > 0 ? 1.5 : 0)}%` : '0%' }} />
    </div>
  );
}

function DarkBar({ value, color }: { value: number; color: string }) {
  const { ref, vis } = useInView(0.3);
  return (
    <div ref={ref} className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-[width] duration-[1300ms] ease-out`} style={{ width: vis ? `${Math.max(value, value > 0 ? 1.5 : 0)}%` : '0%' }} />
    </div>
  );
}

function Pulse() {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
    </span>
  );
}

function SkDark({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/10 ${className}`} />;
}
function SkLight({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

const GRAD_POOL = [
  'from-red-700 to-red-500','from-blue-800 to-blue-600',
  'from-rose-700 to-red-500','from-indigo-800 to-blue-600',
  'from-red-800 to-rose-600','from-blue-900 to-blue-700','from-slate-700 to-slate-500',
];

// ═════════════════════════════════════════════════════════════════════════════
export default function PublicLayout({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [data, setData]         = useState<BudgetData | null>(null);

  // Single fetch — active fiscal year only
  useEffect(() => {
    fetchActiveBudget().then(d => { setData(d); setLoading(false); });
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // ─── Derived ──────────────────────────────────────────────────────────────
  const sp          = data?.systemProfile;
  const fy          = data?.fiscalYear;
  const bdg         = data?.budget;
  const total       = bdg?.totalAmount ?? 0;
  const adminCat    = data?.categorySummary.find(c => c.category === 'ADMINISTRATIVE');
  const youthCat    = data?.categorySummary.find(c => c.category === 'YOUTH');
  const totalUsed   = (adminCat?.used ?? 0) + (youthCat?.used ?? 0);
  const totalAlloc  = (adminCat?.allocated ?? 0) + (youthCat?.allocated ?? 0);
  const activeOff   = (data?.skOfficials ?? []).filter(o => o.isActive);

  const NAV = [
    { l: 'Budget',          id: 'budget'          },
    { l: 'Programs',        id: 'programs'        },
    { l: 'Classifications', id: 'classifications' },
    { l: 'Officials',       id: 'officials'       },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

        *, body, html { font-family:'DM Sans',sans-serif; scroll-behavior:smooth; -webkit-font-smoothing:antialiased; }
        .serif { font-family:'DM Serif Display',Georgia,serif; }
        .mono  { font-family:'DM Mono',monospace; }

        @keyframes enter { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        .e1{animation:enter .55s .00s both ease-out}
        .e2{animation:enter .55s .10s both ease-out}
        .e3{animation:enter .55s .20s both ease-out}
        .e4{animation:enter .55s .32s both ease-out}
        .e5{animation:enter .55s .44s both ease-out}
        .e6{animation:enter .55s .56s both ease-out}

        @keyframes flow{0%{background-position:0% 50%}100%{background-position:200% 50%}}
        .grad-text{
          background:linear-gradient(90deg,#dc2626 0%,#1e40af 40%,#dc2626 80%,#1e40af 100%);
          background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;
          background-clip:text;animation:flow 6s linear infinite;
        }

        @keyframes b1{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(50px,-35px) scale(1.08)}70%{transform:translate(-30px,25px) scale(0.95)}}
        @keyframes b2{0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(-45px,30px) scale(1.06)}65%{transform:translate(30px,-22px) scale(0.97)}}
        .blob1{animation:b1 10s ease-in-out infinite}
        .blob2{animation:b2 13s ease-in-out infinite}

        .noise::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:1;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-size:180px 180px;opacity:.45;mix-blend-mode:overlay}

        .stripe::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;
          background:linear-gradient(90deg,#dc2626,#1d4ed8);border-radius:16px 16px 0 0;
          opacity:0;transition:opacity .2s;pointer-events:none}
        .stripe:hover::before{opacity:1}

        .divline{height:1px;background:linear-gradient(90deg,transparent,rgba(0,0,0,.07) 30%,rgba(0,0,0,.07) 70%,transparent)}
      `}</style>

      <div className="min-h-screen bg-[#f9f8f6] text-slate-900 overflow-x-hidden">

        {/* ══ NAV ═══════════════════════════════════════════════════════════ */}
        <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-2xl shadow-[0_1px_0_rgba(0,0,0,.06)]' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto px-5 sm:px-10 h-[66px] flex items-center justify-between gap-6">

            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 shrink-0 group">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-black/5 shadow-sm shrink-0">
                {sp?.logoUrl
                  ? <img src={sp.logoUrl} alt="logo" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-red-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs">SK</div>
                }
              </div>
              <div className="hidden sm:block text-left leading-tight max-w-[200px]">
                <p className="text-[13px] font-semibold text-slate-800 truncate group-hover:text-red-600 transition-colors">
                  {sp?.systemName ?? 'SK Transparency'}
                </p>
                {sp?.location && <p className="text-[10.5px] text-slate-400 truncate">{sp.location}</p>}
              </div>
            </button>

            <nav className="hidden md:flex items-center gap-7">
              {NAV.map(l => (
                <button key={l.id} onClick={() => go(l.id)} className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors">
                  {l.l}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
                Official Login
              </button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>}
                </svg>
              </button>
            </div>
          </div>

          {menuOpen && (
            <div className="md:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 px-5 py-3 space-y-0.5 shadow-xl">
              {NAV.map(l => (
                <button key={l.id} onClick={() => go(l.id)} className="block w-full text-left px-4 py-2.5 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors">
                  {l.l}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <section className="noise relative min-h-screen flex flex-col items-center justify-center pt-28 pb-20 px-6 sm:px-12 overflow-hidden bg-slate-950">
          <div className="blob1 pointer-events-none absolute -top-20 -right-24 w-[540px] h-[540px] rounded-full bg-red-600/15 blur-[110px]" />
          <div className="blob2 pointer-events-none absolute -bottom-16 -left-24 w-[460px] h-[460px] rounded-full bg-blue-700/15 blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)', backgroundSize: '64px 64px' }} />

          {/* Active FY badge */}
          <div className="e1 flex items-center gap-3 mb-8 relative z-10">
            {!loading && fy?.isActive && <Pulse />}
            <span className="mono text-[11px] tracking-[0.15em] uppercase text-white/40">
              Open Government Initiative{!loading && fy ? ` · Fiscal Year ${fy.year}` : ''}
            </span>
            {!loading && fy?.isActive && (
              <span className="mono text-[10px] font-medium uppercase tracking-widest text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>

          {/* Logo */}
          {!loading && sp?.logoUrl && (
            <div className="e2 mb-6 relative z-10">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
                <img src={sp.logoUrl} alt={sp.systemName} className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="e3 serif text-[clamp(34px,5.5vw,78px)] leading-[1.06] text-center text-white max-w-[880px] tracking-[-0.02em] mb-4 relative z-10">
            {loading
              ? <span className="text-white/15 animate-pulse">Loading…</span>
              : <><span className="text-white/90">{sp?.systemName ?? 'SK Transparency Portal'}</span><br /><em className="grad-text not-italic">Open to everyone.</em></>
            }
          </h1>

          {/* Description & location */}
          {!loading && sp && (
            <div className="e4 flex flex-col items-center gap-1.5 mb-10 relative z-10">
              {sp.systemDescription && (
                <p className="text-[15px] text-white/40 text-center max-w-[460px] leading-[1.75] font-light">
                  {sp.systemDescription}
                </p>
              )}
              {sp.location && (
                <p className="flex items-center gap-1.5 mono text-[11px] text-white/25 mt-1">
                  <svg className="w-3 h-3 shrink-0 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
                  {sp.location}
                </p>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="e5 flex flex-col sm:flex-row items-center gap-3 mb-16 relative z-10">
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2.5 bg-white text-slate-900 font-semibold text-[14px] px-7 py-3.5 rounded-2xl hover:bg-slate-100 transition-colors shadow-lg shadow-black/20"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
              Official Login
            </button>
            <button onClick={() => go('budget')} className="flex items-center gap-2 text-white/45 hover:text-white/75 font-medium text-[14px] transition-colors">
              View budget data
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
            </button>
          </div>

          {/* Stats strip */}
          <div className="e6 w-full max-w-3xl relative z-10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-slate-900/60 py-6 px-5 text-center space-y-2">
                      <SkDark className="h-6 w-20 mx-auto" /><SkDark className="h-3 w-16 mx-auto" />
                    </div>
                  ))
                : [
                    { v: total       ? fmt(total)                   : '—', l: 'Total Budget',  t: full(total)     },
                    { v: data        ? String(data.programs.length) : '—', l: 'Programs',      t: undefined       },
                    { v: total       ? `${pct(totalAlloc, total)}%` : '—', l: 'Allocated',     t: fmt(totalAlloc) },
                    { v: String(activeOff.length) || '—',                  l: 'SK Officials',  t: undefined       },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-900/60 hover:bg-slate-800/70 transition-colors py-6 px-5 text-center group cursor-default">
                      <p className="serif text-[22px] sm:text-[28px] text-white leading-none mb-1.5" title={s.t}>{s.v}</p>
                      <p className="mono text-[10px] uppercase tracking-[0.12em] text-white/35">{s.l}</p>
                    </div>
                  ))
              }
            </div>

            {data?.generatedAt && (
              <p className="text-center mono text-[10px] text-white/15 mt-4">
                Data as of {new Date(data.generatedAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
          </div>
        </section>

        {/* ══ BUDGET ════════════════════════════════════════════════════════ */}
        <section id="budget" className="py-24 px-6 sm:px-12 bg-[#f9f8f6]">
          <div className="max-w-7xl mx-auto">

            <Reveal className="mb-16">
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-red-500 mb-3">
                Budget Plan · {loading ? '—' : `FY ${fy?.year}`} {!loading && fy?.isActive && '· Active'}
              </p>
              <h2 className="serif text-[clamp(28px,4vw,52px)] text-slate-900 leading-[1.1] tracking-[-0.02em]">
                Where your <em className="not-italic text-blue-700">funds</em> go
              </h2>
              <p className="text-[14px] text-slate-500 leading-[1.8] mt-3 max-w-[380px] font-light">
                Full budget breakdown for {loading ? '—' : `FY ${fy?.year}`}. All figures publicly disclosed per DILG transparency requirements.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

              {/* ── Dark bar panel ── */}
              <Reveal className="lg:col-span-3">
                <div className="noise relative bg-slate-950 rounded-[20px] p-7 sm:p-10 h-full flex flex-col overflow-hidden">
                  <div className="pointer-events-none absolute top-0 right-0 w-60 h-60 bg-red-600/10 rounded-full blur-3xl" />
                  <div className="pointer-events-none absolute bottom-0 left-0 w-48 h-48 bg-blue-700/10 rounded-full blur-3xl" />

                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <p className="mono text-[10px] uppercase tracking-[0.18em] text-white/25">Allocation Overview</p>
                    {bdg && <p className="mono text-[10px] text-white/20" title={full(total)}>{fmt(total)} total</p>}
                  </div>

                  {loading ? (
                    <div className="space-y-7 relative z-10">{Array.from({ length: 4 }).map((_, i) => <SkDark key={i} className="h-9 w-full" />)}</div>
                  ) : !data ? (
                    <p className="text-white/30 text-sm relative z-10">No active budget found.</p>
                  ) : (
                    <div className="relative z-10 space-y-7 flex-1">
                      {[
                        { l: 'Youth Cap',   v: bdg!.youthAmount,          p: pct(bdg!.youthAmount, total),          c: 'bg-blue-500'    },
                        { l: 'Admin Cap',   v: bdg!.administrativeAmount, p: pct(bdg!.administrativeAmount, total), c: 'bg-red-500'     },
                        { l: 'Allocated',   v: totalAlloc,                p: pct(totalAlloc, total),                c: 'bg-violet-500'  },
                        { l: 'Used',        v: totalUsed,                 p: pct(totalUsed, total),                 c: 'bg-rose-600'    },
                      ].map(row => (
                        <div key={row.l}>
                          <div className="flex items-baseline justify-between gap-3 mb-2.5">
                            <span className="text-[13px] font-medium text-white/65">{row.l}</span>
                            <div className="text-right">
                              <span className="text-[14px] font-semibold text-white/90" title={full(row.v)}>{fmt(row.v)}</span>
                              <span className="mono text-[10px] text-white/30 ml-2">{row.p}%</span>
                            </div>
                          </div>
                          <DarkBar value={row.p} color={row.c} />
                        </div>
                      ))}

                      <div className="pt-6 border-t border-white/8 grid grid-cols-2 gap-4">
                        <div>
                          <p className="mono text-[9px] uppercase tracking-widest text-white/25 mb-1">Youth Budget</p>
                          <p className="serif text-[20px] text-white" title={full(bdg!.youthAmount)}>{fmt(bdg!.youthAmount)}</p>
                        </div>
                        <div>
                          <p className="mono text-[9px] uppercase tracking-widest text-white/25 mb-1">Admin Budget</p>
                          <p className="serif text-[20px] text-white" title={full(bdg!.administrativeAmount)}>{fmt(bdg!.administrativeAmount)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>

              {/* ── Category summary cards ── */}
              <div className="lg:col-span-2 flex flex-col gap-5">
                {loading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="bg-white border border-slate-100 rounded-[20px] p-7 shadow-sm space-y-4">
                        <SkLight className="h-5 w-28" /><SkLight className="h-9 w-44" /><SkLight className="h-4 w-full" />
                      </div>
                    ))
                  : data?.categorySummary.map((cat, i) => {
                      const isY = cat.category === 'YOUTH';
                      return (
                        <Reveal key={cat.category} delay={i * 100}>
                          <div className="bg-white border border-slate-100 rounded-[20px] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between gap-2 mb-5">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${isY ? 'bg-blue-600' : 'bg-red-600'}`} />
                                  <p className={`mono text-[10px] uppercase tracking-widest ${isY ? 'text-blue-600' : 'text-red-600'}`}>
                                    {isY ? 'Youth' : 'Administrative'}
                                  </p>
                                </div>
                                <p className="serif text-[26px] sm:text-[30px] text-slate-900 leading-none" title={full(cat.cap)}>{fmt(cat.cap)}</p>
                                <p className="mono text-[10px] text-slate-400 mt-1">{full(cat.cap)} cap</p>
                              </div>
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isY ? 'bg-blue-50' : 'bg-red-50'}`}>
                                {isY
                                  ? <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
                                  : <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
                                }
                              </div>
                            </div>
                            <div className="divline mb-4" />
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { l: 'Planned',   v: cat.planned,         p: pct(cat.planned, cat.cap)         },
                                { l: 'Allocated', v: cat.allocated,       p: pct(cat.allocated, cat.cap)       },
                                { l: 'Used',      v: cat.used,            p: pct(cat.used, cat.cap)            },
                                { l: 'Remaining', v: cat.remainingFromCap,p: pct(cat.remainingFromCap, cat.cap)},
                              ].map(f => (
                                <div key={f.l}>
                                  <p className="mono text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">{f.l}</p>
                                  <p className="text-[13px] font-semibold text-slate-800" title={full(f.v)}>{f.v === 0 ? '₱0' : fmt(f.v)}</p>
                                  <p className={`mono text-[10px] mt-0.5 ${isY ? 'text-blue-500' : 'text-red-500'}`}>{f.p}%</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </Reveal>
                      );
                    })
                }
              </div>
            </div>
          </div>
        </section>

        {/* ══ PROGRAMS ══════════════════════════════════════════════════════ */}
        <section id="programs" className="py-24 px-6 sm:px-12 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto">
            <Reveal className="mb-16">
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-blue-600 mb-3">Programs</p>
              <h2 className="serif text-[clamp(28px,4vw,52px)] text-slate-900 leading-[1.1] tracking-[-0.02em]">
                Funded <span className="text-red-600">programs</span>
              </h2>
              <p className="text-[14px] text-slate-500 leading-[1.8] mt-3 max-w-[380px] font-light">
                All programs with allocation breakdown by classification and object of expenditure.
              </p>
            </Reveal>

            <div className="space-y-5">
              {loading
                ? Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="border border-slate-100 rounded-[20px] p-7 bg-[#f9f8f6] space-y-3">
                      <SkLight className="h-5 w-24" /><SkLight className="h-6 w-1/2" /><SkLight className="h-4 w-full" />
                    </div>
                  ))
                : !data || data.programs.length === 0
                ? (
                    <div className="border border-slate-100 rounded-[20px] py-16 text-center bg-[#f9f8f6]">
                      <p className="serif text-[24px] text-slate-400 mb-2">No programs yet</p>
                      <p className="text-[14px] text-slate-400 font-light">Programs for FY {fy?.year ?? '—'} have not been added.</p>
                    </div>
                  )
                : data.programs.map((prog, pi) => {
                    const u  = pct(prog.totalUsed, prog.totalAllocated);
                    const hi = u >= 75;
                    return (
                      <Reveal key={prog.programId} delay={pi * 60}>
                        <div className="stripe relative bg-[#f9f8f6] border border-slate-100 rounded-[20px] overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-shadow">

                          {/* Header */}
                          <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                            <div className="flex items-start gap-4">
                              <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white ${hi ? 'bg-red-600' : 'bg-blue-700'}`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"/></svg>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{prog.programCode}</span>
                                  <span className={`mono text-[10px] font-medium px-2 py-0.5 rounded-md ${hi ? 'bg-red-50 text-red-600' : u === 0 ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                                    {u}% utilized
                                  </span>
                                </div>
                                <h3 className="text-[16px] sm:text-[17px] font-semibold text-slate-900 tracking-tight">{prog.programName}</h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-8 shrink-0 pl-14 sm:pl-0">
                              <div className="text-left sm:text-right">
                                <p className="mono text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Allocated</p>
                                <p className="text-[16px] font-semibold text-slate-900" title={full(prog.totalAllocated)}>{fmt(prog.totalAllocated)}</p>
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="mono text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Used</p>
                                <p className={`text-[16px] font-semibold ${hi ? 'text-red-600' : prog.totalUsed === 0 ? 'text-slate-400' : 'text-blue-600'}`} title={full(prog.totalUsed)}>
                                  {prog.totalUsed === 0 ? '₱0' : fmt(prog.totalUsed)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Bar */}
                          <div className="px-6 sm:px-8 pb-0">
                            <WipeBar value={u} color={hi ? 'bg-red-500' : u === 0 ? 'bg-slate-200' : 'bg-blue-500'} />
                          </div>

                          {/* Allocations */}
                          {prog.allocations.length > 0 && (
                            <div className="px-6 sm:px-8 py-6 border-t border-slate-100 mt-5">
                              <p className="mono text-[9px] uppercase tracking-[0.16em] text-slate-400 mb-4">Line Items</p>
                              <div className="space-y-3">
                                {prog.allocations.map(a => {
                                  const ap  = pct(a.usedAmount, a.allocatedAmount);
                                  const isY = a.category === 'YOUTH';
                                  return (
                                    <div key={a.allocationId} className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5">
                                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                                        <div>
                                          <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <span className={`mono text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${isY ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{a.category}</span>
                                            <span className="mono text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">{a.classificationCode}</span>
                                            <span className="mono text-[9px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">{a.objectCode}</span>
                                          </div>
                                          <p className="text-[14px] font-semibold text-slate-800">{a.objectName}</p>
                                          <p className="text-[12px] text-slate-400 font-light mt-0.5">{a.classificationName}</p>
                                        </div>
                                        <div className="flex gap-5 shrink-0">
                                          <div className="text-right">
                                            <p className="mono text-[9px] text-slate-400 uppercase tracking-wide mb-0.5">Allocated</p>
                                            <p className="text-[13px] font-semibold text-slate-800" title={full(a.allocatedAmount)}>{fmt(a.allocatedAmount)}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="mono text-[9px] text-slate-400 uppercase tracking-wide mb-0.5">Used</p>
                                            <p className={`text-[13px] font-semibold ${ap >= 75 ? 'text-red-600' : a.usedAmount === 0 ? 'text-slate-400' : 'text-blue-600'}`}>
                                              {a.usedAmount === 0 ? '₱0' : fmt(a.usedAmount)}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      {a.usedAmount > 0 && <WipeBar value={ap} color={ap >= 75 ? 'bg-red-500' : 'bg-blue-500'} />}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </Reveal>
                    );
                  })
              }
            </div>
          </div>
        </section>

        {/* ══ CLASSIFICATIONS ═══════════════════════════════════════════════ */}
        <section id="classifications" className="py-24 px-6 sm:px-12 bg-[#f9f8f6] border-t border-slate-100">
          <div className="max-w-7xl mx-auto">
            <Reveal className="mb-16">
              <p className="mono text-[10px] uppercase tracking-[0.18em] text-red-500 mb-3">Classification Limits</p>
              <h2 className="serif text-[clamp(28px,4vw,52px)] text-slate-900 leading-[1.1] tracking-[-0.02em]">
                Budget <span className="text-blue-700">classifications</span>
              </h2>
              <p className="text-[14px] text-slate-500 leading-[1.8] mt-3 max-w-[380px] font-light">
                Approved limits per expenditure type with allocation and remaining balances.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm space-y-3">
                      <SkLight className="h-4 w-24" /><SkLight className="h-7 w-40" /><SkLight className="h-3 w-full" />
                    </div>
                  ))
                : !data || data.classificationLimits.length === 0
                ? <div className="col-span-full py-16 text-center"><p className="text-slate-400 text-sm">No classification data available.</p></div>
                : data.classificationLimits.map((cl, i) => {
                    const ap   = pct(cl.allocated, cl.limitAmount);
                    const up   = pct(cl.used, cl.limitAmount);
                    const remP = pct(cl.remaining, cl.limitAmount);
                    const isY  = cl.category === 'YOUTH';
                    return (
                      <Reveal key={`${cl.classificationId}-${cl.category}`} delay={i * 60}>
                        <div className="stripe relative bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap mb-4">
                            <span className="mono text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">{cl.classificationCode}</span>
                            <span className={`mono text-[10px] font-medium px-2.5 py-1 rounded-lg ${isY ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>{cl.category}</span>
                          </div>

                          <h3 className="text-[14px] font-semibold text-slate-800 leading-snug mb-4 flex-1">{cl.classificationName}</h3>

                          <div className={`rounded-xl p-4 mb-4 ${isY ? 'bg-blue-50/60' : 'bg-red-50/60'}`}>
                            <p className="mono text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Budget Limit</p>
                            <p className="serif text-[20px] text-slate-900" title={full(cl.limitAmount)}>{fmt(cl.limitAmount)}</p>
                            <p className="mono text-[10px] text-slate-400">{full(cl.limitAmount)}</p>
                          </div>

                          <div className="space-y-2.5 mb-4">
                            {[
                              { l: 'Allocated', v: cl.allocated, p: ap,   em: false },
                              { l: 'Used',      v: cl.used,      p: up,   em: false },
                              { l: 'Remaining', v: cl.remaining, p: remP, em: true  },
                            ].map(row => (
                              <div key={row.l} className="flex items-center justify-between text-[13px]">
                                <span className="text-slate-400 font-medium">{row.l}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="mono text-[10px] text-slate-300">{row.p}%</span>
                                  <span className={`font-semibold ${row.em ? 'text-emerald-600' : 'text-slate-700'}`} title={full(row.v)}>
                                    {row.v === 0 ? '₱0' : fmt(row.v)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <WipeBar value={ap} color={ap >= 90 ? 'bg-red-500' : isY ? 'bg-blue-500' : 'bg-red-400'} />
                        </div>
                      </Reveal>
                    );
                  })
              }
            </div>
          </div>
        </section>

        {/* ══ OFFICIALS ═════════════════════════════════════════════════════ */}
        <section id="officials" className="py-24 px-6 sm:px-12 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto">
            <Reveal className="mb-16">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <p className="mono text-[10px] uppercase tracking-[0.18em] text-slate-400 ml-1">SK Officials</p>
              </div>
              <h2 className="serif text-[clamp(28px,4vw,52px)] text-slate-900 leading-[1.1] tracking-[-0.02em]">
                Your elected <span className="text-red-600">representatives</span>
              </h2>
              <p className="text-[14px] text-slate-500 leading-[1.8] mt-3 max-w-[380px] font-light">
                Sangguniang Kabataan council members serving the youth of {sp?.location?.split(',')[0] ?? 'the barangay'}.
              </p>
            </Reveal>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border border-slate-100 rounded-[20px] p-6 bg-[#f9f8f6] text-center space-y-3">
                    <SkLight className="w-16 h-16 rounded-2xl mx-auto" /><SkLight className="h-4 w-3/4 mx-auto" /><SkLight className="h-3 w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            ) : activeOff.length === 0 ? (
              <div className="bg-[#f9f8f6] border border-slate-100 rounded-[20px] py-20 px-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                </div>
                <p className="serif text-[22px] text-slate-500 mb-2">No Officials Added Yet</p>
                <p className="text-[13px] text-slate-400 font-light max-w-xs mx-auto">
                  SK Officials for FY {fy?.year ?? '—'} have not been added to the system. Check back later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {activeOff.map((o, i) => (
                  <Reveal key={o.id} delay={i * 50}>
                    <div className="group bg-[#f9f8f6] border border-slate-100 rounded-[20px] px-5 py-7 text-center hover:shadow-lg hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                      <div className={`absolute inset-x-0 top-0 h-[2px] ${i % 2 === 0 ? 'bg-red-500' : 'bg-blue-600'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      {o.profileImageUrl
                        ? <img src={o.profileImageUrl} alt={o.fullName} className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4 shadow" />
                        : <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-[16px] font-semibold text-white bg-gradient-to-br ${GRAD_POOL[i % GRAD_POOL.length]} shadow`}>{inits(o.fullName)}</div>
                      }
                      <p className="text-[14px] sm:text-[15px] font-semibold text-slate-900 tracking-tight leading-snug">{o.fullName}</p>
                      <p className={`mono text-[10px] uppercase tracking-widest mt-1.5 ${i % 2 === 0 ? 'text-red-500' : 'text-blue-600'}`}>{o.position}</p>
                      {o.responsibility && <p className="text-[11.5px] text-slate-400 mt-2 leading-snug line-clamp-2 font-light">{o.responsibility}</p>}
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ══ CTA ═══════════════════════════════════════════════════════════ */}
        <section className="py-24 px-6 sm:px-12 bg-[#f9f8f6] border-t border-slate-100">
          <Reveal>
            <div className="noise relative bg-slate-950 rounded-[24px] max-w-7xl mx-auto px-8 sm:px-20 py-16 sm:py-20 text-center overflow-hidden">
              <div className="pointer-events-none absolute -top-20 -right-20 w-96 h-96 bg-red-600/15 rounded-full blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 w-80 h-80 bg-blue-700/15 rounded-full blur-3xl" />
              <p className="relative z-10 mono text-[10px] uppercase tracking-[0.2em] text-white/30 mb-5">For Authorized Officials Only</p>
              <h2 className="relative z-10 serif text-[clamp(28px,4.5vw,58px)] text-white leading-[1.08] tracking-[-0.02em] max-w-[580px] mx-auto mb-5">
                Manage your barangay<br /><em className="not-italic grad-text">with full control.</em>
              </h2>
              <p className="relative z-10 text-white/35 text-[14px] font-light max-w-[400px] mx-auto leading-[1.8] mb-12">
                Log in to manage budgets, procurement, programs, officials, and system settings.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="relative z-10 inline-flex items-center gap-2.5 bg-white hover:bg-slate-100 text-slate-900 px-10 py-4 rounded-2xl text-[15px] font-semibold transition-colors shadow-xl shadow-black/20"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>
                Official Login
              </button>
            </div>
          </Reveal>
        </section>

        {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
        <footer className="bg-white border-t border-slate-100 px-6 sm:px-12 py-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 shadow-sm shrink-0">
                {sp?.logoUrl
                  ? <img src={sp.logoUrl} alt="logo" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-red-600 to-blue-700 flex items-center justify-center text-white font-bold text-[10px]">SK</div>
                }
              </div>
              <p className="text-[13px] font-semibold text-slate-700 truncate max-w-[200px]">{sp?.systemName ?? 'SK Transparency'}</p>
            </div>
            <p className="mono text-[10px] text-slate-400 order-last sm:order-none text-center">
              © {new Date().getFullYear()} {sp?.systemName ?? 'SK Barangay'}{fy?.year ? ` · FY ${fy.year}` : ''} · Open Government Initiative
            </p>
            {sp?.location && <p className="mono text-[10px] text-slate-400 hidden sm:block truncate max-w-[200px] text-right">{sp.location}</p>}
          </div>
        </footer>

        {children}
      </div>
    </>
  );
}