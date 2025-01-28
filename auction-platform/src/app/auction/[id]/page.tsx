'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuction } from '@/hooks/useAuction';
import AuthLayout from '@/components/AuthLayout';
import { format } from 'date-fns';
import { Document, Page, pdfjs } from 'react-pdf';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function AuctionDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: auction, isLoading, error } = useAuction(params.id);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </AuthLayout>
    );
  }

  if (error || !auction) {
    return (
      <AuthLayout>
        <div className="text-center text-red-500">Failed to load auction details</div>
      </AuthLayout>
    );
  }

  const canEnterAuction = auction.status === 'LIVE' && agreedToTerms;

  const handleEnterAuction = () => {
    router.push(`/auction/${params.id}/room`);
  };

  return (
    <AuthLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">{auction.title}</h1>
            
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-600">{auction.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Start Time</h3>
                  <p>{format(new Date(auction.startTime), 'PPp')}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">End Time</h3>
                  <p>{format(new Date(auction.endTime), 'PPp')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Total Quantity</h3>
                  <p>{auction.totalQuantity}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Max Quantity Per Bidder</h3>
                  <p>{auction.maxQuantityPerBidder}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium text-gray-700">Min Price</h3>
                  <p>${auction.minPrice}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Max Price</h3>
                  <p>${auction.maxPrice}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700">Min Increment</h3>
                  <p>${auction.minIncrement}</p>
                </div>
              </div>

              {auction.pdfUrl && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold mb-4">Terms & Conditions</h2>
                  <div className="border rounded-lg p-4">
                    <Document
                      file={auction.pdfUrl}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                      className="max-h-96 overflow-y-auto"
                    >
                      <Page pageNumber={1} />
                    </Document>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the terms and conditions of this auction
                  </span>
                </label>
              </div>

              <button
                onClick={handleEnterAuction}
                disabled={!canEnterAuction}
                className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                  canEnterAuction
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {auction.status === 'UPCOMING'
                  ? 'Auction has not started yet'
                  : auction.status === 'COMPLETED'
                  ? 'Auction has ended'
                  : 'Enter Auction Room'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
} 