const { Worker } = require('worker_threads');
const { CalPositionReq } = require('../Ips_cal/IpscalConnector');
const IpscalWorker = new Worker('./Ips_cal/IpscalWorker');
const DBworker = new Worker('./DB/DBWorker.js');


// client 관리 딕셔너리
var clients = {};
var ServerPort = 8710;

// 서버 시작 처리
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



// ----------------Session EventHandler-------------------
function OnConnect(socket) {
    console.log('----------------------------------------------------------');
    console.log(`Client (${socket.id}) Connected!!!`);
    console.log('----------------------------------------------------------');
   
    // 고유한 ID 생성
    const clientId = Math.random().toString(36).substring(2, 9);
    // 클라이언트 ID와 소켓 객체 저장
    clients[clientId] = socket;

    
    // Session 이벤트 등록
    socket.on('test_send', OnTestSend);
    socket.on('test_request', OnTestRequest);
    socket.on('disconnect', OnDisconnect);

    // DB 이벤트 등록
    socket.on('data_request', OnDataRequest);
    socket.on('data_register', OnDataRegister);
    socket.on('device_register', OnDeviceRegitster);
    socket.on('home_setup', OnHomeSetup);
    socket.on('data_update', OnDataUpdate);
    socket.on('data_delete', OnDataDelete);


    // MainStation 이벤트 등록
    socket.on('ips_space', OnIpsSpace);
    socket.on('ips_final', OnIpsFinal);


    // db worker thread 이벤트 등록
    DBworker.on('message', (message) => {
        if(message.type == 'data_request') {
            console.log(message.results);
            socket.emit('data_request_response', message.results);

            console.log('----------------------------------------------------------');
        }
        else if(message.type == 'data_register') {
            console.log(message.results);
            socket.emit('data_register_response', message.results);

            console.log('----------------------------------------------------------');
        }
        else if(message.type == 'data_update') {
            console.log(message.results);
            socket.emit('data_update_response', message.results);

            console.log('----------------------------------------------------------');
        }
        else if(message.type == 'data_delete') {
            console.log(message.results);
            socket.emit('data_delete_response', message.results);

            console.log('----------------------------------------------------------');
        }
        else if(message.type == 'device_register') {
            // console.log(message.results);
            socket.emit('device_register_response', message.results);

            console.log('----------------------------------------------------------');
        }
        else if(message.type == 'home_setup') {
            console.log(message.results);
            socket.emit('home_setup_response', message.results);

            console.log('----------------------------------------------------------');
        }
        else if(message.type == 'ips_space') {
            // console.log(message.results);

            console.log(`Response to Client [${socket.id}] IPS Space Calculate with...`);
            console.log(`Data ${message.results}`);

            socket.emit('ips_space_response', message.results);

            console.log('----------------------------------------------------------');
        }
    });

    IpscalWorker.on('message', (message) => {
        // TODO : Position data 갱신


        if(message.type == 'space_calcluate') { // 현재 방 계산 요청 완료 수신
            console.log(message.results);
            socket.emit('ips_space_response', message.results);

            console.log('----------------------------------------------------------');
        }

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
    console.log('----------------------------------------------------------');
    console.log(`Client (${socket.id}) Disconnected!!!`);
    console.log('----------------------------------------------------------');
}
// --------------------------------------------------------




// ----------------DataBase EventHandler-------------------
async function OnDataRequest(data) {
    console.log('----------------------------------------------------------');
    console.log(`Client [${this.id} Data Request with...]`);

    // 실행시킬 작업을 워커 스레드로 전송
    DBworker.postMessage({"type": 'data_request', "data": data});
}

async function OnDataRegister(data) { // 디바이스와 홈을 제외한 나머지 데이터 등록 처리
    console.log('----------------------------------------------------------');
    console.log(`Client [${this.id} Data Register with...]`);
    
    // 실행시킬 작업을 워커 스레드로 전송
    DBworker.postMessage({"type": 'data_register', "data": data});
}

async function OnDeviceRegitster(data) { // 디바이스 등록 처리
    console.log('----------------------------------------------------------');
    console.log(`Client [${this.id}] Device Session & Data Register with...`);

    data.sid = this.id; // session id 부여

    DBworker.postMessage({"type": 'device_register', "data": data});
}


async function OnHomeSetup(data) { // 홈 등록 처리
    console.log('----------------------------------------------------------');
    console.log(`Client [${this.id} Home Setup Data Register with...`);

    DBworker.postMessage({"type": 'home_setup', "data": data});
}

async function OnDataUpdate(data) {

    // 데이터에는 수정할 항목의 ID와 table, 수정하고자하는 col의 이름과 업데이트 값을 담아 가져와야 한다.
    console.log('----------------------------------------------------------');
    console.log(`Client [${this.id}] Data Update with...`);
    
    // 실행시킬 작업을 워커 스레드로 전송
    DBworker.postMessage({"type": 'data_update', "data": data});
}

async function OnDataDelete(data) {
    // 데이터에는 수정할 항목의 ID와 table, 수정하고자하는 col의 이름과 업데이트 값을 담아 가져와야 한다.
    console.log('----------------------------------------------------------');
    console.log(`Client [${this.id} Data Delete with...]`);
    
    // 실행시킬 작업을 워커 스레드로 전송
    DBworker.postMessage({"type": 'data_delete', "data": data});
}
// --------------------------------------------------------






// --------------MainStation EventHandler-------------------
async function OnIpsSpace(data) { // 현재 방의 위치 계산
    console.log('----------------------------------------------------------');
    data.sid = this.id;
    console.log(`Client [${data.sid}] IPS space Calculate with...`);

    DBworker.postMessage({"type": 'ips_space', "data": data});
}

async function OnIpsFinal(data) { // 현재 방에서의 좌표 계산
    console.log('----------------------------------------------------------');
    data.sid = this.id;
    console.log(`Client [${data.sid}] IPS final Calculate with...`);

    DBworker.postMessage({"type": 'ips_final', "data": data});
}
// --------------------------------------------------------

module.exports = {startServer};