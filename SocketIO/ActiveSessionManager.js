const os = require('os');

let insert_db, select_db, update_db, delete_db, http_get_db;

if (os.platform() === 'win32') { // 윈도우 실행
    ({ insert_db, select_db, update_db, delete_db, http_get_db } = require('../DB/DBConnectorWin'));

} 
else { // 리눅스 실행
    ({ insert_db, select_db, update_db, delete_db, http_get_db } = require('../DB/DBConnectorPi'));

}

class ActiveSessionManager {

    constructor() {
        this._activeDeviceIds = [];
        this._sessionInfoDict = {};

    }

    async BeaconStateUpdate(beaconRssiData) { // 비콘 state 업데이트

        var conclusion = true;

        for(let i = 0; i < beaconRssiData.length; i++) { // 리스트 형태로 여러개의 비콘 상태를 받고, 갱신
            const beacon_id = beaconRssiData[i].id;
            const beacon_state = beaconRssiData[i].state;

            const data = {
                "id": beacon_id,
                "data_type": "Beacon",
                "state": beacon_state
            }

            const response = await update_db(data);
            if(response.valid == false) {
                conclusion = false;
            }
        }

        return conclusion;
    }
  
    async DeviceConnect(sessionId, deviceId) { // 디바이스 연결 시 처리
        this._activeDeviceIds.push(deviceId);
        this._sessionInfoDict[sessionId] = deviceId;

        // TODO : DB 업데이트
        const data = {
            "data_type": "device",
            "id": deviceId,
            "state": "0000", // Normal State
        };

        const response = await update_db(data);
        return response;

    }

    async DeviceUpdate(sessionId, state) { // 디바이스 상태 업데이트

        const device_id = this._sessionInfoDict[sessionId];
        if(device_id != undefined) { // Active 디바이스가 있는 경우
            const data = {
                "id": device_id,
                "data_type": "device",
                "state": state
            }

            const response = await update_db(data);
            return response;
        }
        else { // Active 디바이스를 찾지 못한 경우
            const response = {
                "msg": "This device is not Active",
                "valid": false
            }

            return response;
        }
    }

    async DeviceDisconnect(sessionId) {
        const device_id = this._sessionInfoDict[sessionId];
        if(device_id != undefined) { // Active 디바이스가 있는 경우
            delete this._sessionInfoDict[sessionId]; // Active 디바이스 목록에서 제거

            const data = {
                "id": device_id,
                "data_type": "device",
                "state": "6000" // Set Disconnect State
            }

            const response = await update_db(data);
            return response;
        }
        else { // Active 디바이스를 찾지 못한 경우
            const response = {
                "msg": "This device is not Active",
                "valid": false
            }

            return response;
        }
    }

    GetActiveDeviceId(sessionId) {
        const device_id = this._sessionInfoDict[sessionId];
        console.log(this._sessionInfoDict);
        return device_id;
    }
}
  
module.exports = ActiveSessionManager;

