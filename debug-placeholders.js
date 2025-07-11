const text = '\\sqrt{$1} $0';
console.log('Original text:', text);

// Simulate the placeholder processing
const placeholderRegex = /\$(\d+)/g;
let match;
while ((match = placeholderRegex.exec(text)) !== null) {
    console.log('Found placeholder:', match[0], 'at position', match.index, 'number:', match[1]);
}

console.log('\nText breakdown:');
for (let i = 0; i < text.length; i++) {
    console.log(`Position ${i}: '${text[i]}'`);
}