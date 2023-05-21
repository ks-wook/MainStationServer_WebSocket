const { CalPositionReq, space_calculation_request, position_calculation_request } = require('./IpscalConnector');
const { parentPort } = require('worker_threads');


parentPort.on('message', async (message) => {
    
    var Command = message.type;
    var Data = message.data;

    if(Command == 'space_calculation_request') {
        var response_values = space_calculation_request(Data);
        // parentPort.postMessage({"type": "space_calculation_response", "results": response_values});
    }
    if(Command == 'position_calculation_request') {
        var response_values = position_calculation_request(Data);
        // parentPort.postMessage({"type": "position_calculation_response", "results": response_values});
    }

    
});