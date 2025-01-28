import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function calculateAuctionResults(auctionId: string) {
  // Fetch auction and all bids
  const { data: auction } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', auctionId)
    .single();

  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .eq('auctionId', auctionId)
    .order('price', { ascending: false });

  if (!auction || !bids) return;

  let remainingQuantity = auction.totalQuantity;
  const allocations = new Map<string, { quantity: number; price: number }>();

  // Allocate based on highest price first
  for (const bid of bids) {
    if (remainingQuantity <= 0) break;

    const allocation = Math.min(bid.quantity, remainingQuantity);
    remainingQuantity -= allocation;

    allocations.set(bid.userId, {
      quantity: allocation,
      price: bid.price,
    });
  }

  // Store results in database
  const results = Array.from(allocations.entries()).map(([userId, allocation]) => ({
    auctionId,
    userId,
    quantity: allocation.quantity,
    price: allocation.price,
    totalAmount: allocation.quantity * allocation.price,
  }));

  await supabase.from('auction_results').insert(results);
} 