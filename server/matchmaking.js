/**
 * Matchmaking system for the Bridge debate platform
 * Handles matching users who want to start a call
 */

// Generate a unique room ID
function generateRoomId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

/**
 * Matchmaking function that pairs users who want to join a call
 * @param {Object} newUser - The user who wants to join a call
 * @param {Array} waitingQueue - The queue of users waiting for a match
 * @param {Map} activeRooms - Map of active rooms
 * @param {Object} io - Socket.io instance for emitting events
 * @returns {Object} Result of the matchmaking attempt
 */
function findMatch(newUser, waitingQueue, activeRooms, io) {
    console.log(`[Matchmaking] Finding match for user ${newUser.name} (${newUser.socketId})`);
    console.log(`[Matchmaking] Current waiting queue: ${waitingQueue.length} users`);
    
    // If queue is empty, add user to queue
    if (waitingQueue.length === 0) {
        console.log(`[Matchmaking] No users waiting. Adding ${newUser.name} to queue.`);
        waitingQueue.push(newUser);
        
        // Notify user they've been added to the queue
        io.to(newUser.socketId).emit("matchmaking-status", {
            status: "waiting",
            message: "Waiting for another user to join"
        });
        
        return { 
            matched: false, 
            status: "waiting" 
        };
    }
    
    // Get the first user in the queue
    const matchUser = waitingQueue.shift();
    
    // Check if this is the same user reconnecting (prevent self-matching)
    if (matchUser.socketId === newUser.socketId) {
        console.log(`[Matchmaking] User reconnected, keeping in queue`);
        waitingQueue.push(matchUser);
        return { 
            matched: false, 
            status: "already_waiting" 
        };
    }
    
    // Create a room for these users
    const roomId = generateRoomId();
    
    console.log(`[Matchmaking] Matched users: ${matchUser.name} with ${newUser.name}`);
    console.log(`[Matchmaking] Created room: ${roomId}`);
    
    // Set up the room with user1 and user2
    const room = {
        roomId,
        user1: {
            socketId: matchUser.socketId,
            name: matchUser.name,
            affiliation: matchUser.affiliation
        },
        user2: {
            socketId: newUser.socketId,
            name: newUser.name,
            affiliation: newUser.affiliation
        },
        createdAt: new Date().toISOString()
    };
    
    // Store the room
    activeRooms.set(roomId, room);
    
    // Notify both users they've been matched
    // Send each user to the debate page with their match info
    io.to(matchUser.socketId).emit("match-found", {
        roomId,
        position: "user1",
        match: {
            name: newUser.name,
            affiliation: newUser.affiliation
        }
    });
    
    io.to(newUser.socketId).emit("match-found", {
        roomId,
        position: "user2",
        match: {
            name: matchUser.name,
            affiliation: matchUser.affiliation
        }
    });
    
    return {
        matched: true,
        roomId,
        user1: matchUser,
        user2: newUser
    };
}

/**
 * Remove user from waiting queue when they disconnect or cancel
 * @param {string} socketId - The socket ID of the user to remove
 * @param {Array} waitingQueue - The queue of waiting users
 * @returns {boolean} Whether user was removed from queue
 */
function removeFromQueue(socketId, waitingQueue) {
    const initialLength = waitingQueue.length;
    const index = waitingQueue.findIndex(user => user.socketId === socketId);
    
    if (index !== -1) {
        waitingQueue.splice(index, 1);
        console.log(`[Matchmaking] Removed user ${socketId} from waiting queue`);
        return true;
    }
    
    return false;
}

/**
 * Handle user disconnection - cleanup rooms and waiting queue
 * @param {string} socketId - The socket ID of the disconnected user
 * @param {Array} waitingQueue - The queue of waiting users
 * @param {Map} activeRooms - Map of active rooms
 * @param {Object} io - Socket.io instance for emitting events
 */
function handleDisconnect(socketId, waitingQueue, activeRooms, io) {
    // Remove from waiting queue if present
    removeFromQueue(socketId, waitingQueue);
    
    // Check if user is in any active room
    activeRooms.forEach((room, roomId) => {
        if (room.user1.socketId === socketId || room.user2.socketId === socketId) {
            console.log(`[Matchmaking] User ${socketId} disconnected from room ${roomId}`);
            
            // Notify the other user that their match left
            const otherUser = room.user1.socketId === socketId ? room.user2 : room.user1;
            io.to(otherUser.socketId).emit("match-disconnected");
            
            // Remove the room
            activeRooms.delete(roomId);
        }
    });
}

module.exports = {
    findMatch,
    removeFromQueue,
    handleDisconnect
};