const { Worker } = require('worker_threads');
const { CalPositionReq } = require('../Ips_cal/IpscalConnector');
const IpscalWorker = new Worker('./Ips_cal/IpscalWorker');
const DBworker = new Worker('./DB/DBWorker.js');


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
        console.log(`listening on MainStation Connection*:${ServerPort}`);
    });

    
}




// Session EventHandler
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
    socket.on('delete', OnDeleteDB);


    // MainStation 이벤트 등록
    socket.on('home_setup', OnHomeSetup);
    socket.on('data_register', OnDataRegister);
    socket.on('device_register', OnDeviceRegitster);



    // db worker thread 이벤트 등록
    DBworker.on('message', (message) => {
        if(message.type == 'select') {
            socket.emit('select_result', message.results);
        }
        else if(message.type == 'insert') {
            socket.emit('insert_result', message.results);
        }
        else if(message.type == 'update') {
            socket.emit('update_result', message.results);
        }
        else if(message.type == 'delete') {
            socket.emit('delete_result', message.results);
        }
        else if(message.type == 'device_register') {
            console.log(message.results);
            // TODO : 디바이스 등록 이벤트 응답 처리
        }
        else if(message.type == 'home_setup') {
            console.log(message.results);
            socket.emit('home_setup_response', message.results);
        }
    });

    IpscalWorker.on('message', (message) => {
        // TODO : Position data 갱신
        console.log(message);
    });


    // 스캔 이벤트 등록
    socket.on("scan_res", (data) => {
        const jsonString = JSON.stringify(data); // JSON 데이터를 문자열로 변환
        const jsonObject = JSON.parse(jsonString); // 문자열을 JSON 형태로 파싱
        const rssiRawData = jsonObject.rssi_raw_data; // 배열 데이터 추출
        
        console.log(rssiRawData);

        // 배열 처리 코드 작성
        IpscalWorker.postMessage(rssiRawData);
    });


    // TEST : 연결될 시 스캔 요청
    // socket.emit('scan_req', null);

    
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




// DB EventHandler
async function OnSelectDB(data) {
    
    console.log('-------------------------------');
    console.log(`select ${data.data_type} table request`);

    // 실행시킬 작업을 워커 스레드로 전송
    DBworker.postMessage({"type": 'select', "data": data});

    // await select_db(data, this);
    
    console.log('-------------------------------');
}

async function OnInsertDB(data) {
    
    console.log('-------------------------------');
    console.log(`insert ${data.data_type} table request`);
    
    // await insert_db(data, this);
    DBworker.postMessage({"type": 'insert', "data": data});


    console.log('-------------------------------');
    
}

async function OnUpdateDB(data) {

    // 데이터에는 수정할 항목의 ID와 table, 수정하고자하는 col의 이름과 업데이트 값을 담아 가져와야 한다.
    console.log('-------------------------------');
    console.log(`update ${data.data_type} table request`);
    
    DBworker.postMessage({"type": 'update', "data": data});

    // 업데이트에 대해서는 수정된 아이템의 ID만 같이 전송함
    console.log('-------------------------------');
}

async function OnDeleteDB(data) {
    // 데이터에는 수정할 항목의 ID와 table, 수정하고자하는 col의 이름과 업데이트 값을 담아 가져와야 한다.
    console.log('-------------------------------');
    console.log(`delete ${data.data_type} table request`);
    
    DBworker.postMessage({"type": 'delete', "data": data});

    // 업데이트에 대해서는 수정된 아이템의 ID만 같이 전송함
    console.log('-------------------------------');
}





// MainStation EventHandler
async function OnDataRegister(data) {
    // TODO
}


async function OnDeviceRegitster(data) {
    console.log('-------------------------------');
    console.log('Device register request');

    DBworker.postMessage({"type": 'device_register', "data": data});

    console.log('-------------------------------');

}


async function OnHomeSetup(data) {
    console.log('-------------------------------');
    console.log('home setup request');

    DBworker.postMessage({"type": 'home_setup', "data": data});

    console.log('-------------------------------');
}

module.exports = {startServer};