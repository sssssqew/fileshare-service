(function(){
  let roomID
  let roomInfo
  const socket = io()

  document.querySelector('#receiver-join-btn').addEventListener('click', function(){
    roomID = document.querySelector('#join-id').value
    if(roomID === ''){
      alert('Please give Room ID ...')
      return 
    }
    const joinID = generateRoomID() 
    socket.emit('receiver-join', { joinID, roomID }) // 2. 소켓에 receiver ID 등록
    displayFileListScreen()
  })
  socket.on('room-not-valid', function({ msg }){ // 요청한 방이 존재하지 않는 경우
    alert(msg)
    HideFileListScreen()
    document.querySelector('#join-id').value = ''
  })
  socket.on('receive-roomInfo', function(roomInfoReceived){
    roomInfo = roomInfoReceived // 파일을 전송하기 위하여 roomInfo 저장
    displayRoomInformation(roomInfo, 'list_alt')
  })

  // TODO : 파일 송신부 작성하기 
  document.querySelector('#file-input').addEventListener('change', function(e){ // 파일 업로드시 
    let files = e.target.files
    if(files.length === 0) return 
    Array.from(files).forEach(file => readUploadedFile(file, shareFile))
  })
  function shareFile(metadata, buffer, { progressNode, progressbarNode }){
    console.log('업로드 완료', metadata)
    console.log('room info: ', roomInfo)
    socket.emit('file-meta', { roomInfo, metadata }) // 4. sender 에게 파일 메타데이터 전송하기

    const { fileId, fileSize, chunkSize } = metadata

    // 파일전송이 진행중인 경우 반복적으로 실행되면서 계속 파일 청크를 sender에게 전송함
    socket.on('fs-share-to-sender', function(){ // 7.  파일에서 chunk 만큼 추출하기
      const { chunk, bufferUpdated } = getChunk(buffer, chunkSize) // 파일에서 청크를 제외한 데이터를 다시 buffer 로 설정함  
      updateProgress(fileSize - bufferUpdated.length, fileSize, progressNode, progressbarNode)
      buffer = bufferUpdated // 버퍼 업데이트 
      
      if(chunk.length !== 0){
        socket.emit('file-raw', { // 8. sender 에게 청크 전달하기 (어느 파일의 청크인지 구분하기 위하여 File ID 값도 함께 전달)
          roomInfo,
          buffer: { fileId, chunk }
        })
      }
    })
  }


  // 파일 수신부
  const sharedFiles = [] 
  socket.on('fs-meta', function(metadata){ // 5. 송신자로부터 전달받은 메타데이터를 sharedFiles 배열에 담기 
    console.log('전달받은 파일 메타데이터', metadata)

    const { fileId, fileName } = metadata
    const { progressNode, progressbarNode } = displayFileshareInfo(fileName, 'download')
    sharedFiles[fileId] = initializeFileInfo(metadata, progressNode, progressbarNode)
    
    socket.emit('fs-start', { roomID }) // 6. sender 에게 파일 청크 요청하기
  })
  
  // 파일 전송이 진행중인 경우 반복적으로 실행되면서 계속 파일 청크를 수신받음
  socket.on('fs-share', function(buffer){ // 9. sender 로부터 파일 청크 전달받기
    const { fileId, chunk } = buffer
    let fileInfo = sharedFiles[fileId] 
    fileInfo.buffer.push(chunk) 
    fileInfo.transmited += chunk.byteLength 
    
    const { transmited, metadata, progressNode, progressbarNode } = fileInfo
    updateProgress(transmited, metadata.fileSize, progressNode, progressbarNode)

    if(transmited === metadata.fileSize){ // 파일 전송이 완료된 경우
      download(new Blob(fileInfo.buffer), metadata.fileName) 
      fileInfo = {} // 파일정보 초기화하기 
    }else{
      socket.emit('fs-start', { roomID }) // 10. 파일전송이 진행중인 경우 다음 청크를 보내달라고 송신자에게 요청하기
    }
  })
})()