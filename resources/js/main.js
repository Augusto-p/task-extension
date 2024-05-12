const vscode = acquireVsCodeApi();
vscode.postMessage({ type: 'StartTaskDB' });
const Tasks = document.getElementById("Tasks");
const FinshTasks = document.getElementById("FinishTasks")

function ADDTask(elm, event) {
    if (event.data != " " && event.data != null) {
        vscode.postMessage({ type: 'AddTaskToDB', ID: elm.parentNode.getAttribute('data-id'), Text: elm.value, Status: elm.previousElementSibling.checked })
        // vscode.postMessage({ type: 'GetNextIDTaskOfDB' });
        elm.oninput = (event) => {
            ModTask(elm, event)
        }
    }
}
function ModTask(elm, event) {
    if (elm.value == "" && event.data == null) {
        elm.parentNode.parentNode.removeChild(elm.parentNode)
    }
}
function CheckTask(elm, event) {
    if (elm.checked && elm.nextElementSibling.value.trim() != "") {
        FinshTasks.insertBefore(elm.parentNode, FinshTasks.firstChild);
        elm.nextElementSibling.disabled = true;
        vscode.postMessage({ type: 'UpdateStatusTaskToDB', ID: elm.parentNode.getAttribute('data-id'), Status: true });
    } else if (elm.checked) {
        elm.checked = false;
    } else {
        vscode.postMessage({ type: 'UpdateStatusTaskToDB', ID: elm.parentNode.getAttribute('data-id'), Status: false });
        Tasks.insertBefore(elm.parentNode, Tasks.lastChild);
        elm.nextElementSibling.disabled = false;
    }
}

function DeleteTask(elm, event) {
    if (elm.previousElementSibling.value.trim() != "") {
        elm.parentNode.parentNode.removeChild(elm.parentNode)
        vscode.postMessage({ type: 'DeleteTaskToDB', ID: elm.parentNode.getAttribute('data-id') });
    }
}
function generarRandomID() {
    return Math.floor(Math.random() * 5000) + 1;
}

function UpdateTaskText(elm, event) {
    if (elm.value != "") {
        vscode.postMessage({ type: 'UpdateTextTaskToDB', ID: elm.parentNode.getAttribute('data-id'), Text: elm.value })

    } else {

        DeleteTask(elm, null)
    }
}

function saveTask(elm, event) {
    if (elm.value != "") {
        vscode.postMessage({ type: 'AddTaskToDB', ID: elm.parentNode.getAttribute('data-id'), Text: elm.value, Status: elm.previousElementSibling.checked })
        elm.onblur = (event) => {
            UpdateTaskText(elm, event)
        }
    }
}

function appendTask(ID) {
    Task = document.createElement("article")
    Task.classList.add("Task");
    Task.setAttribute("data-Id", ID);
    Task.innerHTML = `
        <input type="checkbox" name="TaskCheck-${ID}" id="TaskCheck-${ID}" oninput="CheckTask(this, event)">
        <input type="text" name="TaskText-${ID}" id="TaskText-${ID}" data-Id="${ID}" class="TaskText" oninput="ADDTask(this, event)" onblur="UpdateTaskText(this,event)">
        <button class="DeleteTask" data-Id="${ID}" onclick="DeleteTask(this, event)"><svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z"/></svg></button>
        <svg class="SVG_Check_ON"  viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm-1.02-4.13h-.71L4 8.6l.71-.71 1.92 1.92 4.2-4.21.71.71-4.56 4.56z"/></svg>
        <svg class="SVG_Check_OFF"  viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M6.27 10.87h.71l4.56-4.56-.71-.71-4.2 4.21-1.92-1.92L4 8.6l2.27 2.27z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8.6 1c1.6.1 3.1.9 4.2 2 1.3 1.4 2 3.1 2 5.1 0 1.6-.6 3.1-1.6 4.4-1 1.2-2.4 2.1-4 2.4-1.6.3-3.2.1-4.6-.7-1.4-.8-2.5-2-3.1-3.5C.9 9.2.8 7.5 1.3 6c.5-1.6 1.4-2.9 2.8-3.8C5.4 1.3 7 .9 8.6 1zm.5 12.9c1.3-.3 2.5-1 3.4-2.1.8-1.1 1.3-2.4 1.2-3.8 0-1.6-.6-3.2-1.7-4.3-1-1-2.2-1.6-3.6-1.7-1.3-.1-2.7.2-3.8 1-1.1.8-1.9 1.9-2.3 3.3-.4 1.3-.4 2.7.2 4 .6 1.3 1.5 2.3 2.7 3 1.2.7 2.6.9 3.9.6z"/></svg>`;
    Tasks.appendChild(Task)

}

function loadData(Tareas) {

    const tareasCompletadas = Tareas.filter(tarea => tarea.completado === 1)
        .sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));

    // Filtrar tareas no completadas y ordenarlas de menor a mayor fecha
    const tareasNoCompletadas = Tareas.filter(tarea => tarea.completado === 0)
        .sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));

    tareasNoCompletadas.forEach(tarea => {
        ID = tarea.ID
        Task = document.createElement("article")
        Task.classList.add("Task");
        Task.setAttribute("data-Id", ID);
        Task.innerHTML = `
        <input type="checkbox" name="TaskCheck-${ID}" id="TaskCheck-${ID}" oninput="CheckTask(this, event)" ${tarea.completado === 1 ? "checked" : ""}>
        <input type="text" value="${tarea.Texto}" name="TaskText-${ID}" id="TaskText-${ID}" data-Id="${ID}" class="TaskText" oninput="ModTask(this, event)" onblur="UpdateTaskText(this, event)" ${tarea.completado === 1 ? "disabled" : ""}>
        <button class="DeleteTask" data-Id="${ID}" onclick="DeleteTask(this, event)"><svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z"/></svg></button>
        <svg class="SVG_Check_ON"  viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm-1.02-4.13h-.71L4 8.6l.71-.71 1.92 1.92 4.2-4.21.71.71-4.56 4.56z"/></svg>
        <svg class="SVG_Check_OFF"  viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M6.27 10.87h.71l4.56-4.56-.71-.71-4.2 4.21-1.92-1.92L4 8.6l2.27 2.27z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8.6 1c1.6.1 3.1.9 4.2 2 1.3 1.4 2 3.1 2 5.1 0 1.6-.6 3.1-1.6 4.4-1 1.2-2.4 2.1-4 2.4-1.6.3-3.2.1-4.6-.7-1.4-.8-2.5-2-3.1-3.5C.9 9.2.8 7.5 1.3 6c.5-1.6 1.4-2.9 2.8-3.8C5.4 1.3 7 .9 8.6 1zm.5 12.9c1.3-.3 2.5-1 3.4-2.1.8-1.1 1.3-2.4 1.2-3.8 0-1.6-.6-3.2-1.7-4.3-1-1-2.2-1.6-3.6-1.7-1.3-.1-2.7.2-3.8 1-1.1.8-1.9 1.9-2.3 3.3-.4 1.3-.4 2.7.2 4 .6 1.3 1.5 2.3 2.7 3 1.2.7 2.6.9 3.9.6z"/></svg>`;
        
        Tasks.insertBefore(Task, Tasks.firstChild);
    });

    tareasCompletadas.forEach(tarea => {
        ID = tarea.ID
        Task = document.createElement("article")
        Task.classList.add("Task");
        Task.setAttribute("data-Id", ID);
        Task.innerHTML = `
        <input type="checkbox" name="TaskCheck-${ID}" id="TaskCheck-${ID}" oninput="CheckTask(this, event)" ${tarea.completado === 1 ? "checked" : ""}>
        <input type="text" value="${tarea.Texto}" name="TaskText-${ID}" id="TaskText-${ID}" data-Id="${ID}" class="TaskText" oninput="ModTask(this, event)" onblur="UpdateTaskText(this, event)" ${tarea.completado === 1 ? "disabled" : ""}>
        <button class="DeleteTask" data-Id="${ID}" onclick="DeleteTask(this, event)"><svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 8.707l3.646 3.647.708-.707L8.707 8l3.647-3.646-.707-.708L8 7.293 4.354 3.646l-.707.708L7.293 8l-3.646 3.646.707.708L8 8.707z"/></svg></button>
        <svg class="SVG_Check_ON"  viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M8 15A7 7 0 1 0 8 1a7 7 0 0 0 0 14zm-1.02-4.13h-.71L4 8.6l.71-.71 1.92 1.92 4.2-4.21.71.71-4.56 4.56z"/></svg>
        <svg class="SVG_Check_OFF"  viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M6.27 10.87h.71l4.56-4.56-.71-.71-4.2 4.21-1.92-1.92L4 8.6l2.27 2.27z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M8.6 1c1.6.1 3.1.9 4.2 2 1.3 1.4 2 3.1 2 5.1 0 1.6-.6 3.1-1.6 4.4-1 1.2-2.4 2.1-4 2.4-1.6.3-3.2.1-4.6-.7-1.4-.8-2.5-2-3.1-3.5C.9 9.2.8 7.5 1.3 6c.5-1.6 1.4-2.9 2.8-3.8C5.4 1.3 7 .9 8.6 1zm.5 12.9c1.3-.3 2.5-1 3.4-2.1.8-1.1 1.3-2.4 1.2-3.8 0-1.6-.6-3.2-1.7-4.3-1-1-2.2-1.6-3.6-1.7-1.3-.1-2.7.2-3.8 1-1.1.8-1.9 1.9-2.3 3.3-.4 1.3-.4 2.7.2 4 .6 1.3 1.5 2.3 2.7 3 1.2.7 2.6.9 3.9.6z"/></svg>`;
        
        FinshTasks.insertBefore(Task, FinshTasks.firstChild);
    });



}

// started 
// function StartTaskEnty() {
//     vscode.postMessage({ type: 'GetNextIDTaskOfDB' });

// }

// StartTaskEnty()
window.addEventListener('message', event => {
    const message = event.data; // The json data that the extension sent
    switch (message.type) {
        case 'GetNextID':
            {
                appendTask(message.ID)
                break;
            }
        case 'GetAll':
            {
                loadData(message.Tareas);
                break;
            }

    }
});
