export async function POST(request: Request) {
  try {
    const { id, cookies, username, userId, leadId } = await request.json();
    
    // Update Twitter account...
    
    // If leadId is provided, clear the error status
    if (leadId) {
      const leadStatusKey = `lead:${leadId}:status`;
      const cursorKey = `cursor:${leadId}`;
      await redis.del(leadStatusKey);
      await redis.del(cursorKey);
      console.log(`Cleared error status for lead ${leadId}`);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // Error handling...
  }
} 