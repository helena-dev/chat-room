
export function randomInt(start: number, end: number): number {
    return Math.floor(Math.random() * (end + 1 - start) + start)
}

export function formatDate(preformatDate: Date): string {
    const formatNum = (x: number) => x.toString().padStart(2, "0")
    return `${formatNum(preformatDate.getHours())}:${formatNum(preformatDate.getMinutes())}`
}

export function assertUnreachable(): never {
    throw Error("Unreachable code. Prolly a bug and stuff.")
}

export function rgbToHex([r, g, b]: number[]): number {
    const hex = (r << 16) | (g << 8) | b
    return hex
}

export function hexToRgb(hex: number): number[] {
    const r = hex >> 16
    const g = (hex >> 8) & 0b11111111
    const b = hex & 0b11111111
    return [r,g,b]
}
