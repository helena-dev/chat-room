const net = require("net");
let conNum = 0
let connections = []
let nicknames = []

const server = net.createServer(con => {    
    console.log(`Ha arribat una connexió! El seu número és ${conNum}.`)
    let currentCon = `"Foo${conNum}"`
    let bufCon = Buffer.from(currentCon)
    nicknames.push(currentCon)
    connections.push(con)
    conNum++
    con.write("Hewwo!\n" + `Ets l'usuari ${currentCon}\n`)
    if(nicknames.length > 1) {
        con.write("Els usuaris connectats són els següents:\n" + `${nicknames.filter(x => x !== currentCon).map(nick => ` - ${nick}`).join("\n")}\n`)

    } else {
        con.write("De moment ets l'únic usuari connectat. Quan entri algú més, un avis apareixerà a la pantalla.\n")

    }
    function sendToOthers(text) {
        connections.filter(x => x !== con).forEach(x => x.write(text))
    }
    sendToOthers(`Ha arribat l'usuari ${currentCon}\n`)

    function handleCommand(text) {
        const match = /^([a-z]+)(?: +([a-z ]+)?)?$/i.exec(text)
        if(match === null) {
            con.write("La comanda no és valida.\n") //TODO: Millorar missatge d'error
            return
        }
        const [command, arguments] = [match[1], match[2]]
        if(command === "nick") {
            if(!nicknames.includes(arguments)) {
                const oldNick = currentCon
                currentCon = `"${arguments}"`
                nicknames.push(currentCon)
                nicknames = nicknames.filter(x => x !== oldNick)
                sendToOthers(`L'usuari ${oldNick} s'ha canviat el nick a ${currentCon}.\n`)
                con.write(`El teu usuari és ara ${currentCon}.\n`)
            } else {
                con.write("Aquest nom d'usuari ja existeix.\n")
            }
        } 
        else if(command === "nickColor") {
            switch(arguments.toLowerCase()) {
                case "red":
                    const buf = Buffer.from([0x5e, 0x5b, 0x5b, 0x33, 0x31, 0x6d]);
                    bufCon = `${buf}${bufCon}`
                    break;
                case "green":
                    break;
                case "yellow":
                    break;
                case "blue":
                    break;
                case "magenta":
                    break;
                case "cyan":
                    break;
                case "white":
                    break;
                default:
                    con.write("Please select a valid color.\n")
            }
        } else{
            con.write("La comanda no és valida.\n")
        }
    }

    con.on("data", chunk => {
        console.log(`Han arribat dades. Connexió: ${currentCon}`)
        console.log(JSON.stringify(chunk.toString()))
        let input = chunk.toString().trim()
        if(input[0] === "/") {
            input = input.substring(1)
            handleCommand(input)
        } else {
            sendToOthers(`·${currentCon}: ${chunk}`)
        }
    })

    con.on("end",() => {
        console.log(`L'usuari ${currentCon} ha marxat. :(`)
        connections = connections.filter(x => x !== con)
        nicknames = nicknames.filter(x => x !== currentCon)
        sendToOthers(`Ha marxat l'usuari ${currentCon}\n`)
    })
})

server.listen(8000)

/*TODO:
- Constrasenyes
- Time stamps
- Log segons usuari
- Comanda de DMs
- Noms d'usuari amb colorines
*/