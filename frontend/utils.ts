
export function randomInt(start: number, end: number): number {
    return Math.floor(Math.random()*(end+1-start)+start)
}

export function formatDate(preformatDate: Date): string {
    const formatNum = (x: number) => x.toString().padStart(2, "0")
    return `${formatNum(preformatDate.getHours())}:${formatNum(preformatDate.getMinutes())}`
}

