'use client';

type BlockProps = {
  className?: string;
};

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function ShimmerBlock({ className }: BlockProps) {
  return (
    <div
      className={classes(
        'shimmer rounded-2xl bg-slate-200/80',
        className
      )}
      aria-hidden="true"
    />
  );
}

function HeaderShimmer() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-3">
        <ShimmerBlock className="h-9 w-72 max-w-full" />
        <ShimmerBlock className="h-4 w-96 max-w-full rounded-full" />
      </div>
      <ShimmerBlock className="h-12 w-44 rounded-2xl" />
    </div>
  );
}

function FilterShimmer({ compact = false }: { compact?: boolean }) {
  const widths = compact
    ? ['w-full', 'w-full', 'w-full']
    : ['w-full', 'w-full', 'w-full', 'w-full'];

  return (
    <div className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm md:grid-cols-4">
      {widths.map((width, index) => (
        <div key={index} className="space-y-2">
          <ShimmerBlock className="h-3 w-20 rounded-full" />
          <ShimmerBlock className={classes('h-11 rounded-xl', width)} />
        </div>
      ))}
    </div>
  );
}

function CardGridShimmer({
  cards = 6,
  tall = false,
}: {
  cards?: number;
  tall?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm"
        >
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <ShimmerBlock className="h-12 w-12 rounded-2xl" />
              <div className="space-y-3">
                <ShimmerBlock className="h-5 w-40 max-w-full" />
                <ShimmerBlock className="h-3 w-24 rounded-full" />
              </div>
            </div>
            <ShimmerBlock className="h-9 w-20 rounded-full" />
          </div>
          <div className="space-y-3">
            <ShimmerBlock className="h-4 w-full rounded-full" />
            <ShimmerBlock className="h-4 w-5/6 rounded-full" />
            <ShimmerBlock className="h-4 w-2/3 rounded-full" />
          </div>
          <div className="mt-6 space-y-3">
            <ShimmerBlock className="h-3 w-24 rounded-full" />
            <ShimmerBlock className="h-11 w-full rounded-2xl" />
            {tall && <ShimmerBlock className="h-28 w-full rounded-2xl" />}
          </div>
        </div>
      ))}
    </div>
  );
}

function TableShimmer({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/85 shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4">
        <div className="grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <ShimmerBlock key={index} className="h-4 rounded-full" />
          ))}
        </div>
      </div>
      <div className="space-y-4 p-6">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((__, cellIndex) => (
              <ShimmerBlock
                key={cellIndex}
                className="h-5 rounded-full"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPageShimmer({
  cards = 6,
  showFilters = true,
  compactFilters = false,
  table = false,
  tallCards = false,
}: {
  cards?: number;
  showFilters?: boolean;
  compactFilters?: boolean;
  table?: boolean;
  tallCards?: boolean;
}) {
  return (
    <div className="space-y-8">
      <HeaderShimmer />
      {showFilters && <FilterShimmer compact={compactFilters} />}
      {table ? <TableShimmer /> : <CardGridShimmer cards={cards} tall={tallCards} />}
    </div>
  );
}

export function DashboardPageShimmer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="mx-auto max-w-[1600px] px-6 py-8 lg:px-12 lg:py-12">
        <div className="mb-10 rounded-[32px] bg-slate-900 p-8 lg:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <ShimmerBlock className="h-4 w-32 rounded-full bg-white/15" />
              <ShimmerBlock className="h-12 w-[28rem] max-w-full bg-white/15" />
              <ShimmerBlock className="h-10 w-40 rounded-full bg-white/15" />
            </div>
            <div className="w-full max-w-xs space-y-3 rounded-3xl border border-white/10 bg-white/5 p-5">
              <ShimmerBlock className="h-3 w-24 rounded-full bg-white/15" />
              <ShimmerBlock className="h-12 w-full rounded-2xl bg-white/15" />
            </div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[24px] border border-slate-200/70 bg-white/80 p-6 shadow-sm"
            >
              <div className="mb-6 flex items-start justify-between">
                <ShimmerBlock className="h-12 w-12 rounded-2xl" />
                <ShimmerBlock className="h-7 w-16 rounded-full" />
              </div>
              <ShimmerBlock className="mb-3 h-3 w-28 rounded-full" />
              <ShimmerBlock className="h-10 w-36" />
              <ShimmerBlock className="mt-3 h-3 w-24 rounded-full" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[24px] border border-slate-200/70 bg-white/80 p-8 shadow-sm"
            >
              <ShimmerBlock className="mb-3 h-7 w-52" />
              <ShimmerBlock className="mb-8 h-4 w-64 rounded-full" />
              <ShimmerBlock className="h-72 w-full rounded-[24px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReportPageShimmer() {
  return (
    <div className="space-y-10">
      <div className="flex justify-center gap-4">
        <ShimmerBlock className="h-11 w-52 rounded-xl" />
        <ShimmerBlock className="h-11 w-32 rounded-xl" />
      </div>
      <div className="flex justify-center bg-slate-100 py-10">
        <div className="w-full max-w-[1100px] rounded-3xl bg-white p-12 shadow-xl">
          <div className="mb-10 flex items-start justify-between gap-8">
            <ShimmerBlock className="h-24 w-24 rounded-3xl" />
            <div className="flex-1 space-y-3 text-center">
              <ShimmerBlock className="mx-auto h-4 w-64 rounded-full" />
              <ShimmerBlock className="mx-auto h-4 w-72 rounded-full" />
              <ShimmerBlock className="mx-auto h-8 w-56" />
              <ShimmerBlock className="mx-auto h-4 w-32 rounded-full" />
            </div>
            <ShimmerBlock className="h-24 w-24 rounded-3xl" />
          </div>
          <TableShimmer rows={8} />
        </div>
      </div>
    </div>
  );
}

export function FormPageShimmer() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex items-center gap-6">
          <ShimmerBlock className="h-24 w-24 rounded-3xl" />
          <div className="space-y-3">
            <ShimmerBlock className="h-9 w-72 max-w-full" />
            <ShimmerBlock className="h-4 w-80 max-w-full rounded-full" />
            <ShimmerBlock className="h-4 w-56 max-w-full rounded-full" />
          </div>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-md">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <ShimmerBlock className="h-3 w-24 rounded-full" />
                <ShimmerBlock className="h-12 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <ShimmerBlock className="h-11 w-36 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPageShimmer() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-50 px-6 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200/70 bg-white/85 p-8 shadow-xl">
        <div className="mb-8 space-y-4 text-center">
          <ShimmerBlock className="mx-auto h-16 w-16 rounded-3xl" />
          <ShimmerBlock className="mx-auto h-8 w-40" />
          <ShimmerBlock className="mx-auto h-4 w-56 rounded-full" />
        </div>
        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <ShimmerBlock className="h-3 w-20 rounded-full" />
              <ShimmerBlock className="h-12 w-full rounded-xl" />
            </div>
          ))}
          <ShimmerBlock className="mt-2 h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function PublicLandingShimmer() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <ShimmerBlock className="h-4 w-36 rounded-full bg-white/10" />
              <ShimmerBlock className="h-14 w-[34rem] max-w-full bg-white/10" />
              <ShimmerBlock className="h-5 w-[28rem] max-w-full rounded-full bg-white/10" />
              <div className="flex gap-3">
                <ShimmerBlock className="h-12 w-36 rounded-full bg-white/10" />
                <ShimmerBlock className="h-12 w-40 rounded-full bg-white/10" />
              </div>
            </div>
            <ShimmerBlock className="h-80 w-full max-w-xl rounded-[32px] bg-white/10" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[28px] border border-white/10 bg-white/5 p-6"
            >
              <ShimmerBlock className="mb-4 h-12 w-12 rounded-2xl bg-white/10" />
              <ShimmerBlock className="mb-3 h-6 w-40 bg-white/10" />
              <ShimmerBlock className="h-4 w-full rounded-full bg-white/10" />
              <ShimmerBlock className="mt-2 h-4 w-5/6 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
