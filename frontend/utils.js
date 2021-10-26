
export function randomInt(start, end) {
    return Math.floor(Math.random()*(end+1-start)+start)
}

export function formatDate(preformatDate) {
    const formatNum = x => x.toString().padStart(2, "0")
    return `${formatNum(preformatDate.getHours())}:${formatNum(preformatDate.getMinutes())}`
}

