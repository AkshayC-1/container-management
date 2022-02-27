const http = require("http")

module.exports = {
    CreateContainer:CreateContainer,
    ListAndRenderContainers:listAndRenderContainers,
    StopContainer:StopContainer,
    StartContainer:StartContainer,
    DeleteContainer:DeleteContainer,
    MonitorContainerEvents:MonitorContainerEvents
}


function CreateContainer(containerName,payload){
    let api = ""

    if(containerName.length > 0){
        api = `/v1.41/containers/create?name=${containerName}`
    }else{
        api = '/v1.41/containers/create'
    }

    const data = new TextEncoder().encode(
        JSON.stringify(payload)
    )

    const options = {
        socketPath: '/var/run/docker.sock',
        path: api,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
      };

    const callback = res => {
        res.setEncoding('utf8')
        switch(res.statusCode){
            case 201:
                break;
            case 404:
                alert("Image Not Found");
                return
            case 400:
                alert("Invalid data provided");
                return
            case 500:
                alert("Something Went Wrong");
                return 
        }

        let respBodyData = ''

        res.on('data', data => respBodyData+=data);
        res.on('end', function(){
            if (res.statusCode === 201){
                const containerID = JSON.parse(respBodyData)['Id']
                startContainer(containerID)
            }
        })
        res.on('error', data => console.log(data))

    };

    const clientRequest = http.request(options, callback);
    clientRequest.write(data)
    clientRequest.end();
}


function startContainer(containerID){
    let api = `/v1.41/containers/${containerID}/start`

    const options = {
        socketPath: '/var/run/docker.sock',
        path: api,
        method: 'POST',
      };

    const callback = res => {
        res.setEncoding('utf8')
        switch(res.statusCode){
            case 204:
                break;
            case 304:
                alert("Image Already Started");
                break;
            case 404:
                alert("Image not available for starting");
                break;
            case 500:
                alert("Something Went Wrong");
                break; 
        }
    }

    const clientRequest = http.request(options, callback);
    clientRequest.end();
}

function listAndRenderContainers(renderFunction){
    let api = '/v1.41/containers/json?all=true'

    const options = {
        socketPath: '/var/run/docker.sock',
        path: api,
        method: 'GET'
      };

    const callback = res => {
        res.setEncoding('utf8')
        switch(res.statusCode){
            case 200:
                break;
            case 400:
                alert("Bad Request");
                return
            case 500:
                alert("Something Went Wrong");
                return 
        }

        let respBodyData = ''

        res.on('data', data => respBodyData+=data);
        res.on('end', function(){
            if (res.statusCode === 200){
                const jsonData = JSON.parse(respBodyData)
                renderFunction(jsonData)
            }
        })
        res.on('error', data => console.log(data))

    };

    const clientRequest = http.request(options, callback);
    clientRequest.end();
}

function StopContainer(updateContainerStatusFunc, containerID, statusCell, startButton, stopButton, deleteButton, row, containerMap){
    let api = `/v1.41/containers/${containerID}/stop`
    const options = {
        socketPath: '/var/run/docker.sock',
        path: api,
        method: 'POST'
      };

    startButton.disabled = true
    stopButton.disabled = true
    deleteButton.disabled = true

    statusCell.innerHTML = "In Progress"

    const callback = res => {
        res.setEncoding('utf8')
        switch(res.statusCode){
            case 304:
                alert("Container Already Stopped");
                break
            case 404:
                alert("Container Not Found");
                break
            case 500:
                alert("Something Went Wrong");
                break
        }
    };

    const clientRequest = http.request(options, callback);
    clientRequest.end();
}

function StartContainer(updateContainerStatusFunc, containerID, statusCell, startButton, stopButton, deleteButton, row, containerMap){
    let api = `/v1.41/containers/${containerID}/start`
    const options = {
        socketPath: '/var/run/docker.sock',
        path: api,
        method: 'POST'
      };

    startButton.disabled = true
    stopButton.disabled = true
    deleteButton.disabled = true

    statusCell.innerHTML = "In Progress"

    const callback = res => {
        res.setEncoding('utf8')
        switch(res.statusCode){
            case 304:
                alert("Container Already Started");
                break
            case 404:
                alert("Container Not Found");
                break
            case 500:
                alert("Something Went Wrong");
                break
        }
    };

    const clientRequest = http.request(options, callback);
    clientRequest.end();
}

function DeleteContainer(updateContainerStatusFunc, containerID, statusCell, startButton, stopButton, deleteButton, row, containerMap){
    let api = `/v1.41/containers/${containerID}`
    const options = {
        socketPath: '/var/run/docker.sock',
        path: api,
        method: 'DELETE'
      };

    startButton.disabled = true
    stopButton.disabled = true
    deleteButton.disabled = true

    statusCell.innerHTML = "In Progress"

    const callback = res => {
        res.setEncoding('utf8')
        switch(res.statusCode){
            case 400:
                alert("Bad Request");
                break
            case 404:
                alert("Container Not Found");
                break
            case 409:
                alert("Conflict Occurred");
                break
            case 500:
                alert("Something Went Wrong");
                break 
        }
    };

    const clientRequest = http.request(options, callback);
    clientRequest.end();
}



function setContainerStatus(updateContainerStatusFunc, containerID, cell, row, startButton, stopButton, deleteButton, containerMap, eventTimestamp){
    let api = `/v1.41/containers/${containerID}/json`
    const options = {
        socketPath: '/var/run/docker.sock',
        path: api,
        method: 'GET'
      };

    const callback = res => {
        res.setEncoding('utf8')
        switch(res.statusCode){
            case 400:
                console.log("GET Container API Error : Bad Request")
                return
            case 500:
                console.log("GET Container API Error : Internal Server Error")
                return 
        }

        let responseBody = ''

        res.on('data', data => responseBody+=data);
        res.on('end', function(){
            if (containerMap.get(containerID)['eventTimestamp'] < eventTimestamp){
                if (res.statusCode === 200){
                    containerMap.get(containerID)['eventTimestamp'] = eventTimestamp
                    const jsonData = JSON.parse(responseBody)
                    updateContainerStatusFunc(res.statusCode, jsonData['State']['Status'], cell, row, startButton, stopButton, deleteButton)
                }else if(res.statusCode === 404){
                    containerMap.delete(containerID)
                    updateContainerStatusFunc(res.statusCode, '', cell, row, startButton, stopButton, deleteButton)
                }
            }
        });
        res.on('error', data => console.log(data));
    };

    const clientRequest = http.request(options, callback);
    clientRequest.end();
}

function addContainer(containerID, containerTableRowInsertCallback, table, containerMap, attributeMetadata, containerStatusUpdateCallback,eventTimestamp){
    let api = `/v1.41/containers/${containerID}/json`
    const options = {
        socketPath: '/var/run/docker.sock',
        path: api,
        method: 'GET'
        };

    const callback = res => {
        res.setEncoding('utf8')
        switch(res.statusCode){
            case 400:
                console.log("GET Container API Error : Bad Request")
                return
            case 500:
                console.log("GET Container API Error : Internal Server Error")
                return 
        }

        let responseBody = ''

        res.on('data', data => responseBody+=data);
        res.on('end', function(){
            if(res.statusCode === 200){
                const jsonResponse = JSON.parse(responseBody)
                // check if container listed already
                if(containerMap.has(containerID)){
                    if(containerMap.get(containerID)['eventTimestamp'] > eventTimestamp){
                        return
                    }

                    containerMap.get(containerID)['eventTimestamp'] > eventTimestamp
                    let containerRow = containerMap.get(containerID)['row']
                    let statusCell = containerRow.children[3]
                    let startButton = containerRow.children[4]
                    let stopButton = containerRow.children[5]
                    let deleteButton = containerRow.children[6]
                    containerStatusUpdateCallback(res.statusCode, jsonResponse['State']['Status'], statusCell, containerRow, startButton, stopButton, deleteButton)
                    return
                }
                containerTableRowInsertCallback(jsonResponse, table, containerMap, attributeMetadata)
            }
        });
        res.on('error', data => console.log(data));
    };

    const clientRequest = http.request(options, callback);
    clientRequest.end();
}


function MonitorContainerEvents( table, containerMap, updateContainerTableCallback, containerTableRowInsertionCallback, abortControllerObject){
    let api = '/v1.41/events?filters={"type":["container"]}'
    const attributes = [
        {'name':'Id', 'attribute':['Id'],'width':'500px', 'direction': 'ltr'},
        {'name':'Image', 'attribute':['Config', 'Image'],'width':'200px','direction': 'rtl'},
        {'name':'State', 'attribute': ['State', 'Status'],'width':'80px','direction': 'ltr'},
        {'name':'Name', 'attribute': ['Name'],'width':'200px','direction': 'ltr','overflow':'hidden', 'textOverflow':'ellipsis'}
      ]

    const options = {
        socketPath: '/var/run/docker.sock',
        path: api,
        method: 'GET',
        signal: abortControllerObject.signal
      };

    const callback = res => {
        res.setEncoding('utf8')
        switch(res.statusCode){
            case 400:
                console.log("Events API Error : Bad Request")
                return
            case 500:
                console.log("Events API Error : Internal Server Error")
                return
        }

        res.on('readable', ()=>{
            const eventJsonResp = JSON.parse(res.read())
            if(containerMap.has(eventJsonResp['id'])){
                 const row = containerMap.get(eventJsonResp['id'])['row']
                 let statusCell = row.children[3]
                 let startButton = row.children[4]
                 let stopButton = row.children[5]
                 let deleteButton = row.children[6]
                 setContainerStatus(updateContainerTableCallback,eventJsonResp['id'], statusCell, row, startButton, stopButton, deleteButton, containerMap, eventJsonResp['timeNano'])
            }else{
                addContainer(eventJsonResp['id'], containerTableRowInsertionCallback, table, containerMap, attributes, updateContainerTableCallback, eventJsonResp['timeNano'])
            }
        })

        res.on('error', data => console.log(data));
        res.on('aborted', ()=>console.log('request aborted'))
    };

    const clientRequest = http.request(options, callback);
    abortControllerObject.signal.onabort = () => clientRequest.destroy(true)
    clientRequest.end();
}