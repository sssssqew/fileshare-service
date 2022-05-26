// helper functions
function generateRandomNumber(n){
  return Math.trunc(Math.random()*n)
}
function generateRoomID(){
  return `${generateRandomNumber(999)}-${generateRandomNumber(999)}-${generateRandomNumber(999)}`
}
function sliceBuffer(buffer, start, end){
  return buffer.slice(start, end)
}
function storeRoomInfo(roomID, roomName){
  return { roomID, roomName }
}

// DOM manipulation functions
function displayFileListScreen(){
  document.querySelector('.join-screen').classList.remove('active')
  document.querySelector('.fs-screen').classList.add('active')
}
function HideFileListScreen(){
  document.querySelector('.fs-screen').classList.remove('active')
  document.querySelector('.join-screen').classList.add('active')
}
function displayRoomId(roomId){
  document.querySelector('#join-id').innerHTML = `
    <b>Room ID</b>
    <span>${roomId}</span>
  `
}
function displayRoomInformation(roomInfo){
  const roomTitle = document.querySelector('.title') 
  roomTitle.innerText = `Room: ${roomInfo['roomName']} (${roomInfo['roomID']})` 
}
function displayFileshareInfo(filename){
  const el = document.createElement('div') 
  el.classList.add('item')
  el.innerHTML = `
    <div class="progress">0%</div>
    <div class="progress-bar">
      <div class="bar"></div>
    </div>
    <div class="filename">${filename}</div>
  `
  document.querySelector('.files-list').appendChild(el)
  return { progressNode: el.querySelector('.progress'), progressbarNode: el.querySelector('.progress-bar .bar') }
}
function updateProgress(transmited, totalSize, progressNode, progressbarNode){
  const progress = Math.trunc(transmited / totalSize * 100) + '%'
  progressNode.innerText = progress
  progressbarNode.style.width = progress
}

// specific functions
function fetchFile(reader, file, shareFile){
  const buffer = new Uint8Array(reader.result) // 0~255 사이의 숫자를 요소로 가지는 배열
  console.log(buffer)
  const progressNodes = displayFileshareInfo(file.name)

  shareFile({
    fileId: uuidv4(), // File ID (UUID)
    fileName: file.name,
    fileSize: buffer.length, // File total size 
    chunkSize: 1024 // chunk size 
  }, buffer, progressNodes)
}
function readUploadedFile(file, shareFile){
  const reader = new FileReader()
  reader.addEventListener('loadend', (e) => fetchFile(reader, file, shareFile))
  reader.readAsArrayBuffer(file) // array buffer 형식으로 파일 읽기 
}

