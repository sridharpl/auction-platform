'use client';

import { useState } from 'react';
import { useAuctions } from '@/hooks/useAuctions';
import AuthLayout from '@/components/AuthLayout';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [filters, setFilters] = useState({
    status: '' as '' | 'UPCOMING' | 'LIVE' | 'COMPLETED',
    startDate: '',
    endDate: '',
    sortBy: 'startTime' as 'startTime' | 'endTime' | 'title',
    sortOrder: 'asc' as 'asc' | 'desc',
  });

  const { data: auctions, isLoading, error } = useAuctions({
    status: filters.status || undefined,
    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
    endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  return (
    <AuthLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Auctions Dashboard</h1>
          
          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value as any }))}
              className="rounded-md border-gray-300"
            >
              <option value="">All Status</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="LIVE">Live</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
              className="rounded-md border-gray-300"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
              className="rounded-md border-gray-300"
              placeholder="End Date"
            />

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value as any }))}
              className="rounded-md border-gray-300"
            >
              <option value="startTime">Start Time</option>
              <option value="endTime">End Time</option>
              <option value="title">Title</option>
            </select>

            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters(f => ({ ...f, sortOrder: e.target.value as any }))}
              className="rounded-md border-gray-300"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        {/* Auctions Grid */}
        {isLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">Failed to load auctions</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {auctions?.map((auction) => (
              <div
                key={auction.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{auction.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{auction.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>Start: {format(new Date(auction.startTime), 'PPp')}</p>
                    <p>End: {format(new Date(auction.endTime), 'PPp')}</p>
                    <p>Quantity: {auction.totalQuantity}</p>
                    <p>Min Price: ${auction.minPrice}</p>
                  </div>

                  <div className="mt-4">
                    <a
                      href={`/auction/${auction.id}`}
                      className="inline-block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      View Details
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  );
} 