import { useQuery } from '@tanstack/react-query';
import { Auction } from '@/types';

interface UseAuctionsParams {
  status?: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'startTime' | 'endTime' | 'title';
  sortOrder?: 'asc' | 'desc';
}

async function fetchAuctions(params: UseAuctionsParams): Promise<Auction[]> {
  const queryParams = new URLSearchParams();
  if (params.status) queryParams.set('status', params.status);
  if (params.startDate) queryParams.set('startDate', params.startDate.toISOString());
  if (params.endDate) queryParams.set('endDate', params.endDate.toISOString());
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  const response = await fetch(`/api/auctions?${queryParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch auctions');
  return response.json();
}

export function useAuctions(params: UseAuctionsParams = {}) {
  return useQuery({
    queryKey: ['auctions', params],
    queryFn: () => fetchAuctions(params),
    staleTime: 30000, // 30 seconds as per requirements
  });
} 