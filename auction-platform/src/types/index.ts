export interface User {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'BIDDER';
  }
  
  export interface Auction {
    id: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
    totalQuantity: number;
    maxQuantityPerBidder: number;
    minPrice: number;
    maxPrice: number;
    minIncrement: number;
    pdfUrl?: string;
  }
  
  export interface Bid {
    id: string;
    auctionId: string;
    userId: string;
    quantity: number;
    price: number;
    timestamp: Date;
  }
  
  export interface AdminUser extends User {
    role: 'ADMIN';
  }
  
  export interface BidderUser extends User {
    role: 'BIDDER';
  }
  
  export interface AuctionCreationData {
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    totalQuantity: number;
    maxQuantityPerBidder: number;
    minPrice: number;
    maxPrice: number;
    minIncrement: number;
    pdfUrl?: string;
    allowedBidders: string[]; // Array of bidder user IDs
  }
  
  export interface AuctionResult {
    won: boolean;
    allocation?: {
      quantity: number;
      price: number;
      totalAmount: number;
    };
    summary: {
      totalBids: number;
      totalQuantityAllocated: number;
      averagePrice: number;
      winningBids: {
        minPrice: number;
        maxPrice: number;
      };
    };
  } 