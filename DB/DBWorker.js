const { parentPort } = require('worker_threads');
const { Worker } = require('worker_threads');
const IpscalWorker = new Worker('./Ips_cal/IpscalWorker');
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




// Ips_cal 연동 이벤트
IpscalWorker.on('message', async (message) => {
    if(message.type == 'space_calculation_response') { // 현재 방 계산 요청 완료 수신
        const result_space_id = message.results.result_space_id;
        const sid = message.results.sid;

        if(result_space_id == 'FFFFFFFFFFFF') { // 방 연산 실패

            response_values = {
                "msg": "Space calculation failed",
                "valid": false,
                "space_id": result_space_id
            }

            // 디바이스 상태도 변경
            var device_state_update = this._activeSessionManager.DeviceUpdate(sid, "5000"); // missing
            console.log(`Client [${sid}] Device State Update Response...`);
            console.log(`Data = ${device_state_update}`);            

        }
        else { // 방 연산 성공
            // 계산된 방의 ID를 이용 -> 방의 크기정보를 받아 와야함
            const data = {
                "id": result_space_id,
                "data_type": "space"
            }
            var spaceResponse = await select_db(data);

            console.log(spaceResponse);

            if(spaceResponse != undefined) { // 방 조회 성공
                var pos_x = spaceResponse[0].size_x / 2;
                var pos_y = spaceResponse[0].size_y / 2;

                // 초기 위치를 방의 정가운데로 지정
                const device_id = _activeSessionManager.GetActiveDeviceId(sid);

                var space_position_values = {
                    "device_id": device_id,
                    "space_id": result_space_id,
                    "data_type": "pos_data",
                    "pos_x": pos_x,
                    "pos_y": pos_y
                };

                console.log(space_position_values);

                // 포지션 업데이트
                const posDataResponse = await select_db(space_position_values);
                var posDataReturn = undefined;
                if(posDataResponse != undefined) { // 포지션 데이터가 존재하는 경우
                    posDataReturn = await update_db(space_position_values); // 포지션 데이터 갱신
                }
                else { // 포지션 데이터를 찾지 못한 경우
                    posDataReturn = await insert_db(space_position_values); // 포지션 데이터 삽입
                }

                if(posDataReturn != undefined) {
                    console.log(`DeviceID : ${device_id} IPS Data Update Success!!`);
                    response_values = {
                        "msg": "Space calculation Successful",
                        "valid": true,
                        "space_id": result_space_id
                    }
                }
                else  {
                    console.log(`DeviceID : ${device_id} IPS Data Update Error`);
                    response_values = {
                        "msg": "Space calculation failed",
                        "valid": false,
                        "space_id": result_space_id
                    }
                }
            }
        }
        
        parentPort.postMessage({"type": 'ips_space', "results": response_values});
        console.log('----------------------------------------------------------');
    }
    else if(message.type == 'position_calculation_response') {
        console.log(message.results);

        const space_id = message.results.space_id;
        const pos_x = message.results.pos_x;
        const pos_y = message.results.pos_y;
        const sid = message.results.sid;

        // TODO: 계산된 결과를 통해 position update
        // 계산된 방의 ID를 이용 -> 방의 크기정보를 받아 와야함
        const spaceSelectData = {
            "id": space_id,
            "data_type": "space"
        }
        var spaceResponse = await select_db(spaceSelectData);

        if(spaceResponse != undefined) { // 방 조회 성공
            const device_id = _activeSessionManager.GetActiveDeviceId(sid);

            const space_position_values = {
                "device_id": device_id,
                "space_id": space_id,
                "data_type": "pos_data",
                "pos_x": pos_x,
                "pos_y": pos_y
            }

            // 포지션 업데이트
            const posDataResponse = await select_db(space_position_values);
            var posDataReturn = undefined;
            if(posDataResponse != undefined) { // 포지션 데이터가 존재하는 경우
                posDataReturn = await update_db(space_position_values); // 포지션 데이터 갱신
            }
            else { // 포지션 데이터를 찾지 못한 경우
                posDataReturn = await insert_db(space_position_values); // 포지션 데이터 삽입
            }

            if(posDataReturn != undefined) {
                console.log(`DeviceID : ${device_id} IPS Data Update Success!!`);
            }
            else  {
                console.log(`DeviceID : ${device_id} IPS Data Update Error`);
            }
        }

        console.log('----------------------------------------------------------');
    }

});

IpscalWorker.on('error',  (error) => {
    // 오류 처리 로직을 작성합니다.
    console.error('Worker error:', error);
});

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
    else if(Command == 'ips_space') {
        var deviceResponse = await _activeSessionManager.DeviceUpdate(Data.sid, "6000"); // Processing
        console.log(`Client [${Data.sid}] Device State Update Response...`);
        console.log(`Data = ${deviceResponse}`);

        var beacon_rssi_data = Data.beacon_rssi_data; // beacon_rssi_data -> list

        var beaconResponse = await _activeSessionManager.BeaconStateUpdate(Data.beacon_rssi_data);
        if(beaconResponse == true) { // 비콘 업데이트 성공
            console.log(`Client [${Data.sid}] --> Successfully updated beacon status information`);
        }
        else { // 비콘 업데이트 실패
            console.log(`Client [${Data.sid}] --> Failed to updated beacon status information`);
        }

        const priBeaconData =  {
            "data_type": "pri_beacon"
        }

        // 현재 방 계산 요청
        const pri_beacon_data = await select_db(priBeaconData);
        if(pri_beacon_data != undefined) {
            const data =  {
                "beacon_rssi_data": beacon_rssi_data,
                "pri_beacon_data": pri_beacon_data, // pri_beacon 테이블의 데이터를 같이 넘겨야함
                "sid": Data.sid // sid를 저장해둬야 SessionManager로 부터 device id를 획득할 수 있다.
            };

            IpscalWorker.postMessage({"type": 'space_calculation_request', "data": data}); // 이후의 처리는 ips_worker에서
        }
        else {
            const data =  {
                "msg": "Space calculation failed",
                "valid": false,
                "space_id": "FFFFFFFFFFFF",
            };

            parentPort.postMessage({"type": Command, "results": data});
        }
    }
    else if(Command == 'ips_final') {
        const device_id = Data.device_id;
        const space_id = Data.space_id;

        var beacon_rssi_data = Data.beacon_rssi_data;

        var beaconResponse = await _activeSessionManager.BeaconStateUpdate(Data);
        if(beaconResponse == true) { // 비콘 업데이트 성공
            console.log(`Client [${Data.sid}] --> Successfully updated beacon status information`);
        }
        else { // 비콘 업데이트 실패
            console.log(`Client [${Data.sid}] --> Failed to updated beacon status information`);
        }

        const data =  {
            "device_id": device_id,
            "space_id": space_id,
            "beacon_rssi_data": beacon_rssi_data,
            "sid": Data.sid
        };

        // 방 내의 위치 계산 요청
        IpscalWorker.postMessage({"type": 'position_calculation_request', "data": data}); // 이후의 처리는 ips_worker에서

    }
    
});