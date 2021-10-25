const {randomInt, filterEscapeCode, LineSplitter, normalizeIP, CSI, SGR, unbreakLines, wrapText,} = require("./utils")
const {exceptionalReservationsToISO, isoAlpha2ToSymbols} = require("./geo")
const { IPinfoWrapper } = require("node-ipinfo")
const { WebSocketServer } = require("ws")

let ipinfo;
if(!process.env.IPINFO_TOKEN) {
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
    }
    users[currentCon] = connectionData

    function sendUserList() {
        const data = {
            type: "userList",
            users: Object.entries(users).map(x =>{
                return {
                    name: x[0],
                    lastActivity: x[1].lastActivity,
                    own: x[1].connection === con,
                }
            })
        }
        con.send(JSON.stringify(data))
    }
    sendUserList()
    ipinfo.lookupIp(normedIP)
        .then(info => {
            connectionData.currentIP = info
            console.log(`Got geolocation info for connection ${currentCon}:`, info)
        })
    
    con.on("message", chunk => {
        const data = JSON.parse(chunk.toString())
        if (data.type === "message") {
            for (const connectionData of Object.values(users)) {
                const sentData = {
                    type: "message",
                    text: data.text,
                    own: connectionData.connection === con,
                    from: currentCon,
                    date: new Date(),
                }
                connectionData.connection.send(JSON.stringify(sentData))
            }
        } else {
            throw Error("owo")
        }
    })

    con.on("close",() => {
        console.log(`User ${currentCon} has left. :(`)
        delete users[currentCon]
    })
})

server.on("listening", () => console.log("The server is up and running."))