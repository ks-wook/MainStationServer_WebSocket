const mysql = require('mysql2/promise');
const config = require('../config.json');
const { json } = require('express');


function processMessage(message) {
    const { task, args } = message;
    const result = task(...args); // 함수 실행
}


function connectDatabase() {
    const connection = mysql.createConnection({
      host: '127.0.0.1',
      port: config.users[0].port,
      user: config.users[0].id,
      password: config.users[0].password,
      database: config.users[0].database
    });
  
    return connection;
}

async function select_db(data) {

    var sql = "";

    // 테이블마다 가지고 있는 칼럼이 다르므로 경우를 나눠 처리
    if(data.data_type == 'home' || data.data_type == 'Home') {
        sql = `SELECT * FROM Home`;
    }
    else if(data.data_type == 'space' || data.data_type == 'Space') {
        sql = `SELECT * FROM Space`;
    }
    else if(data.data_type == 'user' || data.data_type == 'User') {
        sql = `SELECT * FROM User`;
    }
    else if(data.data_type == 'device' || data.data_type == 'Device') {
        sql = `SELECT * FROM Device`;

        if(data.id != undefined) {
            sql += ` WHERE ID = x'${data.id}'`
        }
        else if(data.user_id != undefined) {
            sql += ` WHERE UserID = x'${data.user_id}'`
        }

    }
    else if(data.data_type == 'beacon' || data.data_type == 'Beacon') {
        sql = `SELECT * FROM Beacon`;
        if(data.space_id == undefined && data.isprimary != undefined) {
            sql += ` WHERE isPrimary = ${data.isprimary}`;
        }
        else if(data.space_id != undefined && data.isprimary == undefined) {
            sql += ` WHERE SpaceID = x'${data.space_id}'`;
        }
        else if(data.space_id != undefined && data.isprimary != undefined) {
            sql += ` WHERE SpaceID = x'${data.space_id}' AND isPrimary = ${data.isprimary}`;
        }
    }
    else if(data.data_type == 'pri_beacon' || data.data_type == "PRI_Beacon") {
        sql = `SELECT * FROM PRI_Beacon`;
    }
    else if(data.data_type == 'router' || data.data_type == 'Router') {
        sql = `SELECT * FROM Router`;
    }
    else if(data.data_type == 'pri_router' || data.data_type == "PRI_Beacon") {
        sql = `SELECT * FROM PRI_Router`;
    }
    else if(data.data_type == 'pos_data' || data.data_type == 'Pos_Data' || data.data_type == 'pos_Data') {
        sql = `SELECT * FROM Pos_Data`;
    }
    else {
        console.log('error : there are no table');
        return;
    }
    
    const connection = await connectDatabase(); // db connect

    try {
        // console.log(sql);
        const [results, fields] = await connection.execute(sql);

        const resultArray = [];
        for (const row of results) {
            const rowObject = {};
            for (const [key, value] of Object.entries(row)) {
                rowObject[key] = value;
            }

            const jsonObject = {};

            if(data.data_type == 'home' || data.data_type == 'Home') {
                jsonObject['home_name'] = rowObject.Home_name.toString();
                jsonObject['interval_time'] = rowObject.Interval_time.toString();
                jsonObject['expire_count'] = rowObject.Expire_count.toString();
            }
            else if(data.data_type == 'space' || data.data_type == 'Space') {
                jsonObject['id'] = rowObject.ID.toString('hex');
                jsonObject['familiar_name'] = rowObject.Familiar_name;
            }
            else if(data.data_type == 'user' || data.data_type == 'User') {
                jsonObject['id'] = rowObject.ID.toString('hex');
                jsonObject['user_name'] = rowObject.User_name;
            }
            else if(data.data_type == 'device' || data.data_type == 'Device') {
                jsonObject['id'] = rowObject.ID.toString('hex');
                jsonObject['familiar_name'] = rowObject.Familiar_name;
                jsonObject['state'] = rowObject.State.toString('hex');
                jsonObject['user_id'] = rowObject.UserID.toString('hex');
            }
            else if(data.data_type == 'beacon' || data.data_type == 'Beacon') {
                jsonObject['id'] = rowObject.ID.toString('hex');
                jsonObject['state'] = rowObject.State.toString('hex');
                jsonObject['pos_x'] = rowObject.Pos_X.toString();
                jsonObject['pos_y'] = rowObject.Pos_Y.toString();
                jsonObject['power'] = rowObject.Power.toString();
                jsonObject['isPrimary'] = rowObject.isPrimary.toString();
            }
            else if(data.data_type == 'pri_beacon' || data.data_type == "Pri_Beacon") {
                jsonObject['beacon_id'] = rowObject.BeaconID.toString('hex');
                jsonObject['space_id'] = rowObject.SpaceID.toString('hex');
                jsonObject['min_rssi'] = rowObject.Min_RSSI.toString();
                jsonObject['max_rssi'] = rowObject.Max_RSSI.toString();
            }
            else if(data.data_type == 'router' || data.data_type == 'Router') {
                jsonObject['id'] = rowObject.ID.toString('hex');
                jsonObject['ssid'] = rowObject.SSID.toString('hex');
                jsonObject['mac'] = rowObject.MAC.toString('hex');
            }
            else if(data.data_type == 'pri_router' || data.data_type == "Pri_Router") {
                jsonObject['router_id'] = rowObject.RouterID.toString('hex');
                jsonObject['space_id'] = rowObject.SpaceID.toString('hex');
                jsonObject['min_rssi'] = rowObject.Min_RSSI.toString();
                jsonObject['max_rssi'] = rowObject.Max_RSSI.toString();
            }
            else if(data.data_type == 'pos_Data' || data.data_type == 'Pos_Data' || data.data_type == 'pos_data') {
                jsonObject['device_id'] = rowObject.DeviceID.toString('hex');
                jsonObject['space_id'] = rowObject.SpaceID.toString('hex');
                jsonObject['pos_x'] = rowObject.Pos_X.toString();
                jsonObject['pos_y'] = rowObject.Pos_Y.toString();
            }

            resultArray.push(jsonObject);
        }

        return resultArray;
        
    } catch (error) {
        console.error('Error inserting data:', error);
        return undefined;

    } finally {
        connection.end();
    }
}


async function insert_db(data) {

    var sql = null;
    var values = null;

    var genearted_id = GenerateID(`${data.data_type}`);


    // 테이블마다 가지고 있는 칼럼이 다르므로 경우를 나눠 처리
    if(data.data_type == 'home' || data.data_type == 'Home') {
        var Interval_time = data.interval_time;
        if(data.interval_time == undefined) {
            Interval_time = '60';
        }
        var Expire_count = data.expire_count;
        if(data.expire_count == undefined) {
            Expire_count = '5';
        }

        sql = `INSERT INTO Home (Home_name, Interval_time, Expire_count) VALUES (?, ?, ?)`;
        values = [data.home_name, parseInt(Interval_time), parseInt(Expire_count)];
    }
    else if(data.data_type == 'space' || data.data_type == 'Space') {
        sql = `INSERT INTO Space (ID, familiar_name, size_x, size_y) VALUES (${genearted_id}, ?, ?, ?)`;
        values = [data.familiar_name, data.size_x, data.size_y];
    }
    else if(data.data_type == 'user' || data.data_type == 'User') {
        sql = `INSERT INTO User (ID, User_name) VALUES (${genearted_id}, ?)`;
        values = [data.user_name];
    }
    else if(data.data_type == 'device' || data.data_type == 'Device') {
        const State = Buffer.from([0x00, 0x00]); // state는 최초 삽입 시, 00으로 들어가게 된다.
        const UserID = Buffer.from(data.user_id, 'hex'); // 주인의 ID는 user에 속한 ID여야 한다.

        sql = `INSERT INTO Device (ID, familiar_name, State, UserID) VALUES (${genearted_id}, ?, ?, ?)`;
        values = [data.familiar_name, State, UserID];
    }
    else if(data.data_type == 'beacon' || data.data_type == 'Beacon') {
        const State = Buffer.from([0x00, 0x00]);
        const beacon_id = Buffer.from(data.beacon_id, 'hex');
        const space_id = Buffer.from(data.space_id, 'hex'); // 16진수 문자열을 이진 데이터로 변환
        
        sql = `INSERT INTO Beacon (ID, State, SpaceID, Pos_X, Pos_Y, Power, isPrimary) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        values = [beacon_id, State, space_id, parseFloat(data.pos_x), parseFloat(data.pos_y), parseInt(data.power), data.isPrimary];
    }
    else if(data.data_type == 'pri_beacon' || data.data_type == "PRI_Beacon") {
        const beacon_id = Buffer.from(data.beacon_id, 'hex'); // 16진수 문자열을 이진 데이터로 변환
        const space_id = Buffer.from(data.space_id, 'hex'); // 16진수 문자열을 이진 데이터로 변환

        sql = `INSERT INTO PRI_Beacon (BeaconID, SpaceID, Min_RSSI, Max_RSSI) VALUES (?, ?, ?, ?)`;
        values = [beacon_id, space_id, parseInt(data.min_rssi), parseInt(data.max_rssi)];
    }
    else if(data.data_type == 'router' || data.data_type == 'Router') {
        const MacAdr = Buffer.from(data.mac, 'hex');

        sql = `INSERT INTO Router (ID, SSID, MAC) VALUES (${genearted_id}, ?, ?)`;
        values = [data.ssid, MacAdr];
    }
    else if(data.data_type == 'pri_router' || data.data_type == "Pri_Router") {
        const RouterID = Buffer.from(data.router_id, 'hex'); // 16진수 문자열을 이진 데이터로 변환
        const SpaceID = Buffer.from(data.space_id, 'hex'); // 16진수 문자열을 이진 데이터로 변환

        sql = `INSERT INTO PRI_Router (RouterID, SpaceID, Min_RSSI, Max_RSSI) VALUES (?, ?, ?, ?)`;
        values = [RouterID, SpaceID, parseInt(data.min_rssi), parseInt(data.max_rssi)];
    }
    else if(data.data_type == 'pos_data' || data.data_type == 'Pos_Data' || data.data_type == 'pos_Data') {
        const DeviceID = Buffer.from(data.device_id, 'hex'); 
        const SpaceID = Buffer.from(data.space_id, 'hex');

        var Pos_X = data.pos_x;
        if(data.pos_x == undefined) {
            Pos_X = '0.0';
        }
        var Pos_Y = data.pos_y
        if(data.pos_y == undefined) {
            Pos_Y = '0.0';
        }

        sql = `INSERT INTO Pos_Data (DeviceID, SpaceID, Pos_X, Pos_Y) VALUES (?, ?, ?, ?)`;
        values = [DeviceID, SpaceID, parseFloat(Pos_X), parseFloat(Pos_Y)];
    }
    else {
        console.log('error : there are no table');
        return;
    }

    const connection = await connectDatabase();
    var response_valid = false;
    var response_values = {
        "data_type": data.data_type,
        "msg": "Register Failed"
    };

    try {
        // console.log(sql);
        await connection.execute(sql, values);

        var response_valid = true;
        var response_values = {
            "msg": "Register Success",
            "id": genearted_id
        };

        
    } catch (error) {
        console.error('Error inserting data:', error);
        return undefined;

    } finally {
        connection.end();
    }

    const response = {
        "valid": response_valid,
        "values": response_values
    };

    return response;


}

async function update_db(data) {

    var sql = "";
    var columnCondition = "";

    // 테이블마다 가지고 있는 칼럼이 다르므로 경우를 나눠 처리
    if(data.data_type == 'home' || data.data_type == 'Home') {
        sql = `UPDATE Home SET`;
        if(data.interval_time != undefined) {
            columnCondition += ` Interval_time = ${data.interval_time}`;
        }
        if(data.expire_count != undefined) {
            if(columnCondition != "") {
                columnCondition += `,`;
            }
            columnCondition += ` Expire_count = ${data.expire_count}`;
        }

        sql += columnCondition + ` WHERE Home_name = '${data.home_name}'`;
    }
    else if(data.data_type == 'space' || data.data_type == 'Space') {
        sql = `UPDATE Space SET`;
        if(data.size_x != undefined) {
            columnCondition += ` Size_X = ${data.size_x}`;
        }
        if(data.size_y != undefined) {
            if(columnCondition != "") {
                columnCondition += `,`;
            }
            columnCondition += ` Size_Y = ${data.size_y}`;
        }

        sql += columnCondition + ` WHERE ID = x'${data.id}'`;
    }
    else if(data.data_type == 'user' || data.data_type == 'User') {
        sql = `UPDATE User SET`;
        if(data.user_name != undefined) {
            columnCondition += ` User_name = '${data.user_name}'`;
        }

        sql += columnCondition + ` WHERE ID = x'${data.id}'`;
    }
    else if(data.data_type == 'device' || data.data_type == 'Device') {
        sql = `UPDATE Device SET`;
        if(data.state != undefined) {
            columnCondition += ` STATE = x'${data.state}'`
        }
        
        sql += columnCondition + ` WHERE ID = x'${data.id}'`
    }
    else if(data.data_type == 'beacon' || data.data_type == 'Beacon') {
        sql = `UPDATE Beacon SET`;
        if(data.state != undefined) {
            columnCondition += ` STATE = x'${data.state}'`
        }
        if(data.isprimary != undefined) {
            if(columnCondition != "") {
                columnCondition += `,`;
            }
            columnCondition += ` isPrimary = ${data.isprimary}`;
        }

        sql += columnCondition + ` WHERE ID = x'${data.id}'`;
    }
    else if(data.data_type == 'pri_beacon' || data.data_type == "PRI_Beacon") {
        sql = `UPDATE PRI_Beacon SET`;
        if(data.min_rssi != undefined) {
            columnCondition += ` Min_RSSI = ${data.min_rssi}`;
        }
        if(data.max_rssi != undefined) {
            if(columnCondition != "") {
                columnCondition += `,`;
            }
            columnCondition += ` Max_RSSI = ${data.max_rssi}`;
        }

        sql += columnCondition + ` WHERE BeaconID = x'${data.beacon_id}' AND SpaceID = x'${data.space_id}'`;
    }
    else if(data.data_type == 'router' || data.data_type == 'Router') {
        sql = `UPDATE Router SET`;
        if(data.ssid != undefined) {
            columnCondition += ` SSID = '${data.ssid}'`;
        }

        sql += columnCondition + ` WHERE ID = x'${data.id}'`;
    }
    else if(data.data_type == 'pri_router' || data.data_type == "PRI_Router") {
        sql = `UPDATE PRI_Router SET`;
        if(data.min_rssi != undefined) {
            columnCondition += ` Min_RSSI = ${data.min_rssi}`
        }
        if(data.max_rssi != undefined) {
            if(columnCondition != "") {
                columnCondition += `,`;
            }
            columnCondition += ` Max_RSSI = ${data.max_rssi}`;
        }

        sql += columnCondition + ` WHERE RouterID = x'${data.router_id}' AND SpaceID = x'${data.space_id}'`;
    }
    else if(data.data_type == 'pos_data' || data.data_type == 'Pos_Data' || data.data_type == 'pos_Data') {
        sql = `UPDATE Pos_Data SET `;
        if(data.space_id != undefined) {
            columnCondition += ` SpaceID = x'${data.space_id}'`;
        }
        if(data.pos_x != undefined) {
            if(columnCondition != "") {
                columnCondition += `,`;
            }
            columnCondition += ` Pos_X = ${data.pos_x}`
        }
        if(data.pos_y != undefined) {
            if(columnCondition != "") {
                columnCondition += `,`;
            }
            columnCondition += ` Pos_Y = ${data.pos_y}`;
        }

        sql += columnCondition + ` WHERE DeviceID = x'${data.device_id}'`;
    }
    else {
        console.log('error : there are no table');
        return;
    }

    const connection = await connectDatabase();
    var response_valid = false;
    var response_values = {
        "data_type": data.data_type,
        "msg": "Update Failed"
    };

    // 조립된 쿼리문 실행
    try {
        // console.log(sql);
        const [rows, fields] = await connection.execute(sql);
        response_valid = true;
        response_values.msg = "Update Success";

    } catch (error) {
        console.error(`Error updating data: ${error}`);
        response_valid = false;
        response_values.msg = "Update Failed";
    }

    const response = {
        "valid": response_valid,
        "values": response_values
    };

    return response;
}

async function delete_db(data) {

    var sql = "";

    // 테이블마다 가지고 있는 칼럼이 다르므로 경우를 나눠 처리
    if(data.data_type == 'home' || data.data_type == 'Home') {
        sql = `DELETE FROM Home WHERE Home_name = '${data.home_name}'`;
    }
    else if(data.data_type == 'space' || data.data_type == 'Space') {
        sql = `DELETE FROM Space WHERE ID = x'${data.id}'`;
    }
    else if(data.data_type == 'user' || data.data_type == 'User') {
        sql = `DELETE FROM User WHERE ID = x'${data.id}'`;
    }
    else if(data.data_type == 'device' || data.data_type == 'Device') {
        sql = `DELETE FROM Device WHERE ID = x'${data.id}'`;
    }
    else if(data.data_type == 'beacon' || data.data_type == 'Beacon') {
        sql = `DELETE FROM Beacon WHERE ID = x'${data.id}'`;
    }
    else if(data.data_type == 'pri_beacon' || data.data_type == "PRI_Beacon") {
        sql = `DELETE FROM PRI_Beacon WHERE BeaconID = x'${data.beacon_id}' AND SpaceID = x'${data.space_id}'`;
    }
    else if(data.data_type == 'router' || data.data_type == 'Router') {
        sql = `DELETE FROM Router WHERE ID = x'${data.id}'`;
    }
    else if(data.data_type == 'pri_router' || data.data_type == "PRI_router") {
        sql = `DELETE FROM PRI_Router WHERE RouterID = x'${data.router_id}' AND SpaceID = x'${data.space_id}'`;
    }
    else if(data.data_type == 'pos_data' || data.data_type == 'Pos_Data' || data.data_type == 'pos_Data') {
        sql = `DELETE FROM Pos_Data WHERE DeviceID = x'${data.device_id}' AND SpaceID = x'${data.space_id}'`;
    }
    else {
        console.log('error : there are no table');
        return;
    }

    const connection = await connectDatabase();

    // 조립된 쿼리문 실행
    try {

        console.log(sql);
        const results = await connection.execute(sql);

        var res_data = {
            'delete_ok': "0",
        }

        if(results != null) {
            res_data.delete_ok = "1";
        }
        
        return res_data;
        
    } catch (error) {
        console.error('Error inserting data:', error);
    } finally {
        connection.end();
    }
}

// 서버에서 사용할 ID 6바이트 ID 발급
function GenerateID(type) {

    const data = Buffer.alloc(6);

    if(type == 'user' || type == 'User') { // 유저 ID 생성
      data[0] = Math.floor(Math.random() * 16) + 16;
    }
    else if(type == 'space' || type == 'Space') { // space ID 생성
      data[0] = Math.floor(Math.random() * 32) + 32;
    }
    else if(type == 'router' || type == 'Router') { // router ID 생성
      data[0] = Math.floor(Math.random() * 64) + 64;
    }
    else if(type == 'device'|| type == 'Device') { // device ID 생성
      data[0] = Math.floor(Math.random() * 96) + 64;
    }

    // 나머지 바이트는 0에서 255사이의 랜덤한 값
    for (let i = 1; i < 6; i++) {
      data[i] = Math.floor(Math.random() * 256);
    }
  
    var genearted_id = "X'" + data.toString('hex') + "'";
    return genearted_id;

}

// ID를 이용하여 어떤 타입의 ID인지 확인 후 반환
function GetTypeByID(id) {
    const byteArray = Buffer.from(id, 'hex');
    const firstByte = byteArray[0];
    if (firstByte >= 16 && firstByte < 32) {
        return 'user';
    } 
    else if (firstByte >= 32 && firstByte < 64) {
        return 'space';
    } 
    else if (firstByte >= 64 && firstByte < 96) {
        return 'device';
    } 
    else if (firstByte >= 80 && firstByte < 224) {
        return 'beacon';
    } 
    else {
        return null; // Invalid ID
    }
}


module.exports = {
    select_db, insert_db, update_db, delete_db
};

