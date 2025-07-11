/**
 * Test cases for LaTeX to Unicode conversion
 * Based on unicodeit functionality
 */

// Import or use the global converter
const LaTeXConverter = require('./converter.js');
const converter = new LaTeXConverter();

// Test functions
function test_superscript_12() {
    const result = converter.convertToUnicode('a^{12}');
    const expected = 'a¹²';
    console.assert(result === expected, `Expected '${expected}', got '${result}'`);
    console.log('✓ test_superscript_12 passed');
}

function test_superscript_minus1() {
    const result = converter.convertToUnicode('cm^{-1}');
    const expected = 'cm⁻¹';
    console.assert(result === expected, `Expected '${expected}', got '${result}'`);
    console.log('✓ test_superscript_minus1 passed');
}

function test_subscript_12() {
    const result = converter.convertToUnicode('a_{12}');
    const expected = 'a₁₂';
    console.assert(result === expected, `Expected '${expected}', got '${result}'`);
    console.log('✓ test_subscript_12 passed');
}

function test_subscript_minus1() {
    const result = converter.convertToUnicode('cm_{-1}');
    const expected = 'cm₋₁';
    console.assert(result === expected, `Expected '${expected}', got '${result}'`);
    console.log('✓ test_subscript_minus1 passed');
}

function test_complex_expression_with_delimiters() {
    const result = converter.convertToUnicode('\\sqrt{1 + \\left( \\sqrt{3} - \\sqrt{\\dfrac{\\pi}{2}} \\right)^{2}}');
    const expected = '√{1 + ( √{3} - √{π/2} )²}';
    console.assert(result === expected, `Expected '${expected}', got '${result}'`);
    console.log('✓ test_complex_expression_with_delimiters passed');
}

// Run all tests
function runTests() {
    console.log('Running LaTeX to Unicode conversion tests...\n');
    
    try {
        test_superscript_12();
        test_superscript_minus1();
        test_subscript_12();
        test_subscript_minus1();
        test_complex_expression_with_delimiters();
        
        console.log('\n✅ All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run tests if this file is executed directly
if (typeof module !== 'undefined' && require.main === module) {
    runTests();
} else if (typeof window !== 'undefined') {
    // For browser environment
    window.runTests = runTests;
}

// Export for potential use in other test files
if (typeof module !== 'undefined') {
    module.exports = {
        test_superscript_12,
        test_superscript_minus1,
        test_subscript_12,
        test_subscript_minus1,
        test_complex_expression_with_delimiters,
        runTests
    };
}