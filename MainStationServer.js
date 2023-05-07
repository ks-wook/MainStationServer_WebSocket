//
// MainStationServer scrpited by node.js
//
// created by ks-wook on 2023/04/21
//

const {startBroadCast} = require('./Broadcast/BroadCast');
const {startServer} = require('./SocketIO/SocketIO');

const { CalPositionReq } = require('./Ips_cal/IpscalConnector');

startBroadCast();
startServer();


