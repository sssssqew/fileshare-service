window.viewType = 'table_view' // 사용자가 선택한 view type 을 기억했다가 파일을 새로 업로드할때 view type 에 따라 아이템을 다르게 생성함

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
function getChunk(buffer, chunkSize){
  const chunk = sliceBuffer(buffer, 0, chunkSize) 
  const bufferUpdated = sliceBuffer(buffer, chunkSize, buffer.length)
  return { chunk, bufferUpdated }
}
function storeRoomInfo(roomID, roomName){
  return { roomID, roomName }
}
function initializeFileInfo(metadata, progressNode, progressbarNode){
  return {
    metadata,
    transmited: 0,
    buffer: [],
    progressNode,
    progressbarNode
  }
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
function toggleView(e, roomInfo){
    const viewType = e.target.innerText === 'table_view' ? 'list_alt' : 'table_view'
    window.viewType = e.target.innerText === 'table_view' ? 'table_view' : 'list_alt'
    displayRoomInformation(roomInfo, viewType)

    const filesList = document.querySelector('.files-list')
    filesList.classList.toggle('active')

    const items = filesList.querySelectorAll('.files-list .item')
    for(let item of items){
      const progress = item.querySelector('.progress')
      const progressbar = item.querySelector('.progress-bar')
      const icon = item.querySelector('.material-icons')
      const filename = item.querySelector('.filename')

      item.classList.toggle('active')
      progress.classList.toggle('active')
      progressbar.classList.toggle('active')
      icon.classList.toggle('active')
      filename.classList.toggle('active')
    }
}
function displayRoomInformation(roomInfo, viewType){
  const roomTitle = document.querySelector('.title') 
  roomTitle.innerHTML = `
    <span><i class="material-icons">chalet</i> ${roomInfo['roomName']} (${roomInfo['roomID']})</span>
    <i class="material-icons view-type ${viewType}">${viewType}</i>
  ` 
  roomTitle.querySelector('.view-type').addEventListener('click', (e) => toggleView(e, roomInfo))
}
function buildFileItem(viewType, transferType, filename){
  const el = document.createElement('div') 
  const checkViewType = viewType === 'list_alt'
  el.className = checkViewType ? 'item active' : 'item'
  el.innerHTML = `
    <i class="material-icons ${transferType} ${checkViewType && 'active'}">${transferType}</i>
    <div class="progress ${checkViewType && 'active'}">0%</div>
    <div class="progress-bar ${checkViewType && 'active'}">
      <div class="bar"></div>
    </div>
    <div class="filename ${checkViewType && 'active'}">${filename}</div>
  `
  return el 
}
function displayFileshareInfo(filename, transferType){
  const fileItem = buildFileItem(window.viewType, transferType, filename)
  document.querySelector('.files-list').appendChild(fileItem)
  return { progressNode: fileItem.querySelector('.progress'), progressbarNode: fileItem.querySelector('.progress-bar .bar') }
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
  const progressNodes = displayFileshareInfo(file.name, 'send')

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

