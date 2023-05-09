const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const mysql = require('mysql2/promise');
const config = require('../config.json');
const { Worker } = require('worker_threads');
const DBworker = new Worker('./DB/DBWorker.js');


const PORT = process.env.PORT || 8712;

function connectDatabase() {
  const connection = mysql.createConnection({
    host: '127.0.0.1',
    port: config.users[1].port,
    user: config.users[1].id,
    password: config.users[1].password,
    database: config.users[1].database
  });

  return connection;
}

app.use(express.static('public'));

app.get('/position.json', async (req, res) => {
  
    const connection = await connectDatabase();
  
    try {

        const [rows, fields] = await connection.execute(`
          SELECT HEX(DeviceID),
            (SELECT Familiar_name FROM Device WHERE Device.ID = Pos_Data.DeviceID) AS Device_Name,
            (SELECT HEX(State) FROM Device WHERE Device.ID = Pos_Data.DeviceID) AS Device_State,
            HEX(SpaceID),
            (SELECT Familiar_name FROM Space WHERE Space.ID = Pos_Data.SpaceID) AS Space_name,
            (SELECT Size_X FROM Space WHERE Space.ID = Pos_Data.SpaceID) AS Space_Size_X,
            (SELECT Size_Y FROM Space WHERE Space.ID = Pos_Data.SpaceID) AS Space_Size_Y,
            Pos_X, Pos_Y,
            DATE_FORMAT(Data_time, '%Y-%m-%d %H:%i:%s') AS Date_time
            FROM Pos_Data
        `);

        console.log(rows);
        res.send(rows);

    } catch (error) {
        console.log(error);
    } finally {
        connection.end();
    }

});

DBworker.on('message', (message) => {
    if(message.type == 'http_get') {
        
    }
    
});

io.on('connection', (socket) => {
    console.log('HomeServer connected');

    socket.on('disconnect', () => {
        console.log('HomeServer disconnected');
    });
});

http.listen(PORT, () => {
    console.log(`listening on HomeServer*:${PORT}`);
});