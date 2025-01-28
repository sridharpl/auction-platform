import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from './rateLimit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuctionSocket {
  auctionId: string;
  userId: string;
}

class SocketService {
  private io: SocketIOServer;
  private auctionRooms: Map<string, Set<string>> = new Map(); // auctionId -> Set of userIds

  constructor(server: HTTPServer) {
    this.io = new Server(server, {
      path: '/socket',
      transports: ['websocket'],
    });

    this.io.on('connection', this.handleConnection.bind(this));
  }

  private async handleConnection(socket: any) {
    const auctionId = socket.handshake.query.auctionId;
    if (!auctionId) {
      socket.disconnect();
      return;
    }

    // Get user from auth token
    const token = socket.handshake.auth.token;
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      socket.disconnect();
      return;
    }

    // Join auction room
    socket.join(auctionId);
    
    // Track active users
    if (!this.auctionRooms.has(auctionId)) {
      this.auctionRooms.set(auctionId, new Set());
    }
    this.auctionRooms.get(auctionId)!.add(user.id);

    // Emit updated bidder count
    this.emitBidderCount(auctionId);

    socket.on('disconnect', () => {
      this.auctionRooms.get(auctionId)?.delete(user.id);
      this.emitBidderCount(auctionId);
    });
  }

  private emitBidderCount(auctionId: string) {
    const count = this.auctionRooms.get(auctionId)?.size || 0;
    this.io.to(auctionId).emit('bidderCount', count);
  }

  public updateCompetitiveness(auctionId: string, level: 'LOW' | 'MEDIUM' | 'HIGH') {
    this.io.to(auctionId).emit('competitiveness', level);
  }
}

let socketService: SocketService | null = null;

export function initializeSocket(server: HTTPServer) {
  if (!socketService) {
    socketService = new SocketService(server);
  }
  return socketService;
}

export function getSocketService() {
  if (!socketService) {
    throw new Error('Socket service not initialized');
  }
  return socketService;
} 