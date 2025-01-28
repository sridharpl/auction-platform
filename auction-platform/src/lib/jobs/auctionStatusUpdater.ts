import { createClient } from '@supabase/supabase-js';
import { getSocketService } from '../socket';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateAuctionStatuses() {
  const now = new Date().toISOString();

  // Update UPCOMING to LIVE
  await supabase
    .from('auctions')
    .update({ status: 'LIVE' })
    .eq('status', 'UPCOMING')
    .lte('startTime', now);

  // Update LIVE to COMPLETED
  const { data: completedAuctions } = await supabase
    .from('auctions')
    .update({ status: 'COMPLETED' })
    .eq('status', 'LIVE')
    .lte('endTime', now)
    .select('id');

  // Notify connected clients about completed auctions
  if (completedAuctions) {
    const socketService = getSocketService();
    completedAuctions.forEach(auction => {
      socketService.notifyAuctionComplete(auction.id);
    });
  }
} 