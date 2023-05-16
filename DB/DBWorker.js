const { parentPort } = require('worker_threads');
const ActiveSessionManager = require('../SocketIO/ActiveSessionManager');
const _activeSessionManager = new ActiveSessionManager();

const os = require('os');

let insert_db, select_db, update_db, delete_db, http_get_db;

if (os.platform() === 'win32') { // 윈도우 실행
    ({ insert_db, select_db, update_db, delete_db, http_get_db } = require('./DBConnectorWin'));

} 
else { // 리눅스 실행
    ({ insert_db, select_db, update_db, delete_db, http_get_db } = require('./DBConnectorPi'));

}

parentPort.on('message', async (message) => {
    
    var Command = message.type;
    var Data = message.data;

    if(Command == 'data_request') {
        var results = await select_db(Data);
        parentPort.postMessage({"type": Command, "results": results});
    }
    else if(Command == 'data_register') {
        var results = await insert_db(Data);
        parentPort.postMessage({"type": Command, "results": results});
    }
    else if(Command == 'data_update') {
        var results = await update_db(Data);
        parentPort.postMessage({"type": Command, "results": results});
    }
    else if(Command == 'data_delete') {
        var results = await delete_db(Data);
        parentPort.postMessage({"type": Command, "results": results});
    }
    else if(Command == 'http_get') {
        var results = await http_get_db();
        parentPort.postMessage({"type": Command, "results": results});
    }
    else if(Command == 'home_setup') {
        // 홈 데이터가 있는 지 확인
        var results = await select_db(Data);
        if(results != 0) { // 홈 데이터가 이미 있는 경우
            console.log('there already exsists HomeData');
            parentPort.postMessage({"type": Command, "results": results});

        }
        else { // 홈 데이터가 없는 경우
            console.log("there are no HomeData");

            // 홈 데이터 등록
            var results = await insert_db(Data);
            parentPort.postMessage({"type": Command, "results": results});
        }
    }
    else if(Command == 'device_register') {

        var results = await select_db(Data);
        console.log(results);
        
        var response = undefined;

        if(results != 0) { // 디바이스가 이미 존재하는 경우
            console.log(`Response to Client [${Data.sid}] Device Resister with...`);
            response = await _activeSessionManager.DeviceConnect(Data.sid, Data.id)
            console.log(response);

            parentPort.postMessage({"type": Command, "results": response});
        }
        else { // 디바이스가 없는 경우
            console.log("there are no Device");

            // 디바이스 등록
            response = await insert_db(Data);
            
            if(response.id == undefined) { // 디바이스 등록 실패
                console.log(`Response to Client [${Data.sid}] Device Resister with...`);
                console.log(response);
                parentPort.postMessage({"type": Command, "results": response});
            }
            else { // 디바이스 등록 성공
                console.log(`Response to Client [${Data.sid}] Device Resister with...`);
                console.log(response);
                parentPort.postMessage({"type": Command, "results": response});
            }
        }
    }
    
});