import { exceptionalReservationsToISO, isoAlpha2ToSymbols } from "./geo"
import { IPinfo, IPinfoWrapper } from "node-ipinfo"
import { WebSocket, WebSocketServer } from "ws"
import { getMagicColorSequence, normalizeIP} from "./utils.js"
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
    colorNum: number
    get cssColor(): string
    send(data: BackMessage): void
}

let conNum = 0
let users: {[key: string]: ConnectionData} = {}

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
            if(!set.has(i)) {
                return i
            }
        }
    }

    const connectionData: ConnectionData = {
        connection: con,
        currentIP: undefined,
        lastActivity: new Date(),
        colorNum: findNum(colorNumSet),
        get cssColor () {
            if (currentCon === process.env.SPECIAL_USER_COLOR) {
                return "orchid"
            }
            const pos = getMagicColorSequence(this.colorNum)
            return `hsl(${pos*360}, 100%, 50%)`
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
        for (const connectionData of Object.values(users)) {
            connectionData.send({
                type: "toast",
                toast: "nickChange",
                oldName,
                newName: currentCon,
                own: (connectionData.connection === con),
            })
        }
    }

    function sendUserList() {
        for (const connectionData of Object.values(users)) {
            connectionData.send({
                type: "userList",
                users: Object.entries(users).map(x => ({
                    name: x[0],
                    lastActivity: x[1].lastActivity,
                    own: x[1].connection === connectionData.connection,
                    cssColor: x[1].cssColor
                }))
            })
        }
    }

    function userNumChange(sign: "plus" | "minus") {
        for (const connectionData of Object.values(users)) {
            connectionData.send({
                type: "toast",
                toast: "userChange",
                sign,
                name: currentCon,
                own: (connectionData.connection === con),
            })
        }
    }

    sendUserList()
    userNumChange("plus")

    ipinfo.lookupIp(normedIP)
        .then(info => {
            connectionData.currentIP = info
            console.log(`Got geolocation info for connection ${currentCon}:`, info)
        })

    con.on("message", chunk => {
        const data: FrontMessage = JSON.parse(chunk.toString())
        if (data.type === "message") {
            if(data.text.length > 5000) return punish()
            for (const targetConnectionData of Object.values(users)) {
                targetConnectionData.send({
                    type: "message",
                    text: data.text,
                    own: targetConnectionData.connection === con,
                    from: currentCon,
                    date: new Date(),
                    cssColor: connectionData.cssColor,
                })
            }
        } else if (data.type === "userName") {
            changeName(data.text)
        } else {
            throw Error("owo")
        }
    })

    function punish() {
        connectionData.send({
            type: "toast",
            toast: "punish",
            text: "Don't mess with the code. Bye."
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