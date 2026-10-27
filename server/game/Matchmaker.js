// server/game/Matchmaker.js

export class Matchmaker {
  constructor(roomManager, io) {
    this.roomManager = roomManager;
    this.io = io;
    this.queue = []; // Array of { playerId, socketId, nickname, avatar, joinedAt }
    this.checkInterval = null;
    this.minMatchSize = 3;
    this.maxMatchSize = 6;
    this.startQueueWorker();
  }

  startQueueWorker() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => {
      this.processQueue();
    }, 2000);
  }

  addToQueue(playerData) {
    // Remove if already in queue
    this.removeFromQueue(playerData.playerId);

    const entry = {
      playerId: playerData.playerId,
      socketId: playerData.socketId,
      nickname: playerData.nickname || `Guest_${playerData.playerId.slice(0, 4)}`,
      avatar: playerData.avatar || 'avatar-1',
      joinedAt: Date.now()
    };

    this.queue.push(entry);

    if (this.io && entry.socketId) {
      this.io.to(entry.socketId).emit('matchmaking:status', {
        status: 'SEARCHING',
        queueLength: this.queue.length
      });
    }

    this.processQueue();
    return { success: true, position: this.queue.length };
  }

  removeFromQueue(playerId) {
    const idx = this.queue.findIndex(p => p.playerId === playerId);
    if (idx !== -1) {
      const removed = this.queue.splice(idx, 1)[0];
      if (this.io && removed.socketId) {
        this.io.to(removed.socketId).emit('matchmaking:status', {
          status: 'IDLE',
          queueLength: this.queue.length
        });
      }
      return true;
    }
    return false;
  }

  processQueue() {
    if (this.queue.length < this.minMatchSize) {
      // Broadcast queue size updates to everyone in queue
      if (this.io) {
        for (const item of this.queue) {
          this.io.to(item.socketId).emit('matchmaking:status', {
            status: 'SEARCHING',
            queueLength: this.queue.length
          });
        }
      }
      return;
    }

    // Pull candidates for match (up to maxMatchSize, min minMatchSize)
    const matchCount = Math.min(this.queue.length, this.maxMatchSize);
    const matchedPlayers = this.queue.splice(0, matchCount);

    // Create room with first matched player as host
    const host = matchedPlayers[0];
    const room = this.roomManager.createRoom(host.playerId, host.nickname, host.avatar, {
      visibility: 'public',
      minPlayers: 3
    }, host.socketId);

    // Add rest of players
    for (let i = 1; i < matchedPlayers.length; i++) {
      const p = matchedPlayers[i];
      this.roomManager.joinRoom(room.roomCode, p.playerId, p.nickname, p.avatar, null, p.socketId);
    }

    // Notify all matched players
    if (this.io) {
      for (const p of matchedPlayers) {
        this.io.to(p.socketId).emit('matchmaking:status', {
          status: 'MATCHED',
          matchedRoomCode: room.roomCode
        });
      }
    }
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}
