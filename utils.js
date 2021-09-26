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
            if(this.chunkBuffer[i] == 0x0A) {
                this.emit("line", this.chunkBuffer.slice(0,i))
                this.chunkBuffer = this.chunkBuffer.slice(i+1, this.chunkBuffer.length)
                this.chunkBuffer = Buffer.from([])
                i = -1
            }
        }
    }
}

const CSI = '\u001b['
const SGR = x => CSI + x + 'm'

module.exports = {
    randomInt,
    filterEscapeCode,
    LineSplitter,
    CSI,
    SGR,
}
