const GS = '\u001d';

export function isChestnyZnak(raw: string): boolean {
    if (!raw) return false;
    
    // 1. Убираем AIM-идентификатор, если есть (]d2, ]d0 и т.д.)
    let s = raw.replace(/^\]d[0-9]/, '');
    
    // 2. Убираем все служебные символы GS (и другие невидимые разделители) из строки
    // Оставляем только буквы, цифры и спецсимволы (без GS)
    s = s.replace(/[\u001d\u001e\u0004]/g, '');

    // 3. Проверяем маску для электроники (длинная или короткая)
    // 01 + 14 цифр + 21 + 20 символов + (91 + 4 + 92 + 44) ИЛИ (93 + 4)
    const m = /^01(\d{14})21(.{20})(91(.{4})92(.{44})|93(.{4}))$/.exec(s);
    
    if (!m) return false;

    const gtin = m[1];
    const serial = m[2];

    // Проверка контрольной цифры GTIN
    let sum = 0;
    for (let i = 0; i < 13; i++) sum += Number(gtin[i]) * (i % 2 === 0 ? 3 : 1);
    const checkDigit = (10 - (sum % 10)) % 10;
    if (checkDigit !== Number(gtin[13])) return false;

    // Проверка кода страны ЕАЭС (первый символ серийника)
    // В твоем примере серийник начинается на 5 (Россия)
    if (!'12345E'.includes(serial[0])) return false;

    return true;
}