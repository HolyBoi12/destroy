const express = require('express');
const path = require('path')
const http = require('http')
const PORT = process.env.PORT || 3000
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// Set static folder
app.use(express.static(path.join(__dirname, "public")))

//start sever
server.listen(PORT, () => console.log(`server running on pot ${PORT}`))

//handlde a socket

const connections = [null, null]
io.on('connection', socket => {
    // console.log('New Ws Connection')

    //find an avalibl
    let playerIndex = -1;
    for (const i in connections) {
        if(connections[i] === null) {
            playerIndex = i
            break
        }
    }



    //tell conneting
    socket.emit('player-number', playerIndex)

    console.log(`Player ${playerIndex} has connected`) 

    //ignore 3
    if(playerIndex === -1) return

    connections[playerIndex] = false
    //tell every one
    socket.broadcast.emit('player-connection', playerIndex)

    //handle disconnect
    socket.on('disconnect', () => {
        console.log(`player ${playerIndex} disconnected`)
        connections[playerIndex] = null
        //tell everyone who left
        socket.broadcast.emit('player-connection', playerIndex)
    })

    //on ready
    socket.on('player-ready', () => {
        socket.broadcast.emit('enemy-ready', playerIndex)
        connections[playerIndex] = true
    })
    //check player connections
    socket.on('check-players', () => {
        const players = []
        for(const i in connections) {
            connections[i] === null ? players.push({connected: false, ready: false}) :
            players.push({connected: true, ready: connections[i]})
        }
        socket.emit('check-players', players)
    })

    //on fire recived
    socket.on('fire', id => {
        console.log(`Shot fired from ${playerIndex} `, id)

        //emit the attack to the other player
        socket.broadcast.emit('fire', id)
    })

    //on fire reply
    socket.on('fire-reply', square => {
        console.log(square)

        //forward the reply to other player
        socket.broadcast.emit('fire-reply', square)
    })
    //time out
    setTimeout(() => {
        connections[playerIndex] = null
        socket.emit('timeout')
        socket.disconnect()
    }, 600000) //ten minute limit
})