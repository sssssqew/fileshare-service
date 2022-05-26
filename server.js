const express = require('express')
const app = express()
const http = require('http')
const path = require('path')

const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)

app.use(express.static(path.join(__dirname+'/public')))

io.on('connection', function(socket){
  socket.on('sender-join', function(data){ // sender join to Room
    socket.join(data.roomInfo['roomID']) 
  })
  socket.on('receiver-join', function(data){ // receiver join to Room
    if(io.sockets.adapter.rooms.get(data.roomID)){ // Room 이 존재하는 경우
      socket.join(data.roomID) 
      socket.to(data.roomID).emit('init', data.joinID) // sender 에게 room Info 요청
    }else{ // Room 이 존재하지 않은 경우
      socket.emit('room-not-valid', { msg: 'Room not Found !'}) // socket.emit 은 receiver-join 이벤트를 발송한 사람한테만 room-not-valid 이벤트를 전달함
    }
  })
  socket.on('room-info', function(data){ // socket.to 는 해당 방에서 room-info 이벤트를 발송한 사람을 제외한 모든 사람에게 receiver-roomInfo 메세지를 전달함
    socket.to(data.roomInfo['roomID']).emit('receive-roomInfo', data.roomInfo) // 해당 방에 속한(Sender 제외) 모든 receiver 에게 room info 전달
  })
  socket.on('file-meta', function(data){ // Sender에 접속한 모든 Receiver 에게 메타데이터 전송 
    socket.to(data.roomInfo['roomID']).emit('fs-meta', data.metadata) // receiver 로 파일 메타데이터 전송
  })
  socket.on('fs-start', function(data){ // Sender 에게 다음 chunk 를 보내줄것을 요청함 // 해당 room 에만 파일 데이터를 요청함
    socket.to(data.roomID).emit('fs-share-to-sender', {}) 
  })
  socket.on('file-raw', function(data){ // 해당 room 에 속한(Sender 제외) 모든 receiver 에게 파일 청크 전송
    socket.to(data.roomInfo['roomID']).emit('fs-share', data.buffer) 
  })
})

server.listen(5000)
