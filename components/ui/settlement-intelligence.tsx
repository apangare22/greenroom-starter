"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface SettlementIntelligenceProps {
  showId: string;
  settlementStatus: string;
  signoffText: string | null;
  dealNotesFreetext: string | null;
  structuredFields: {
    dealType: string;
    guaranteeAmount: number | null;
    percentage: number | null;
    percentageBasis: string | null;
    expenseCap: number | null;
    hospitalityCap: number | null;
  };
}

type SignoffCheck = {
  isContradiction: boolean;
  sentiment: "positive" | "negative" | "ambiguous" | "empty";
  explanation: string;
};

type DealDiff = {
  mismatches: {
    field: string;
    notesSay: string;
    structuredSays: string;
    severity: "high" | "medium" | "low";
  }[];
};

type IntelligenceResponse = {
  signoffCheck: SignoffCheck | null;
  dealDiff: DealDiff | null;
};

export default function SettlementIntelligence(
  props: SettlementIntelligenceProps,
) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<IntelligenceResponse | null>(null);
  const [isResolved, setIsResolved] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSettlementIntegrity() {
      try {
        if (
          props.settlementStatus === "revised" ||
          props.settlementStatus === "finalized" ||
          props.settlementStatus === "paid"
        ) {
          return;
        }

        const response = await fetch("/api/settlement-intelligence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(props),
        });

        if (!response.ok) {
          throw new Error("Settlement intelligence request failed.");
        }

        const data = (await response.json()) as IntelligenceResponse;
        if (!cancelled) {
          setResult(data);
        }
      } catch {
        if (!cancelled) {
          setResult(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    checkSettlementIntegrity();

    return () => {
      cancelled = true;
    };
  }, [props]);

  if (loading) {
    return (
      <div className="text-[12px] text-ink-400">
        Checking settlement integrity...
      </div>
    );
  }

  const hasSignoffContradiction =
    result?.signoffCheck?.isContradiction === true;
  const mismatches = result?.dealDiff?.mismatches ?? [];

  if (!hasSignoffContradiction && mismatches.length === 0) {
    return null;
  }

  async function reconcileSettlement() {
    setIsResolving(true);
    try {
      const response = await fetch("/api/settlement-reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showId: props.showId }),
      });

      if (!response.ok) {
        throw new Error("Settlement reconcile request failed.");
      }

      const data = (await response.json()) as {
        success: boolean;
        error?: string;
      };
      if (!data.success) {
        throw new Error(data.error ?? "Settlement reconcile request failed.");
      }

      setIsResolved(true);
      setIsResolving(false);
    } catch (err) {
      setIsResolving(false);
      console.error(err);
    }
  }

  return (
    <div className="space-y-3">
      {hasSignoffContradiction && isResolved && (
        <div className="rounded-lg border border-green-200/60 bg-green-50/40 p-4 flex items-center gap-2">
          <CheckCircle className="text-green-700 h-4 w-4" />
          <div className="text-[13px] text-green-800">
            Settlement marked as resolved. Status updated to revised.
          </div>
        </div>
      )}

      {hasSignoffContradiction && !isResolved && (
        <div className="rounded-lg border border-amber-200/60 bg-amber-50/40 p-5 flex gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <div className="text-[13px] font-semibold text-amber-800">
              TM signoff conflicts with disputed status
            </div>
            <div className="text-[12.5px] text-ink-600 italic mt-1 leading-relaxed">
              &quot;{props.signoffText ?? ""}&quot;
            </div>
            <div className="text-[12px] text-ink-500 mt-1 leading-relaxed">
              {result?.signoffCheck?.explanation}
            </div>
            <button
              type="button"
              onClick={reconcileSettlement}
              disabled={isResolving}
              className="mt-3 text-[12px] font-medium text-amber-800 underline cursor-pointer"
            >
              {isResolving ? "Resolving..." : "Mark as Resolved"}
            </button>
          </div>
        </div>
      )}

      {mismatches.length > 0 && (
        <div className="rounded-lg border border-rose-200/60 bg-rose-50/40 p-5 flex gap-3">
          <AlertTriangle className="h-4 w-4 text-rose-700 mt-0.5 shrink-0" />
          <div>
            <div className="text-[13px] font-semibold text-rose-800">
              Deal terms need confirmation before settlement
            </div>
            <div className="mt-3 space-y-2">
              {mismatches.map((mismatch) => (
                <div
                  key={`${mismatch.field}-${mismatch.notesSay}-${mismatch.structuredSays}`}
                  className="text-[12.5px] text-ink-600 leading-relaxed"
                >
                  <span className="font-semibold">{mismatch.field}</span>:{" "}
                  {mismatch.notesSay} vs {mismatch.structuredSays}
                </div>
              ))}
            </div>
            <div className="text-[11.5px] text-ink-400 mt-3">
              Confirm the correct value before sending numbers to the agent
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
