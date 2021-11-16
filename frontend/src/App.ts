import { formatDate } from "./utils"
import "@mdi/font/css/materialdesignicons.min.css"
import "./App.css"
import type { BackMessage, FrontMessage, RecievedMessage, Toast } from "../../messages"

const con = new WebSocket(`ws://${window.location.hostname}:8080`)
function send(data: FrontMessage): void {
    con.send(JSON.stringify(data))
}
con.onopen = () => console.log("Connected!")
let lastMsgSender: string | undefined;
let firstUsrLst = true
const bell = new Audio("assets/bell.oga")
let bellReady = false
bell.addEventListener("canplaythrough", event => {
    bellReady = true;
})

Notification.requestPermission()
con.onmessage = msgEvent => {
    const data: BackMessage = JSON.parse(msgEvent.data)
    console.log(data)
    if (data.type === "userList") {
        if (firstUsrLst) {
            const yourUser = data.users.filter(x => x.own).map(x => x.name)[0]
            nickInput.placeholder = yourUser
            firstUsrLst = false
        }
        const topBarText: HTMLParagraphElement = document.querySelector("#topBarText")!
        const otherUsers = data.users.filter(x => !x.own).map(x => x.name)
        otherUsers.push("You")
        topBarText.innerText = otherUsers.join(", ")
    } else if (data.type === "message") {
        if (document.hidden) {
            notification(data)
        }
        recieveMessage(data)
    } else if (data.type === "toast") {
        recieveToast(data)
    } else {
        throw Error("owo")
    }
}

function notification(data: RecievedMessage) {
    if ("Notification" in window && Notification.permission === "granted") {
        const options = {
            body: data.text,
            renotify: true,
            tag: "msg",
        }
        try {
            new Notification(`${data.from}`, options)
            return
        } catch (error) {
            if (!(error instanceof TypeError)) {
                throw error
            }
        }
    }
    if (bellReady) {
        bell.play()
    }
}

function autoscroll(childNode?: HTMLElement) {
    const currentScroll = textField.scrollTop + textField.clientHeight
    const currentHeight = textField.scrollHeight
    if (childNode) {
        textField.appendChild(childNode)
    }

    if (currentScroll >= currentHeight - 20) {
        textField.scrollTop = textField.scrollHeight
    }
}

function recieveToast(data: Toast) {
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
    } else if (data.toast === "punish") {
        toastText.innerText = data.text
    }
    newUserNode.appendChild(toastText)
    lastMsgSender = undefined
    autoscroll(newUserNode)
}

function recieveMessage(data: RecievedMessage) {
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
        spanUser.style.color = data.cssColor
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

const textInput: HTMLTextAreaElement = document.querySelector("#textInput")!
const messageField: HTMLFormElement = document.querySelector("#messageField")!

function sendMessage() {
    textField.scrollTop = textField.scrollHeight
    textInput.focus()
    const text = textInput.value.trim()
    if (text) {
        send({
            type: "message",
            text: text
        })
    }
    textInput.value = ""
    textInput.style.height = "auto"
}
messageField.addEventListener("submit", (event) => {
    event.preventDefault()
    sendMessage()
})

const nickInput: HTMLInputElement = document.querySelector("#nickInput")!
const nickField: HTMLFormElement = document.querySelector("#nickField")!
nickField.addEventListener("submit", (event) => {
    const text = nickInput.value.trim()
    if (text && text !== nickInput.placeholder) {
        send({
            type: "userName",
            text: text
        })
    }
    nickInput.value = ""
    textInput.focus()
    event.preventDefault()
})

const textField: HTMLDivElement = document.querySelector("#textField")!
for (const child of Array.from(textField.children)) {
    textField.removeChild(child)
    console.log(child)
}

textInput.addEventListener("input", () => {
    textInput.style.height = "auto"
    textInput.style.height = (textInput.scrollHeight)+"px";
    autoscroll()
})

textInput.addEventListener("keydown", (event) => {
    if(event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()
        sendMessage()
    }
})