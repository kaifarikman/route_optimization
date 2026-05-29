export function russianPlural(count, forms) {
    const absCount = Math.abs(count);
    const lastTwoDigits = absCount % 100;
    const lastDigit = absCount % 10;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return forms[2];
    }
    if (lastDigit === 1) {
        return forms[0];
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
        return forms[1];
    }
    return forms[2];
}

export function pointWord(count) {
    return russianPlural(count, ["точка", "точки", "точек"]);
}

export function generatedPointsMessage(count) {
    const verb = russianPlural(count, ["Сгенерирована", "Сгенерированы", "Сгенерировано"]);
    return `${verb} ${count} ${pointWord(count)}`;
}
