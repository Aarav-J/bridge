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

// Global debate state for a single 1v1 room ("debate")
let debateState = {
  active: false,
  currentPhaseIndex: 0, // 0-based index into DEBATE_PHASES
  timeRemaining: 0,
  currentSpeaker: null,
  participants: {
    // user1: { socketId, name, affiliation }
    // user2: { socketId, name, affiliation }
  },
  timer: null
};

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

  res.json({
    users,
    totalUsers: users.length,
    debateParticipants: Object.keys(debateState.participants).length,
    debateActive: debateState.active
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

// Helper: emit users-update consistently (always include debateActive)
function emitUsersUpdate() {
  io.emit("users-update", {
    connectedUsers: Array.from(connectedUsers.values()),
    debateParticipants: Object.keys(debateState.participants).length,
    debateActive: debateState.active
  });
}

// Helper: get the "other" participant socketId (if present)
function getOtherParticipantSocketId(senderSocketId) {
  const { participants } = debateState;
  for (const pos of ["user1", "user2"]) {
    if (participants[pos] && participants[pos].socketId !== senderSocketId) {
      return participants[pos].socketId;
    }
  }
  return null;
}

function findParticipantSlotBySocket(socketId) {
  for (const pos of ["user1", "user2"]) {
    if (debateState.participants[pos]?.socketId === socketId) {
      return pos;
    }
  }
  return null;
}

function occupiedSlots() {
  return ["user1", "user2"].filter((pos) => Boolean(debateState.participants[pos]));
}

function hasDistinctParticipants() {
  const slots = occupiedSlots();
  if (slots.length < 2) return false;
  const [first, second] = slots;
  return (
    debateState.participants[first]?.socketId &&
    debateState.participants[second]?.socketId &&
    debateState.participants[first].socketId !== debateState.participants[second].socketId
  );
}

function resetDebateState() {
  console.log("[Debate] Resetting debate state");
  if (debateState.timer) clearInterval(debateState.timer);

  debateState = {
    active: false,
    currentPhaseIndex: 0,
    timeRemaining: 0,
    currentSpeaker: null,
    participants: {},
    timer: null
  };
}

function startPhase() {
  if (debateState.currentPhaseIndex >= DEBATE_PHASES.length) {
    console.log("[Debate] Finished");
    io.to("debate").emit("debate-finished");
    resetDebateState();
    emitUsersUpdate();
    return;
  }

  const currentPhase = DEBATE_PHASES[debateState.currentPhaseIndex];
  debateState.timeRemaining = currentPhase.duration;
  debateState.currentSpeaker = currentPhase.speaker;

  console.log(`[Debate] Starting phase ${currentPhase.phase}: ${currentPhase.description}`);

  io.to("debate").emit("phase-start", {
    phase: currentPhase.phase,            // keep 1..6 for UI
    duration: currentPhase.duration,
    speaker: currentPhase.speaker,        // "user1" / "user2"
    description: currentPhase.description
  });

  // Countdown
  debateState.timer = setInterval(() => {
    debateState.timeRemaining -= 1;
    io.to("debate").emit("time-update", { timeRemaining: debateState.timeRemaining });

    if (debateState.timeRemaining <= 0) {
      clearInterval(debateState.timer);
      debateState.currentPhaseIndex += 1;

      if (debateState.currentPhaseIndex >= DEBATE_PHASES.length) {
        io.to("debate").emit("debate-finished");
        resetDebateState();
        emitUsersUpdate();
        return;
      }

      // Short pause between phases
      setTimeout(startPhase, 1000);
    }
  }, 1000);
}

function startDebateTimer() {
  if (debateState.active) {
    console.log("[Debate] Already active");
    return;
  }
  console.log("[Debate] Starting debate");
  debateState.active = true;
  debateState.currentPhaseIndex = 0;
  startPhase();
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

  // --- DEBATE JOIN: debate page calls this with { name, affiliation } ---
  socket.on("join-debate", (userData) => {
    const name = userData?.name || "Anonymous";
    const affiliation = userData?.affiliation || "Unknown";

    // Track in connectedUsers as well (so Active Users stays correct)
    socket.userInfo = {
      name,
      affiliation,
      socketId: socket.id,
      connectedAt: new Date().toISOString()
    };
    connectedUsers.set(socket.id, socket.userInfo);

    // Assign slot
    const existingSlot = findParticipantSlotBySocket(socket.id);
    if (existingSlot) {
      // Update metadata (name/affiliation could change) and confirm join
      debateState.participants[existingSlot] = { socketId: socket.id, name, affiliation };
      socket.join("debate");
      console.log(`[Debate] ${name} rejoined as ${existingSlot} (same socket)`);
      socket.emit("joined-debate", {
        position: existingSlot,
        participants: debateState.participants,
        debateActive: debateState.active
      });
      emitUsersUpdate();
      return;
    }

    const count = occupiedSlots().length;
    if (count >= 2) {
      console.log("[Debate] Room full; rejecting", socket.id);
      socket.emit("room-full");
      emitUsersUpdate();
      return;
    }

    const position = count === 0 ? "user1" : "user2";
    debateState.participants[position] = { socketId: socket.id, name, affiliation };

    socket.join("debate");

    console.log(`[Debate] ${name} joined as ${position}`);
    // Let the joiner know their position + current state
    socket.emit("joined-debate", {
      position,
      participants: debateState.participants,
      debateActive: debateState.active
    });

    // Notify the other participant (if present)
    const otherId = getOtherParticipantSocketId(socket.id);
    if (otherId) {
      io.to(otherId).emit("user-joined", {
        user: { name, affiliation },
        position
      });
    }

    emitUsersUpdate();

    // Auto-start when both are present
    if (hasDistinctParticipants() && !debateState.active) {
      console.log("[Debate] Two participants ready, starting in 2s");
      setTimeout(() => startDebateTimer(), 2000);
    }
  });

  // Manual start (from UI button)
  socket.on("start-debate", () => {
    if (hasDistinctParticipants() && !debateState.active) {
      console.log("[Debate] Manual start");
      startDebateTimer();
    }
  });

  // --- WebRTC signaling: route only to the other participant ---
  socket.on("webrtc-signal", (data) => {
    const otherId = getOtherParticipantSocketId(socket.id);
    if (otherId) {
      io.to(otherId).emit("webrtc-signal", { ...data, from: socket.id });
    } else {
      // Fallback: if no other participant, ignore; avoids spamming everyone
      console.log("[RTC] No other participant to route signal to");
    }
  });

  socket.on("disconnect", () => {
    console.log("[Socket] Disconnected:", socket.id);

    // Remove from connected users
    connectedUsers.delete(socket.id);

    // Remove from debate participants (if present)
    for (const pos of ["user1", "user2"]) {
      if (debateState.participants[pos]?.socketId === socket.id) {
        const removedName = debateState.participants[pos].name;
        delete debateState.participants[pos];
        console.log(`[Debate] Removed ${removedName} from ${pos}`);
        socket.broadcast.to("debate").emit("user-left", { position: pos });
      }
    }

    // If room is empty, reset debate
    if (Object.keys(debateState.participants).length === 0) {
      resetDebateState();
    }

    emitUsersUpdate();
  });
});

/* ====== Start server ====== */

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Listening on http://0.0.0.0:${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
});
