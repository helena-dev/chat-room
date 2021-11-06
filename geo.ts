const exceptionalReservationsToISO = {
    "Ascension Island": "AC",
    "Clipperton Island": "CP",
    "Island of Sark": "CQ",
    "Diego Garcia": "DG",
    "Ceuta": "EA",
    "Melilla": "EA",
    "Ceuta, Melilla": "EA",
    "European Union": "EU",
    "Eurozone": "EZ",
    "France, Metropolitan": "FX",
    "Canary Islands": "IC",
    "Union of Soviet Socialist Republics": "SU",
    "Tristan da Cunha": "TA",
    "United Kingdom": "UK",
    "United Nations": "UN",

}

function isoAlpha2ToSymbols(code: string): string {
    if (!/^[A-Z]{2}$/.test(code)) {
      throw Error('Must be an ISO 3166-1 alpha-2 code.')
    }
    const diff = 0x1F1E6 - 0x41
    return [...code].map(x => String.fromCodePoint(x.charCodeAt(0) + diff)).join('')
}

export {
    exceptionalReservationsToISO,
    isoAlpha2ToSymbols,
}