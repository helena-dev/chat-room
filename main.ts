import { IPinfo, IPinfoWrapper } from "node-ipinfo"
import { RawData, WebSocket, WebSocketServer } from "ws"
import { getMagicColorSequence, normalizeIP, decodeDataURL } from "./utils.js"
import type { BackMessage, FrontMessage, LoginRequest, ReceivedMessage, SignupRequest } from "./messages"
import { Pool, createPool } from 'mysql2/promise'
import { createServer } from "http"
import got from "got"
import bcrypt from "bcryptjs"

const { RECAPTCHA_PRIVATEKEY } = process.env
if (!RECAPTCHA_PRIVATEKEY) throw "Recaptcha private key needed.\r\n"

const isProduction = process.env.NODE_ENV === "production"

const saltRounds = 9

let ipinfo: IPinfoWrapper;
if (!process.env.IPINFO_TOKEN) {
    throw "IPinfo token does not exist.\r\n"
} else {
    ipinfo = new IPinfoWrapper(process.env.IPINFO_TOKEN)
}

interface ConnectionData {
    name: string
    cons: Map<number, { conSocket: WebSocket, currentIP: IPinfo, online: boolean, lastActivity: Date }>
    colorNum: number
    get cssColor(): string
    send(sockets: WebSocket, data: BackMessage): void
}

let conNum = 0
let users: { [key: string]: ConnectionData } = {}
let msgNum = 0
function generateMsgId() {
    return msgNum++
}

let mysqlPool: Pool;
if (!process.env.SQL_URL) {
    throw "SQL DB does not exist.\r\n"
} else {
    mysqlPool = createPool({ uri: process.env.SQL_URL })
}

const httpServer = createServer((request, response) => {
    response.statusCode = 200
    response.end("hello world\n")
})
httpServer.listen({ port: 8080 }, () => console.log("The server is up and running."))
const server = new WebSocketServer({ server: httpServer });

server.on("connection", (con, request) => {
    const socket = request.socket
    const normedIP = isProduction ?
        request.headers["x-forwarded-for"] as string :
        normalizeIP(socket.remoteAddress!)
    console.log(`A connection has arrived! Its number is ${conNum}.\nIts IP is: ${normedIP}`)
    const ipinfoPromise = ipinfo.lookupIp(normedIP)

    let completed = false
    function send(data: BackMessage) {
        con.send(JSON.stringify(data))
    }

    const getUserId = async (name: string): Promise<number> => {
        const [rows, fields] = await mysqlPool.execute<any[]>("SELECT id FROM users WHERE user_name_lowercase = ? LIMIT 1;", [name.toLowerCase()])
        return rows[0].id
    }

    const handleLogin = async (data: LoginRequest) => {
        const valid = await checkCredentials(data.userName, data.password)
        const connectionIpInfo = await ipinfoPromise
        send({
            type: "login",
            ok: valid,
        })
        if (valid && !completed) {
            const id = await getUserId(data.userName)
            completed = true
            con.off("message", messageHandler)
            handlePostLogin(con, connectionIpInfo, data.userName, id)
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
        if (!captchaVerifyResponse.success) {
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
            const id = await getUserId(data.userName)
            completed = true
            con.off("message", messageHandler)
            handlePostLogin(con, connectionIpInfo, data.userName, id)
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
    const [rows, fields] = await mysqlPool.execute<any[]>("SELECT password FROM users WHERE user_name_lowercase = ? LIMIT 1;", [userName.toLowerCase()])
    if (rows.length === 0) return false
    const sqlPassword = rows[0].password
    return await bcrypt.compare(password, sqlPassword)
}

async function addCredentials(userName: string, password: string) {
    if (!userName || !password) return -2
    const sqlPassword = await bcrypt.hash(password, saltRounds)
    try {
        await mysqlPool.execute("INSERT INTO users (user_name_lowercase, user_name, bkg_color, password, last_activity) VALUES (?, ?, ?, ?, ?);", [userName.toLowerCase(), userName, 857112, sqlPassword, new Date()])
        return 0
    } catch (err) {
        return (err as any).errno
    }
}

const handlePostLogin = (con: WebSocket, ipinfo: IPinfo, name: string, userId: number) => {
    const myConNum = conNum
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
        name,
        cons: new Map(),
        colorNum: findNum(colorNumSet),

        get cssColor() {
            if (name === process.env.SPECIAL_USER_COLOR) {
                return "orchid"
            }
            const pos = getMagicColorSequence(this.colorNum)
            return `hsl(${pos * 360}, 100%, 50%)`
        },
        send(socket, data: BackMessage) {
            socket.send(JSON.stringify(data))
        },
    }
    let oldColorNum: number | undefined = connectionData.colorNum
    let otherConnections
    if (users[userId]) {
        oldColorNum = users[userId].colorNum
        otherConnections = users[userId].cons.entries()
    }
    users[userId] = connectionData
    users[userId].cons = otherConnections ? new Map(otherConnections) : new Map()
    if (typeof oldColorNum === "number") users[userId].colorNum = oldColorNum
    users[userId].cons.set(myConNum, { conSocket: con, currentIP: ipinfo, online: true, lastActivity: new Date(), })

    async function changeName(text: string) {
        if (text.length > 20) return punish()
        if (Object.hasOwnProperty.call(users[userId], text)) return
        const oldName = users[userId].name
        try {
            await mysqlPool.execute("UPDATE users SET user_name_lowercase = ?, user_name = ? WHERE id = ?;", [text.toLowerCase(), text, userId])
            users[userId].name = text
            name = text
            sendUserList()
            const id = generateMsgId()
            for (const [targetUserId, targetConnectionData] of Object.entries(users)) {
                for (const socket of [...targetConnectionData.cons.values()].map(x => x.conSocket)) {
                    targetConnectionData.send(socket, {
                        type: "toast",
                        toast: "nickChange",
                        oldName,
                        newName: name,
                        own: parseInt(targetUserId) === userId,
                        msgNum: id,
                    })
                }
            }
        } catch (err) {
            console.log(err)
            return
        }
    }

    async function getRegisteredUsers(): Promise<{ user_name: string, id: string, last_activity: Date }[]> {
        const [rows, fields] = await mysqlPool.execute<any[]>("SELECT user_name, id, last_activity FROM users;") /* FIXME */
        return rows
    }

    async function sendUserList() {
        sendOwnCons()
        const registeredUsers = await getRegisteredUsers()
        for (const [targetUser, targetConnectionData] of Object.entries(users)) {
            for (const socket of [...targetConnectionData.cons.values()].map(x => x.conSocket)) {
                targetConnectionData.send(socket, {
                    type: "userList",
                    users: registeredUsers.map(user => {
                        const connected = Object.hasOwnProperty.call(users, user.id)
                        const userInfo = {
                            name: user.user_name,
                            connected,
                            own: `${user.id}` === targetUser
                        }
                        if (connected) {
                            const userData = users[`${user.id}`]
                            const lastActivity = [...userData.cons.values()].map(x => x.lastActivity).sort().slice(-1)[0].getTime()
                            const numLastActivity = (socket === con && `${userId}` === user.id) ? myConNum : [...userData.cons.entries()].filter(x => x[1].lastActivity.getTime() === lastActivity)[0][0]
                            const { region, countryCode, city } = userData.cons.get(numLastActivity)?.currentIP || {}
                            const { bogon } = (userData.cons.get(numLastActivity)?.currentIP as any || {})
                            const { cssColor } = userData
                            const online = [...userData.cons.values()].map(x => x.online).includes(true)
                            const ipInfo = {
                                region,
                                countryCode,
                                city,
                                bogon,
                            }
                            return { ...userInfo, lastActivity, online, cssColor, ipInfo }
                        } else {
                            const lastActivity = user.last_activity.getTime()
                            const online = false
                            return { ...userInfo, lastActivity, online }
                        }
                    })
                })
            }
        }
    }

    function userNumChange(sign: "plus" | "minus") {
        const id = generateMsgId()
        for (const [targetUserId, targetConnectionData] of Object.entries(users)) {
            const sockets = [...targetConnectionData.cons.values()].map(x => x.conSocket)
            for (const socket of sockets) {
                targetConnectionData.send(socket, {
                    type: "toast",
                    toast: "userChange",
                    sign,
                    name,
                    own: parseInt(targetUserId) === userId,
                    msgNum: id,
                })
            }
        }
    }

    function sendOwnCons() {
        if (users[userId]) {
            const sockets = [...users[userId].cons.values()].map(x => x.conSocket)
            for (const socket of sockets) {
                users[userId].send(socket, {
                    type: "ownCons",
                    connections: [...users[userId].cons.entries()].map(x => {
                        const { currentIP, online, lastActivity } = x[1]
                        const conNum = x[0]
                        const own = (socket === x[1].conSocket)
                        const data = { conNum, own, currentIP, online, lastActivity }
                        return data
                    })
                })
            }
        }
    }

    mysqlPool.execute<any[]>("SELECT bkg_color FROM users WHERE id = ?", [userId])
        .then(([rows, fields]) => {
            for (const socket of [...users[userId].cons.values()].map(x => x.conSocket)) {
                users[userId].send(socket, {
                    type: "bkgColor",
                    color: rows[0].bkg_color,
                })
            }
        }, () => console.log("efe"))
    sendUserList()
    if (users[userId].cons.size === 1) userNumChange("plus")

    con.on("message", chunk => {
        const data: FrontMessage = JSON.parse(chunk.toString())
        if (data.type === "message") {
            if (data.text.length > 5000) return punish()
            if (data.image) {
                const matches = decodeDataURL(data.image)
                if (!matches || !matches[0].startsWith("image/") || matches[1].length > 30 * 2 ** 20) return punish()
            }
            const id = generateMsgId()
            const messageData: ReceivedMessage = {
                type: "message",
                text: data.text,
                image: data.image,
                own: false,
                from: name,
                date: new Date(),
                cssColor: users[userId].cssColor,
                msgNum: id,
                replyNum: data.replyNum,
                edited: false,
            }
            for (const [targetUserId, targetConnectionData] of Object.entries(users)) {
                if (parseInt(targetUserId) !== userId) {
                    for (const socket of [...targetConnectionData.cons.values()].map(x => x.conSocket)) {
                        targetConnectionData.send(socket, {
                            ...messageData,
                            own: false,
                        })
                    }
                } else if (parseInt(targetUserId) === userId) {
                    const sockets = [...targetConnectionData.cons.values()].map(x => x.conSocket)
                    for (const socket of sockets) {
                        if (socket === con) {
                            targetConnectionData.send(socket, {
                                type: "ackMessage",
                                date: new Date(),
                                cssColor: users[userId].cssColor,
                                msgNum: id,
                                pseudoId: data.pseudoId
                            })
                        } else {
                            targetConnectionData.send(socket, {
                                ...messageData,
                                own: true,
                            })
                        }
                    }
                }
            }
        } else if (data.type === "userName") {
            changeName(data.text)
        } else if (data.type === "isOnline") {
            const date = new Date()
            users[userId].cons.set(myConNum, { conSocket: con, currentIP: ipinfo, online: data.online, lastActivity: date })
            if (!data.online) {
                mysqlPool.execute("UPDATE users SET last_activity = ? WHERE id = ?;", [date, userId])
                    .catch(() => console.log("efe"))
            }
            sendUserList()
        } else if (data.type === "typing") {
            for (const targetConnectionData of Object.values(users)) {
                for (const socket of [...targetConnectionData.cons.values()].map(x => x.conSocket)) {
                    targetConnectionData.send(socket, {
                        type: "typing",
                        from: name,
                    })
                }
            }
        } else if (data.type === "deleteMsg") {
            const msgId = data.msgNum
            for (const targetConnectionData of Object.values(users)) {
                for (const socket of [...targetConnectionData.cons.values()].map(x => x.conSocket)) {
                    targetConnectionData.send(socket, {
                        type: "deleteMsg",
                        msgNum: msgId,
                    })
                }
            }
        } else if (data.type === "edit") {
            for (const targetConnectionData of Object.values(users)) {
                for (const socket of [...targetConnectionData.cons.values()].map(x => x.conSocket)) {
                    targetConnectionData.send(socket, {
                        type: "edit",
                        msgNum: data.msgNum,
                        text: data.text,
                    })
                }
            }
        } else if (data.type === "bkgColor") {
            mysqlPool.execute("UPDATE users SET bkg_color = ? WHERE id = ?;", [data.color, userId])
                .catch(() => console.log("efe"))
            for (const socket of [...users[userId].cons.values()].map(x => x.conSocket).filter(x => x !== con)) {
                users[userId].send(socket, {
                    type: "bkgColor",
                    color: data.color,
                })
            }
        } else if (data.type === "password") {
            changePassword(data.oldPwd, data.newPwd)
        } else if (data.type === "deleteAccount") {
            deleteAccount(data.password)
        } else if (data.type === "deleteAccountYes") {
            [...users[userId].cons.values()].map(x => x.conSocket).forEach(x => x.close())
            mysqlPool.execute("DELETE FROM users WHERE id = ?;", [userId])
        } else {
            throw Error("owo")
        }
    })

    async function changePassword(oldPwd: string, newPwd: string) {
        const [rows, fields] = await mysqlPool.execute<any[]>("SELECT password FROM users WHERE id = ? LIMIT 1;", [userId])
        const sqlPassword = rows[0].password
        if (await bcrypt.compare(oldPwd, sqlPassword)) {
            const newHash = await bcrypt.hash(newPwd, saltRounds)
            mysqlPool.execute("UPDATE users SET password = ? WHERE id = ?;", [newHash, userId])
            connectionData.send(con, {
                type: "password",
                ok: true
            })
        } else {
            connectionData.send(con, {
                type: "password",
                ok: false,
            })
        }
    }

    async function deleteAccount(password: string) {
        const [rows, fields] = await mysqlPool.execute<any[]>("SELECT password FROM users WHERE id = ? LIMIT 1;", [userId])
        const sqlPassword = rows[0].password
        if (await bcrypt.compare(password, sqlPassword)) {
            connectionData.send(con, {
                type: "deleteConfirmation",
            })
        } else {
            connectionData.send(con, {
                type: "password",
                ok: false,
            })
        }
    }

    function punish() {
        const id = generateMsgId()
        for (const socket of [...users[userId].cons.values()].map(x => x.conSocket)) {
            connectionData.send(socket, {
                type: "toast",
                toast: "punish",
                text: "Don't mess with the code. Bye.",
                msgNum: id,
            })
        }
        con.close()
    }

    const close = () => {
        con.off("close", close)
        con.off("error", close)
        if (users[userId].cons.size === 1) {
            if (users[userId].cons.get(myConNum)?.online) {
                mysqlPool.execute("UPDATE users SET last_activity = ? WHERE id = ?;", [new Date(), userId])
                    .catch(() => console.log("efe"))
            }
            console.log(`User ${name} has left. :(`)
            delete users[userId]
            userNumChange("minus")
        } else {
            users[userId].cons.delete(myConNum)
        }

        sendUserList()
    }

    con.on("close", close)
    con.on("error", close)

}
