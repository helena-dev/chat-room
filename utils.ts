import EventEmitter from "events"

function randomInt(start: number, end: number): number {
    return Math.floor(Math.random() * (end + 1 - start) + start)
}

function filterEscapeCode(text: string): string {
    const isAllowed = (x: number) => x >= 0x20 && x !== 0x7F
    return text.split("").filter(x => isAllowed(x.charCodeAt(0))).join("")
}

class LineSplitter extends EventEmitter {
    chunkBuffer: Buffer

    constructor() {
        super()
        this.chunkBuffer = Buffer.from([])
    }

    recieveChunk(rawChunk: Buffer) {
        this.chunkBuffer = Buffer.concat([this.chunkBuffer, rawChunk])
        for (let i = 0; i < this.chunkBuffer.length; i++) {
            if (this.chunkBuffer[i] == 0x0A || this.chunkBuffer[i] == 0x0D) {
                this.emit("line", this.chunkBuffer.slice(0, i))
                this.chunkBuffer = this.chunkBuffer.slice(i + 1, this.chunkBuffer.length)
                this.chunkBuffer = Buffer.from([])
                i = -1
            }
        }
    }
}

function getMagicColorSequence(i: number): number {
    if (i === 0) return 0
    const nearest = 2 ** Math.floor(Math.log2(i))
    return (1 + 2 * (i - nearest)) / (2 * nearest)
}

function normalizeIP(text: string): string {
    text = text.toLowerCase()
    const match = /^::ffff:((?:\d+\.){3}\d+)$/.exec(text)
    return match ? match[1] : text
}

const CSI = '\u001b['
const SGR = (x: string | number): string => CSI + x + 'm'

function unbreakLines(text: string, num: number): string {
    const saveCursor = CSI + 's'
    const restoreCursor = CSI + 'u'
    const cursorUp = CSI + num + 'A'
    const cursorDown = CSI + num + 'B'
    const insertLineUp = CSI + num + "L"
    const rn = "\r\n".repeat(num)
    return `${saveCursor}${rn}${cursorUp}${insertLineUp}${text}${restoreCursor}${cursorDown}`

}

function wrapText(text: string): [string, number] {
    const length = text.length
    const lineLength = 30
    const padNum = 8
    const numLines = (length > (lineLength - padNum) && length <= lineLength) ? 2 : Math.ceil(length / (lineLength))
    const textArray = text.split("")
    const wrappedText = []
    const endPadding = padNum
    for (let i = 0; i < numLines; i++) {
        let padding = (!i) ? 0 : padNum
        let newLine = textArray.slice(i * lineLength - padding, (i + 1) * lineLength - endPadding)
        newLine.push("\r\n")
        if (i != 0) newLine.unshift(" ".repeat(padding));
        wrappedText.push(newLine)
    }
    wrappedText[wrappedText.length - 1].pop()
    const wrappedString = wrappedText.flat().join("")
    return [wrappedString, numLines]
}

function encodeDataURL(mime: string, bytes: Buffer): string {
    const url = "data:" + mime + ";base64," + bytes.toString("base64")
    return url
}

function decodeDataURL(url: string): [string, Buffer] | undefined {
    const match = /^data:([^,]+);base64,(.+)$/.exec(url)
    if (match) return [match[1], Buffer.from(match[2], 'base64')]
}

export {
    randomInt,
    filterEscapeCode,
    LineSplitter,
    normalizeIP,
    CSI,
    SGR,
    unbreakLines,
    wrapText,
    getMagicColorSequence,
    encodeDataURL,
    decodeDataURL,
}
