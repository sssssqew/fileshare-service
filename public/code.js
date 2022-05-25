(function(){
  let receiverID
  let roomInfo = {}
  const socket = io()

  function generateID(){
    return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`
  }
  document.querySelector('#sender-start-con-btn').addEventListener('click', function(){
    roomInfo['roomID'] = generateID()
    roomInfo['roomName'] = document.querySelector('.form-input .room-name').value 
    document.querySelector('.form-input .room-name').style.display = 'none'
    document.querySelector('#join-id').innerHTML = `
      <b>Room ID</b>
      <span>${roomInfo['roomID']}</span>
    `
    const roomTitle = document.querySelector('.files-list .title') // Room ID 표시
    roomTitle.innerText = `Shared files: ${roomInfo['roomName']} (${roomInfo['roomID']})` 

    socket.emit('sender-join', { // 1. 소켓에 sender ID 등록
      roomInfo
    })
  })
  socket.on('init', function(uid){ // 3. receiver ID 저장 및 파일 업로드 화면 보여주기
    console.log("Receiver ID: ", uid)
    receiverID = uid // TODO: receiver ID 목록 저장하기
    document.querySelector('.join-screen').classList.remove('active')
    document.querySelector('.fs-screen').classList.add('active')

    socket.emit('room-info', {
      roomInfo
    }) // 전체 수신자에게 room info 전송
    
  })
  document.querySelector('#file-input').addEventListener('change', function(e){ // 파일 업로드시 
    let files = e.target.files

    for(let file of files){

      if(!file) return 
      let reader = new FileReader()
      reader.onload = function(e){
        let buffer = new Uint8Array(reader.result) // 0~255 사이의 숫자를 요소로 가지는 배열
        console.log(buffer)

        let el = document.createElement('div') // 화면에 업로드한 파일정보 표시하기 
        el.classList.add('item')
        el.innerHTML = `
          <div class="progress">0%</div>
          <div class="progress-bar">
            <div class="bar"></div>
          </div>
          <div class="filename">${file.name}</div>
        `
        document.querySelector('.files-list').appendChild(el)
        
        shareFile({
          fileId: uuidv4(), // File ID (고유한 UUID)
          filename: file.name,
          total_buffer_size: buffer.length, 
          buffer_size: 1024 // chunk size 
        }, buffer, el.querySelector('.progress'), el.querySelector('.progress-bar .bar'))
      }
      reader.readAsArrayBuffer(file) // array buffer 형식으로 파일 읽기 
    }
    
  })
  function shareFile(metadata, buffer, progress_node, progressbar_node){
    console.log('업로드 완료', metadata)
    socket.emit('file-meta', { // 4. receiver 에게 파일 메타데이터 전송하기
      roomInfo, // TODO: Receiver ID 목록 전달하기
      metadata: metadata,
    })
   
    // 파일전송이 진행중인 경우 반복적으로 실행되면서 계속 파일 청크를 전송함
    socket.on('fs-share-to-sender', function(){ // 7. receiver로부터 파일 청크를 보내줄것을 요청받고 파일에서 chunk 만큼 추출하기
      let chunk = buffer.slice(0, metadata.buffer_size) // 파일에서 1024 바이트씩 끊어서 추출함
      // console.log(metadata.filename, ': ', chunk)
      buffer = buffer.slice(metadata.buffer_size, buffer.length) // 파일에서 청크를 제외한 나머지 데이터를 다시 buffer 로 설정함
      const progress = Math.trunc((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100) + '%'
      progress_node.innerText = progress  // 현재진행률
      progressbar_node.style.width = progress 
      // console.log('전송 진행률: ', progress)
      if(chunk.length != 0){
        socket.emit('file-raw', { // 8. receiver 에게 청크 전달하기 (어느 파일의 청크인지 구분하기 위하여 File ID 값도 함께 전달)
          roomInfo,
          buffer: {fid: metadata.fileId, chunk}
        })
      }
    })
  }
})()