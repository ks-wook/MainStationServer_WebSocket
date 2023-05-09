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
        sql = `SELECT * FROM home`;
    }
    else if(data.data_type == 'router' || data.data_type == 'Router') {
        sql = `SELECT * FROM router`;
    }
    else if(data.data_type == 'space' || data.data_type == 'Space') {
        sql = `SELECT * FROM space`;
    }
    else if(data.data_type == 'beacon' || data.data_type == 'Beacon') {
        sql = `SELECT * FROM beacon`;
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
    else if(data.data_type == 'pri_beacon' || data.data_type == "Pri_Beacon") {
        sql = `SELECT * FROM pri_beacon`;
    }
    else if(data.data_type == 'pri_router' || data.data_type == "Pri_Router") {
        sql = `SELECT * FROM pri_router`;
    }
    else if(data.data_type == 'user' || data.data_type == 'User') {
        sql = `SELECT * FROM user`;
    }
    else if(data.data_type == 'device' || data.data_type == 'Device') {
        sql = `SELECT * FROM device`;
        if(data.user_id != undefined) {
            sql += ` WHERE UserID = x'${data.user_id}'`
        }
    }
    else if(data.data_type == 'pos_data' || data.data_type == 'Pos_Data' || data.data_type == 'pos_Data') {
        sql = `SELECT * FROM pos_data`;
    }
    else {
        console.log('error : there are no table');
        return;
    }
    
    const connection = await connectDatabase(); // db connect

    try {

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
            else if(data.data_type == 'router' || data.data_type == 'Router') {
                jsonObject['id'] = rowObject.ID.toString('hex');
                jsonObject['ssid'] = rowObject.SSID.toString('hex');
                jsonObject['mac'] = rowObject.MAC.toString('hex');
            }
            else if(data.data_type == 'space' || data.data_type == 'Space') {
                jsonObject['id'] = rowObject.ID.toString('hex');
                jsonObject['familiar_name'] = rowObject.Familiar_name;
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
            else if(data.data_type == 'pri_router' || data.data_type == "Pri_Router") {
                jsonObject['router_id'] = rowObject.RouterID.toString('hex');
                jsonObject['space_id'] = rowObject.SpaceID.toString('hex');
                jsonObject['min_rssi'] = rowObject.Min_RSSI.toString();
                jsonObject['max_rssi'] = rowObject.Max_RSSI.toString();
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
            else if(data.data_type == 'pos_Data' || data.data_type == 'Pos_Data' || data.data_type == 'pos_data') {
                jsonObject['device_id'] = rowObject.DeviceID.toString('hex');
                jsonObject['space_id'] = rowObject.SpaceID.toString('hex');
                jsonObject['pos_x'] = rowObject.Pos_X.toString();
                jsonObject['pos_y'] = rowObject.Pos_Y.toString();
            }

            console.log(jsonObject);
            resultArray.push(jsonObject);
        }

        return resultArray;
        
    } catch (error) {
        console.error('Error inserting data:', error);
    } finally {
        connection.end();
    }
}


async function insert_db(data) {

    var query = null;
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

        query = `INSERT INTO home (Home_name, Interval_time, Expire_count) VALUES (?, ?, ?)`;
        values = [data.home_name, parseInt(Interval_time), parseInt(Expire_count)];
    }
    else if(data.data_type == 'router' || data.data_type == 'Router') {
        const MacAdr = Buffer.from(data.mac, 'hex');

        query = `INSERT INTO router (ID, SSID, MAC) VALUES (${genearted_id}, ?, ?)`;
        values = [data.ssid, MacAdr];
    }
    else if(data.data_type == 'space' || data.data_type == 'Space') {
        query = `INSERT INTO space (ID, familiar_name, size_x, size_y) VALUES (${genearted_id}, ?, ?, ?)`;
        values = [data.familiar_name, data.size_x, data.size_y];
    }
    else if(data.data_type == 'beacon' || data.data_type == 'Beacon') {
        const State = Buffer.from([0x00, 0x00]);
        const beacon_id = Buffer.from(data.beacon_id, 'hex');
        const space_id = Buffer.from(data.space_id, 'hex'); // 16진수 문자열을 이진 데이터로 변환
        
        query = `INSERT INTO beacon (ID, State, SpaceID, Pos_X, Pos_Y, Power, isPrimary) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        values = [beacon_id, State, space_id, parseFloat(data.pos_x), parseFloat(data.pos_y), parseInt(data.power), data.isPrimary];
    }
    else if(data.data_type == 'pri_beacon' || data.data_type == "Pri_Beacon") {
        const beacon_id = Buffer.from(data.beacon_id, 'hex'); // 16진수 문자열을 이진 데이터로 변환
        const space_id = Buffer.from(data.space_id, 'hex'); // 16진수 문자열을 이진 데이터로 변환

        query = `INSERT INTO pri_beacon (BeaconID, SpaceID, Min_RSSI, Max_RSSI) VALUES (?, ?, ?, ?)`;
        values = [beacon_id, space_id, parseInt(data.min_rssi), parseInt(data.max_rssi)];
    }
    else if(data.data_type == 'pri_router' || data.data_type == "Pri_Router") {
        const RouterID = Buffer.from(data.router_id, 'hex'); // 16진수 문자열을 이진 데이터로 변환
        const SpaceID = Buffer.from(data.space_id, 'hex'); // 16진수 문자열을 이진 데이터로 변환

        query = `INSERT INTO pri_router (RouterID, SpaceID, Min_RSSI, Max_RSSI) VALUES (?, ?, ?, ?)`;
        values = [RouterID, SpaceID, parseInt(data.min_rssi), parseInt(data.max_rssi)];
    }
    else if(data.data_type == 'user' || data.data_type == 'User') {
        query = `INSERT INTO user (ID, User_name) VALUES (${genearted_id}, ?)`;
        values = [data.user_name];
    }
    else if(data.data_type == 'device' || data.data_type == 'Device') {
        const State = Buffer.from([0x00, 0x00]); // state는 최초 삽입 시, 00으로 들어가게 된다.
        const UserID = Buffer.from(data.user_id, 'hex'); // 주인의 ID는 user에 속한 ID여야 한다.

        query = `INSERT INTO device (ID, familiar_name, State, UserID) VALUES (${genearted_id}, ?, ?, ?)`;
        values = [data.familiar_name, State, UserID];
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

        query = `INSERT INTO pos_data (DeviceID, SpaceID, Pos_X, Pos_Y) VALUES (?, ?, ?, ?)`;
        values = [DeviceID, SpaceID, parseFloat(Pos_X), parseFloat(Pos_Y)];
    }
    else {
        console.log('error : there are no table');
        return;
    }

    const connection = await connectDatabase();
    
    try {

        await connection.execute(query, values);
        console.log('Data inserted successfully');
        
    } catch (error) {
        console.error('Error inserting data:', error);
    } finally {
        connection.end();

        var res_data = {
            'id': genearted_id,
            'table': data.data_type
        }
        
        return res_data;
    }

}

async function update_db(data) {

    var WhereCondition = "";
    var update_ok = 0;
    
    if(data.id != undefined) {

        if(data.setTarget == '1') { // ID의 값으로 하나의 아이템을 검색하는 경우
            WhereCondition = ` Where ID = x'${data.id}'`;
        }
        else {
            // ID의 타입을 확인
            const dataType = GetTypeByID(data.id);

            if(dataType == 'space') { // space ID로 검색하고자 하는 경우
                WhereCondition += ` WHERE SpaceID = x'${data.id}'`
            }
            else if(dataType == 'user') { // user ID로 검색하고자 하는 경우
                WhereCondition += ` WHERE UserID = x'${data.id}'`
            }
            else { // 비적합한 ID
                console.log ("error : it's invalid ID");
                update_ok = 0;
            }
        }
    }
    
    if(data.isPrimary == '1') { // isPrimary = true 인 아이템을 찾고 싶은 경우
        if(WhereCondition != "") {
            WhereCondition += ' AND';
        }
        else {
            WhereCondition += ' WHERE';
        }
        
        WhereCondition += ' isPrimary = 1';
    }

    let values;

    if(data.column == 'state' || data.column == 'user_id' || data.column == 'space_id' || data.column == 'device_id') {
        const byteValue = Buffer.from(data.new_value, 'hex');
        values = [byteValue];

        if(data.column == 'user_id') {
            data.column = 'UserID';
        }
        else if(data.column == 'space_id') {
            data.column = 'SpaceID';
        }
        else if(data.column == 'device_id') {
            data.column = 'DeviceID';
        }
    }
    else if(data.column == 'pos_x' || data.comumn == 'pos_y' || data.column == 'size_x' || data.column == 'size_y') {
        values = [parseFloat(data.new_value)]
    }
    else if(data.column == 'power' || data.column == 'interval_time' || data.comumn == 'expire_count' || data.column == 'min_rssi' || data.column == 'max_rssi') {
        values = [parseInt(data.new_value)]
    }
    else {
        values = [data.new_value];
    }

    const sql = `UPDATE ${data.data_type} SET ${data.column} = ? ` + WhereCondition;

    const connection = await connectDatabase();

    // 조립된 쿼리문 실행
    try {
        console.log(sql);
        const [rows, fields] = await connection.execute(sql, values);
        console.log(`${data.column} row(s) update complete`);
        update_ok = 1;

    } catch (error) {
        console.error(`Error updating data: ${error}`);
        update_ok = 0;
    }


    var res_data = {
        'update_ok': update_ok.toString(),
    }

    return res_data;
}

async function delete_db(data) {

    var WhereCondition = "";

    // 쿼리문 조립
    if(data.id != undefined) {
        if(data.setTarget == '1') { // ID의 값으로 하나의 아이템을 검색하는 경우
            WhereCondition = ` Where ID = x'${data.id}'`;
        }
        else {
            // ID의 타입을 확인
            const dataType = GetTypeByID(data.id);

            if(dataType == 'space') { // space ID로 검색하고자 하는 경우
                WhereCondition += ` WHERE SpaceID = x'${data.id}'`
            }
            else if(dataType == 'user') { // user ID로 검색하고자 하는 경우
                WhereCondition += ` WHERE UserID = x'${data.id}'`
            }
            else { // 비적합한 ID
                console.log ("error : it's invalid ID");
                update_ok = 0;
            }
        }

    }

    if(data.isPrimary == true) { // isPrimary = true 인 아이템을 찾고 싶은 경우
        if(WhereCondition != "") {
            WhereCondition += ' AND';
        }
        else {
            WhereCondition += ' WHERE';
        }
        
        WhereCondition += ' isPrimary = 1';
    }
    
    var query = `DELETE FROM ${data.data_type}` + WhereCondition;
    console.log(query);
    const connection = await connectDatabase();

    // 조립된 쿼리문 실행
    try {

        const results = await connection.execute(query);

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

    if(type == 'user') { // 유저 ID 생성
      data[0] = Math.floor(Math.random() * 16) + 16;
    }
    else if(type == 'space') { // space ID 생성
      data[0] = Math.floor(Math.random() * 32) + 32;
    }
    else if(type == 'router') { // router ID 생성
      data[0] = Math.floor(Math.random() * 64) + 64;
    }
    else if(type == 'device') { // device ID 생성
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

