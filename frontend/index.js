import { formatDate } from "./utils.js"
console.log("Alba")
const con = new WebSocket(`ws://${window.location.hostname}:8080`)
con.onopen = () => console.log("Connected!")
let lastMsgSender;
let firstUsrLst = true
con.onmessage = msgEvent => {
    const data = JSON.parse(msgEvent.data)
    console.log(data)
    if (data.type === "userList") {
        if (firstUsrLst) {
            const yourUser = data.users.filter(x => x.own).map(x => x.name)
            nickInput.placeholder = yourUser
            firstUsrLst = false
        }
        const topBarText = document.querySelector("#topBarText")
        const otherUsers = data.users.filter(x => !x.own).map(x => x.name)
        otherUsers.push("You")
        topBarText.innerText = otherUsers.join(", ")
    } else if (data.type === "message") {
        recieveMessage(data)
    } else if (data.type === "toast") {
        recieveToast(data)
    } else {
        throw Error("owo")
    }
}

function autoscroll(childNode) {
    const currentScroll = textField.scrollTop + textField.clientHeight
    const currentHeight = textField.scrollHeight
    textField.appendChild(childNode)

    if (currentScroll >= currentHeight - 20) {
        textField.scrollTop = textField.scrollHeight
    }
}

function recieveToast(data) {
    const newUserNode = document.createElement("div")
    newUserNode.className = "toast"
    const toastText = document.createElement("span")
    toastText.className = "toast-text"
    if (data.toast === "userChange") {
        if (data.sign === "plus") {
            if (data.own) {
                toastText.innerText = "You are now online"
            } else {
                toastText.innerText = `${data.name} has just arrived`
            }
        } else if (data.sign === "minus") {
            if (!data.own) {
                toastText.innerText = `${data.name} has left`
            }
        } else {
            throw Error("owo")
        }
    } else if (data.toast === "nickChange") {
        if (data.own) {
            nickInput.placeholder = data.newName
            toastText.innerText = `Your username is now: ${data.newName}`
        } else {
            toastText.innerText = `User "${data.oldName}" is now "${data.newName}"`
        }
    }
    newUserNode.appendChild(toastText)
    autoscroll(newUserNode)
}

function recieveMessage(data) {
    const messageNode = document.createElement("div")
    messageNode.className = data.own ? "message own" : "message"
    const isFollowup = (lastMsgSender === data.from);
    lastMsgSender = data.from
    if (isFollowup) {
        messageNode.className += " followup"
    }
    if (!data.own && !isFollowup) {
        const spanUser = document.createElement("span")
        spanUser.className = "message-user"
        spanUser.innerText = data.from
        messageNode.appendChild(spanUser)
    }
    const spanText = document.createElement("span")
    spanText.className = "message-text"
    spanText.innerText = data.text
    messageNode.appendChild(spanText)
    const spanTime = document.createElement("span")
    spanTime.className = "message-timeStamp"
    const msgDate = new Date(data.date)
    spanTime.innerText = formatDate(msgDate)
    messageNode.appendChild(spanTime)
    autoscroll(messageNode)
}

const textInput = document.querySelector("#textInput")
const messageField = document.querySelector("#messageField")
messageField.addEventListener("submit", (event) => {
    textField.scrollTop = textField.scrollHeight
    textInput.focus()
    const text = textInput.value.trim()
    if (text) {
        const data = {
            type: "message",
            text: text
        }
        con.send(JSON.stringify(data))
    }
    textInput.value = ""
    event.preventDefault()
})

const nickInput = document.querySelector("#nickInput")
const nickField = document.querySelector("#nickField")
nickField.addEventListener("submit", (event) => {
    const text = nickInput.value.trim()
    if (text && text != nickInput.placeholder) {
        const data = {
            type: "userName",
            text: text
        }
        con.send(JSON.stringify(data))
    }
    nickInput.value = ""
    textInput.focus()
    event.preventDefault()
})

const textField = document.querySelector("#textField")
for (const child of Array.from(textField.children)) {
    textField.removeChild(child)
    console.log(child)
}
