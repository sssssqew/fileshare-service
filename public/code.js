(function(){
  const roomInfo = {}
  const socket = io()
  
  document.querySelector('#create-room-btn').addEventListener('click', function(){
    const roomName = document.querySelector('.room-name')
    roomInfo['roomID'] = generateRoomID()
    roomInfo['roomName'] = roomName.value 
    roomName.classList.add('hide')
    displayRoomId(roomInfo['roomID'])
    displayRoomInformation(roomInfo)
    socket.emit('sender-join', { roomInfo }) // 1. 소켓에 sender ID 등록
  })
  socket.on('init', function(joinID){ // 3. receiver ID 저장 및 파일 업로드 화면 보여주기
    console.log("Receiver ID: ", joinID)
    displayFileListScreen()
    socket.emit('room-info', { roomInfo }) // 전체 수신자에게 room info 전송
  })
  document.querySelector('#file-input').addEventListener('change', function(e){ // 파일 업로드시 
    let files = e.target.files
    if(files.length === 0) return 
    Array.from(files).forEach(file => readUploadedFile(file, shareFile))
  })
  function shareFile(metadata, buffer, { progressNode, progressbarNode }){
    console.log('업로드 완료', metadata)
    socket.emit('file-meta', { roomInfo, metadata }) // 4. receiver 에게 파일 메타데이터 전송하기

    const { fileId, fileSize, chunkSize } = metadata
   
    // 파일전송이 진행중인 경우 반복적으로 실행되면서 계속 파일 청크를 전송함
    socket.on('fs-share-to-sender', function(){ // 7. receiver로부터 파일 청크를 보내줄것을 요청받고 파일에서 chunk 만큼 추출하기
      const chunk = sliceBuffer(buffer, 0, chunkSize) // 파일에서 청크(1024바이트)를 추출함
      buffer = sliceBuffer(buffer, chunkSize, buffer.length) // 파일에서 청크를 제외한 데이터를 다시 buffer 로 설정함
      
      const progress = Math.trunc((fileSize - buffer.length) / fileSize * 100) + '%'
      progressNode.innerText = progress  
      progressbarNode.style.width = progress 
     
      if(chunk.length !== 0){
        socket.emit('file-raw', { // 8. receiver 에게 청크 전달하기 (어느 파일의 청크인지 구분하기 위하여 File ID 값도 함께 전달)
          roomInfo,
          buffer: { fileId, chunk }
        })
      }
    })
  }
})()