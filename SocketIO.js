var ServerPort = 8710;

function startServer() {

    const express = require('express');
    const app = express();
    const http = require('http').createServer(app);
    const io = require('socket.io')(http);
    const { Server } = require('http');

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });

    // socket.io event
    io.on('connection', OnConnection);

    // 3000 port open
    http.listen(ServerPort, () => {
        console.log(`listening on *: ${ServerPort}`);
    });

}

function OnConnection(socket) {
    console.log(`a user connected : ${socket.id}`);
        
    socket.on('test_send', OnTestSend);
    socket.on('test_request', OnTestRequest);
    socket.on('disconnect', OnDisconnect);
}

function OnTestRequest(data) {
    console.log(`${data.message}`);
    console.log(`${data.hex}`);
    console.log(`${data.int}`);
    console.log(`${data.float}`);

    this.emit('test_response', { 'message': 'Test connection from Server',
                                    'hex' : 'AABBCCDDEEFF',
                                    'int' : 123456789,
                                    'float': 1.23456789});
}

function OnTestSend(socket) {
    console.log('message: ' + data);
    socket.emit('test_send', data);
}

function OnDisconnect(socket) {
    console.log(`user(${socket.id}) disconnected`);
}

module.exports = {startServer};