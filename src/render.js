const http = require('http');
const imageOperation = require('./image-operations');
const apiOperation = require('./api-operations');

class OnDestroyObject{
  constructor(controller){
    this.controller = controller
  }

  destroy(){
    this.controller.abort()
  }
}

const keyValueStore = new Map()

function cleanupContentPanel(){
  let element = document.getElementById("content")

  while(element.firstChild){
    removeElement(element.firstChild)
  }
}

function removeElement(element){
  while(element.firstChild){
    removeElement(element.firstChild)
  }

  if (element.nodeType===1 && element.hasAttribute("data-onDestroyObjectKey")===true){
    key = element.getAttribute("data-onDestroyObjectKey")
    const onDestroyObject = keyValueStore.get(key)
    onDestroyObject.destroy()
    keyValueStore.delete(key)
  }
  
  element.parentNode.removeChild(element)
}


function renderImageListHTML(){
 cleanupContentPanel()
 listContainerImages(renderContainerImageList)
}

function filterImageList(){
  const searchFilter = document.getElementById("imageSearch")
  if(searchFilter === null || searchFilter.value === ""){
    return
  }

  const table = document.getElementById("imageListTable")
  const rowList = table.getElementsByTagName("tr")

  const indexList = [0]

  for (let i = 0; i < rowList.length; i++) {

    const cellList = rowList[i].getElementsByTagName("td")
    
    for (let j = 0;j<indexList.length; j++){
      
      if (cellList[indexList[j]]) {
        if (cellList[indexList[j]].innerHTML.toLowerCase().indexOf(searchFilter.value.toLowerCase()) > -1) {
          rowList[i].style.display = ""
          break
        }
        rowList[i].style.display = "none"
      }
    }
  }
}

function clearImageFilter(){
  const table = document.getElementById("imageListTable")
  const rowList = table.getElementsByTagName("tr")

  for (let i = 0; i < rowList.length; i++) {      
          rowList[i].style.display = ""
  }
}

function renderContainerImageList(statusCode, responseBody){
  let div = document.createElement("div")
  let table = document.createElement("table")
  let tableHeader = document.createElement("thead")
  let firstRow = document.createElement("tr")

  const searchFeature = `<input type="text" id="imageSearch" style="width:60%;height:30px;margin:2%;border-radius: 8px">
  <button style="height:30px;margin:5px;border-radius: 5px" onclick="filterImageList()">Search</button>
  <button style="height:30px;margin:5px;border-radius: 5px" onclick="clearImageFilter()">Reset</button>`


  const headers = [{name:"RepoTags",width:400 },
                   {name: "Image ID", width: 600},
                   {name: "Creation Date", width:200}]

  headers.forEach(addHeaders)

  // function to create headers and add to the row
  function addHeaders(value){
    let header = document.createElement("th")
    header.style.width = value.width
    header.style.maxWidth = value.width
    header.innerHTML = value.name
    firstRow.appendChild(header)
    tableHeader.appendChild(firstRow)
  }
  
  table.appendChild(tableHeader)

  let tableBody = document.createElement("tbody")

  if (statusCode === 200){

    imageRecords = JSON.parse(responseBody)

    if(imageRecords.length > 0) {
      imageRecords.forEach(addRows)

      function addRows(imageRecord){
        let row = document.createElement("tr")
        row.style.height = 60
        imageRecord["RepoTags"].forEach(addCell)
      
        function addCell(repoTag){
          let imageName = ""
          let cell1 = document.createElement("td")
          cell1.style.maxWidth = 400
          cell1.style.width = 400
          cell1.style.direction = "rtl"
          
          if (repoTag === "<none>:<none>"){
            imageName = "none:none"
          }else{
            imageName = repoTag
          }

          cell1.innerHTML = imageName

          row.appendChild(cell1)

          let cell2 = document.createElement("td")
          cell2.style.maxWidth = 600
          cell2.style.width = 600
          cell2.style.textOverflow = "ellipsis"
          cell2.style.overflow = "hidden"
          cell2.innerHTML = imageRecord["Id"]
          row.appendChild(cell2)

          let cell3 = document.createElement("td")
          const date = new Date(1000* imageRecord["Created"])
          cell3.innerHTML = date.toLocaleString()
          cell3.style.width = 300
          cell3.style.maxWidth = 300

          row.appendChild(cell3)

          let cell4  = document.createElement("td")
          let runButton = document.createElement("button")
          runButton.textContent = "Run"
          runButton.onclick = function(){
            imageOperation.renderImageRunOperation(imageName)
          }
          
          cell4.appendChild(runButton)
          row.appendChild(cell4)
          
          // TODO: implement delete feature for images
          /*
          let cell5  = document.createElement("td")
          let deleteButton = document.createElement("button")
          deleteButton.textContent = "Delete"
          cell5.appendChild(deleteButton)
          row.appendChild(cell5)
          */
          
          tableBody.appendChild(row)

        }

      }

    }
  }

  table.id = "imageListTable"

  table.appendChild(tableBody)
  div.appendChild(table)
  div.className= "image-list-div"


  let element = document.getElementById("content")

  const filterDiv = document.createElement("div")
  filterDiv.innerHTML = searchFeature

  element.appendChild(filterDiv)
  element.appendChild(div)

}

function listContainerImages(renderContainerImageList){
  const imageListAPI= '/v1.41/images/json?all=0s'

  const options = {
    socketPath: '/var/run/docker.sock',
    path: imageListAPI,
  };
  
  const callback = res => {
  res.setEncoding('utf8');

  function render(data){
    renderContainerImageList(res.statusCode, data)
  }

  let respBodyData = ''

  res.on('data', data => respBodyData+=data);
  res.on('end', function(){render(respBodyData)})
  res.on('error', data => console.error("error occurred while getting image list"));
  };

  const clientRequest = http.request(options, callback);
  clientRequest.end();
}

const containerListHTML = `<input type="text" id="containerSearch" style="width:60%;height:30px;margin:2%;border-radius: 8px">
<button style="height:30px;margin:5px;border-radius: 5px" onclick="filterTable()">Search</button>
<button style="height:30px;margin:5px;border-radius: 5px" onclick="clearFilter()">Reset</button>
<div class=container-list-div>
  <table id="containerListTable">
    <tr>
      <th style="width:200px;width:200px;min-width:200px">Container Name</th>
      <th style="width:500px;max-width:500px;min-width:500px">Container ID</th>
      <th style="width:200px;max-width:200px;min-width:200px">Image</th>
      <th style="width:80px;max-width:80px;min-width:80px">Status</th>
    </tr>
  </table>
</div>
`

function filterTable(){
  const searchFilter = document.getElementById("containerSearch")
  if(searchFilter === null || searchFilter.value === ""){
    return
  }

  const table = document.getElementById("containerListTable")
  const rowList = table.getElementsByTagName("tr")

  const indexList = [0,2]

  for (let i = 0; i < rowList.length; i++) {

    const cellList = rowList[i].getElementsByTagName("td")
    
    for (let j = 0;j<indexList.length; j++){
      
      if (cellList[indexList[j]]) {
        if (cellList[indexList[j]].innerHTML.toLowerCase().indexOf(searchFilter.value.toLowerCase()) > -1) {
          rowList[i].style.display = ""
          break
        }
        rowList[i].style.display = "none"
      }
    }
  }  
}

function clearFilter(){
  const table = document.getElementById("containerListTable")
  const rowList = table.getElementsByTagName("tr")

  for (let i = 0; i < rowList.length; i++) {
          rowList[i].style.display = ""
  }
}

function addContainersToTable(containerList){
  let table = document.getElementById("containerListTable")
  parentElement = table.parentNode

  let containerMap = new Map()
  const attributes = [
    {'name':'Id', 'attribute':['Id'],'width':'500px', 'direction': 'ltr'},
    {'name':'Image', 'attribute':['Image'],'width':'200px','direction': 'rtl'},
    {'name':'State', 'attribute': ['State'],'width':'80px','direction': 'ltr'},
    {'name':'Name', 'attribute': ['Names'],'width':'200px','direction': 'ltr','overflow':'hidden', 'textOverflow':'ellipsis'}
  ]

  for (let i=0; i<containerList.length;i++){
    addContainerTableRow(containerList[i], table, containerMap, attributes)
  }

  const controller = new AbortController()

  const onDestroyObject = new OnDestroyObject(controller)

  const key = 'containerListTable-'+Date.now()+'-'+Math.random().toString(36)

  table.setAttribute("data-onDestroyObjectKey", key)
  
  keyValueStore.set(key, onDestroyObject)

  apiOperation.MonitorContainerEvents(table, containerMap, updateContainerStatus, addContainerTableRow, controller)
}

function getAttributeInfo(attributeMetadata, attributeName){
  for(let i=0;i<attributeMetadata.length; i++){
    if(attributeMetadata[i]['name'] === attributeName){
      return attributeMetadata[i]
    }
  }

  return undefined 
}

function getAttributeValue(jsonData, attributeMetadata, attributeName){
  let attributeData = getAttributeInfo(attributeMetadata, attributeName)
  if(attributeData === undefined){
    return undefined
  }

  let value = jsonData
  for(let i=0;i<attributeData['attribute'].length; i++){
    value = value[attributeData['attribute'][i]]
  }

  return value
}


function addContainerTableRow(container, table, containerMap, attributeMetadata){

  const nameAttributeInfo = getAttributeInfo(attributeMetadata, 'Name')
  if(nameAttributeInfo === undefined){
    console.log("could not find metadata for name")
    return
  }

  let nameValue = getAttributeValue(container, attributeMetadata, 'Name')
  if(nameValue === undefined){
    console.log("could not extract container name")
    return
  }

  if(Array.isArray(nameValue) == true){
    nameValue = nameValue.join(", ")
  }


  let row = document.createElement("tr")
  let containerNameCell = document.createElement("td")
  containerNameCell.style.width = nameAttributeInfo['width']
  containerNameCell.style.maxWidth = nameAttributeInfo['width']
  containerNameCell.style.minWidth = nameAttributeInfo['width']
  containerNameCell.style.textOverflow = nameAttributeInfo['textOverflow']
  containerNameCell.style.overflow = nameAttributeInfo['overflow']
  containerNameCell.innerHTML = nameValue
  row.appendChild(containerNameCell)
  
  let statusCell
  attributeMetadata.forEach(metadata =>{
    if(metadata['name']==='Name'){
      return
    }

    const attributeInfo = getAttributeInfo(attributeMetadata, metadata['name'])
    if(attributeInfo === undefined){
      console.log("could not find metadata for %s", metadata['name'])
      return
    }

    let attributeValue = getAttributeValue(container, attributeMetadata, metadata['name'])
    if(attributeValue === undefined){
      console.log("could not extract container %s", metadata['name'])
      return
    }

    let cell = document.createElement('td')
    cell.style.width = attributeInfo['width']
    cell.style.maxWidth = attributeInfo['width']
    cell.style.minWidth = attributeInfo['width']
    cell.style.textOverflow = "ellipsis"
    cell.style.overflow = "hidden"
    cell.style.direction = attributeInfo['direction']
    cell.innerHTML = attributeValue
    row.appendChild(cell)
    if(attributeInfo['name']==="State"){
      statusCell = cell
    }
  })

  const containerID = getAttributeValue(container, attributeMetadata, 'Id')
  if(containerID===undefined){
    console.log("unable to extract container ID")
    return
  }

  const containerStatus = getAttributeValue(container, attributeMetadata, 'State')
  if(containerStatus === undefined){
    console.log("unable to extract container status")
    return
  }

  containerMap.set(containerID, {
    'row': row,
    'eventTimestamp': 0
  })

  let startButton = document.createElement("button")
  startButton.innerHTML = "Start"
  startButton.style.marginRight = "5px"
  
  let stopButton = document.createElement("button")
  stopButton.innerHTML = "Stop"
  stopButton.style.marginRight = "5px"
  
  let deleteButton = document.createElement("button")
  deleteButton.innerHTML = "Delete"
  
  startButton.onclick = function(){apiOperation.StartContainer(updateContainerStatus, containerID, statusCell, startButton, stopButton, deleteButton, row, containerMap)}
  stopButton.onclick=function(){apiOperation.StopContainer(updateContainerStatus, containerID, statusCell, startButton, stopButton, deleteButton,row, containerMap)}
  deleteButton.onclick = function(){apiOperation.DeleteContainer(updateContainerStatus, containerID, statusCell, startButton, stopButton, deleteButton, row, containerMap)}
  
  if (containerStatus != 'exited'){
    startButton.disabled = true
  }

  if (containerStatus != 'running'){
    stopButton.disabled = true
  }
  
  if (containerStatus != 'exited'){
    deleteButton.disabled = true
  }

  row.appendChild(startButton)
  row.appendChild(stopButton)
  row.appendChild(deleteButton)
  
  table.appendChild(row)
}

function renderContainerList(){
  cleanupContentPanel()
  let element = document.getElementById("content")
  element.innerHTML = containerListHTML
  apiOperation.ListAndRenderContainers(addContainersToTable)
}

function updateContainerStatus(statusCode, status, cell, row, startButton, stopButton, deleteButton){
  if(statusCode === 404){
      row.parentNode.removeChild(row)
  }else if(statusCode === 200){
      cell.innerHTML = status
      if(status === 'running'){
        startButton.disabled = true
        stopButton.removeAttribute("disabled")
        deleteButton.disabled = true
      }else if(status === 'exited'){
        startButton.removeAttribute("disabled")
        stopButton.disabled = true
        deleteButton.removeAttribute("disabled")
      }else{
        startButton.disabled = true
        stopButton.disabled = true
        deleteButton.disabled = true
      }
  }
}