const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 8720;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

io.on('connection', (socket) => {
    console.log('HomeServer connected');

    socket.on('disconnect', () => {
        console.log('HomeServer disconnected');
    });

    
});

http.listen(PORT, () => {
    console.log(`listening on *:${PORT}`);
});