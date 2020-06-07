const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const debug = require("debug");

const serverDebug = debug("server");
const ioDebug = debug("io");
const socketDebug = debug("socket");

const app = express();
const port = process.env.PORT || 80;

const server = http.createServer(app);

server.listen(port, () => {
  serverDebug(`listening on port: ${port}`);
});

const io = socketIO(server, {
  handlePreflightRequest: function (req, res) {
    var headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": req.header ? req.header.origin : "*",
      "Access-Control-Allow-Credentials": true,
    };
    res.writeHead(200, headers);
    res.end();
  },
});

io.on("connection", (socket) => {
  ioDebug("connection established!");
  io.to(`${socket.id}`).emit("init-room");
  socket.on("join-room", (roomID) => {
    socketDebug(`${socket.id} has joined ${roomID}`);
    socket.join(roomID);
    if (io.sockets.adapter.rooms[roomID].length <= 1) {
      io.to(`${socket.id}`).emit("first-in-room");
    } else {
      socket.broadcast.to(roomID).emit("new-user", socket.id);
    }
    io.in(roomID).emit(
      "room-user-change",
      Object.keys(io.sockets.adapter.rooms[roomID].sockets)
    );
  });

  socket.on("server-broadcast", (roomID, encryptedData) => {
    socketDebug(`${socket.id} sends update to ${roomID}`);
    console.log('hello', roomID);
    socket.broadcast.to(roomID).emit("client-broadcast", encryptedData);
  });

  socket.on("server-volatile-broadcast", (roomID, encryptedData) => {
    socketDebug(`${socket.id} sends volatile update to ${roomID}`);
    socket.volatile.broadcast
      .to(roomID)
      .emit("client-broadcast", encryptedData);
  });

  socket.on("disconnecting", () => {
    const rooms = io.sockets.adapter.rooms;
    for (const roomID in socket.rooms) {
      const clients = Object.keys(rooms[roomID].sockets).filter(
        (id) => id !== socket.id
      );
      if (clients.length > 0) {
        socket.broadcast.to(roomID).emit("room-user-change", clients);
      }
    }
  });

  socket.on("disconnect", () => {
    socket.removeAllListeners();
  });
});
