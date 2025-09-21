// require("dotenv").config(); 

// const express = require("express"); 
// const cors = require("cors"); 
// const app = express(); 

// app.use(cors());

// // API endpoint to get active users
// app.get('/api/active-users', (req, res) => {
//     const users = Array.from(connectedUsers.values()).map(user => ({
//         name: user.name,
//         affiliation: user.affiliation,
//         connectedAt: user.connectedAt
//     }));
//     res.json({ 
//         users, 
//         totalUsers: users.length,
//         debateParticipants: Object.keys(debateState.participants).length,
//         debateActive: debateState.active
//     });
// });

// const server = require("http").createServer(app);
// const io = require("socket.io")(server, { 
//     cors: {
//         origin: "*",
//         methods: ["GET", "POST"]
//     }
// }); 

// const port = 3000; 

// // Error handling middleware
// function errorHandler(err, req, res, next) { 
//     console.error(err.stack); 
//     res.status(500).send("Internal Server Error");
// }
// app.use(errorHandler);

// // Debate timer configuration
// const DEBATE_PHASES = [
//     { phase: 1, duration: 30, speaker: "user1", description: "Opening statement - User 1" },
//     { phase: 2, duration: 30, speaker: "user2", description: "Opening statement - User 2" },
//     { phase: 3, duration: 120, speaker: "user1", description: "Main argument - User 1" },
//     { phase: 4, duration: 120, speaker: "user2", description: "Main argument - User 2" },
//     { phase: 5, duration: 60, speaker: "user1", description: "Closing statement - User 1" },
//     { phase: 6, duration: 60, speaker: "user2", description: "Closing statement - User 2" }
// ];

// // Global debate state
// let debateState = {
//     active: false,
//     currentPhase: 0,
//     timeRemaining: 0,
//     currentSpeaker: null,
//     participants: {},
//     timer: null
// };

// // Track all connected users
// let connectedUsers = new Map(); // socketId -> userInfo

// // Debate timer functions
// function startDebateTimer() {
//     if (debateState.active) {
//         console.log("Debate already active");
//         return;
//     }

//     debateState.active = true;
//     debateState.currentPhase = 0;
    
//     console.log("Starting debate timer");
//     startPhase();
// }

// function startPhase() {
//     if (debateState.currentPhase >= DEBATE_PHASES.length) {
//         console.log("Debate finished");
//         io.emit("debate-finished");
//         resetDebateState();
//         return;
//     }

//     const currentPhaseData = DEBATE_PHASES[debateState.currentPhase];
//     debateState.timeRemaining = currentPhaseData.duration;
//     debateState.currentSpeaker = currentPhaseData.speaker;

//     console.log(`Starting phase ${currentPhaseData.phase}: ${currentPhaseData.description}`);

//     // Broadcast phase start
//     io.emit("phase-start", {
//         phase: currentPhaseData.phase,
//         duration: currentPhaseData.duration,
//         speaker: currentPhaseData.speaker,
//         description: currentPhaseData.description
//     });

//     // Start countdown timer
//     debateState.timer = setInterval(() => {
//         debateState.timeRemaining--;

//         // Broadcast time update every second
//         io.emit("time-update", {
//             timeRemaining: debateState.timeRemaining
//         });

//         if (debateState.timeRemaining <= 0) {
//             clearInterval(debateState.timer);
//             debateState.currentPhase++;
            
//             if (debateState.currentPhase >= DEBATE_PHASES.length) {
//                 // Debate finished
//                 io.emit("debate-finished");
//                 resetDebateState();
//                 return;
//             }
            
//             // Start next phase after a brief pause
//             setTimeout(() => {
//                 startPhase();
//             }, 1000);
//         }
//     }, 1000);
// }

// function resetDebateState() {
//     console.log("Resetting debate state");
//     if (debateState.timer) {
//         clearInterval(debateState.timer);
//     }
//     debateState = {
//         active: false,
//         currentPhase: 0,
//         timeRemaining: 0,
//         currentSpeaker: null,
//         participants: {},
//         timer: null
//     };
// }

// // Socket.IO connection handling
// io.on("connection", (socket) => { 
//     console.log("User connected:", socket.id);
    
//     // Handle user joining the debate
//     socket.on("join-debate", (userData) => {
//         console.log("User joining debate:", userData, socket.id);
//         console.log("Current participants before join:", Object.keys(debateState.participants));
        
//         // Store user info in both places
//         socket.userInfo = {
//             name: userData.name,
//             affiliation: userData.affiliation,
//             socketId: socket.id,
//             connectedAt: new Date().toISOString()
//         };
        
//         connectedUsers.set(socket.id, socket.userInfo);
        
//         // Check if room is full
//         const participantCount = Object.keys(debateState.participants).length;
//         console.log(`Current participant count: ${participantCount}`);
        
//         if (participantCount >= 2) {
//             console.log("Room is full, rejecting user");
//             socket.emit("room-full");
//             return;
//         }
        
//         // Assign user position (user1 or user2)
//         const userPosition = participantCount === 0 ? "user1" : "user2";
        
//         debateState.participants[userPosition] = {
//             socketId: socket.id,
//             name: userData.name,
//             affiliation: userData.affiliation
//         };
        
//         console.log(`User ${userData.name} assigned position ${userPosition}`);
//         console.log("Updated participants:", debateState.participants);
        
//         // Tell this user their position and current room state
//         socket.emit("joined-debate", {
//             position: userPosition,
//             participants: debateState.participants,
//             debateActive: debateState.active
//         });
        
//         // Broadcast user list update to all clients
//         io.emit("users-update", {
//             connectedUsers: Array.from(connectedUsers.values()),
//             debateParticipants: Object.keys(debateState.participants).length
//         });
        
//         // If there's another participant, notify them about the new user
//         Object.keys(debateState.participants).forEach(pos => {
//             const participant = debateState.participants[pos];
//             if (participant.socketId !== socket.id) {
//                 io.to(participant.socketId).emit("user-joined", {
//                     user: {
//                         name: userData.name,
//                         affiliation: userData.affiliation
//                     },
//                     position: userPosition
//                 });
//             }
//         });
        
//         // Start debate automatically if we have 2 participants
//         if (Object.keys(debateState.participants).length === 2 && !debateState.active) {
//             console.log("Two participants ready, starting debate in 2 seconds");
//             setTimeout(() => {
//                 startDebateTimer();
//             }, 2000);
//         }
//     });

//     // Handle WebRTC signaling
//     socket.on("webrtc-signal", (data) => {
//         console.log("WebRTC signal:", data.type, "from", socket.id);
//         socket.broadcast.emit("webrtc-signal", {
//             ...data,
//             from: socket.id
//         });
//     });

//     // Handle manual debate start
//     socket.on("start-debate", () => {
//         if (Object.keys(debateState.participants).length === 2 && !debateState.active) {
//             console.log("Manual debate start requested");
//             startDebateTimer();
//         }
//     });

//     // Handle disconnect
//     socket.on("disconnect", () => {
//         console.log("User disconnected:", socket.id);
        
//         // Remove from connected users
//         connectedUsers.delete(socket.id);
        
//         // Remove user from debate participants
//         Object.keys(debateState.participants).forEach(pos => {
//             if (debateState.participants[pos].socketId === socket.id) {
//                 delete debateState.participants[pos];
//                 console.log(`Removed user from debate position ${pos}`);
                
//                 // Notify remaining participants
//                 socket.broadcast.emit("user-left", { position: pos });
//             }
//         });
        
//         console.log("Participants after disconnect:", Object.keys(debateState.participants));
        
//         // Broadcast updated user list to all clients
//         io.emit("users-update", {
//             connectedUsers: Array.from(connectedUsers.values()),
//             debateParticipants: Object.keys(debateState.participants).length
//         });
        
//         // Reset debate if no participants left
//         if (Object.keys(debateState.participants).length === 0) {
//             resetDebateState();
//         }
//     });
// });

// server.listen(port, '0.0.0.0', () => { 
//     console.log(`Listening on Port ${port} on all interfaces`)
// });


// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { randomUUID } = require("crypto");
const { Server } = require("socket.io");

const app = express();

/* ====== Config ====== */
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
// Allow everything by default; tighten in production with exact origins.
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

/* ====== In-memory state ====== */

// Debate timer configuration (phases are 1..6 as in your UI copy)
const DEBATE_PHASES = [
  { phase: 1, duration: 30,  speaker: "user1", description: "Opening statement - User 1" },
  { phase: 2, duration: 30,  speaker: "user2", description: "Opening statement - User 2" },
  { phase: 3, duration: 120, speaker: "user1", description: "Main argument - User 1" },
  { phase: 4, duration: 120, speaker: "user2", description: "Main argument - User 2" },
  { phase: 5, duration: 60,  speaker: "user1", description: "Closing statement - User 1" },
  { phase: 6, duration: 60,  speaker: "user2", description: "Closing statement - User 2" }
];

const TOPIC_DATA = {
  "Economic": [
    "Should the minimum wage be $15/hour?",
    "Should student loan debt be forgiven?",
    "Should taxes on the rich be higher?",
    "Should the government give people money for free (UBI)?",
    "Should corporations pay lower taxes to grow the economy?"
  ],
  "Social": [
    "Should guns be more strictly controlled?",
    "Should everyone have healthcare?",
    "Should colleges limit hate speech?",
    "Should the government track personal data for safety?",
    "Should schools teach about diversity and inclusion?"
  ],
  "Foreign Policy": [
    "Should the U.S. reduce troops overseas?",
    "Should the U.S. punish China over trade or human rights?",
    "Should the U.S. accept refugees from other countries?",
    "Should the U.S. help other countries with money?",
    "Should the U.S. focus on climate agreements with other nations?"
  ],
  "Governance": [
    "Should we get rid of the Electoral College?",
    "Should Congress have term limits?",
    "Should voting be required?",
    "Should campaign money be limited?",
    "Should the president have less power?"
  ],
  "Cultural": [
    "Should cancel culture exist?",
    "Does the media have a political bias?",
    "Should schools teach about gender identity?",
    "Is cultural appropriation disrespectful?",
    "Should TV and movies include more minorities?"
  ]
};

const TOPICS = Object.keys(TOPIC_DATA);

// Rooms keyed by roomId -> per-room debate state
const rooms = new Map();
const waitingQueue = [];

function createRoomState(roomId) {
  return {
    id: roomId,
    active: false,
    currentPhaseIndex: 0,
    timeRemaining: 0,
    currentSpeaker: null,
    participants: {},
    timer: null,
    topic: null,
    question: null
  };
}

function getRoom(roomId = "default") {
  const key = roomId || "default";
  if (!rooms.has(key)) {
    rooms.set(key, createRoomState(key));
  }
  return rooms.get(key);
}

function debateRoomChannel(roomId) {
  return `debate:${roomId}`;
}

function generateRoomId() {
  if (typeof randomUUID === "function") {
    return randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function chooseRandomTopic() {
  if (TOPICS.length === 0) {
    return { topic: null, question: null };
  }
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const questions = TOPIC_DATA[topic] || [];
  const question = questions.length > 0
    ? questions[Math.floor(Math.random() * questions.length)]
    : null;
  return { topic, question };
}

function occupiedSlots(room) {
  return ["user1", "user2"].filter((pos) => Boolean(room.participants[pos]));
}

function findParticipantSlot(room, socketId) {
  for (const pos of ["user1", "user2"]) {
    if (room.participants[pos]?.socketId === socketId) {
      return pos;
    }
  }
  return null;
}

function hasDistinctParticipants(room) {
  const slots = occupiedSlots(room);
  if (slots.length < 2) return false;
  const [first, second] = slots;
  return (
    room.participants[first]?.socketId &&
    room.participants[second]?.socketId &&
    room.participants[first].socketId !== room.participants[second].socketId
  );
}

function serializeParticipants(room) {
  const result = {};
  for (const pos of ["user1", "user2"]) {
    if (room.participants[pos]) {
      const { name, affiliation } = room.participants[pos];
      result[pos] = { name, affiliation };
    }
  }
  return result;
}

function getOtherParticipantSocketId(room, senderSocketId) {
  for (const pos of ["user1", "user2"]) {
    const participant = room.participants[pos];
    if (participant && participant.socketId !== senderSocketId) {
      return participant.socketId;
    }
  }
  return null;
}

// Track all connected users (for "Active Users" list on the homepage)
const connectedUsers = new Map(); // socketId -> { name, affiliation, socketId, connectedAt }

/* ====== REST API ====== */

app.get("/health", (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// For your matchmaking page's "Active Users" section
app.get("/api/active-users", (_req, res) => {
  const users = Array.from(connectedUsers.values()).map(u => ({
    name: u.name,
    affiliation: u.affiliation,
    connectedAt: u.connectedAt
  }));

  const roomSummaries = Array.from(rooms.values()).map(room => ({
    roomId: room.id,
    active: room.active,
    participantCount: occupiedSlots(room).length
  }));
  const totalParticipants = roomSummaries.reduce((acc, room) => acc + room.participantCount, 0);
  const activeRooms = roomSummaries.filter(room => room.active).length;

  res.json({
    users,
    totalUsers: users.length,
    debateParticipants: totalParticipants,
    debateActive: activeRooms > 0,
    activeRooms,
    rooms: roomSummaries,
    waitingCount: waitingQueue.length
  });
});

/* ====== Error handler ====== */
function errorHandler(err, _req, res, _next) {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
}
app.use(errorHandler);

/* ====== Socket.IO ====== */

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// Helper: emit users-update consistently (include room summaries)
function emitUsersUpdate() {
  const roomSummaries = Array.from(rooms.values())
    .filter(room => room.active || occupiedSlots(room).length > 0)
    .map(room => ({
      roomId: room.id,
      active: room.active,
      participantCount: occupiedSlots(room).length
    }));
  const debateParticipants = roomSummaries.reduce((acc, room) => acc + room.participantCount, 0);
  const activeRooms = roomSummaries.filter(room => room.active).length;

  io.emit("users-update", {
    connectedUsers: Array.from(connectedUsers.values()),
    debateParticipants,
    debateActive: activeRooms > 0,
    activeRooms,
    rooms: roomSummaries,
    waitingCount: waitingQueue.length
  });
}

function removeFromWaitingQueue(socketId) {
  const index = waitingQueue.findIndex(entry => entry.socketId === socketId);
  if (index !== -1) {
    waitingQueue.splice(index, 1);
    return true;
  }
  return false;
}

function resetRoomState(room, { clearParticipants = false } = {}) {
  if (!room) return;

  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }

  room.active = false;
  room.currentPhaseIndex = 0;
  room.timeRemaining = 0;
  room.currentSpeaker = null;

  if (clearParticipants) {
    room.participants = {};
    room.topic = null;
    room.question = null;
  }
}

function stopDebateTimer(room, reason = "stopped") {
  if (!room) return;

  const wasActive = room.active;
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }

  resetRoomState(room);

  if (wasActive) {
    console.log(`[Debate:${room.id}] Timer stopped (${reason})`);
    io.to(debateRoomChannel(room.id)).emit("debate-aborted", { roomId: room.id, reason });
  }
}

function endDebateForAll(room, reason, excludeSocketId = null) {
  if (!room) return;

  const channel = debateRoomChannel(room.id);
  const participants = occupiedSlots(room)
    .map(pos => room.participants[pos])
    .filter(Boolean);

  stopDebateTimer(room, reason);

  participants.forEach((participant) => {
    const targetId = participant.socketId;
    const socketInstance = io.sockets.sockets.get(targetId);
    if (socketInstance) {
      socketInstance.leave(channel);
      if (socketInstance.currentRoomId === room.id) {
        socketInstance.currentRoomId = null;
      }
    }
    if (targetId !== excludeSocketId) {
      io.to(targetId).emit("force-hangup", { roomId: room.id, reason });
    }
  });

  resetRoomState(room, { clearParticipants: true });
  rooms.delete(room.id);
  emitUsersUpdate();
}

function startPhase(room) {
  if (!room || !rooms.has(room.id)) return;

  const channel = debateRoomChannel(room.id);

  if (room.currentPhaseIndex >= DEBATE_PHASES.length) {
    console.log(`[Debate:${room.id}] Finished`);
    io.to(channel).emit("debate-finished", { roomId: room.id });
    resetRoomState(room);
    emitUsersUpdate();
    return;
  }

  const currentPhase = DEBATE_PHASES[room.currentPhaseIndex];
  room.timeRemaining = currentPhase.duration;
  room.currentSpeaker = currentPhase.speaker;

  console.log(`[Debate:${room.id}] Starting phase ${currentPhase.phase}: ${currentPhase.description}`);

  io.to(channel).emit("phase-start", {
    roomId: room.id,
    phase: currentPhase.phase,
    duration: currentPhase.duration,
    speaker: currentPhase.speaker,
    description: currentPhase.description
  });

  // Countdown
  room.timer = setInterval(() => {
    room.timeRemaining -= 1;
    io.to(channel).emit("time-update", { roomId: room.id, timeRemaining: room.timeRemaining });

    if (room.timeRemaining <= 0) {
      if (room.timer) {
        clearInterval(room.timer);
        room.timer = null;
      }
      room.currentPhaseIndex += 1;

      if (room.currentPhaseIndex >= DEBATE_PHASES.length) {
        io.to(channel).emit("debate-finished", { roomId: room.id });
        resetRoomState(room);
        emitUsersUpdate();
        return;
      }

      // Start next phase after a brief pause
      setTimeout(() => startPhase(room), 1000);
    }
  }, 1000);
}

function startDebateTimer(room) {
  if (!room || !rooms.has(room.id)) return;
  if (room.active) {
    console.log(`[Debate:${room.id}] Already active`);
    return;
  }

  console.log(`[Debate:${room.id}] Starting debate`);
  room.active = true;
  room.currentPhaseIndex = 0;
  startPhase(room);
  emitUsersUpdate();
}

io.on("connection", (socket) => {
  console.log("[Socket] Connected:", socket.id);

  // --- LOBBY: allow matchmaking page to mark user online before debate page ---
  // (Your matchmaking page previously emitted "message" with type "userJoin")
  socket.on("message", (data) => {
    if (data?.type === "userJoin") {
      const name = data.userName || "Anonymous";
      const affiliation = data.userAffiliation || "Unknown";
      socket.userInfo = {
        name,
        affiliation,
        socketId: socket.id,
        connectedAt: new Date().toISOString()
      };
      connectedUsers.set(socket.id, socket.userInfo);
      emitUsersUpdate();
      console.log("[Lobby] userJoin:", name, affiliation);
    }
  });

  socket.on("join-matchmaking", (userData = {}) => {
    const name = userData?.name || socket.userInfo?.name || "Anonymous";
    const affiliation = userData?.affiliation || socket.userInfo?.affiliation || "Unknown";

    // Remove stale entries referencing this socket
    removeFromWaitingQueue(socket.id);

    // Clean up queue from disconnected sockets
    for (let i = waitingQueue.length - 1; i >= 0; i--) {
      if (!io.sockets.sockets.has(waitingQueue[i].socketId)) {
        waitingQueue.splice(i, 1);
      }
    }

    while (waitingQueue.length > 0) {
      const opponent = waitingQueue.shift();
      if (opponent.socketId === socket.id) {
        continue;
      }
      const opponentSocket = io.sockets.sockets.get(opponent.socketId);
      if (!opponentSocket) {
        continue;
      }

      const roomId = generateRoomId();
      const room = getRoom(roomId);
      resetRoomState(room, { clearParticipants: true });
      const { topic, question } = chooseRandomTopic();
      room.topic = topic;
      room.question = question;

      console.log(`[Matchmaking] Matched ${opponent.name} with ${name} in room ${roomId}`);

      io.to(opponent.socketId).emit("match-found", {
        roomId,
        position: "user1",
        match: { name, affiliation },
        topic,
        question
      });
      io.to(opponent.socketId).emit("matchmaking-status", { status: "matched", roomId });

      io.to(socket.id).emit("match-found", {
        roomId,
        position: "user2",
        match: { name: opponent.name, affiliation: opponent.affiliation },
        topic,
        question
      });
      io.to(socket.id).emit("matchmaking-status", { status: "matched", roomId });

      emitUsersUpdate();
      return;
    }

    waitingQueue.push({ socketId: socket.id, name, affiliation });
    console.log(`[Matchmaking] ${name} queued for a match`);
    socket.emit("matchmaking-status", { status: "waiting" });
    emitUsersUpdate();
  });

  socket.on("cancel-matchmaking", () => {
    if (removeFromWaitingQueue(socket.id)) {
      console.log("[Matchmaking] User cancelled waiting", socket.id);
      socket.emit("matchmaking-status", { status: "cancelled" });
      emitUsersUpdate();
    }
  });

  // --- DEBATE JOIN: debate page calls this with { name, affiliation, roomId } ---
  socket.on("join-debate", (userData = {}) => {
    const name = userData?.name || "Anonymous";
    const affiliation = userData?.affiliation || "Unknown";
    const requestedRoomId = (userData?.roomId ?? "default").toString().trim() || "default";
    const room = getRoom(requestedRoomId);
    const channel = debateRoomChannel(room.id);

    // Track in connectedUsers as well (so Active Users stays correct)
    socket.userInfo = {
      name,
      affiliation,
      socketId: socket.id,
      connectedAt: new Date().toISOString()
    };
    connectedUsers.set(socket.id, socket.userInfo);

    // Leave previous room if socket was already in one
    if (socket.currentRoomId && socket.currentRoomId !== room.id) {
      const previousRoom = rooms.get(socket.currentRoomId);
      if (previousRoom) {
        const previousChannel = debateRoomChannel(previousRoom.id);
        const previousSlot = findParticipantSlot(previousRoom, socket.id);
        if (previousSlot) {
          delete previousRoom.participants[previousSlot];
          io.to(previousChannel).emit("user-left", { roomId: previousRoom.id, position: previousSlot });
          socket.leave(previousChannel);
          endDebateForAll(previousRoom, "participant-switched", socket.id);
        } else {
          socket.leave(previousChannel);
        }
      }
      socket.currentRoomId = null;
    }

    const existingSlot = findParticipantSlot(room, socket.id);
    if (existingSlot) {
      room.participants[existingSlot] = { socketId: socket.id, name, affiliation };
      socket.join(channel);
      socket.currentRoomId = room.id;
      console.log(`[Debate:${room.id}] ${name} rejoined as ${existingSlot}`);
      socket.emit("joined-debate", {
        roomId: room.id,
        position: existingSlot,
        participants: serializeParticipants(room),
        debateActive: room.active,
        topic: room.topic,
        question: room.question
      });
      emitUsersUpdate();
      return;
    }

    const count = occupiedSlots(room).length;
    if (count >= 2) {
      console.log(`[Debate:${room.id}] Room full; rejecting ${socket.id}`);
      socket.emit("room-full", { roomId: room.id });
      emitUsersUpdate();
      return;
    }

    const position = count === 0 ? "user1" : "user2";
    room.participants[position] = { socketId: socket.id, name, affiliation };

    socket.join(channel);
    socket.currentRoomId = room.id;

    if (!room.topic || !room.question) {
      const { topic, question } = chooseRandomTopic();
      room.topic = topic;
      room.question = question;
    }

    console.log(`[Debate:${room.id}] ${name} joined as ${position}`);
    socket.emit("joined-debate", {
      roomId: room.id,
      position,
      participants: serializeParticipants(room),
      debateActive: room.active,
      topic: room.topic,
      question: room.question
    });

    const otherId = getOtherParticipantSocketId(room, socket.id);
    if (otherId) {
      io.to(otherId).emit("user-joined", {
        roomId: room.id,
        user: { name, affiliation },
        position
      });
    }

    emitUsersUpdate();

    if (hasDistinctParticipants(room) && !room.active) {
      console.log(`[Debate:${room.id}] Two participants ready, starting in 2s`);
      setTimeout(() => {
        if (rooms.has(room.id) && hasDistinctParticipants(room) && !room.active) {
          startDebateTimer(room);
        }
      }, 2000);
    }
  });

  // Manual start (from UI button)
  socket.on("start-debate", () => {
    const roomId = socket.currentRoomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (room && hasDistinctParticipants(room) && !room.active) {
      console.log(`[Debate:${room.id}] Manual start`);
      startDebateTimer(room);
    }
  });

  // --- WebRTC signaling: route only to the other participant ---
  socket.on("webrtc-signal", (data) => {
    const roomId = socket.currentRoomId;
    if (!roomId) {
      console.log("[RTC] Signal received with no active room", data?.type);
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      console.log("[RTC] Room not found for signal", roomId);
      return;
    }

    const otherId = getOtherParticipantSocketId(room, socket.id);
    if (otherId) {
      io.to(otherId).emit("webrtc-signal", { ...data, from: socket.id, roomId });
    } else {
      // Fallback: if no other participant, ignore; avoids spamming everyone
      console.log("[RTC] No other participant to route signal to");
    }
  });

  socket.on("leave-debate", (payload = {}) => {
    console.log("[Debate] Leave request from", socket.id);
    const roomId = payload?.roomId || socket.currentRoomId;
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    const position = findParticipantSlot(room, socket.id);
    if (position) {
      delete room.participants[position];
      socket.leave(debateRoomChannel(room.id));
      socket.currentRoomId = null;
      io.to(debateRoomChannel(room.id)).emit("user-left", { roomId: room.id, position });

      endDebateForAll(room, "participant-left", socket.id);
    }
  });

  socket.on("disconnect", () => {
    console.log("[Socket] Disconnected:", socket.id);

    // Remove from connected users
    connectedUsers.delete(socket.id);

    const removedFromQueue = removeFromWaitingQueue(socket.id);
    if (removedFromQueue) {
      console.log(`[Matchmaking] Removed ${socket.id} from waiting queue (disconnect)`);
    }

    // Remove from debate participants (if present)
    const roomId = socket.currentRoomId;
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        const position = findParticipantSlot(room, socket.id);
        if (position) {
          const removedName = room.participants[position].name;
          delete room.participants[position];
          console.log(`[Debate:${room.id}] Removed ${removedName} from ${position}`);
          socket.broadcast.to(debateRoomChannel(room.id)).emit("user-left", { roomId: room.id, position });
          socket.currentRoomId = null;
          endDebateForAll(room, "participant-disconnected", socket.id);
          return;
        }
      }
    }

    emitUsersUpdate();
  });
});

/* ====== Start server ====== */

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on http://0.0.0.0:${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
});
