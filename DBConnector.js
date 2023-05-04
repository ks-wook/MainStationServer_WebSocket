const mysql = require('mysql2/promise');
const config = require('./config.json');


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
        if(data.setTarget == 1) { // ID의 값으로 하나의 아이템을 검색하는 경우
            const TargetID = "X'" + Array.from(new Uint8Array(data.ID)).map(b => b.toString(16).padStart(2, '0')).join('') + "'";
            WhereCondition = ` Where ID = ${TargetID}`;
        }
        else {
            // ID의 타입을 확인
            const dataType = GetTypeByID(data.ID);

            if(dataType == 'Space') { // space ID로 검색하고자 하는 경우
                const SpaceID = "X'" + Array.from(new Uint8Array(data.ID)).map(b => b.toString(16).padStart(2, '0')).join('') + "'";
                WhereCondition += ` WHERE SpaceID = ${SpaceID}`
            }
            else if(dataType == 'User') { // user ID로 검색하고자 하는 경우
                const UserID = "X'" + data.ID.toString('hex') + "'";
                WhereCondition += ` WHERE UserID = ${UserID}`
            }
            else { // 비적합한 ID
                console.log ("error : it's invalid ID");
                return;
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
    if(data.table == 'Router') {
        const MacAdr = Buffer.from(data.MacAdr.toString('hex'), 'hex');
        query = `INSERT INTO Router (ID, SSID, MAC) VALUES (${genearted_id}, ?, ?)`;
        values = [data.SSID, data.MAC];
    }
    else if(data.table == 'Space') {
        query = `INSERT INTO Space (ID, Familiar_name, Size_X, Size_Y) VALUES (${genearted_id}, ?, ?, ?)`;
        values = [data.Familiar_name, data.Size_X, data.Size_Y];
    }
    else if(data.table == 'Beacon') {
        const State = Buffer.from([0x00, 0x00]);
        query = `INSERT INTO Beacon (ID, State, SpaceId, Pos_X, Pos_Y, Power, isPrimary) VALUES (${genearted_id}, ?, ?, ?, ?, ?, ?)`;
        values = [State, data.SpaceID, data.Pos_X, data.Pos_Y, data.Power, data.isPrimary];
    }
    else if(data.table == 'Pri_beacon') {
        query = `INSERT INTO Pri_beacon (BeaconID, SpaceID, Min_RSSI, Max_RSSI) VALUES (?, ?, ?, ?)`;
        values = [data.BeaconID, data.SpaceID, data.Min_RSSI, data.Max_RSSI];
    }
    else if(data.table == 'Pri_router') {
        query = `INSERT INTO Pri_router (RouterID, SpaceId, Min_RSSI, Max_RSSI) VALUES (?, ?, ?, ?)`;
        values = [data.RouterID, data.SpaceID, data.Min_RSSI, data.Max_RSSI];
    }
    else if(data.table == 'User') {
        query = `INSERT INTO User (ID, User_name) VALUES (${genearted_id}, ?)`;
        values = [data.User_name];
    }
    else if(data.table == 'Device') {
        const State = Buffer.from([0x00, 0x00]); // state는 최초 삽입 시, 00으로 들어가게 된다.
        const UserID = Buffer.from(data.UserID.toString('hex'), 'hex'); // 주인의 ID는 user에 속한 ID여야 한다.
        query = `INSERT INTO Device (ID, Familiar_name, State, UserID) VALUES (${genearted_id}, ?, ?, ?)`;
        values = [data.Familiar_name, State, data.UserID];
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

        if(data.setTarget == 1) { // ID의 값으로 하나의 아이템을 검색하는 경우
            const TargetID = "X'" + Array.from(new Uint8Array(data.ID)).map(b => b.toString(16).padStart(2, '0')).join('') + "'";
            WhereCondition = ` Where ID = ${TargetID}`;
        }
        else {
            // ID의 타입을 확인
            const dataType = GetTypeByID(data.ID);
    
            if(dataType == 'Space') { // space ID로 검색하고자 하는 경우
                const SpaceID = "X'" + Array.from(new Uint8Array(data.ID)).map(b => b.toString(16).padStart(2, '0')).join('') + "'";
                WhereCondition += ` WHERE SpaceID = ${SpaceID}`
            }
            else if(dataType == 'User') { // user ID로 검색하고자 하는 경우
                const UserID = "X'" + Array.from(new Uint8Array(data.ID)).map(b => b.toString(16).padStart(2, '0')).join('') + "'";
                WhereCondition += ` WHERE UserID = ${UserID}`
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

    const sql = `UPDATE ${data.table} SET ${data.column} = ? ` + WhereCondition;
    const values = [data.newValue];

    const connection = await connectDatabase();

    // 조립된 쿼리문 실행
    try {
        
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

    if(type == 'User') { // 유저 ID 생성
      data[0] = Math.floor(Math.random() * 16) + 16;
    }
    else if(type == 'Space') { // space ID 생성
      data[0] = Math.floor(Math.random() * 32) + 32;
    }
    else if(type == 'Router') { // router ID 생성
      data[0] = Math.floor(Math.random() * 64) + 64;
    }
    else if(type == 'Device') { // device ID 생성
      data[0] = Math.floor(Math.random() * 96) + 64;
    }
    else if(type == 'Beacon') { // beacon ID 생성
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
    const firstByte = id[0];
    if (firstByte >= 16 && firstByte < 32) {
        return 'User';
    } 
    else if (firstByte >= 32 && firstByte < 64) {
        return 'Space';
    } 
    else if (firstByte >= 64 && firstByte < 96) {
        return 'Device';
    } 
    else if (firstByte >= 80 && firstByte < 224) {
        return 'Beacon';
    } 
    else {
        return null; // Invalid ID
    }
  }


module.exports = {
    select_db, insert_db, update_db
};

