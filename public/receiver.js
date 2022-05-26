(function(){
  let roomID
  const socket = io()

  document.querySelector('#receiver-join-btn').addEventListener('click', function(){
    roomID = document.querySelector('#join-id').value
    if(roomID.length === 0) return 

    const joinID = generateRoomID() 

    socket.emit('receiver-join', { joinID, roomID }) // 2. 소켓에 receiver ID 등록
    displayFileListScreen()
  })
  socket.on('receive-roomInfo', function(roomInfo){
    displayRoomInformation(roomInfo)
  })

  const sharedFiles = [] 
  socket.on('fs-meta', function(metadata){ // 5. 송신자로부터 전달받은 메타데이터를 sharedFiles 배열에 담기 
    console.log('전달받은 파일 메타데이터', metadata)

    const { fileId, fileName } = metadata

    sharedFiles[fileId] = {}
    sharedFiles[fileId].metadata = metadata
    sharedFiles[fileId].transmited = 0
    sharedFiles[fileId].buffer = []

    const { progressNode, progressbarNode } = displayFileshareInfo(fileName)

    sharedFiles[fileId].progressNode = progressNode
    sharedFiles[fileId].progressbarNode = progressbarNode

    socket.emit('fs-start', { roomID }) // 6. sender 에게 파일 청크 요청하기
  })
  
  // 파일 전송이 진행중인 경우 반복적으로 실행되는 코드블록 
  socket.on('fs-share', function(buffer){ // 9. sender 로부터 파일 청크(1024바이트)를 전달받기
    const { fileId, chunk } = buffer
    sharedFiles[fileId].buffer.push(chunk) // 버퍼에 파일 청크 추가하기
    sharedFiles[fileId].transmited += chunk.byteLength 

    const progress = Math.trunc(sharedFiles[fileId].transmited / sharedFiles[fileId].metadata.fileSize * 100) + '%'
    sharedFiles[fileId].progressNode.innerText = progress
    sharedFiles[fileId].progressbarNode.style.width = progress

    if(sharedFiles[fileId].transmited == sharedFiles[fileId].metadata.fileSize){ // 송신자로부터 수신자에게 파일 데이터 전송이 완료된 경우
      download(new Blob(sharedFiles[fileId].buffer), sharedFiles[fileId].metadata.fileName) // 파일 다운로드 실행
      sharedFiles[fileId] = {} // 해당 파일정보 초기화하기 
    }else{
      socket.emit('fs-start', { roomID }) // 10. 현재 파일전송이 진행중인 경우 sender 에게 다음 파일청크를 보내달라고 요청하기
    }
  })
})()