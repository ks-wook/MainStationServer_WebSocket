//
// MainStationServer scrpited by node.js
//
// created by ks-wook on 2023/04/21
//

const {startBroadCast} = require('./BroadCast');
const {startServer} = require('./SocketIO');
const {insert_db, select_db} = require('./DBConnector');

startBroadCast();
startServer();



const dummyID = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);



// select_db('user', dummyID);
