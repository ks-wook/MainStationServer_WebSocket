const io = require("socket.io-client");
const SERVER_URL = "http://127.0.0.1:3000";

let socket = null;

const os = require('os');
const { parentPort } = require("worker_threads");

let insert_db, select_db, update_db, delete_db, http_get_db;

if (os.platform() === 'win32') { // 윈도우 실행
    ({ insert_db, select_db, update_db, delete_db, http_get_db } = require('../DB/DBConnectorWin'));

} 
else { // 리눅스 실행
    ({ insert_db, select_db, update_db, delete_db, http_get_db } = require('../DB/DBConnectorPi'));

}


// test data
const rows = 3;
const columns = 10;
var rssi_raw_data = [[-53.0, -54.0, -54.0, -55.0, -55.0, -55.0, -56.0, -56.0, -80.0, -57.0],
                [-53.0, -54.0, -54.0, -55.0, -55.0, -55.0, -56.0, -56.0, -80.0, -57.0],
                [-53.0, -54.0, -54.0, -55.0, -55.0, -55.0, -56.0, -56.0, -80.0, -57.0]];
var pos_data = [[5.0, 0.], [10.0, 8.0], [0.0, 10.0]] // Beacon position data
var preset_data = [[-40.0], [-42.0], [-43.0]] // Beacon preset 1M rssi data



function connectToServer() {
    socket = io(SERVER_URL);
    
    socket.on("connect", () => {
        console.log("Connected to server!");
    });
    
    socket.on("connect_error", (err) => {
        console.log(`Connection failed: ${err}`);
        setTimeout(connectToServer, 1000);
    });
    
    socket.on("disconnect", (reason) => {
        console.log(`Disconnected: ${reason}`);
        setTimeout(connectToServer, 1000);
    });
    
    socket.on("message", (message) => {
        console.log(`Received message from server: ${message}`);
    });

    // 테스트 이벤트 수신
    socket.on('event', (data) => {
        console.log(data);
    });

    // 방 계산 결과 수신
    socket.on('space_calculation_response', async (data) => {
        console.log(data);
        const result_space_id = data.space_id;
        const sid = data.sid;

        const message = {
            "result_space_id": result_space_id,
            "sid": sid
        }
        
        parentPort.postMessage({"type": "space_calculation_response", "results": message});
    });

    // 좌표 계산 결과 수신
    socket.on('position_calculation_response', async (data) => {

        console.log("test");
        console.log(data);
        // 계산 결과에 따른 Position Update
        const space_id = data.space_id;
        const pos_x = data.pos_x;
        const pos_y = data.pos_y;
        const sid = data.sid;

        parentPort.postMessage({"type": "position_calculation_response", "results": data});


    });

}

function CalPositionReq(scanData) {

    var message = {
        "rssi_raw_data": scanData,
        "pos_data": pos_data,
        "preset_data": preset_data
    };

    // 연결상태 확인 후 계산 요청
    if (socket && socket.connected) { 
        socket.emit('cal_req', message);
    } 
    else {

        console.log("Not connected to server. Trying to connect...");
        connectToServer();

        setTimeout(() => {

            if (socket && socket.connected) {
                socket.emit('cal_req', message);
            } 
            else {
                console.log("Failed to connect to server. Message not sent.");
            }

        }, 2000);
    }
}

function space_calculation_request(data) {
    var message = {
        "pri_beacon_data": data.pri_beacon_data,
        "beacon_rssi_data": data.beacon_rssi_data,
        "sid": data.sid
    };

    // 연결상태 확인 후 계산 요청
    if (socket && socket.connected) { 
        socket.emit('space_calculation_request', message);
    } 
    else {

        console.log("Not connected to server. Trying to connect...");
        connectToServer();

        setTimeout(() => {

            if (socket && socket.connected) {
                socket.emit('space_calculation_request', message);
            } 
            else {
                console.log("Failed to connect to server. Message not sent.");
            }

        }, 2000);
    }
}

function position_calculation_request(data) {
    var message = {
        "device_id": data.device_id,
        "space_id": data.space_id,
        "beacon_rssi_data": data.beacon_rssi_data,
        "sid": data.sid
    };

    // 연결상태 확인 후 계산 요청
    if (socket && socket.connected) { 
        socket.emit('position_calculation_request', message);
    } 
    else {

        console.log("Not connected to server. Trying to connect...");
        connectToServer();

        setTimeout(() => {

            if (socket && socket.connected) {
                socket.emit('position_calculation_request', message);
            } 
            else {
                console.log("Failed to connect to server. Message not sent.");
            }

        }, 2000);
    }
}



module.exports = {
    CalPositionReq, space_calculation_request, position_calculation_request
};