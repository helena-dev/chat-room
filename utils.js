const EventEmitter = require("events")

function randomInt(start, end) {
    return Math.floor(Math.random()*(end+1-start)+start)
}

function filterEscapeCode (text) {
    const isAllowed = x => x.charCodeAt(0) >= 0x20 && x.charCodeAt(0) !== 0x7F
    return text.split("").filter(isAllowed).join("")
}

class LineSplitter extends EventEmitter {
    constructor() {
        super()
        this.chunkBuffer = Buffer.from([])
    }

    recieveChunk(rawChunk) {
        this.chunkBuffer = Buffer.concat([this.chunkBuffer, rawChunk])
        for(let i = 0; i < this.chunkBuffer.length; i++) {
            if(this.chunkBuffer[i] == 0x0A || this.chunkBuffer[i] == 0x0D) {
                this.emit("line", this.chunkBuffer.slice(0,i))
                this.chunkBuffer = this.chunkBuffer.slice(i+1, this.chunkBuffer.length)
                this.chunkBuffer = Buffer.from([])
                i = -1
            }
        }
    }
}

function normalizeIP(text) {
    text = text.toLowerCase()
    const match = /^::ffff:((?:\d+\.){3}\d+)$/.exec(text)
    return match ? match[1] : text
}

const CSI = '\u001b['
const SGR = x => CSI + x + 'm'

function unbreakLines(text, num) {
    const saveCursor = CSI + 's'
    const restoreCursor = CSI + 'u'
    const cursorUp = CSI + num + 'A'
    const cursorDown = CSI + num + 'B'
    const insertLineUp = CSI + num + "L"
    let rn;
    rn = "\r\n".repeat(num)
    return `${saveCursor}${rn}${cursorUp}${insertLineUp}${text}${restoreCursor}${cursorDown}`

}

function wrapText(text) {
    const length = text.length
    const lineLength = 30
    const padNum = 8
    const numLines = (length>(lineLength-padNum) && length<=lineLength) ? 2 : Math.ceil(length/(lineLength))
    const textArray = text.split("")
    const wrappedText = []
    const endPadding = padNum
    for(let i = 0; i < numLines; i++) {
        let padding = (!i) ? 0 : padNum
        let newLine = textArray.slice(i*lineLength-padding,(i+1)*lineLength-endPadding)
        newLine.push("\r\n")
        if(i!=0) newLine.unshift(" ".repeat(padding));
        wrappedText.push(newLine)
    }
    wrappedText[wrappedText.length-1].pop()
    const wrappedString = wrappedText.flat().join("")
    return [wrappedString, numLines]
}

module.exports = {
    randomInt,
    filterEscapeCode,
    LineSplitter,
    normalizeIP,
    CSI,
    SGR,
    unbreakLines,
    wrapText,
}
