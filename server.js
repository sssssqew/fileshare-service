const express = require('express')
const app = express()
const http = require('http')
const path = require('path')

const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

app.use(express.static(path.join(__dirname+'/public')))

io.on('connection', function(socket){
  socket.on('sender-join', function(data){ // sender ID 등록
    socket.join(data.roomInfo['roomID']) 
    console.log("sender: ", socket.rooms)
    console.log("sender: ", socket.id) // 방을 개설할때마다 소켓 ID 는 다름
  })
  socket.on('receiver-join', function(data){ // receiver ID 등록
    socket.join(data.roomID) 
    console.log("receiver: ", socket.rooms)
    console.log("sender: ", socket.id)
    socket.to(data.roomID).emit('init', data.uid) // sender 에게 room Info 요청
  })
  socket.on('room-info', function(data){
    console.log('room info: ', data.roomInfo)
    socket.to(data.roomInfo['roomID']).emit('receive-roomInfo', data.roomInfo) // 해당 방에 속한(sender 제외) 모든 receiver 에게 room info 전달
  })
  socket.on('file-meta', function(data){
    console.log('data: ', data)
    // TODO: Sender에 접속한 모든 Receiver 에게 메타데이터 전송 
    socket.to(data.roomInfo['roomID']).emit('fs-meta', data.metadata) // receiver 로 파일 메타데이터 전송
  })
  // 해당 room 에만 파일 데이터를 요청함
  socket.on('fs-start', function(data){ // 수신자로부터 다음 chunk 를 보내줄것을 송신자에게 요청
    socket.to(data.roomID).emit('fs-share-to-sender', {}) 
  })
  socket.on('file-raw', function(data){ // 해당 room 에 속한(sender 제외) 모든 receiver 에게 파일 청크 전송
    socket.to(data.roomInfo['roomID']).emit('fs-share', data.buffer) // data.uid : 수신자 ID / 수신자에게 파일 청크(1024바이트) 전송
  })
})

server.listen(5000)
