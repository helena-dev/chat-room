console.log("Alba")
const con = new WebSocket("ws://localhost:8080")
con.onopen = () => console.log("Connected!")
con.onmessage = msgEvent => {
    const data = JSON.parse(msgEvent.data)
    console.log(data)
    if (data.type === "userList") {
        const topBarText = document.querySelector("#topBarText")
        topBarText.innerText = data.users.map(x => x.name).join(", ")
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
    if (!data.own) {
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
