const { parentPort } = require('worker_threads');
const os = require('os');

let insert_db, select_db, update_db, delete_db;

if (os.platform() === 'win32') { // 윈도우 실행
    console.log('Server on Window...');
    ({ insert_db, select_db, update_db, delete_db } = require('./DBConnectorWin'));

} 
else { // 리눅스 실행
    console.log('Server on Linux...');
    ({ insert_db, select_db, update_db, delete_db } = require('./DBConnectorPi'));

}

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
    else if(query == 'delete') {
        var results = await delete_db(queryData);
        parentPort.postMessage({"type": query, "results": results});
    }

});