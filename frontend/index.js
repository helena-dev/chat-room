console.log("Alba")
const con = new WebSocket("ws://localhost:8080")
con.onopen = () => console.log("Connected!")
let lastMsgSender;
con.onmessage = msgEvent => {
    const data = JSON.parse(msgEvent.data)
    console.log(data)
    if (data.type === "userList") {
        const topBarText = document.querySelector("#topBarText")
        const otherUsers = data.users.filter(x => !x.own).map(x => x.name)
        otherUsers.push("You")
        topBarText.innerText = otherUsers.join(", ")
    } else if (data.type === "message") {
        recieveMessage(data)
    } else {
        throw Error("owo")
    }
    return
}

function recieveMessage(data) {
    const messageNode = document.createElement("div")
    messageNode.className = data.own ? "message own" : "message"
    let isFollowup;
    if (lastMsgSender === data.from) {
        messageNode.className += " followup"
        isFollowup = true
    } else{
        isFollowup = false
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
    spanTime.innerText = data.date
    messageNode.appendChild(spanTime)

    const currentScroll = textField.scrollTop + textField.clientHeight
    const currentHeight = textField.scrollHeight
    textField.appendChild(messageNode)
    lastMsgSender = data.from

    if (currentScroll >= currentHeight - 20) {
        textField.scrollTop = textField.scrollHeight
    }
}

const textInput = document.querySelector("#textInput")
const messageField = document.querySelector("#messageField")
messageField.addEventListener("submit", (event) => {
    const data = {
        type: "message",
        text: textInput.value
    }
    con.send(JSON.stringify(data))
    textInput.value = ""
    event.preventDefault()
})

const textField = document.querySelector("#textField")
for (const child of Array.from(textField.children)) {
    textField.removeChild(child)
    console.log(child)
}
