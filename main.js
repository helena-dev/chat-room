const net = require("net");
let conNum = 0
let users = {}

const CSI = '\u001b['
const SGR = x => CSI + x + 'm'

const server = net.createServer(con => {
    console.log(`Ha arribat una connexió! El seu número és ${conNum}.`)
    let currentCon = `Foo${conNum}`
    users[currentCon] = {
        terminalNick: {
            color: randomInt(31, 36)
        },
        connection: con,
        lastActivity: new Date()
    }
    conNum++
    con.write("Hewwo!\r\n" + `Ets l'usuari ${formatTerminalNick()}.\r\n` + 'Input "/help" to get the help message for the different commands.\r\n')
    printUserList()
    con.write("\r\n")
    function sendToOthers(text) {
        const connections = Object.values(users).map(x => x.connection)
        connections.filter(x => x !== con).forEach(x => x.write(text))
    }
    sendToOthers(`Ha arribat l'usuari ${formatTerminalNick()}\r\n`)

    function randomInt(start, end) {
        return Math.floor(Math.random()*(end+1-start)+start)
    }

    function filterEscapeCode (text) {
        const isAllowed = x => x.charCodeAt(0) >= 0x20 && x.charCodeAt(0) !== 0x7F
        return text.split("").filter(isAllowed).join("")
    }

    function printUserList() {
        const otherNicks = Object.keys(users).filter(x => x !== currentCon)
        const formatEntry = nick => ` - ${formatTerminalNick(nick)} (Last Active on: ${formatDate(users[nick].lastActivity)})`;
        if(otherNicks != "") {
            con.write("Els usuaris connectats són els següents:\r\n" + `${otherNicks.map(formatEntry).join("\r\n")}\r\n`)
        } else {
            con.write("De moment ets l'únic usuari connectat. Quan entri algú més, un avis apareixerà a la pantalla.\r\n")
        }
    }

    function colorToByte(text) {
        text = text.toLowerCase()
        const colorMappings = {
            red: 31,
            green: 32,
            yellow: 33,
            blue: 34,
            magenta: 35,
            cyan: 36,
            white: 37,
        }
        if(text in colorMappings) {
            return colorMappings[text]
        } else {
            con.write("Please select a valid color.\r\n")
        }
    }

    function formatTerminalNick(userNick = currentCon) {
        const normalBuf = `${SGR(0)}`
        const buf = `${SGR(users[userNick].terminalNick.color)}`
        const bold = `${SGR(1)}`
        return `${bold}${buf}"${userNick}"${normalBuf}`
    }

    function formatDate(preformatDate) {
        const formatNum = x => x.toString().padStart(2, "0")
        return `${SGR(colorToByte("cyan"))}[${formatNum(preformatDate.getHours())}:${formatNum(preformatDate.getMinutes())}]${SGR(0)}`
    }

    function handleCommand(text) {
        const match = /^([a-z]+)(?: +([a-z 0-9]+)?)?$/i.exec(text)
        if(match === null) {
            con.write("La comanda no és valida.\r\n") //TODO: Millorar missatge d'error
            return
        }
        const [command, arguments] = [match[1], match[2]]
        if(command === "nick") {
            if(arguments) {
                if(arguments.length <= 20) {
                    const oldTerminalNick = formatTerminalNick()
                    const newNick = `${arguments}`            
                    if(!(newNick in users)) {
                        users[newNick] = users[currentCon]
                        delete users[currentCon]
                        currentCon = newNick
                        sendToOthers(`L'usuari ${oldTerminalNick} s'ha canviat el nick a ${formatTerminalNick()}.\r\n`)
                        con.write(`El teu usuari és ara ${formatTerminalNick()}.\r\n`)
                    } else {
                        con.write("Aquest nom d'usuari ja existeix.\r\n")
                    }
                } else if (arguments.length > 20) {
                    con.write("The maximum length of the nick is 20 characters.\r\n")
                }
            } else {
                con.write("The nick has to contain characters other than just whitespace.\r\n")
            }
        } else if(command === "nickColor") {
            if(arguments) {
                const color = colorToByte(arguments)
                if(color) {
                    users[currentCon].terminalNick.color = color
                }
            } else {
                con.write("The color name has to contain characters other than just whitespace.\r\n")
            }
        } else if(command === "help") {
            con.write(` · ${SGR(1)}/nick [newNick]${SGR(0)}: Used to change your nick. Two users cannot have the same nick.\r\n`)
            con.write(` · ${SGR(1)}/nickColor [newColor]${SGR(0)}: Used to change your nick's color. The available colors are: red, green, yellow, blue, magenta, cyan, and white.\r\n`)
            con.write(` · ${SGR(1)}/users${SGR(0)}: Prints the list of connected users (other than oneself).\r\n`)
            con.write(` · ${SGR(1)}/buzz${SGR(0)}: Send a bell sound to the other users.\r\n`)
            con.write(` · ${SGR(1)}/help${SGR(0)}: Shows and describes the available commands.\r\n`)
        } else if(command === "users") {
            printUserList()
        } else if (command === "buzz") {
            sendToOthers("\u0007")
        } else{
            con.write("La comanda no és valida.\r\n")
        }
    }
    
    let chunkBuffer = Buffer.from([])
    con.on("data", chunk => {
        chunkBuffer = Buffer.concat([chunkBuffer, chunk])
        console.log(`Han arribat dades. Connexió: ${currentCon}`)
        recieveChunk(chunkBuffer)
    })
    
    function recieveChunk(rawChunk) {
        for(i = 0; i < rawChunk.length; i++) {
            if(rawChunk[i] == 0x0A) {
                handleLine(rawChunk.slice(0,i))
                rawChunk = rawChunk.slice(i+1, rawChunk.length)
                chunkBuffer = Buffer.from([])
                i = -1
            }
        }
    }

    function handleLine(chunkLine) {
        let date = new Date()
        users[currentCon].lastActivity = date
        console.log(JSON.stringify(chunkLine.toString()))
        let input = chunkLine.toString().trim()
        if(input[0] === "/") {
            input = input.substring(1)
            handleCommand(input)
        } else if(input != []) {
            if(input.length <= 2000) {
                sendToOthers(`${formatDate(date)} ${formatTerminalNick()}: ${filterEscapeCode(input)}\r\n`)
            } else {
                con.write("Messages have a maximim length of 2000 characters.\r\n")
            }
        }
    }

    con.on("end",() => {
        console.log(`L'usuari ${currentCon} ha marxat. :(`)
        sendToOthers(`Ha marxat l'usuari ${formatTerminalNick()}\r\n`)
        delete users[currentCon]
    })
})

server.listen(8000)