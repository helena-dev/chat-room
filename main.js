const net = require("net");
let conNum = 0
let users = {}

const server = net.createServer(con => {
    console.log(`Ha arribat una connexió! El seu número és ${conNum}.`)
    let currentCon = `Foo${conNum}`
    users[currentCon] = {
        terminalNick: {
            color: randomInt(0x31, 0x36)
        },
        connection: con,
        lastActivity: new Date()
    }
    conNum++
    con.write("Hewwo!\r\n" + `Ets l'usuari ${formatTerminalNick()}.\r\n` + 'Input "/help" to get the help message for the different commands.\r\n')
    printUserList()
    function sendToOthers(text) {
        const connections = Object.values(users).map(x => x.connection)
        connections.filter(x => x !== con).forEach(x => x.write(text))
    }
    sendToOthers(`Ha arribat l'usuari ${currentCon}\r\n`)

    function randomInt(start, end) {
        return Math.floor(Math.random()*(end+1-start)+start)
    }

    function printUserList() {
        const otherNicks = Object.keys(users).filter(x => x !== currentCon)
        const formatEntry = nick => ` - ${formatTerminalNick(nick)} (Last Active on: ${formatDate(users[nick].lastActivity)})`;
        if(otherNicks != 0) {
            con.write("Els usuaris connectats són els següents:\r\n" + `${otherNicks.map(formatEntry).join("\r\n")}\r\n`)
        } else {
            con.write("De moment ets l'únic usuari connectat. Quan entri algú més, un avis apareixerà a la pantalla.\r\n")
        }
    }

    function colorToByte(text) {
        text = text.toLowerCase()
        const colorMappings = {
            red: 0x31,
            green: 0x32,
            yellow: 0x33,
            blue: 0x34,
            magenta: 0x35,
            cyan: 0x36,
            white: 0x37,
        }
        if(text in colorMappings) {
            return colorMappings[text]
        } else {
            con.write("Please select a valid color.\r\n")
        }
    }

    function formatTerminalNick(userNick = currentCon) {
        const normalBuf = Buffer.from([0x1b, 0x5b, 0x30, 0x6d])
        const buf = Buffer.from([0x1b, 0x5b, 0x33, users[userNick].terminalNick.color, 0x6d])
        return `${buf}"${userNick}"${normalBuf}`
    }

    function formatDate(preformatDate) {
        return `[${preformatDate.getHours()}:${preformatDate.getMinutes()}]`
    }

    function handleCommand(text) {
        const match = /^([a-z]+)(?: +([a-z 0-9]+)?)?$/i.exec(text)
        if(match === null) {
            con.write("La comanda no és valida.\r\n") //TODO: Millorar missatge d'error
            return
        }
        const [command, arguments] = [match[1], match[2]]
        if(command === "nick") {
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
        } 
        else if(command === "nickColor") {
            const color = colorToByte(arguments)
            if(color) {
                users[currentCon].terminalNick.color = color
            }
        } else if(command === "help") {
            con.write("·/nick [newNick]: Used to change your nick. Two users cannot have the same nick.\r\n")
            con.write("·/nickColor [newColor]: Used to change your nick's color. The available colors are: red, green, yellow, blue, magenta, cyan, and white.\r\n")
            con.write("·/users: Prints the list of connected users (other than oneself).\r\n")
            con.write("·/help: Shows and describes the available commands.\r\n")
        } else if(command === "users") {
            printUserList()
        } else{
            con.write("La comanda no és valida.\r\n")
        }
    }


    con.on("data", chunk => {
        date = new Date()
        users[currentCon].lastActivity = date
        console.log(`Han arribat dades. Connexió: ${currentCon}`)
        console.log(JSON.stringify(chunk.toString()))
        let input = chunk.toString().trim()
        if(input[0] === "/") {
            input = input.substring(1)
            handleCommand(input)
        } else {
            sendToOthers(`·${formatDate(date)} ${formatTerminalNick()}: ${input}\r\n`)
        }
    })

    con.on("end",() => {
        console.log(`L'usuari ${currentCon} ha marxat. :(`)
        sendToOthers(`Ha marxat l'usuari ${formatTerminalNick()}\r\n`)
        delete users[currentCon]
    })
})

server.listen(8000)

/*TODO:
- Constrasenyes
- better format for oneself
- Log segons usuari
- Comanda de DMs
*/