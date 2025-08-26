const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

const rooms = {}; // { roomID: { players: [{id, name}] } }

function generateRoomID() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for(let i=0; i<6; i++) result += chars.charAt(Math.floor(Math.random()*chars.length));
    return result;
}

io.on("connection", socket => {

    socket.on("createRoom", data => {
        const roomID = generateRoomID();
        rooms[roomID] = { players: [{id: socket.id, name: data.username}] };
        socket.join(roomID);
        socket.emit("roomCreated", { roomID, players: rooms[roomID].players });
    });

    socket.on("joinRoom", data => {
        const room = rooms[data.roomID];
        if(!room) {
            socket.emit("roomError", "Místnost neexistuje!");
            return;
        }
        room.players.push({id: socket.id, name: data.username});
        socket.join(data.roomID);
        io.to(data.roomID).emit("playerList", room.players);
        socket.emit("roomCreated", { roomID: data.roomID, players: room.players });
    });

    socket.on("leaveRoom", data => {
        const room = rooms[data.roomID];
        if(!room) return;
        room.players = room.players.filter(p => p.id !== socket.id);
        socket.leave(data.roomID);
        io.to(data.roomID).emit("playerList", room.players);
        if(room.players.length === 0) delete rooms[data.roomID];
    });

    socket.on("disconnecting", () => {
        const joinedRooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        joinedRooms.forEach(roomID => {
            const room = rooms[roomID];
            if(!room) return;
            room.players = room.players.filter(p => p.id !== socket.id);
            io.to(roomID).emit("playerList", room.players);
            if(room.players.length === 0) delete rooms[roomID];
        });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server běží na portu ${PORT}`);
});
