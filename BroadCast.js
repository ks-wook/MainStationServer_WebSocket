const dgram = require('dgram');
const os = require('os');

const broadcastPort = 8200;
const broadcastAddress = '255.255.255.255';
const broadcastSocket = dgram.createSocket('udp4'); // broadcasting UDP Socket
const broadcastClilent = dgram.createSocket('udp4');

function startBroadCast() {

    // UDP broadcast
    broadcastSocket.bind(broadcastPort);
    broadcastSocket.on('listening', () => {
    console.log(`broadcast Port : ${broadcastPort}`);
    });

    broadcastSocket.on('message', (message, rinfo) => {
        const clientAddress = rinfo.address;
        console.log(`Client address received: ${clientAddress}`);

        // res to client
        const serverAddress = getServerAddress();
        const responseMessage = `${serverAddress}`;
        broadcastClilent.send(responseMessage, 0, responseMessage.length, broadcastPort, clientAddress, (err) => {
            if (err) {
            console.error(`Error while sending message to client: ${err}`);
            }
            else {
            console.log(`Server address sent to client successfully: ${responseMessage}`);
            }
        });
    
    });
}

function getServerAddress() {
    const ifaces = os.networkInterfaces();
    
    // Rasberrypi
    for(let iface of Object.values(ifaces)) {
        for(let info of iface) {
                if(info.family === 'IPv4' && !info.internal) {
                    console.log(info.address);
                    return info.address;
                }
            }
    }
    
    
    // Window
    /*
    let address;

    Object.keys(ifaces).forEach((ifname) => {
        ifaces[ifname].forEach((iface) => {
            if(iface.family !== 'IPv4' || iface.internal !== false) {
                return;
            }

            if(ifname === 'Wi-Fi') {
                address = iface.address;
                return;
            }
        });
    });

    return address
    */
}

module.exports = {
    startBroadCast,
    getServerAddress
};
