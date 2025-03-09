import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json();

    if (!leadId) {
      return NextResponse.json({ error: "Lead ID is required" }, { status: 400 });
    }

    // Clear the lead status in Redis
    const leadStatusKey = `lead:${leadId}:status`;
    await redis.del(leadStatusKey);
    
    // Also clear the cursor if any
    const cursorKey = `cursor:${leadId}`;
    await redis.del(cursorKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear lead error status:', error);
    return NextResponse.json({ 
      error: 'Failed to clear lead error status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 