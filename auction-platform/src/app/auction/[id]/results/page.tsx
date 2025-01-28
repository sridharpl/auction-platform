'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuction } from '@/hooks/useAuction';
import AuthLayout from '@/components/AuthLayout';
import { AuctionResult } from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AuctionResults({ params }: { params: { id: string } }) {
  const { data: auction, isLoading: auctionLoading } = useAuction(params.id);
  const [chartView, setChartView] = useState<'quantity' | 'price'>('quantity');
  
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['auctionResults', params.id],
    queryFn: async () => {
      const response = await fetch(`/api/auctions/${params.id}/results`);
      if (!response.ok) throw new Error('Failed to fetch results');
      return response.json() as Promise<AuctionResult>;
    },
    enabled: !!auction && auction.status === 'COMPLETED',
  });

  if (auctionLoading || resultsLoading) {
    return (
      <AuthLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      </AuthLayout>
    );
  }

  if (!auction || !results) {
    return (
      <AuthLayout>
        <div className="text-center text-red-500">Failed to load auction results</div>
      </AuthLayout>
    );
  }

  const chartData = {
    labels: ['Your Allocation', 'Total Allocation'],
    datasets: [
      {
        label: chartView === 'quantity' ? 'Quantity' : 'Price ($)',
        data: chartView === 'quantity' 
          ? [results.allocation?.quantity || 0, results.summary.totalQuantityAllocated]
          : [results.allocation?.price || 0, results.summary.averagePrice],
        backgroundColor: ['rgba(99, 102, 241, 0.5)', 'rgba(156, 163, 175, 0.5)'],
        borderColor: ['rgb(99, 102, 241)', 'rgb(156, 163, 175)'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: chartView === 'quantity' ? 'Quantity Allocation' : 'Price Comparison',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-8">{auction.title} - Results</h1>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Your Results */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Your Results</h2>
              <div className="space-y-4">
                <div className={`text-lg font-medium ${
                  results.won ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {results.won ? 'Congratulations! You won allocation.' : 'You did not receive allocation.'}
                </div>
                
                {results.won && results.allocation && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Quantity Allocated</div>
                        <div className="text-lg font-medium">{results.allocation.quantity}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Price per Unit</div>
                        <div className="text-lg font-medium">${results.allocation.price}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Amount</div>
                      <div className="text-lg font-medium">${results.allocation.totalAmount}</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Auction Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Auction Summary</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Total Bids</div>
                  <div className="text-lg font-medium">{results.summary.totalBids}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Quantity Allocated</div>
                  <div className="text-lg font-medium">{results.summary.totalQuantityAllocated}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Price Range</div>
                  <div className="text-lg font-medium">
                    ${results.summary.winningBids.minPrice} - ${results.summary.winningBids.maxPrice}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Average Price</div>
                  <div className="text-lg font-medium">${results.summary.averagePrice}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="mt-8">
            <div className="flex justify-end mb-4">
              <div className="inline-flex rounded-md shadow-sm">
                <button
                  onClick={() => setChartView('quantity')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-md ${
                    chartView === 'quantity'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Quantity
                </button>
                <button
                  onClick={() => setChartView('price')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-md ${
                    chartView === 'price'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Price
                </button>
              </div>
            </div>
            <div className="h-80">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
} 