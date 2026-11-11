const GS = '\u001d'
export function isChestnyZnak(raw: string): boolean {
    if (!raw) return false
    let s = raw.replace(/^\]d[0-9]/, '')
    if (s.startsWith(GS)) s = s.slice(1)
    const m = /^01(\d{14})21(.{20})(91(.{4})92(.{44})|93(.{4}))$/.exec(s);
    if (!m) return false
    const gtin = m[1]
    const serial = m[2]

    let sum = 0
    for (let i=0; i<13; i++) sum += Number(gtin[i]) * (i%2 === 0? 3 : 1)
    const checkDigit = (10 - (sum % 10)) % 10
    if (checkDigit !== Number(gtin[13])) return false
    if (!'12345'.includes(serial[0])) return false
    return true
}