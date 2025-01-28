import { useQuery } from '@tanstack/react-query';
import { Auction } from '@/types';

export function useAuction(auctionId: string) {
  return useQuery({
    queryKey: ['auction', auctionId],
    queryFn: async () => {
      const response = await fetch(`/api/auctions/${auctionId}`);
      if (!response.ok) throw new Error('Failed to fetch auction');
      return response.json() as Promise<Auction>;
    },
    staleTime: 30000,
  });
} 