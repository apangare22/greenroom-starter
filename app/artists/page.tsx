import { getAllArtists } from "@/lib/queries";
import { formatShowDate } from "@/lib/format";

export default async function ArtistsPage() {
  const rows = await getAllArtists();

  // Defensive filter — should always have shows but just in case
  const filtered = rows.filter((r) => r.showCount > 0);

  const buckets = {
    frequent: filtered.filter((r) => r.showCount >= 4),
    regular: filtered.filter((r) => r.showCount >= 2 && r.showCount < 4),
    occasional: filtered.filter((r) => r.showCount === 1),
  };

  return (
    <div className="px-10 py-8 max-w-5xl">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700 mb-2">
        Roster
      </div>
      <h1 className="text-[32px] font-semibold text-ink-900 tracking-tight leading-none">
        Artists
      </h1>
      <p className="text-[14px] text-ink-500 mt-2.5 max-w-xl">
        {filtered.length} artists who have played The Crescent in the last 24
        months. Bucketed by frequency.
      </p>

      <div className="mt-9 space-y-9">
        <Bucket
          title="Frequent"
          subtitle="4+ shows in the window"
          rows={buckets.frequent}
        />
        <Bucket
          title="Regular"
          subtitle="2–3 shows in the window"
          rows={buckets.regular}
        />
        <Bucket
          title="Occasional"
          subtitle="1 show"
          rows={buckets.occasional}
        />
      </div>
    </div>
  );
}

function Bucket({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Awaited<ReturnType<typeof getAllArtists>>;
}) {
  if (rows.length === 0) return null;
  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[14px] font-semibold text-ink-900">
          {title}{" "}
          <span className="text-ink-400 font-normal">({rows.length})</span>
        </h2>
        <span className="text-[12px] text-ink-500">{subtitle}</span>
      </div>
      <div className="rounded-xl border border-ink-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(20,15,8,0.04),0_4px_12px_rgba(20,15,8,0.04)]">
        <ul className="divide-y divide-ink-100">
          {rows.map(({ artist, agent, agency, showCount, lastShowDate }) => (
            <li
              key={artist.id}
              className="grid grid-cols-[1fr_180px_120px_auto] items-center gap-4 px-5 py-3 hover:bg-canvas-soft transition-colors"
            >
              <div className="min-w-0">
                <div className="text-[14px] font-medium text-ink-900 truncate">
                  {artist.name}
                </div>
                <div className="text-[11.5px] text-ink-500 capitalize mt-0.5">
                  {artist.genre ?? "—"}
                </div>
              </div>
              <div className="text-[12px] text-ink-700 truncate">
                {agent ? (
                  <>
                    {agent.name}
                    {agency && (
                      <span className="text-ink-500"> · {agency.name}</span>
                    )}
                  </>
                ) : (
                  <span className="text-ink-500">—</span>
                )}
              </div>
              <div className="text-[12px] text-ink-700 font-mono tabular">
                {showCount} {showCount === 1 ? "show" : "shows"}
              </div>
              <div className="text-right">
                {lastShowDate && (
                  <>
                    <div className="text-[10px] text-ink-500 uppercase tracking-wider">
                      Last
                    </div>
                    <div className="text-[12px] text-ink-700 font-mono tabular">
                      {formatShowDate(lastShowDate)}
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
