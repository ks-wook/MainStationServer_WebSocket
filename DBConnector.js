const mysql = require('mysql2/promise');

function connectDatabase() {
  const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'your password',
    database: 'mainstationdb'
  });

  return connection;
}

async function insertUser() {


    const query = `INSERT INTO user (name, ID) VALUES (?, ${generateID('user')})`;
    const values = ['테스트유저'];

    const connection = await connectDatabase();
    
    try {
        await connection.execute(query, values);
        console.log('Data inserted successfully');
    } catch (error) {
        console.error('Error inserting data:', error);
    } finally {
        connection.end();
    }

}
  
function generateID(type) {

    const data = Buffer.alloc(6);

    if(type == 'user') { // 유저 ID 생성
      data[0] = Math.floor(Math.random() * 16) + 16;
    }
  
    // 나머지 바이트는 0에서 255사이의 랜덤한 값
    for (let i = 1; i < 6; i++) {
      data[i] = Math.floor(Math.random() * 256);
    }
  
    return "X'" + data.toString('hex') + "'";

}


module.exports = {
    insertUser
};

