// helper functions
function generateRandomNumber(n){
  return Math.trunc(Math.random()*n)
}
function generateRoomID(){
  return `${generateRandomNumber(999)}-${generateRandomNumber(999)}-${generateRandomNumber(999)}`
}
function isFileTransfferDone(fileId){
  return fileId.transmited == fileId.metadata.fileSize
}
function sliceBuffer(buffer, start, end){
  return buffer.slice(start, end)
}

// DOM manipulation functions
function displayFileListScreen(){
  document.querySelector('.join-screen').classList.remove('active')
  document.querySelector('.fs-screen').classList.add('active')
}
function displayRoomInformation(roomInfo){
  const roomTitle = document.querySelector('.title') 
  roomTitle.innerText = `Room: ${roomInfo['roomName']} (${roomInfo['roomID']})` 
}
function displayFileshareInfo(filename){
  let el = document.createElement('div') 
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

// specific functions
function fetchFile(reader, file, shareFile){
  const buffer = new Uint8Array(reader.result) // 0~255 사이의 숫자를 요소로 가지는 배열
  console.log(buffer)
  const progressNodes = displayFileshareInfo(file.name)
  console.log('nodes', progressNodes)

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

