(function(){
  let senderID
  const socket = io()

  function generateID(){
    return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`
  }
  document.querySelector('#receiver-start-con-btn').addEventListener('click', function(){
    senderID = document.querySelector('#join-id').value
    if(senderID.length === 0) return 

    let joinID = generateID() 
    socket.emit('receiver-join', { // 2. 소켓에 receiver ID 등록
      uid: joinID,
      sender_uid: senderID
    })
    document.querySelector('.join-screen').classList.remove('active')
    document.querySelector('.fs-screen').classList.add('active')
  })

  let sharedFiles = [] 
  socket.on('fs-meta', function(metadata){ // 5. 송신자로부터 전달받은 메타데이터를 sharedFiles 배열에 담기 
    console.log('전달받은 파일 메타데이터', metadata)

    sharedFiles[metadata.fileId] = {}
    sharedFiles[metadata.fileId].metadata = metadata
    sharedFiles[metadata.fileId].transmited = 0
    sharedFiles[metadata.fileId].buffer = []

    let el = document.createElement('div') // 화면에 sender가 공유한 파일정보 표시하기 
    el.classList.add('item')
    el.innerHTML = `
      <div class="progress">0%</div>
      <div class="progress-bar">
        <div class="bar"></div>
      </div>
      <div class="filename">${metadata.filename} (File ID - ${metadata.fileId})</div>
    `
    document.querySelector('.files-list').appendChild(el)
    sharedFiles[metadata.fileId].progress_node = el.querySelector('.progress')
    sharedFiles[metadata.fileId].progressbar_node = el.querySelector('.progress-bar .bar')

    socket.emit('fs-start', { // 6. sender 에게 파일 청크 요청하기
      uid: senderID
    })
  })
  
  // 파일 전송이 진행중인 경우 반복적으로 실행되는 코드블록 

  // buffer : {fid: metadata.fileId, chunk}
  socket.on('fs-share', function(buffer){ // 9. sender 로부터 파일 청크(1024바이트)를 전달받기
    const { fid, chunk } = buffer
    sharedFiles[fid].buffer.push(chunk) // 버퍼에 파일 청크 추가하기
    sharedFiles[fid].transmited += chunk.byteLength 

    const progress = Math.trunc(sharedFiles[fid].transmited / sharedFiles[fid].metadata.total_buffer_size * 100) + '%'
    sharedFiles[fid].progress_node.innerText = progress
    sharedFiles[fid].progressbar_node.style.width = progress

    // console.log('전달받은 실제 데이터', sharedFiles[fid].buffer)
    if(sharedFiles[fid].transmited == sharedFiles[fid].metadata.total_buffer_size){ // 송신자로부터 수신자에게 파일 데이터 전송이 완료된 경우
      // console.log('blob 데이터: ', new Blob(sharedFiles[fid].buffer))
      download(new Blob(sharedFiles[fid].buffer), sharedFiles[fid].metadata.filename) // 파일 다운로드 실행
      sharedFiles[fid] = {} // 해당 파일정보 초기화하기 
    }else{
      socket.emit('fs-start', { // 10. 현재 파일전송이 진행중인 경우 sender 에게 다음 파일청크를 보내달라고 요청하기
        uid: senderID
      })
    }
  })
})()