const { parentPort } = require('worker_threads');
const os = require('os');

let insert_db, select_db, update_db, delete_db, http_get_db;

if (os.platform() === 'win32') { // 윈도우 실행
    ({ insert_db, select_db, update_db, delete_db, http_get_db } = require('./DBConnectorWin'));

} 
else { // 리눅스 실행
    ({ insert_db, select_db, update_db, delete_db, http_get_db } = require('./DBConnectorPi'));

}

parentPort.on('message', async (message) => {
    
    var Command = message.type;
    var Data = message.data;

    if(Command == 'select') {
        var results = await select_db(Data);
        parentPort.postMessage({"type": Command, "results": results});
    }
    else if(Command == 'insert') {
        var results = await insert_db(Data);
        parentPort.postMessage({"type": Command, "results": results});
    }
    else if(Command == 'update') {
        var results = await update_db(Data);
        parentPort.postMessage({"type": Command, "results": results});
    }
    else if(Command == 'delete') {
        var results = await delete_db(Data);
        parentPort.postMessage({"type": Command, "results": results});
    }
    else if(Command == 'http_get') {
        var results = await http_get_db();
        parentPort.postMessage({"type": Command, "results": results});
    }

});