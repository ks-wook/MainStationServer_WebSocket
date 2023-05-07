const mysql = require('mysql2/promise');
const config = require('../config.json');


function processMessage(message) {
    const { task, args } = message;
    const result = task(...args); // 함수 실행
}


function connectDatabase() {
  const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: config.port,
    user: config.id,
    password: config.password,
    database: config.database
  });

  return connection;
}

async function select_db(data) {

    var WhereCondition = "";

    // 쿼리문 조립
    if(data.ID != null) {
        if(data.setTarget == '1') { // ID의 값으로 하나의 아이템을 검색하는 경우
            WhereCondition = ` Where ID = x'${data.ID}'`;
        }
        else {
            // ID의 타입을 확인
            const dataType = GetTypeByID(data.ID);

            if(dataType == 'space') { // space ID로 검색하고자 하는 경우
                WhereCondition += ` WHERE SpaceID = x'${data.ID}'`
            }
            else if(dataType == 'user') { // user ID로 검색하고자 하는 경우
                WhereCondition += ` WHERE UserID = x'${data.ID}'`
            }
            else { // 비적합한 ID
                console.log ("error : it's invalid ID");
                updateOk = 0;
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
    
    var selectQuery = `SELECT * FROM ${data.table}` + WhereCondition;

    const connection = await connectDatabase();

    // 조립된 쿼리문 실행
    try {

        const [results, fields] = await connection.execute(selectQuery);
        return results;
        
    } catch (error) {
        console.error('Error inserting data:', error);
    } finally {
        connection.end();
    }
}


async function insert_db(data) {

    var query = null;
    var values = null;

    var genearted_id = GenerateID(`${data.table}`);


    // 테이블마다 가지고 있는 칼럼이 다르므로 경우를 나눠 처리
    if(data.table == 'router') {
        const MacAdr = Buffer.from(data.MacAdr, 'hex');
        query = `INSERT INTO router (ID, SSID, MAC) VALUES (${genearted_id}, ?, ?)`;
        values = [data.SSID, MacAdr];
    }
    else if(data.table == 'space') {
        query = `INSERT INTO space (ID, Familiar_name, Size_X, Size_Y) VALUES (${genearted_id}, ?, ?, ?)`;
        values = [data.Familiar_name, data.Size_X, data.Size_Y];
    }
    else if(data.table == 'beacon') {
        const State = Buffer.from([0x00, 0x00]);
        const BeaconID = Buffer.from(data.BeaconID, 'hex');
        const SpaceID = Buffer.from(data.SpaceID, 'hex'); // 16진수 문자열을 이진 데이터로 변환

        query = `INSERT INTO beacon (ID, State, SpaceId, Pos_X, Pos_Y, Power, isPrimary) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        values = [BeaconID, State, SpaceID, parseFloat(data.Pos_X), parseFloat(data.Pos_Y), parseInt(data.Power), data.isPrimary];
    }
    else if(data.table == 'pri_beacon') {
        query = `INSERT INTO Pri_beacon (BeaconID, SpaceID, Min_RSSI, Max_RSSI) VALUES (?, ?, ?, ?)`;
        const BeaconID = Buffer.from(data.BeaconID, 'hex'); // 16진수 문자열을 이진 데이터로 변환
        const SpaceID = Buffer.from(data.SpaceID, 'hex'); // 16진수 문자열을 이진 데이터로 변환

        values = [BeaconID, SpaceID, parseInt(data.Min_RSSI), parseInt(data.Max_RSSI)];
    }
    else if(data.table == 'pri_beacon') {
        query = `INSERT INTO Pri_router (RouterID, SpaceId, Min_RSSI, Max_RSSI) VALUES (?, ?, ?, ?)`;
        const SpaceID = Buffer.from(data.SpaceID, 'hex'); // 16진수 문자열을 이진 데이터로 변환
        const RouterID = Buffer.from(data.RouterID, 'hex'); // 16진수 문자열을 이진 데이터로 변환

        values = [RouterID, SpaceID, parseInt(data.Min_RSSI), parseInt(data.Max_RSSI)];
    }
    else if(data.table == 'user') {
        query = `INSERT INTO user (ID, User_name) VALUES (${genearted_id}, ?)`;
        values = [data.User_name];
    }
    else if(data.table == 'device') {
        const State = Buffer.from([0x00, 0x00]); // state는 최초 삽입 시, 00으로 들어가게 된다.
        const UserID = Buffer.from(data.UserID, 'hex'); // 주인의 ID는 user에 속한 ID여야 한다.
        query = `INSERT INTO device (ID, Familiar_name, State, UserID) VALUES (${genearted_id}, ?, ?, ?)`;
        values = [data.Familiar_name, State, UserID];
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
            'ID': genearted_id,
            'table': data.table
        }
        
        return res_data;
    }

}

async function update_db(data) {

    var WhereCondition = "";
    var updateOk = 0;
    var newValue = data.newValue;
    
    if(data.ID != null) {

        if(data.setTarget == '1') { // ID의 값으로 하나의 아이템을 검색하는 경우
            WhereCondition = ` Where ID = x'${data.ID}'`;
        }
        else {
            // ID의 타입을 확인
            const dataType = GetTypeByID(data.ID);

            if(dataType == 'space') { // space ID로 검색하고자 하는 경우
                WhereCondition += ` WHERE SpaceID = x'${data.ID}'`
            }
            else if(dataType == 'user') { // user ID로 검색하고자 하는 경우
                WhereCondition += ` WHERE UserID = x'${data.ID}'`
            }
            else { // 비적합한 ID
                console.log ("error : it's invalid ID");
                updateOk = 0;
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

    const sql = `UPDATE ${data.table} SET ${data.column} = ? ` + WhereCondition;
    let values;

    if(data.column == 'State' || data.comumn == 'UserID' || data.column == 'SpaceID' || data.column == 'DeviceID') {
        const byteValue = Buffer.from(data.newValue, 'hex');
        values = [byteValue];

    }
    else if(data.column == 'Pos_X' || data.comumn == 'Pos_y' || data.column == 'Size_X' || data.column == 'Size_y') {
        values = [parseFloat(data.newValue)]
    }
    else if(data.column == 'Power' || data.column == 'Interval_time' || data.comumn == 'Expire_count' || data.column == 'Min_RSSI' || data.column == 'Max_RSSI') {
        values = [parseInt(data.newValue)]
    }
    else {
        values = [data.newValue];
    }

    const connection = await connectDatabase();

    // 조립된 쿼리문 실행
    try {
        console.log(sql);
        const [rows, fields] = await connection.execute(sql, values);
        console.log(`${data.column} row(s) update complete`);

    } catch (error) {
        console.error(`Error updating data: ${error}`);
        updateOk = 0;
    }

    updateOk = 1;

    var res_data = {
        'updateOk': updateOk,
    }

    return res_data;
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
    else if(type == 'beacon') { // beacon ID 생성
      data[0] = Math.floor(Math.random() * 144) + 80;
    }

    // 나머지 바이트는 0에서 255사이의 랜덤한 값
    for (let i = 1; i < 6; i++) {
      data[i] = Math.floor(Math.random() * 256);
    }
  
    // TEMP : int단위 확인용 -----------------------------
    var genearted_id = "X'" + data.toString('hex') + "'";
    console.log(`generated id ${type} : ${genearted_id}`);
    const byteArray = Buffer.from(data.toString('hex'), 'hex');
    const paddedByteArray = Buffer.alloc(6);
    byteArray.copy(paddedByteArray, 6 - byteArray.length);
    for(i = 0; i < paddedByteArray.length; i++) {
        console.log(byteArray[i]);
    }
    console.log(paddedByteArray);
    // ---------------------------------------------------

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
    select_db, insert_db, update_db
};

