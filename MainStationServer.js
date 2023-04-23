//
// MainStationServer scrpited by node.js
//
// created by ks-wook on 2023/04/21
//

const {startBroadCast} = require('./BroadCast');
const {startServer} = require('./SocketIO');
const {insertUser} = require('./DBConnector');

startBroadCast();
startServer();


// insertUser();