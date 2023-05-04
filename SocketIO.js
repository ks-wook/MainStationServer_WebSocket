const {insert_db, select_db, update_db} = require('./DBConnector');
const { Worker } = require('worker_threads');
const worker = new Worker('./WorkerProcess.js');


// client 관리 딕셔너리
var clients = {};
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
    io.on('connect', OnConnect);

    // 8710 port open
    http.listen(ServerPort, () => {
        console.log(`listening on *: ${ServerPort}`);
    });

    
}

// Session
function OnConnect(socket) {
    console.log('-------------------------------');
    console.log(`a user connected : ${socket.id}`);
    console.log('-------------------------------');
   
    // 고유한 ID 생성
    const clientId = Math.random().toString(36).substring(2, 9);
    // 클라이언트 ID와 소켓 객체 저장
    clients[clientId] = socket;

    
    // Session 이벤트 등록
    socket.on('test_send', OnTestSend);
    socket.on('test_request', OnTestRequest);
    socket.on('disconnect', OnDisconnect);

    // DB 이벤트 등록
    socket.on('select', OnSelectDB);
    socket.on('insert', OnInsertDB);
    socket.on('update', OnUpdateDB);

    // db worker thread 이벤트 등록
    worker.on('message', (message) => {
        if(message.type == 'select') {
            socket.emit('select_result', message.results);
        }
        else if(message.type == 'insert') {
            socket.emit('insert_result', message.results);
        }
        else if(message.type == 'update') {
            socket.emit('update_result', message.results);
        }
    }); 
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
    console.log('-------------------------------');
    console.log(`user(${clientId}) disconnected`);
    console.log('-------------------------------');
}

// DB
async function OnSelectDB(data) {
    
    console.log('-------------------------------');
    console.log(`select ${data.table} request`);

    // 실행시킬 작업을 워커 스레드로 전송
    worker.postMessage({"type": 'select', "data": data});

    // await select_db(data, this);
    
    console.log('-------------------------------');
}

async function OnInsertDB(data) {
    
    console.log('-------------------------------');
    console.log(`insert ${data.table} request`);
    
    // await insert_db(data, this);
    worker.postMessage({"type": 'insert', "data": data});


    console.log('-------------------------------');
    
}

async function OnUpdateDB(data) {
    // 데이터에는 수정할 항목의 ID와 table, 수정하고자하는 col의 이름과 업데이트 값을 담아 가져와야 한다.
    console.log('-------------------------------');
    console.log(`update ${data.table}, ${data.column}, request`);
    
    worker.postMessage({"type": 'update', "data": data});

    // 업데이트에 대해서는 수정된 아이템의 ID만 같이 전송함
    console.log('-------------------------------');
}


module.exports = {startServer};