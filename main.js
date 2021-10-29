const { exceptionalReservationsToISO, isoAlpha2ToSymbols } = require("./geo")
const { IPinfoWrapper } = require("node-ipinfo")
const { WebSocketServer } = require("ws")
const { normalizeIP} = require("./utils.js")

let ipinfo;
if (!process.env.IPINFO_TOKEN) {
    throw "IPinfo token does not exist.\r\n"
} else {
    ipinfo = new IPinfoWrapper(process.env.IPINFO_TOKEN)
}

let conNum = 0
let users = {}

const server = new WebSocketServer({ port: 8080 });
server.on("connection", (con, request) => {
    const socket = request.socket
    const normedIP = normalizeIP(socket.remoteAddress)
    console.log(`A connection has arrived! Its number is ${conNum}.\nIts IP and port are: ${normedIP}, ${socket.remotePort}`)
    let currentCon = `Foo${conNum}`
    conNum++
    const connectionData = {
        connection: con,
        currentIP: null,
        lastActivity: new Date(),
        colorNum: undefined,
        get cssColor () {
            if (currentCon === process.env.SPECIAL_USER_COLOR) {
                return "orchid"
            }
            const i = this.colorNum
            if (i === 0) return 0
            const nearest = 2**Math.floor(Math.log2(i))
            const pos = (1 + 2*(i - nearest))  / (2*nearest)
            return `hsl(${pos*360}, 100%, 50%)`
        }
    }
    users[currentCon] = connectionData
    const colorNumSet = new Set(Object.values(users).map(x => x.colorNum))
    function findNum(set) {
        for (let i = 0; true; i++) {
            if(!set.has(i)) {
                return i
            }
        }
    }
    users[currentCon].colorNum = findNum(colorNumSet)

    function changeName(text) {
        if ((text.length > 20) || (Object.keys(users)).includes(text)) return
        const oldName = currentCon
        users[text] = connectionData
        delete users[oldName]
        currentCon = text
        sendUserList()
        const data = {
            type: "toast",
            toast: "nickChange",
            oldName,
            newName: currentCon,
        }
        for (const connectionData of Object.values(users)) {
            data.own = (connectionData.connection === con)
            connectionData.connection.send(JSON.stringify(data))
        }
    }

    function sendUserList() {
        for (const connectionData of Object.values(users)) {
            const data = {
                type: "userList",
                users: Object.entries(users).map(x => {
                    return {
                        name: x[0],
                        lastActivity: x[1].lastActivity,
                        own: x[1].connection === connectionData.connection,
                        cssColor: x[1].cssColor
                    }
                })
            }
            connectionData.connection.send(JSON.stringify(data))
        }
    }

    function userNumChange(sign) {
        const data = {
            type: "toast",
            toast: "userChange",
            sign,
            name: currentCon, 
        }
        for (const connectionData of Object.values(users)) {
            data.own = (connectionData.connection === con)
            connectionData.connection.send(JSON.stringify(data))
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
        const data = JSON.parse(chunk.toString())
        if (data.type === "message") {
            for (const targetConnectionData of Object.values(users)) {
                const sentData = {
                    type: "message",
                    text: data.text,
                    own: targetConnectionData.connection === con,
                    from: currentCon,
                    date: new Date(),
                    cssColor: connectionData.cssColor,
                }
                targetConnectionData.connection.send(JSON.stringify(sentData))
            }
        } else if (data.type === "userName") {
            changeName(data.text)
        } else {
            throw Error("owo")
        }
    })

    con.on("close", () => {
        console.log(`User ${currentCon} has left. :(`)
        delete users[currentCon]
        userNumChange("minus")
        sendUserList()
    })
})

server.on("listening", () => console.log("The server is up and running."))