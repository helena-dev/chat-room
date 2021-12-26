import { IPinfo, IPinfoWrapper } from "node-ipinfo"
import { WebSocket, WebSocketServer } from "ws"
import { getMagicColorSequence, normalizeIP } from "./utils.js"
import type { BackMessage, FrontMessage } from "./messages"

let ipinfo: IPinfoWrapper;
if (!process.env.IPINFO_TOKEN) {
    throw "IPinfo token does not exist.\r\n"
} else {
    ipinfo = new IPinfoWrapper(process.env.IPINFO_TOKEN)
}

interface ConnectionData {
    connection: WebSocket
    currentIP?: IPinfo
    lastActivity: Date
    online: boolean
    colorNum: number
    get cssColor(): string
    send(data: BackMessage): void
}

let conNum = 0
let users: { [key: string]: ConnectionData } = {}
let msgNum = 0
function generateMsgId() {
    return msgNum++
}

const server = new WebSocketServer({ port: 8080 });
server.on("connection", (con, request) => {
    const socket = request.socket
    const normedIP = normalizeIP(socket.remoteAddress!)
    console.log(`A connection has arrived! Its number is ${conNum}.\nIts IP and port are: ${normedIP}, ${socket.remotePort}`)
    let currentCon = `Foo${conNum}`
    conNum++

    const colorNumSet = new Set(Object.values(users).map(x => x.colorNum))
    function findNum(set: Set<number>) {
        for (let i = 0; true; i++) {
            if (!set.has(i)) {
                return i
            }
        }
    }

    const connectionData: ConnectionData = {
        connection: con,
        currentIP: undefined,
        lastActivity: new Date(),
        online: true,
        colorNum: findNum(colorNumSet),
        get cssColor() {
            if (currentCon === process.env.SPECIAL_USER_COLOR) {
                return "orchid"
            }
            const pos = getMagicColorSequence(this.colorNum)
            return `hsl(${pos * 360}, 100%, 50%)`
        },
        send(data: BackMessage) {
            this.connection.send(JSON.stringify(data))
        },
    }
    users[currentCon] = connectionData

    function changeName(text: string) {
        if (text.length > 20) return punish()
        if (text in users) return
        const oldName = currentCon
        users[text] = connectionData
        delete users[oldName]
        currentCon = text
        sendUserList()
        const id = generateMsgId()
        for (const connectionData of Object.values(users)) {
            connectionData.send({
                type: "toast",
                toast: "nickChange",
                oldName,
                newName: currentCon,
                own: (connectionData.connection === con),
                msgNum: id,
            })
        }
    }

    function sendUserList() {
        for (const connectionData of Object.values(users)) {
            connectionData.send({
                type: "userList",
                users: Object.entries(users).map(x => {
                    const { region, countryCode, city } = x[1].currentIP || {}
                    const { bogon } = (x[1].currentIP as any || {})
                    const { lastActivity, online, cssColor } = x[1]
                    return {
                        name: x[0],
                        lastActivity,
                        online,
                        own: x[1].connection === connectionData.connection,
                        cssColor,
                        ipInfo: {
                            region,
                            countryCode,
                            city,
                            bogon,
                        }
                    }
                })
            })
        }
    }

    function userNumChange(sign: "plus" | "minus") {
        const id = generateMsgId()
        for (const connectionData of Object.values(users)) {
            connectionData.send({
                type: "toast",
                toast: "userChange",
                sign,
                name: currentCon,
                own: (connectionData.connection === con),
                msgNum: id,
            })
        }
    }

    sendUserList()
    userNumChange("plus")

    ipinfo.lookupIp(normedIP)
        .then(info => {
            connectionData.currentIP = info
            console.log(`Got geolocation info for connection ${currentCon}:`, info)
            sendUserList()
        })

    con.on("message", chunk => {
        const data: FrontMessage = JSON.parse(chunk.toString())
        if (data.type === "message") {
            if (data.text.length > 5000) return punish()
            if (data.image && !data.image.startsWith("data:image")) return punish()
            const id = generateMsgId()
            for (const targetConnectionData of Object.values(users)) {
                if (targetConnectionData.connection !== con) {
                    targetConnectionData.send({
                        type: "message",
                        text: data.text,
                        image: data.image,
                        own: targetConnectionData.connection === con,
                        from: currentCon,
                        date: new Date(),
                        cssColor: connectionData.cssColor,
                        msgNum: id,
                        reply: data.reply,
                    })
                } else if (targetConnectionData.connection === con) {
                    targetConnectionData.send({
                        type: "ackMessage",
                        date: new Date(),
                        cssColor: connectionData.cssColor,
                        msgNum: id,
                        pseudoId: data.pseudoId
                    })
                }
            }
        } else if (data.type === "userName") {
            changeName(data.text)
        } else if (data.type === "isOnline") {
            connectionData.online = data.online
            connectionData.lastActivity = new Date()
            sendUserList()
        } else if (data.type === "typing") {
            for (const targetConnectionData of Object.values(users)) {
                targetConnectionData.send({
                    type: "typing",
                    from: currentCon,
                })
            }
        } else if (data.type === "deleteMsg") {
            const msgId = data.msgNum
            for (const targetConnectionData of Object.values(users)) {
                targetConnectionData.send({
                    type: "deleteMsg",
                    msgNum: msgId,
                })
            }
        } else {
            throw Error("owo")
        }
    })

    function punish() {
        const id = generateMsgId()
        connectionData.send({
            type: "toast",
            toast: "punish",
            text: "Don't mess with the code. Bye.",
            msgNum: id,
        })
        con.close()
    }

    con.on("close", () => {
        console.log(`User ${currentCon} has left. :(`)
        delete users[currentCon]
        userNumChange("minus")
        sendUserList()
    })
})

server.on("listening", () => console.log("The server is up and running."))
