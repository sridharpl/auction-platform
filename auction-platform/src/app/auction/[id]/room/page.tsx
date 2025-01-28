'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuction } from '@/hooks/useAuction';
import { useAuctionRoom } from '@/hooks/useAuctionRoom';
import AuthLayout from '@/components/AuthLayout';
import { formatDistanceToNow } from 'date-fns';

export default function AuctionRoom({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: auction, isLoading: auctionLoading } = useAuction(params.id);
  const { roomData, error, placeBid, isConnected } = useAuctionRoom(params.id);
  
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [bidStatus, setBidStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [lastBidTime, setLastBidTime] = useState<Date | null>(null);

  // Update countdown timer
  useEffect(() => {
    if (!auction) return;

    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(auction.endTime);
      const distance = end.getTime() - now.getTime();

      if (distance <= 0) {
        setTimeLeft('Auction ended');
        router.push(`/auction/${params.id}/results`);
        clearInterval(timer);
      } else {
        setTimeLeft(formatDistanceToNow(end, { addSuffix: true }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [auction, params.id, router]);

  const handleQuickBid = (incrementPercentage: number) => {
    if (!auction || !roomData?.myBids.length) return;
    
    const lastBid = roomData.myBids[0];
    const newPrice = lastBid.price * (1 + incrementPercentage / 100);
    setPrice(Math.min(newPrice, auction.maxPrice).toFixed(2));
    setQuantity(lastBid.quantity.toString());
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auction || bidStatus === 'submitting') return;

    // Validate bid timing
    if (lastBidTime && new Date().getTime() - lastBidTime.getTime() < 1000) {
      setBidStatus('error');
      return;
    }

    const numericQuantity = parseInt(quantity);
    const numericPrice = parseFloat(price);

    // Validate inputs
    if (
      isNaN(numericQuantity) ||
      isNaN(numericPrice) ||
      numericQuantity > auction.maxQuantityPerBidder ||
      numericQuantity < 1 ||
      numericPrice < auction.minPrice ||
      numericPrice > auction.maxPrice
    ) {
      setBidStatus('error');
      return;
    }

    setBidStatus('submitting');
    const success = await placeBid(numericQuantity, numericPrice);
    setBidStatus(success ? 'success' : 'error');
    setLastBidTime(new Date());

    // Reset status after delay
    setTimeout(() => setBidStatus('idle'), 3000);
  };

  if (auctionLoading) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </AuthLayout>
    );
  }

  if (!auction || error) {
    return (
      <AuthLayout>
        <div className="text-center text-red-500">Failed to load auction room</div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Auction Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{auction.title}</h1>
                <div className={`flex items-center ${
                  timeLeft.includes('ended') ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <span className="font-medium">{timeLeft}</span>
                </div>
              </div>

              {/* Connection Status */}
              <div className={`flex items-center mb-4 ${
                isConnected ? 'text-green-600' : 'text-red-600'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-600' : 'bg-red-600'
                }`} />
                <span className="text-sm">
                  {isConnected ? 'Connected' : 'Reconnecting...'}
                </span>
              </div>

              {/* Active Bidders */}
              <div className="mb-6">
                <span className="text-sm text-gray-600">
                  {roomData?.activeBidders || 0} active bidders in this auction
                </span>
              </div>

              {/* Bid Form */}
              <form onSubmit={handleSubmitBid} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={auction.maxQuantityPerBidder}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={auction.minPrice}
                      max={auction.maxPrice}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      required
                    />
                  </div>
                </div>

                {/* Quick Bid Buttons */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => handleQuickBid(5)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    +5%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickBid(10)}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    +10%
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={bidStatus === 'submitting'}
                  className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                    bidStatus === 'submitting'
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {bidStatus === 'submitting' ? 'Placing Bid...' : 'Place Bid'}
                </button>

                {/* Bid Status */}
                {bidStatus === 'success' && (
                  <div className="text-green-600 text-sm text-center">
                    Bid placed successfully
                  </div>
                )}
                {bidStatus === 'error' && (
                  <div className="text-red-600 text-sm text-center">
                    Failed to place bid. Please try again.
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Right Column - Bid History & Competitiveness */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Your Bids</h2>
            
            {/* Competitiveness Indicator */}
            {roomData?.competitiveness && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Bid Competitiveness
                </h3>
                <div className={`p-3 rounded-md ${
                  roomData.competitiveness === 'HIGH'
                    ? 'bg-red-100 text-red-800'
                    : roomData.competitiveness === 'MEDIUM'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {roomData.competitiveness === 'HIGH'
                    ? 'Consider reviewing your bid to improve allocation chances'
                    : roomData.competitiveness === 'MEDIUM'
                    ? 'Current bid may not be competitive for your desired quantity'
                    : 'Your bid appears competitive'
                  }
                </div>
              </div>
            )}

            {/* Bid History */}
            <div className="space-y-4">
              {roomData?.myBids.map((bid) => (
                <div
                  key={bid.id}
                  className="p-3 border rounded-md"
                >
                  <div className="flex justify-between text-sm">
                    <span>Quantity: {bid.quantity}</span>
                    <span>Price: ${bid.price}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(bid.timestamp), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
} 