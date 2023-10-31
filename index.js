const express = require('express')
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3500
const ADMIN = 'Admin'

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const expressServer = app.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
});

// state
const userState = {
    users: [],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray;
    }
}


const io = new Server(expressServer, {
    cors: {
        origin: process.env.Node === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500"]
    }
});

io.on('connection', (socket) => {
    console.log('${socket.id} user connected');
    //
    socket.emit('message', buildMsg(ADMIN, 'Welcome to the chat app!'));
    //
    socket.on('enterRoom', ({name, room}) => {
        const prevRoom= getUser(socket.id)?.room;
        if (prevRoom) {
            socket.leave(prevRoom);
            io.to(prevRoom).emit('message', buildMsg('Admin', `${name} has left the chat`));
        }
        const user = activateUser(socket.id, name, room);

    //
        if (prevRoom) {
            io.to(prevRoom).emit('userList',{
                users: getUsersInRoom(prevRoom)
            })
            //
            socket.join(user.room)
            //
            socket.emit('message', buildMsg(ADMIN, `you have joined the ${user.room} chat room`));
            socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has joined the room`));
            io.to(userList).emit('userList',{
                users: getUsersInRoom(user.room)
            })
            io.emit('roomList', {
                rooms : getAllActiveRooms()
            })
    }})
    //
    socket.on('message', ({ name, text }) => {
        const room = getUser(socket.id)?.room;
        if (room){
            io.to(room).emit('message', buildMsg(name, text));
        }

        
    });


    socket.on('disconnect', () => {
        const user = getUser(socket.id)
        userLeavesApp(socket.id)

        if (user) {
            io.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} has left the room`));
            io.to(user.room).emit('userList',{
                users: getUsersInRoom(user.room)
            })
            io.emit('roomList', {
                rooms : getAllActiveRooms()
            })
        }
        console.log(`${socket.id} user disconnected`);
    })


    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room;
        if (room){
            socket.broadcast.to(room).emit('message', buildMsg(name, 'is typing...'))
        }
    })
});

httpServer.listen(3500, () => {
    console.log('listening on port 3500');
});


function buildMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('default', {
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            
        }).format(new Date())
    }
}


// user functions

function activateUser(id, name, room) {
    user = {
        id,
        name,
        room
    }
    userState.setUsers([...userState.users.filter(user => user.id !== id), user])
    return user
}

function userLeavesApp(id){
    userState.setUsers([...userState.users.filter(user => user.id !== id)])
}

function getUser(id){
    return userState.users.find(user => user.id === id)
}

function getUsersInRoom(room){
    return userState.users.filter(user => user.room === room)
}

function getAllActiveRooms(){
    return Array.from(new Set(userState.users.map(user => user.room)))
}