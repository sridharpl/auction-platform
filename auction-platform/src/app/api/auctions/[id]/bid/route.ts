import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { rateLimit } from '@/lib/rateLimit';
import { getSocketService } from '@/lib/socket';
import { Bid } from '@/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  const canBid = await rateLimit(`${session.user.id}_bid`, 'bid');
  if (!canBid) {
    return NextResponse.json(
      { error: 'Too many bids. Please wait.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { quantity, price } = body;

    // Fetch auction details
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', params.id)
      .single();

    if (auctionError || !auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      );
    }

    // Validate auction is live
    if (auction.status !== 'LIVE') {
      return NextResponse.json(
        { error: 'Auction is not live' },
        { status: 400 }
      );
    }

    // Validate bid
    if (
      quantity > auction.maxQuantityPerBidder ||
      quantity < 1 ||
      price < auction.minPrice ||
      price > auction.maxPrice
    ) {
      return NextResponse.json(
        { error: 'Invalid bid parameters' },
        { status: 400 }
      );
    }

    // Insert bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        auctionId: params.id,
        userId: session.user.id,
        quantity,
        price,
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (bidError) {
      return NextResponse.json(
        { error: 'Failed to place bid' },
        { status: 500 }
      );
    }

    // Calculate competitiveness
    const { data: bids } = await supabase
      .from('bids')
      .select('price, quantity')
      .eq('auctionId', params.id)
      .order('price', { ascending: false });

    let totalQuantity = 0;
    let competitiveness: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    if (bids) {
      for (const bid of bids) {
        totalQuantity += bid.quantity;
        if (totalQuantity >= auction.totalQuantity) {
          if (bid.price >= price) {
            competitiveness = 'HIGH';
          } else {
            competitiveness = 'MEDIUM';
          }
          break;
        }
      }
    }

    // Update competitiveness via WebSocket
    getSocketService().updateCompetitiveness(params.id, competitiveness);

    return NextResponse.json(bid);
  } catch (error) {
    console.error('Bid processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 