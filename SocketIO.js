var ServerPort = 8710;

// client 관리 딕셔너리
    // TEMP : 
var clients = {};

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
   
    // 고유한 ID 생성
    const clientId = Math.random().toString(36).substring(2, 9);
    // 클라이언트 ID와 소켓 객체 저장
    clients[clientId] = socket;

        
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

function OnDisconnect(socket, clientId) {
    // 연결이 끊긴 클라이언트 삭제
    delete clients[clientId];
    console.log(`user(${clientId}) disconnected`);
}



module.exports = {startServer};

