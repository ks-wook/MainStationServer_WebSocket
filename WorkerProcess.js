const {insert_db, select_db, update_db} = require('./DBConnector');
const { parentPort } = require('worker_threads');

parentPort.on('message', async (message) => {
    
    var query = message.type;
    var queryData = message.data;

    if(query == 'select') {
        var results = await select_db(queryData);
        parentPort.postMessage({"type": query, "results": results});
    }
    else if(query == 'insert') {
        var results = await insert_db(queryData);
        parentPort.postMessage({"type": query, "results": results});
    }
    else if(query == 'update') {
        var results = await update_db(queryData);
        parentPort.postMessage({"type": query, "results": results});
    }

});