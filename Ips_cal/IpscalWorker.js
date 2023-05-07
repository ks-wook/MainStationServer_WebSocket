const { CalPositionReq } = require('./IpscalConnector');
const { parentPort } = require('worker_threads');

parentPort.on('message', async (message) => {
    
    var scanData = message;

    CalPositionReq(scanData);
    
});