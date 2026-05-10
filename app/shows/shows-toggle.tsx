"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, Calendar } from "lucide-react";
import { DealTypeBadge, PlainBadge } from "@/components/ui/badge";

type Status = "booked" | "advanced" | "day_of" | "settled" | "closed";

export type ShowRow = {
  show: { id: string; status: Status };
  artist: { name: string } | null;
  deal: { dealType: string; guaranteeFormatted: string | null } | null;
  settlement: { totalFormatted: string | null; status: string } | null;
  dateFormatted: string;
  dateRelative: string;
  month: string;
};

const lifecycleStatusVariants: Record<
  string,
  { variant: "default" | "amber" | "brand" | "rose" | "sky"; label: string }
> = {
  draft: { variant: "default", label: "Draft" },
  submitted: { variant: "sky", label: "Submitted" },
  in_review: { variant: "sky", label: "In review" },
  signed: { variant: "brand", label: "Signed" },
  disputed: { variant: "rose", label: "Disputed" },
  revised: { variant: "amber", label: "Revised" },
  finalized: { variant: "brand", label: "Finalized" },
  paid: { variant: "brand", label: "Paid" },
  voided: { variant: "default", label: "Voided" },
};

function getAccentColor(row: ShowRow): string {
  if (row.settlement) {
    const s = row.settlement.status;
    if (s === "paid" || s === "finalized" || s === "signed") return "bg-brand-500";
    if (s === "disputed") return "bg-rose-500";
    if (s === "revised") return "bg-amber-500";
    if (s === "submitted" || s === "in_review") return "bg-sky-400";
    return "bg-ink-300";
  }
  if (row.show.status === "day_of") return "bg-amber-500";
  if (row.show.status === "advanced") return "bg-sky-400";
  if (row.show.status === "settled") return "bg-brand-400";
  return "bg-ink-200";
}

function groupByMonth(rows: ShowRow[]): { month: string; rows: ShowRow[] }[] {
  const groups: Map<string, ShowRow[]> = new Map();
  for (const row of rows) {
    if (!groups.has(row.month)) groups.set(row.month, []);
    groups.get(row.month)!.push(row);
  }
  return Array.from(groups.entries()).map(([month, rows]) => ({ month, rows }));
}

export function ShowsToggle({
  upcoming,
  past,
}: {
  upcoming: ShowRow[];
  past: ShowRow[];
}) {
  const [active, setActive] = useState<"upcoming" | "past">("past");
  const [query, setQuery] = useState("");

  const sourceRows = active === "upcoming" ? upcoming : past;

  const filtered = useMemo(() => {
    if (!query.trim()) return sourceRows;
    const q = query.toLowerCase();
    return sourceRows.filter(
      (r) =>
        r.artist?.name.toLowerCase().includes(q) ||
        r.deal?.dealType.toLowerCase().includes(q) ||
        r.dateFormatted.toLowerCase().includes(q),
    );
  }, [sourceRows, query]);

  const months = useMemo(() => groupByMonth(filtered), [filtered]);

  return (
    <div>
      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Segmented control */}
        <div
          className="relative inline-grid grid-cols-2 bg-ink-100/80 rounded-lg p-[3px]"
          style={{ minWidth: 240 }}
        >
          <div
            className="absolute top-[3px] bottom-[3px] w-[calc(50%-3px)] bg-white rounded-[6px] shadow-[0_1px_3px_rgba(26,24,20,0.08)] transition-all duration-200 ease-out"
            style={{
              left: active === "past" ? 3 : "calc(50% + 0px)",
            }}
          />
          <button
            onClick={() => { setActive("past"); setQuery(""); }}
            className={`relative z-10 px-4 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
              active === "past"
                ? "text-ink-900"
                : "text-ink-500 hover:text-ink-700"
            }`}
          >
            Past
            <span
              className={`ml-1.5 font-mono tabular text-[11px] ${
                active === "past" ? "text-ink-500" : "text-ink-400"
              }`}
            >
              {past.length}
            </span>
          </button>
          <button
            onClick={() => { setActive("upcoming"); setQuery(""); }}
            className={`relative z-10 px-4 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
              active === "upcoming"
                ? "text-ink-900"
                : "text-ink-500 hover:text-ink-700"
            }`}
          >
            Upcoming
            <span
              className={`ml-1.5 font-mono tabular text-[11px] ${
                active === "upcoming" ? "text-ink-500" : "text-ink-400"
              }`}
            >
              {upcoming.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search artists, deals…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-60 pl-9 pr-3 py-2 text-[13px] bg-white border border-ink-200/60 rounded-lg text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-700/20 focus:border-brand-300 transition-all"
          />
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Calendar className="h-8 w-8 text-ink-200 mx-auto mb-3" />
          <div className="text-[14px] text-ink-500">
            {query
              ? `No shows matching "${query}"`
              : active === "upcoming"
                ? "No upcoming shows on the books."
                : "No completed shows yet."}
          </div>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="mt-2 text-[12px] text-brand-700 hover:text-brand-800 font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {months.map(({ month, rows }) => (
            <section key={month}>
              {/* Month header */}
              <div className="flex items-baseline justify-between mb-1 px-1">
                <h3 className="text-[13px] font-semibold text-ink-900">
                  {month}
                </h3>
                <span className="text-[11px] font-mono tabular text-ink-400">
                  {rows.length} {rows.length === 1 ? "show" : "shows"}
                </span>
              </div>
              <div className="border-t border-ink-200/50">
                <ul>
                  {rows.map((row) => (
                    <ShowListRow key={row.show.id} row={row} />
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}

      {query && filtered.length > 0 && (
        <div className="mt-4 text-center">
          <span className="text-[12px] text-ink-400">
            {filtered.length} of {sourceRows.length} shows
          </span>
        </div>
      )}
    </div>
  );
}

function ShowListRow({ row }: { row: ShowRow }) {
  const { show, artist, deal, settlement } = row;
  const accent = getAccentColor(row);

  return (
    <li className="relative group list-none">
      <div
        className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-150 group-hover:top-1 group-hover:bottom-1 ${accent}`}
      />
      <Link
        href={`/shows/${show.id}`}
        className="grid grid-cols-[84px_1fr_120px_auto_24px] items-center gap-4 pl-5 pr-2 py-3 rounded-lg hover:bg-white/80 hover:shadow-[0_1px_4px_rgba(26,24,20,0.04)] transition-all duration-150"
      >
        {/* Date */}
        <div>
          <div className="text-[12.5px] font-medium text-ink-800 tabular">
            {row.dateFormatted}
          </div>
          <div className="text-[10px] text-ink-400 mt-px">
            {row.dateRelative}
          </div>
        </div>

        {/* Artist + deal */}
        <div className="min-w-0">
          <div className="text-[14.5px] font-medium text-ink-900 truncate group-hover:text-brand-800 transition-colors">
            {artist?.name ?? "—"}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {deal && <DealTypeBadge type={deal.dealType} />}
            {deal?.guaranteeFormatted && (
              <span className="font-mono tabular text-[11px] text-ink-500">
                {deal.guaranteeFormatted}
                {deal.dealType === "vs" ? " min" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Settlement amount */}
        <div className="text-right">
          {settlement?.totalFormatted ? (
            <>
              <div className="font-mono tabular text-[14px] font-semibold text-ink-900">
                {settlement.totalFormatted}
              </div>
              <div className="text-[9px] text-ink-400 uppercase tracking-[0.08em] mt-px">
                to artist
              </div>
            </>
          ) : null}
        </div>

        {/* Status */}
        <div className="flex justify-end">
          {settlement ? (
            <SettlementLifecyclePill status={settlement.status} />
          ) : (
            <ShowStatusPill status={show.status} />
          )}
        </div>

        {/* Arrow */}
        <ArrowUpRight className="h-3.5 w-3.5 text-ink-200 group-hover:text-ink-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-150" />
      </Link>
    </li>
  );
}

function SettlementLifecyclePill({ status }: { status: string }) {
  const v = lifecycleStatusVariants[status] ?? {
    variant: "default" as const,
    label: status,
  };
  return <PlainBadge variant={v.variant}>{v.label}</PlainBadge>;
}

const showStatusLabels: Record<Status, string> = {
  booked: "Booked",
  advanced: "Advanced",
  day_of: "Day of",
  settled: "Settled",
  closed: "Closed",
};

const showStatusVariants: Record<
  Status,
  "default" | "amber" | "brand" | "rose" | "sky"
> = {
  booked: "default",
  advanced: "sky",
  day_of: "amber",
  settled: "brand",
  closed: "default",
};

function ShowStatusPill({ status }: { status: Status }) {
  return (
    <PlainBadge variant={showStatusVariants[status]}>
      {showStatusLabels[status]}
    </PlainBadge>
  );
}
