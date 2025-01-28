import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { Bid } from '@/types';

interface AuctionRoomData {
  activeBidders: number;
  competitiveness: 'LOW' | 'MEDIUM' | 'HIGH';
  myBids: Bid[];
}

export function useAuctionRoom(auctionId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();
  
  // Fetch initial room data
  const { data, error } = useQuery({
    queryKey: ['auctionRoom', auctionId],
    queryFn: async () => {
      const response = await fetch(`/api/auctions/${auctionId}/room`);
      if (!response.ok) throw new Error('Failed to fetch auction room data');
      return response.json() as Promise<AuctionRoomData>;
    },
    staleTime: 10000,
  });

  useEffect(() => {
    const newSocket = io('/auction', {
      query: { auctionId },
    });

    newSocket.on('bidderCount', (count: number) => {
      queryClient.setQueryData(['auctionRoom', auctionId], (old: any) => ({
        ...old,
        activeBidders: count,
      }));
    });

    newSocket.on('competitiveness', (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
      queryClient.setQueryData(['auctionRoom', auctionId], (old: any) => ({
        ...old,
        competitiveness: level,
      }));
    });

    newSocket.on('disconnect', () => {
      // Implement reconnection logic
      setTimeout(() => {
        newSocket.connect();
      }, 5000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [auctionId, queryClient]);

  const placeBid = async (quantity: number, price: number) => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, price }),
      });

      if (!response.ok) throw new Error('Failed to place bid');

      // Update local data
      const newBid = await response.json();
      queryClient.setQueryData(['auctionRoom', auctionId], (old: any) => ({
        ...old,
        myBids: [newBid, ...(old?.myBids || [])],
      }));

      return true;
    } catch (error) {
      console.error('Bid placement failed:', error);
      return false;
    }
  };

  return {
    roomData: data,
    error,
    placeBid,
    isConnected: socket?.connected || false,
  };
} 