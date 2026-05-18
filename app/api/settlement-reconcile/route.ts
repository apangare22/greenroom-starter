import { db } from "@/db";
import { settlements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { showId: string };

    await db
      .update(settlements)
      .set({
        status: "revised",
        revisedAt: new Date(),
      })
      .where(eq(settlements.showId, body.showId));

    const [updatedSettlement] = await db
      .select()
      .from(settlements)
      .where(eq(settlements.showId, body.showId));

    console.log("Updated settlement status:", updatedSettlement.status);

    return NextResponse.json({ success: true, status: updatedSettlement.status });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
