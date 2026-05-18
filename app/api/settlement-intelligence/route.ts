import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type StructuredFields = {
  dealType?: string | null;
  guaranteeAmount?: number | null;
  percentage?: number | null;
  percentageBasis?: string | null;
  expenseCap?: number | null;
  hospitalityCap?: number | null;
};

type SettlementIntelligenceBody = {
  settlementStatus?: string | null;
  signoffText?: string | null;
  dealNotesFreetext?: string | null;
  structuredFields?: StructuredFields | null;
};

function contentToText(content: Message["content"]) {
  return content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
}

function parseJsonResponse(text: string) {
  const cleaned = text
    .replace(/^[\s\S]*?```(?:json)?\s*/i, "")
    .replace(/\s*```[\s\S]*$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return JSON.parse(text.trim());
  }
}

async function runSignoffCheck(body: SettlementIntelligenceBody) {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system:
        "You analyze settlement signoff text. Return JSON only, no other text.",
      messages: [
        {
          role: "user",
          content: `Settlement status: ${body.settlementStatus ?? ""}. Artist team signoff text: ${body.signoffText ?? ""}. Return exactly: {isContradiction: boolean, sentiment: positive|negative|ambiguous|empty, explanation: string}. isContradiction is true only when status is disputed or revised AND sentiment is positive.`,
        },
      ],
    });

    return parseJsonResponse(contentToText(response.content));
  } catch (err) {
    console.error("Settlement intelligence error:", err);
    return null;
  }
}

async function runDealDiff(body: SettlementIntelligenceBody) {
  try {
    if (!body.dealNotesFreetext?.trim()) {
      return null;
    }

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system:
        "You compare deal prose notes to structured fields. Return JSON only, no other text.",
      messages: [
        {
          role: "user",
          content: `Deal notes: ${body.dealNotesFreetext}. Structured fields: ${JSON.stringify(body.structuredFields ?? {})}. Find contradictions where prose states different numerical values than structured fields. Return exactly: {mismatches: [{field: string, notesSay: string, structuredSays: string, severity: high|medium|low}]}. Only flag clear numerical contradictions. Empty array if none.`,
        },
      ],
    });

    return parseJsonResponse(contentToText(response.content));
  } catch (err) {
    console.error("Settlement intelligence error:", err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SettlementIntelligenceBody;
    const [signoffCheck, dealDiff] = await Promise.all([
      runSignoffCheck(body),
      runDealDiff(body),
    ]);

    return NextResponse.json({ signoffCheck, dealDiff });
  } catch {
    return NextResponse.json({ signoffCheck: null, dealDiff: null });
  }
}
