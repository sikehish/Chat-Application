// https://stackoverflow.com/questions/60765304/why-we-pass-app-in-http-createserverapp -VVI
// https://medium.com/@electra_chong/what-is-cors-what-is-it-used-for-308cafa4df1a

require('dotenv').config();

const cors = require('cors');

const harperSave = require('./harper-utils/store-messages');
const harperGet = require('./harper-utils/get-messages'); // Add this

const express = require('express');
const app = express();
app.use(cors()); // Add cors middleware - https://medium.com/@electra_chong/what-is-cors-what-is-it-used-for-308cafa4df1a
const http = require('http');
const { Server } = require('socket.io');


// process.setMaxListeners(0);

const server = http.createServer(app);

// Create an io server and allow for CORS from http://localhost:3000 with GET and POST methods
const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  //Storing the data in variables on the server
  let chatRoom = ''; // the rooms the user enter like cricket,football,etc
let allUsers = []; // all entered users

  const CHAT_BOT = 'ChatBot'
  
  // Listen for when the client connects via socket.io-client
  io.on('connection', (socket) => {
      // We can write our socket event listeners in here...
    console.log(`User connected ${socket.id}`);
    //Basically data here is the object we sent alng with the join_room emitter
    socket.on('join_room', (data) => {
        const { user, room } = data; // Data sent from client when join_room event emitted
        socket.join(room); // Join the user to a socket room

      let __createdtime__ = Date.now(); // Current timestamp
    // Send message to all users currently in the room, apart from the user that just joined i.e user/sender will not receive this msg but evyone else in the room will
    socket.to(room).emit('receive_message', {
      message: `${user} has joined the chat room`,
      user: CHAT_BOT,
      __createdtime__,
    });

    // Send welcome msg to user that just joined chat only
    socket.emit('receive_message', {
        message: `Welcome ${user}`,
        user: CHAT_BOT,
        __createdtime__,
      });

      // Save the new user to the room
    chatRoom = room;
    allUsers.push({ id: socket.id, user, room });
    ///Selectings all users who are in the same room as that of the current user(client)
    chatRoomUsers = allUsers.filter((user) => user.room === room);

    socket.to(room).emit('chatroom_users', chatRoomUsers); //everyone except the current user will recive this msg
    socket.emit('chatroom_users', chatRoomUsers); //only the current user gets the msg and no one else
    //BASICALLY THE ABOVE 2 LINES OF CODE WOULD REACH EVERYONE IN THE ROOM.  

    //OR/SO INSTEAD OF THE ABOVE 2 LINES YOU CAN SIMPLY WRITE: io.to(room).emit("chatroom_users"chatRoomUsers);

    harperGet(room)
      .then((data) => {
        // console.log('latest', data);
        socket.emit('last_10_msgs', data);
      })
      .catch((err) => console.log(err));

    socket.on('send_message', (data) => {
      io.to(data.room).emit('receive_message', data); // io.to and io.in are the same - Send to all users in room, including sender
      harperSave(data) // Save in harperdb
        .then((response) => console.log(response))
        .catch((err) => console.log(err.code, err.response.statusText));
    });

    }); 
    
    

  });

const port = 3001;
server.listen(port, () => console.log(`Server is running on port ${port}`));
