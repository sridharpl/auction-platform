import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch user's bids
    const { data: myBids, error: bidsError } = await supabase
      .from('bids')
      .select('*')
      .eq('auctionId', params.id)
      .eq('userId', session.user.id)
      .order('timestamp', { ascending: false });

    if (bidsError) {
      return NextResponse.json(
        { error: 'Failed to fetch bids' },
        { status: 500 }
      );
    }

    // Calculate competitiveness
    const { data: allBids, error: allBidsError } = await supabase
      .from('bids')
      .select('price, quantity')
      .eq('auctionId', params.id)
      .order('price', { ascending: false });

    if (allBidsError) {
      return NextResponse.json(
        { error: 'Failed to calculate competitiveness' },
        { status: 500 }
      );
    }

    // Get auction details for total quantity
    const { data: auction } = await supabase
      .from('auctions')
      .select('totalQuantity')
      .eq('id', params.id)
      .single();

    let competitiveness: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (myBids && myBids.length > 0 && allBids && auction) {
      let totalQuantity = 0;
      const myLastBid = myBids[0];

      for (const bid of allBids) {
        totalQuantity += bid.quantity;
        if (totalQuantity >= auction.totalQuantity) {
          if (bid.price >= myLastBid.price) {
            competitiveness = 'HIGH';
          } else {
            competitiveness = 'MEDIUM';
          }
          break;
        }
      }
    }

    return NextResponse.json({
      myBids: myBids || [],
      competitiveness,
      activeBidders: 0, // This will be updated via WebSocket
    });
  } catch (error) {
    console.error('Room data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 