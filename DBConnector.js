const mysql = require('mysql2/promise');
const config = require('./config.json');


function connectDatabase() {
  const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: config.id,
    password: config.password,
    database: 'mainstationdb'
  });

  return connection;
}



async function select_db(table, condition) {

    const connection = await connectDatabase();

    if(condition != null) {
        // condition = Buffer.from(condition).toString('hex');
        condition = condition.toString('hex');
        console.log(condition);
    }
    try { // TODO : 다른 모든 테이블에 대해서 select문 처리 작성
        if(table == 'user') {

            const [results, fields] = await connection.execute(`SELECT ID, name FROM ${table} WHERE id = x'${condition}'`);
            return results;
            // return find_data(results, condition);
        }
        else if(table == 'device') {
            const [results, fields] = await connection.execute(`SELECT ID, State, OwnerId FROM ${table} WHERE id = x'${condition}'`);
            return results;
            // return find_data(results, condition);
        }
        else if(table == 'beacon') {
            const [results, fields] = await connection.execute(`SELECT ID, State, SpaceId FROM ${table} WHERE id = x'${condition}'`);
            return results;
            // return find_data(results, condition);
        }
        else if(table == 'router') {
            const [results, fields] = await connection.execute(`SELECT ID, name, MacAdr FROM ${table} WHERE id = x'${condition}'`);
            return results;
            // return find_data(results, condition);
        }
        else if(table == 'space') {
            const [results, fields] = await connection.execute(`SELECT ID, name FROM ${table} WHERE id = x'${condition}'`);
            return results;
            // return find_data(results, condition);
        }
        else {
            console.log('there are no table');
            return results;
            // return null;
        }
    } catch (error) {
        console.error('Error inserting data:', error);
    } finally {
        connection.end();
    }
}


// data에 넣고자 하는 데이터의 정보가 들어있다.
async function insert_db(data) {

    var query = null;
    var values = null;

    var genearted_id = generateID(`${data.table}`);

    if(data.table == 'user') {
        query = `INSERT INTO user (ID, name) VALUES (${genearted_id}, ?)`;
        values = [data.name];
    }
    else if(data.table == 'device') {
        const State = Buffer.from([0x00, 0x00]);
        const OwnerId = Buffer.from(data.OwnerId.toString('hex'), 'hex');
        query = `INSERT INTO device (ID, State, OwnerId) VALUES (${genearted_id}, ?, ?)`;
        values = [State, OwnerId];
    }
    else if(data.table == 'beacon') {
        const State = Buffer.from([0x00, 0x00]);
        const SpaceId = Buffer.from(data.SpaceId.toString('hex'), 'hex');
        query = `INSERT INTO beacon (ID, State, SpaceId) VALUES (${genearted_id}, ?, ?)`;
        values = [State, SpaceId];
    }
    else if(data.table == 'router') {
        const MacAdr = Buffer.from(data.MacAdr.toString('hex'), 'hex');
        query = `INSERT INTO router (ID, name, MacAdr) VALUES (${genearted_id}, ?, ?)`;
        values = [data.name, MacAdr];
    }
    else if(data.table == 'space') {
        query = `INSERT INTO space (ID, name) VALUES (${genearted_id}, ?)`;
        values = [data.name];
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
        return genearted_id;
    }

}

async function update_db(data) {

    var update_item_id = null;

    if(data.update_item_id != null) {
        update_item_id = data.update_item_id.toString('hex');
        console.log(update_item_id);
    }
    else {
        console.log('error : there are no update id');
        return;
    }

    const sql = `UPDATE ${data.table} SET ${data.column} = ? WHERE id = x'${update_item_id}'`;

    // 바이트 배열의 수정인 경우 DB처리를 위해 문자열 변환 -> 바이트 배열 전환 과정을 서버에서 거쳐야함
    // 클라이언트에서 받은 바이트 배열은 바로 처리가 불가능
    if(data.column == 'State' || data.column == 'OwnerId' || data.column == 'MacAdr') {
        data.new_value = Buffer.from(data.new_value.toString('hex'), 'hex');
    }

    const values = [data.new_value];

    const connection = await connectDatabase();

    try {
        
        const [rows, fields] = await connection.execute(sql, values);

        console.log(`${data.column} row(s) update complete`);
    } catch (error) {
        console.error(`Error updating data: ${error}`);
    }

    return update_item_id;
}



// function find_data(results, string_id) {

//     if(string_id == null)
//       return results;

//     var find_result = null;
//     results.forEach(result => {
//       const binaryString = Buffer.from(result.ID).toString('hex');
//       // console.log(binaryString);
//       // console.log(string_id);
//       if(binaryString == string_id) {
//           console.log('Data searched !!');
//           find_result = result;
//       }
      
//     });

//     return find_result;

// }
  
function generateID(type) {

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
  
    var genearted_id = "X'" + data.toString('hex') + "'";
    console.log(`generated id ${type} : ${genearted_id}`);
    const byteArray = Buffer.from(data.toString('hex'), 'hex');
    const paddedByteArray = Buffer.alloc(6);
    byteArray.copy(paddedByteArray, 6 - byteArray.length);
    for(i = 0; i < paddedByteArray.length; i++) {
        console.log(byteArray[i]);
    }
    console.log(paddedByteArray);
    return genearted_id;

}


module.exports = {
    select_db, insert_db, update_db
};

