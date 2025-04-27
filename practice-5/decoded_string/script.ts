function hexToAscii(hex: string): string {
    if (hex.length % 2 !== 0) {
        throw new Error('Hex string length must be even.');
    }

    let ascii = '';

    for (let i = 0; i < hex.length; i += 2) {
        const hexByte = hex.slice(i, i + 2);
        const decimal = parseInt(hexByte, 16);
        ascii += String.fromCharCode(decimal);
    }

    return ascii;
}

const hexString = "4920616D206E6F7420612068616D73746572";
//   const result = hexToAscii(hexString);
//   console.log(result);

const buffer = Buffer.from(hexString, 'hex');
console.log(buffer.toString('utf-8'));