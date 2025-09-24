
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
const WAITING_FALLBACK_MS = 10_000;
const MIN_IDEOLOGICAL_GAP = 45;

const SPECTRUM_TOPIC_MAP = {
  economic: "Economic",
  social: "Social",
  foreignPolicy: "Foreign Policy",
  governance: "Governance",
  cultural: "Cultural"
};

function randomQuestionForTopic(topic) {
  const questions = TOPIC_DATA[topic] || [];
  if (questions.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * questions.length);
  return questions[index];
}

// Rooms keyed by roomId -> per-room debate state
const rooms = new Map();
const waitingQueue = [];

function chooseRandomTopic() {
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const question = randomQuestionForTopic(topic);
  return {
    topic,
    question: question ?? null
  };
}

function chooseTopicFromSpectra(spectrumA, spectrumB) {
  if (!spectrumA || !spectrumB) {
    return null;
  }

  let maxDiff = -Infinity;
  let candidates = [];

  for (const [key, topicName] of Object.entries(SPECTRUM_TOPIC_MAP)) {
    const scoreA = typeof spectrumA[key] === "number" ? spectrumA[key] : null;
    const scoreB = typeof spectrumB[key] === "number" ? spectrumB[key] : null;
    if (scoreA === null || scoreB === null) {
      continue;
    }
    const diff = Math.abs(scoreA - scoreB);
    if (diff > maxDiff) {
      maxDiff = diff;
      candidates = [topicName];
    } else if (diff === maxDiff) {
      candidates.push(topicName);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  const topic = candidates[Math.floor(Math.random() * candidates.length)];
  const question = randomQuestionForTopic(topic);
  if (!question) {
    return null;
  }
  return { topic, question };
}

function determineTopicForUsers(userA, userB) {
  const result = chooseTopicFromSpectra(userA?.spectrum, userB?.spectrum);
  return result ?? chooseRandomTopic();
}

function scoresAreCompatible(scoreA, scoreB, minGap = MIN_IDEOLOGICAL_GAP) {
  if (typeof scoreA !== "number" || typeof scoreB !== "number") {
    return false;
  }
  if (scoreA === 0 || scoreB === 0) {
    return false;
  }
  const sameSide = (scoreA > 0 && scoreB > 0) || (scoreA < 0 && scoreB < 0);
  if (sameSide) {
    return false;
  }
  return Math.abs(scoreA - scoreB) >= minGap;
}

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
      const {
        name,
        affiliation,
        username = null,
        politicalScore = null
      } = room.participants[pos];
      result[pos] = {
        name,
        affiliation,
        username: username ?? null,
        politicalScore: typeof politicalScore === "number" ? politicalScore : null
      };
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
      const username = data.username ?? null;
      const politicalScore = typeof data.politicalScore === "number" ? data.politicalScore : null;
      const spectrum = data.spectrum ?? null;
      socket.userInfo = {
        name,
        affiliation,
        username,
        politicalScore,
        spectrum,
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
    const username = userData?.username ?? socket.userInfo?.username ?? null;
    const politicalScore = typeof userData?.politicalScore === "number"
      ? userData.politicalScore
      : (typeof socket.userInfo?.politicalScore === "number" ? socket.userInfo.politicalScore : null);
    const spectrum = userData?.spectrum ?? socket.userInfo?.spectrum ?? null;

    // Remove stale entries referencing this socket
    removeFromWaitingQueue(socket.id);

    const now = Date.now();

    // Clean up queue from disconnected sockets and normalise metadata
    for (let i = waitingQueue.length - 1; i >= 0; i--) {
      const entry = waitingQueue[i];
      if (!io.sockets.sockets.has(entry.socketId)) {
        waitingQueue.splice(i, 1);
        continue;
      }
      if (typeof entry.joinedAt !== "number") {
        entry.joinedAt = now;
      }
    }

    const entrant = {
      socketId: socket.id,
      name,
      affiliation,
      username,
      politicalScore,
      spectrum,
      joinedAt: now
    };

    const fallbackThreshold = now - WAITING_FALLBACK_MS;

    const findOpponent = () => {
      let bestIndex = -1;
      let bestGap = -Infinity;

      // Pass 1: look for the strongest ideological contrast
      for (let i = 0; i < waitingQueue.length; i++) {
        const candidate = waitingQueue[i];
        if (candidate.socketId === socket.id) {
          continue;
        }
        if (!io.sockets.sockets.has(candidate.socketId)) {
          waitingQueue.splice(i, 1);
          i -= 1;
          continue;
        }

        if (scoresAreCompatible(candidate.politicalScore, entrant.politicalScore)) {
          const gap = Math.abs(candidate.politicalScore - entrant.politicalScore);
          if (gap > bestGap) {
            bestGap = gap;
            bestIndex = i;
          }
        }
      }

      if (bestIndex !== -1) {
        return waitingQueue.splice(bestIndex, 1)[0];
      }

      // Pass 2: fallback to longest-waiting user past threshold
      let fallbackIndex = -1;
      let oldestJoin = Infinity;
      for (let i = 0; i < waitingQueue.length; i++) {
        const candidate = waitingQueue[i];
        if (candidate.socketId === socket.id) {
          continue;
        }
        if (!io.sockets.sockets.has(candidate.socketId)) {
          waitingQueue.splice(i, 1);
          i -= 1;
          continue;
        }
        const joinedAt = typeof candidate.joinedAt === "number" ? candidate.joinedAt : now;
        if (joinedAt <= fallbackThreshold && joinedAt < oldestJoin) {
          oldestJoin = joinedAt;
          fallbackIndex = i;
        }
      }

      if (fallbackIndex !== -1) {
        return waitingQueue.splice(fallbackIndex, 1)[0];
      }

      return null;
    };

    const opponent = findOpponent();

    if (!opponent) {
      waitingQueue.push(entrant);
      console.log(`[Matchmaking] ${name} queued for a match`);
      socket.emit("matchmaking-status", { status: "waiting" });
      emitUsersUpdate();
      return;
    }

    const opponentSocket = io.sockets.sockets.get(opponent.socketId);
    if (!opponentSocket) {
      waitingQueue.push(entrant);
      console.log(`[Matchmaking] ${name} queued for a match (opponent lost)`);
      socket.emit("matchmaking-status", { status: "waiting" });
      emitUsersUpdate();
      return;
    }

    const roomId = generateRoomId();
    const room = getRoom(roomId);
    resetRoomState(room, { clearParticipants: true });
    const { topic, question } = determineTopicForUsers(opponent, entrant);
    room.topic = topic;
    room.question = question;

    console.log(`[Matchmaking] Matched ${opponent.name} with ${name} in room ${roomId}`);

    io.to(opponent.socketId).emit("match-found", {
      roomId,
      position: "user1",
      match: {
        name,
        affiliation,
        username,
        politicalScore,
        spectrum
      },
      topic,
      question
    });
    io.to(opponent.socketId).emit("matchmaking-status", { status: "matched", roomId });

    io.to(socket.id).emit("match-found", {
      roomId,
      position: "user2",
      match: {
        name: opponent.name,
        affiliation: opponent.affiliation,
        username: opponent.username ?? null,
        politicalScore: typeof opponent.politicalScore === "number" ? opponent.politicalScore : null,
        spectrum: opponent.spectrum ?? null
      },
      topic,
      question
    });
    io.to(socket.id).emit("matchmaking-status", { status: "matched", roomId });

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
    const username = userData?.username ?? null;
    const politicalScore = typeof userData?.politicalScore === "number" ? userData.politicalScore : null;
    const spectrum = userData?.spectrum ?? null;
    const requestedRoomId = (userData?.roomId ?? "default").toString().trim() || "default";
    const room = getRoom(requestedRoomId);
    const channel = debateRoomChannel(room.id);

    // Track in connectedUsers as well (so Active Users stays correct)
    socket.userInfo = {
      name,
      affiliation,
      username,
      politicalScore,
      spectrum,
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
      room.participants[existingSlot] = { socketId: socket.id, name, affiliation, username, politicalScore, spectrum };
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
    room.participants[position] = { socketId: socket.id, name, affiliation, username, politicalScore, spectrum };

    socket.join(channel);
    socket.currentRoomId = room.id;

    if (!room.topic || !room.question) {
      const slots = occupiedSlots(room).map((slot) => room.participants[slot]);
      const topicInfo = slots.length >= 2 ? determineTopicForUsers(slots[0], slots[1]) : null;
      const { topic, question } = topicInfo ?? chooseRandomTopic();
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
        user: { name, affiliation, username, politicalScore, spectrum },
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
