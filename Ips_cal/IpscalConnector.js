const io = require("socket.io-client");
const SERVER_URL = "http://127.0.0.1:3000";

let socket = null;

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

    // 계산 결과 수신
    socket.on('cal_res', (data) => {
        console.log(data);
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



module.exports = {
    CalPositionReq
};