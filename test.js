const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const MAX_PLAYERS = 4;
const players = [];

io.on('connection', (socket) => {
  console.log(`Client ${socket.id} connected`);

  socket.on('join', (name) => {
    if (players.length >= MAX_PLAYERS) {
      socket.emit('join-error', 'Game is full');
    } else {
      const player = { id: socket.id, name, health: 100 };
      players.push(player);
      socket.emit('join-success', player);
      socket.broadcast.emit('player-joined', player);
      io.emit('update', players);
    }
  });

  socket.on('attack', (playerId) => {
    const player = players.find((p) => p.id === playerId);
    if (player) {
      player.health -= 10;
      if (player.health <= 0) {
        players.splice(players.indexOf(player), 1);
        io.emit('player-left', player);
      }
      io.emit('update', players);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client ${socket.id} disconnected`);
    const player = players.find((p) => p.id === socket.id);
    if (player) {
      players.splice(players.indexOf(player), 1);
      io.emit('player-left', player);
      io.emit('update', players);
    }
  });
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});