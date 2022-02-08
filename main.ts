import { IPinfo, IPinfoWrapper } from "node-ipinfo"
import { RawData, WebSocket, WebSocketServer } from "ws"
import { getMagicColorSequence, normalizeIP, decodeDataURL } from "./utils.js"
import type { BackMessage, FrontMessage, LoginRequest, SignupRequest } from "./messages"
import { Connection, createConnection } from 'mysql2/promise'
import { createServer } from "http"
import got from "got"

const { RECAPTCHA_PRIVATEKEY } = process.env
if(!RECAPTCHA_PRIVATEKEY) throw "Recaptcha private key needed.\r\n"

let ipinfo: IPinfoWrapper;
if (!process.env.IPINFO_TOKEN) {
    throw "IPinfo token does not exist.\r\n"
} else {
    ipinfo = new IPinfoWrapper(process.env.IPINFO_TOKEN)
}

interface ConnectionData {
    connection: WebSocket
    currentIP: IPinfo
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
let mysqlCon: Connection;
if (!process.env.SQL_URL) {
    throw "SQL DB does not exist.\r\n"
} else {
    createConnection(process.env.SQL_URL)
        .then((con) => {
            mysqlCon = con
            httpServer.listen({ port: 8080 }, () => console.log("The server is up and running."))
        })
}
const httpServer = createServer()
const server = new WebSocketServer({ server: httpServer });

server.on("connection", (con, request) => {
    const socket = request.socket
    const normedIP = normalizeIP(socket.remoteAddress!)
    console.log(`A connection has arrived! Its number is ${conNum}.\nIts IP and port are: ${normedIP}, ${socket.remotePort}`)
    const ipinfoPromise = ipinfo.lookupIp(normedIP)

    let completed = false
    function send(data: BackMessage) {
        con.send(JSON.stringify(data))
    }
    const handleLogin = async (data: LoginRequest) => {
        const valid = await checkCredentials(data.userName, data.password)
        const connectionIpInfo = await ipinfoPromise
        send({
            type: "login",
            ok: valid,
        })
        if (valid && !completed) {
            completed = true
            con.off("message", messageHandler)
            handlePostLogin(con, connectionIpInfo, data.userName)
        }
    }
    const handleSignup = async (data: SignupRequest) => {
        const params = {
            secret: RECAPTCHA_PRIVATEKEY,
            response: data.captchaResponse,
            remoteip: normedIP,
        }
        const captchaVerifyResponse: any = await got.post("https://www.google.com/recaptcha/api/siteverify", {
            form: params
        }).json()
        if(!captchaVerifyResponse.success) {
            send({
                type: "signup",
                ok: false,
                err: -3,
            })
            return
        }

        const code = await addCredentials(data.userName, data.password)
        const connectionIpInfo = await ipinfoPromise
        send({
            type: "signup",
            ok: !code,
            err: code,
        })
        if (code === 0 && !completed) {
            completed = true
            con.off("message", messageHandler)
            handlePostLogin(con, connectionIpInfo, data.userName)
        }
    }

    const messageHandler = (chunk: RawData) => {
        const data: FrontMessage = JSON.parse(chunk.toString())
        if (data.type === "login") {
            handleLogin(data)
        } else if (data.type === "signup") {
            handleSignup(data)
        } else {
            con.close()
        }
    }
    con.on("message", messageHandler)
})

async function checkCredentials(userName: string, password: string) {
    const [rows, fields] = await mysqlCon.execute<any[]>("SELECT password FROM users WHERE user_name_lowercase = ? LIMIT 1;", [userName.toLowerCase()])
    if (rows.length === 0) return false
    const sqlPassword = rows[0].password
    return password === sqlPassword
}

async function addCredentials(userName: string, password: string) {
    if(!userName || !password) return -2
    try {
        await mysqlCon.execute("INSERT INTO users (user_name_lowercase, user_name, bkg_color, password, last_activity) VALUES (?, ?, ?, ?, ?);", [userName.toLowerCase(), userName, 857112, password, new Date()])
        return 0
    } catch (err) {
        return (err as any).errno
    }
}

const handlePostLogin = (con: WebSocket, ipinfo: IPinfo, currentCon: string) => {
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
        currentIP: ipinfo,
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

    async function changeName(text: string) {
        if (text.length > 20) return punish()
        if (text in users) return
        const oldName = currentCon
        try {
            await mysqlCon.execute("UPDATE users SET user_name_lowercase = ?, user_name = ? WHERE user_name_lowercase = ?;", [text.toLowerCase(), text, oldName.toLowerCase()])
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
        } catch {
            return
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

    mysqlCon.execute<any[]>("SELECT bkg_color FROM users WHERE user_name_lowercase = ?", [currentCon.toLowerCase()])
        .then(([rows, fields]) => {
            connectionData.send({
                type: "bkgColor",
                color: rows[0].bkg_color,
            })
        }, () => console.log("efe"))
    sendUserList()
    userNumChange("plus")

    con.on("message", chunk => {
        const data: FrontMessage = JSON.parse(chunk.toString())
        if (data.type === "message") {
            if (data.text.length > 5000) return punish()
            if (data.image) {
                const matches = decodeDataURL(data.image)
                if (!matches || !matches[0].startsWith("image/") || matches[1].length > 30 * 2 ** 20) return punish()
            }
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
                        replyNum: data.replyNum,
                        edited: false,
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
            if (!data.online) {
                const date = new Date()
                connectionData.lastActivity = date
                mysqlCon.execute("UPDATE users SET last_activity = ? WHERE user_name_lowercase = ?;", [date, currentCon.toLowerCase()])
                    .catch(() => console.log("efe"))
            }
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
        } else if (data.type === "edit") {
            for (const targetConnectionData of Object.values(users)) {
                targetConnectionData.send({
                    type: "edit",
                    msgNum: data.msgNum,
                    text: data.text,
                })
            }
        } else if (data.type === "bkgColor") {
            mysqlCon.execute("UPDATE users SET bkg_color = ? WHERE user_name_lowercase = ?;", [data.color, currentCon.toLowerCase()])
                .catch(() => console.log("efe"))
        } else if (data.type === "password") {
            changePassword(data.oldPwd, data.newPwd)
        } else {
            throw Error("owo")
        }
    })

    async function changePassword(oldPwd: string, newPwd: string) {
        const [rows, fields] = await mysqlCon.execute<any[]>("SELECT password FROM users WHERE user_name_lowercase = ? LIMIT 1;", [currentCon.toLowerCase()])
        const sqlPassword = rows[0].password
        if(sqlPassword === oldPwd) {
            mysqlCon.execute("UPDATE users SET password = ? WHERE user_name_lowercase = ?;", [newPwd, currentCon.toLowerCase()])
            connectionData.send({
                type: "password",
                ok: true
            })
        } else {
            connectionData.send ({
                type: "password",
                ok: false,
            })
        }
    }

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
        if (users[currentCon].online) {
            mysqlCon.execute("UPDATE users SET last_activity = ? WHERE user_name_lowercase = ?;", [new Date(), currentCon.toLowerCase()])
                .catch(() => console.log("efe"))
        }
        delete users[currentCon]
        userNumChange("minus")
        sendUserList()
    })
}
