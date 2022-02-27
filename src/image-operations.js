const apiOperations = require("./api-operations")

module.exports = {
    renderImageRunOperation: renderImageRunOperation
}

const imageRunLayout = `
<div class="modal-content">
    <label style="font-weight:bold">Image Name:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>
    <label id="containerImageLabel"></label><br><br>
    <label style="font-weight:bold">Container Name:&nbsp;&nbsp;</label>
    <input id="container-name"type="text" pattern="/?[a-zA-Z0-9][a-zA-Z0-9_.-]+"></br></br>
    <label style="font-weight:bold">Expose Ports&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label><button class="circular-button green-background" onclick=addPortElement()>+</button>
    <div id="exposed-port-list" class="port-list-container">
    </div></br>
    <label style="font-weight:bold">Environment Variables&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label><button class="circular-button green-background" onclick=addEnvironmentVariableElement()>+</button>
    <div id="environment-variable-list" class="env-var-list-container">
    </div>
    <div class="image-run-buttons">
        <button onclick=runContainerImage()>Run Container</button>
        <button onclick=cancelImageRunOperationBox()>Cancel</button>
    </div>
</div>
`

function addPortElement(){

    let count = 0
    const divElements = document.getElementsByClassName("port-data")
    if(divElements!=null){
        count = divElements.length
    }

    const divID = 'port-data'+(count+1)

    const element = `
    <div class="port-data" id=${divID}>
        <select name="protocol">
            <option value="udp">UDP</option>
            <option value="tcp">TCP</option>
        </select>
        <input name="container-port" placeholder="container-port" maxlength="5">
        <input name="host-port" placeholder="host-port" maxlength="5">
        <button class="circular-button red-background" onclick="deletePortDataDiv('${divID}')">x</button>
    </div>
    `
    let portList = document.getElementById("exposed-port-list")
    const childNode = new DOMParser().parseFromString(element, 'text/html').body.firstChild
    portList.appendChild(childNode)
}

function addEnvironmentVariableElement(){

    let count = 0
    const divElements = document.getElementsByClassName("env-var-data")
    if(divElements!=null){
        count = divElements.length
    }

    const divID = 'env-var'+(count+1)

    const element = `
    <div class="env-var-data" id=${divID}>
        <input name="key" placeholder="Key" width="20%" max-width="20%">
        <input name="value" placeholder="Value" width="20%" max-width="20%">
        <button class="circular-button red-background" onclick="deleteEnvVarDiv('${divID}')">x</button>
    </div>
    `
    let envVarList = document.getElementById("environment-variable-list")
    const childNode = new DOMParser().parseFromString(element, 'text/html').body.firstChild
    envVarList.appendChild(childNode)
}

function deletePortDataDiv(id){
    const elementToBeDeleted = document.getElementById(id)
    const mainPortDiv = document.getElementById("exposed-port-list")

    // delete all child nodes
    while(elementToBeDeleted.firstChild){
        elementToBeDeleted.removeChild(elementToBeDeleted.firstChild)
    }

    mainPortDiv.removeChild(elementToBeDeleted)
}

function deleteEnvVarDiv(id){
    const elementToBeDeleted = document.getElementById(id)
    const mainPortDiv = document.getElementById("environment-variable-list")
   
    // remove child nodes
    while(elementToBeDeleted.firstChild){
        elementToBeDeleted.removeChild(elementToBeDeleted.firstChild)
    }
    
    mainPortDiv.removeChild(elementToBeDeleted)
}

function renderImageRunOperation(imageName){
    let modalContainer = document.getElementById("modal-container")
    modalContainer.innerHTML = imageRunLayout
    document.getElementById("containerImageLabel").innerText = imageName
    modalContainer.style.display = "flex"
}

function cancelImageRunOperationBox(){
    closeCreateContainerDialog()
}

function closeCreateContainerDialog(){
    const divElement = document.getElementById("modal-container")
    divElement.style.display="None"
    
    // remove all child nodes
    while (divElement.firstChild){
        divElement.removeChild(divElement.firstChild)
    }
}

function runContainerImage(){
    let payload = {}
    
    const containerInfoElement = document.getElementById("modal-container")

    const image = document.getElementById("containerImageLabel").innerHTML

    if(!image || image.length === 0){
        alert("Invalid image")
        return
    }

    if(image === "none:none"){
        alert("none:none image cannot be run")
        return
    }

    payload["Image"] = image

    let containerName = ""
    const containerNameInput = document.getElementById("container-name").value
    if (containerNameInput.length > 0){
        containerName = containerNameInput
    }

    var portDataDivList = document.getElementsByClassName("port-data")
    if (portDataDivList!=null){
        let hostConfig = {}
        let exposedPort = {}

        for(let i=0; i<portDataDivList.length;i++){
            // add code here to iterate over the divs and get all the port data
            const protocol = portDataDivList[i].querySelector('select[name="protocol"]')
            if(protocol === null || (protocol.value != 'udp' && protocol.value != 'tcp')){
                alert("invalid protocol")
                return
            }

            const containerPort = portDataDivList[i].querySelector('input[name="container-port"]')
            if (containerPort === null || containerPort.value.length===0){
                alert('invalid container port provided in port forwarding section')
                return
            }
            
            const hostPort = portDataDivList[i].querySelector('input[name="host-port"]')
            if (hostPort === null || hostPort.value.length === 0){
                alert('invalid host port provided in port forwarding section')
                return
            }

            exposedPort[`${containerPort.value}/${protocol.value}`] = {}

            hostConfig[`${containerPort.value}/${protocol.value}`] = [{'HostPort': hostPort.value}]

        }

        if (portDataDivList.length > 0){
            payload['HostConfig'] = {
                'PortBindings': hostConfig
            }
            payload['ExposedPorts'] = exposedPort
        }
    }

    var envDataDivList = document.getElementsByClassName("env-var-data")
    if (envDataDivList!=null){
        let envVars = []

        for(let i=0; i<envDataDivList.length;i++){
            // add code here to iterate over the divs and get all the port data
            const key = envDataDivList[i].querySelector('input[name="key"]')
            if(key === null || key.value.length === 0){
                alert("invalid key provided")
                return
            }

            const value = envDataDivList[i].querySelector('input[name="value"]')
            if (value === null || value.value.length===0){
                alert('invalid value provided')
                return
            }

            envVars.push(`${key.value}=${value.value}`)
        }

        if (envDataDivList.length > 0){
            payload['Env'] = envVars
        }
    }

    apiOperations.CreateContainer(containerName, payload)

    closeCreateContainerDialog()

}