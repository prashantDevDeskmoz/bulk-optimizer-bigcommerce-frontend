export default function BulkOptimizerLoading() {
  return (
    <div className="min-h-screen animate-pulse bg-[#F1F1F1] p-5 pt-0">
      <header className="flex flex-col items-start justify-between gap-3 py-3 lg:flex-row lg:items-center lg:py-6">
        <div className="flex flex-col gap-2">
          <div className="h-7 w-40 rounded bg-[#e5e5e5]" />
          <div className="h-3 w-72 max-w-full rounded bg-[#ececec]" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-36 rounded-md bg-[#e5e5e5]" />
          <div className="h-9 w-24 rounded-md bg-[#e5e5e5]" />
        </div>
      </header>

      <main>
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`card flex items-center gap-4 ${i === 2 ? "sm:col-span-2 xl:col-span-1" : ""}`}
            >
              <div className="h-14 w-14 shrink-0 rounded-xl bg-[#ececec]" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-3 w-20 rounded bg-[#ececec]" />
                <div className="h-6 w-16 rounded bg-[#e5e5e5]" />
              </div>
            </div>
          ))}
        </section>

        <div className="flex flex-col gap-4 xl:flex-row">
          <section className="card flex-1 p-0!">
            <div className="flex flex-col gap-4 border-b border-[#DDDDDD] p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="h-5 w-40 rounded bg-[#e5e5e5]" />
                <div className="h-3 w-56 rounded bg-[#ececec]" />
              </div>
              <div className="h-9 w-32 rounded-md bg-[#e5e5e5]" />
            </div>

            <div className="flex flex-col gap-4 p-4">
              <div className="flex flex-wrap gap-2">
                <div className="h-7 w-20 rounded-md bg-[#ececec]" />
                <div className="h-7 w-28 rounded-md bg-[#ececec]" />
                <div className="h-7 w-16 rounded-md bg-[#ececec]" />
              </div>
              <div className="h-32 w-full rounded-lg bg-[#ececec]" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-6 w-24 rounded-lg bg-[#ececec]" />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-[#DDDDDD] p-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex-1 space-y-3">
                <div className="h-3 w-full max-w-md rounded bg-[#ececec]" />
                <div className="flex flex-wrap gap-2">
                  <div className="h-9 w-28 rounded-md bg-[#e5e5e5]" />
                  <div className="h-9 w-56 rounded-md bg-[#e5e5e5]" />
                  <div className="h-9 w-36 rounded-md bg-[#ececec]" />
                </div>
              </div>
              <div className="h-16 w-full min-w-[220px] rounded-lg bg-[#ececec] lg:w-64" />
            </div>
          </section>

          <section className="card w-full p-4 xl:w-[320px] xl:shrink-0">
            <div className="mb-4 h-5 w-28 rounded bg-[#e5e5e5]" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded bg-[#ececec]" />
              <div className="h-4 w-4/5 rounded bg-[#ececec]" />
              <div className="h-20 w-full rounded-lg bg-[#ececec]" />
            </div>
          </section>
        </div>

        <div className="card mt-4 p-0!">
          <div className="flex flex-col gap-3 border-b border-[#DDDDDD] p-4 md:flex-row md:items-center md:justify-between">
            <div className="h-5 w-44 rounded bg-[#e5e5e5]" />
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded bg-[#ececec]" />
              <div className="h-9 w-48 rounded-md bg-[#ececec]" />
              <div className="h-9 w-32 rounded-md bg-[#ececec]" />
            </div>
          </div>
          <div className="p-4">
            <div className="overflow-hidden rounded-lg border border-[#e3e3e3] bg-white">
              <div className="h-10 border-b border-[#e3e3e3] bg-[#f6f6f7]" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 border-b border-[#eeeeee] px-4 py-3">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <div key={j} className="h-4 flex-1 rounded bg-[#ececec]" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
