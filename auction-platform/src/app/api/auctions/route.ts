import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const sortBy = searchParams.get('sortBy') || 'startTime';
  const sortOrder = searchParams.get('sortOrder') || 'asc';

  let query = supabase
    .from('auctions')
    .select('*');

  if (status) {
    query = query.eq('status', status);
  }
  if (startDate) {
    query = query.gte('startTime', startDate);
  }
  if (endDate) {
    query = query.lte('endTime', endDate);
  }

  const { data, error } = await query
    .order(sortBy, { ascending: sortOrder === 'asc' });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch auctions' }, { status: 500 });
  }

  return NextResponse.json(data);
} 