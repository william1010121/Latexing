/**
 * LaTeX to Unicode Converter
 * Based on unicodeit by Sven Kreiss (https://github.com/svenkreiss/unicodeit)
 * MIT License
 */

class LaTeXConverter {
    constructor() {
        this.symbols = new Map([
            // Greek letters (lowercase)
            ['\\alpha', 'α'],
            ['\\beta', 'β'],
            ['\\gamma', 'γ'],
            ['\\delta', 'δ'],
            ['\\epsilon', 'ε'],
            ['\\varepsilon', 'ε'],
            ['\\zeta', 'ζ'],
            ['\\eta', 'η'],
            ['\\theta', 'θ'],
            ['\\vartheta', 'ϑ'],
            ['\\iota', 'ι'],
            ['\\kappa', 'κ'],
            ['\\lambda', 'λ'],
            ['\\mu', 'μ'],
            ['\\nu', 'ν'],
            ['\\xi', 'ξ'],
            ['\\omicron', 'ο'],
            ['\\pi', 'π'],
            ['\\varpi', 'ϖ'],
            ['\\rho', 'ρ'],
            ['\\varrho', 'ϱ'],
            ['\\sigma', 'σ'],
            ['\\varsigma', 'ς'],
            ['\\tau', 'τ'],
            ['\\upsilon', 'υ'],
            ['\\phi', 'φ'],
            ['\\varphi', 'φ'],
            ['\\chi', 'χ'],
            ['\\psi', 'ψ'],
            ['\\omega', 'ω'],

            // Greek letters (uppercase)
            ['\\Alpha', 'Α'],
            ['\\Beta', 'Β'],
            ['\\Gamma', 'Γ'],
            ['\\Delta', 'Δ'],
            ['\\Epsilon', 'Ε'],
            ['\\Zeta', 'Ζ'],
            ['\\Eta', 'Η'],
            ['\\Theta', 'Θ'],
            ['\\Iota', 'Ι'],
            ['\\Kappa', 'Κ'],
            ['\\Lambda', 'Λ'],
            ['\\Mu', 'Μ'],
            ['\\Nu', 'Ν'],
            ['\\Xi', 'Ξ'],
            ['\\Omicron', 'Ο'],
            ['\\Pi', 'Π'],
            ['\\Rho', 'Ρ'],
            ['\\Sigma', 'Σ'],
            ['\\Tau', 'Τ'],
            ['\\Upsilon', 'Υ'],
            ['\\Phi', 'Φ'],
            ['\\Chi', 'Χ'],
            ['\\Psi', 'Ψ'],
            ['\\Omega', 'Ω'],

            // Mathematical operators
            ['\\sum', '∑'],
            ['\\prod', '∏'],
            ['\\int', '∫'],
            ['\\oint', '∮'],
            ['\\iint', '∬'],
            ['\\iiint', '∭'],
            ['\\partial', '∂'],
            ['\\nabla', '∇'],
            ['\\infty', '∞'],
            ['\\pm', '±'],
            ['\\mp', '∓'],
            ['\\times', '×'],
            ['\\div', '÷'],
            ['\\cdot', '·'],
            ['\\bullet', '•'],
            ['\\ast', '*'],
            ['\\star', '⋆'],
            ['\\circ', '∘'],
            ['\\oplus', '⊕'],
            ['\\ominus', '⊖'],
            ['\\otimes', '⊗'],
            ['\\oslash', '⊘'],
            ['\\odot', '⊙'],

            // Relations
            ['\\le', '≤'],
            ['\\leq', '≤'],
            ['\\ge', '≥'],
            ['\\geq', '≥'],
            ['\\ne', '≠'],
            ['\\neq', '≠'],
            ['\\equiv', '≡'],
            ['\\approx', '≈'],
            ['\\sim', '∼'],
            ['\\simeq', '≃'],
            ['\\cong', '≅'],
            ['\\propto', '∝'],
            ['\\perp', '⊥'],
            ['\\parallel', '∥'],
            ['\\in', '∈'],
            ['\\notin', '∉'],
            ['\\ni', '∋'],
            ['\\subset', '⊂'],
            ['\\supset', '⊃'],
            ['\\subseteq', '⊆'],
            ['\\supseteq', '⊇'],
            ['\\cup', '∪'],
            ['\\cap', '∩'],
            ['\\setminus', '∖'],
            ['\\emptyset', '∅'],
            ['\\varnothing', '∅'],

            // Arrows
            ['\\to', '→'],
            ['\\rightarrow', '→'],
            ['\\leftarrow', '←'],
            ['\\leftrightarrow', '↔'],
            ['\\Rightarrow', '⇒'],
            ['\\Leftarrow', '⇐'],
            ['\\Leftrightarrow', '⇔'],
            ['\\uparrow', '↑'],
            ['\\downarrow', '↓'],
            ['\\updownarrow', '↕'],
            ['\\nearrow', '↗'],
            ['\\searrow', '↘'],
            ['\\swarrow', '↙'],
            ['\\nwarrow', '↖'],
            ['\\mapsto', '↦'],
            ['\\longmapsto', '⟼'],
            ['\\longrightarrow', '⟶'],
            ['\\longleftarrow', '⟵'],
            ['\\longleftrightarrow', '⟷'],

            // Logic
            ['\\land', '∧'],
            ['\\lor', '∨'],
            ['\\lnot', '¬'],
            ['\\neg', '¬'],
            ['\\forall', '∀'],
            ['\\exists', '∃'],
            ['\\nexists', '∄'],
            ['\\top', '⊤'],
            ['\\bot', '⊥'],
            ['\\vdash', '⊢'],
            ['\\dashv', '⊣'],
            ['\\vDash', '⊨'],
            ['\\models', '⊨'],

            // Miscellaneous
            ['\\sqrt', '√'],
            ['\\angle', '∠'],
            ['\\triangle', '△'],
            ['\\square', '□'],
            ['\\lozenge', '◊'],
            ['\\clubsuit', '♣'],
            ['\\diamondsuit', '♦'],
            ['\\heartsuit', '♥'],
            ['\\spadesuit', '♠'],
            ['\\flat', '♭'],
            ['\\natural', '♮'],
            ['\\sharp', '♯'],
            ['\\checkmark', '✓'],
            ['\\dag', '†'],
            ['\\ddag', '‡'],
            ['\\S', '§'],
            ['\\P', '¶'],
            ['\\copyright', '©'],
            ['\\pounds', '£'],
            ['\\euro', '€'],
            ['\\yen', '¥'],
            ['\\cent', '¢'],
            ['\\degree', '°'],
            ['\\prime', '′'],
            ['\\dprime', '″'],
            ['\\tprime', '‴'],
            ['\\backprime', '‵'],
            ['\\dots', '…'],
            ['\\ldots', '…'],
            ['\\cdots', '⋯'],
            ['\\vdots', '⋮'],
            ['\\ddots', '⋱'],
            ['\\hbar', 'ℏ'],
            ['\\ell', 'ℓ'],
            ['\\wp', '℘'],
            ['\\Re', 'ℜ'],
            ['\\Im', 'ℑ'],
            ['\\aleph', 'ℵ'],
            ['\\beth', 'ℶ'],
            ['\\gimel', 'ℷ'],
            ['\\daleth', 'ℸ'],

            // Brackets and delimiters
            ['\\langle', '⟨'],
            ['\\rangle', '⟩'],
            ['\\lceil', '⌈'],
            ['\\rceil', '⌉'],
            ['\\lfloor', '⌊'],
            ['\\rfloor', '⌋'],
            ['\\lbrace', '{'],
            ['\\rbrace', '}'],
            ['\\lbrack', '['],
            ['\\rbrack', ']'],
            ['\\lparen', '('],
            ['\\rparen', ')'],
            ['\\|', '‖'],
            ['\\vert', '|'],
            ['\\Vert', '‖'],

            // Accents and diacritics
            ['\\hat', '^'],
            ['\\check', 'ˇ'],
            ['\\breve', '˘'],
            ['\\acute', '´'],
            ['\\grave', '`'],
            ['\\tilde', '~'],
            ['\\bar', '¯'],
            ['\\vec', '→'],
            ['\\dot', '˙'],
            ['\\ddot', '¨'],
            ['\\dddot', '⃛'],
            ['\\ddddot', '⃜'],

            // Superscript digits
            ['^0', '⁰'],
            ['^1', '¹'],
            ['^2', '²'],
            ['^3', '³'],
            ['^4', '⁴'],
            ['^5', '⁵'],
            ['^6', '⁶'],
            ['^7', '⁷'],
            ['^8', '⁸'],
            ['^9', '⁹'],
            ['^+', '⁺'],
            ['^-', '⁻'],
            ['^=', '⁼'],
            ['^(', '⁽'],
            ['^)', '⁾'],
            ['^n', 'ⁿ'],
            ['^i', 'ⁱ'],

            // Subscript digits
            ['_0', '₀'],
            ['_1', '₁'],
            ['_2', '₂'],
            ['_3', '₃'],
            ['_4', '₄'],
            ['_5', '₅'],
            ['_6', '₆'],
            ['_7', '₇'],
            ['_8', '₈'],
            ['_9', '₉'],
            ['_+', '₊'],
            ['_-', '₋'],
            ['_=', '₌'],
            ['_(', '₍'],
            ['_)', '₎'],
            ['_a', 'ₐ'],
            ['_e', 'ₑ'],
            ['_h', 'ₕ'],
            ['_i', 'ᵢ'],
            ['_j', 'ⱼ'],
            ['_k', 'ₖ'],
            ['_l', 'ₗ'],
            ['_m', 'ₘ'],
            ['_n', 'ₙ'],
            ['_o', 'ₒ'],
            ['_p', 'ₚ'],
            ['_r', 'ᵣ'],
            ['_s', 'ₛ'],
            ['_t', 'ₜ'],
            ['_u', 'ᵤ'],
            ['_v', 'ᵥ'],
            ['_x', 'ₓ']
        ]);

        this.superscriptMap = new Map([
            ['0', '⁰'], ['1', '¹'], ['2', '²'], ['3', '³'], ['4', '⁴'],
            ['5', '⁵'], ['6', '⁶'], ['7', '⁷'], ['8', '⁸'], ['9', '⁹'],
            ['+', '⁺'], ['-', '⁻'], ['=', '⁼'], ['(', '⁽'], [')', '⁾'],
            ['a', 'ᵃ'], ['b', 'ᵇ'], ['c', 'ᶜ'], ['d', 'ᵈ'], ['e', 'ᵉ'],
            ['f', 'ᶠ'], ['g', 'ᵍ'], ['h', 'ʰ'], ['i', 'ⁱ'], ['j', 'ʲ'],
            ['k', 'ᵏ'], ['l', 'ˡ'], ['m', 'ᵐ'], ['n', 'ⁿ'], ['o', 'ᵒ'],
            ['p', 'ᵖ'], ['r', 'ʳ'], ['s', 'ˢ'], ['t', 'ᵗ'], ['u', 'ᵘ'],
            ['v', 'ᵛ'], ['w', 'ʷ'], ['x', 'ˣ'], ['y', 'ʸ'], ['z', 'ᶻ'],
            ['A', 'ᴬ'], ['B', 'ᴮ'], ['D', 'ᴰ'], ['E', 'ᴱ'], ['G', 'ᴳ'],
            ['H', 'ᴴ'], ['I', 'ᴵ'], ['J', 'ᴶ'], ['K', 'ᴷ'], ['L', 'ᴸ'],
            ['M', 'ᴹ'], ['N', 'ᴺ'], ['O', 'ᴼ'], ['P', 'ᴾ'], ['R', 'ᴿ'],
            ['T', 'ᵀ'], ['U', 'ᵁ'], ['V', 'ⱽ'], ['W', 'ᵂ']
        ]);

        this.subscriptMap = new Map([
            ['0', '₀'], ['1', '₁'], ['2', '₂'], ['3', '₃'], ['4', '₄'],
            ['5', '₅'], ['6', '₆'], ['7', '₇'], ['8', '₈'], ['9', '₉'],
            ['+', '₊'], ['-', '₋'], ['=', '₌'], ['(', '₍'], [')', '₎'],
            ['a', 'ₐ'], ['e', 'ₑ'], ['h', 'ₕ'], ['i', 'ᵢ'], ['j', 'ⱼ'],
            ['k', 'ₖ'], ['l', 'ₗ'], ['m', 'ₘ'], ['n', 'ₙ'], ['o', 'ₒ'],
            ['p', 'ₚ'], ['r', 'ᵣ'], ['s', 'ₛ'], ['t', 'ₜ'], ['u', 'ᵤ'],
            ['v', 'ᵥ'], ['x', 'ₓ']
        ]);
    }

    convertToUnicode(input) {
        if (!input || typeof input !== 'string') {
            return input;
        }

        try {
            let result = input;
            
            // First, handle LaTeX commands
            result = this.replaceSymbols(result);
            
            // Then handle superscripts and subscripts
            result = this.handleSuperscripts(result);
            result = this.handleSubscripts(result);
            
            // Handle fractions
            result = this.handleFractions(result);
            
            return result;
        } catch (error) {
            console.error('Error converting LaTeX to Unicode:', error);
            return input; // Return original input if conversion fails
        }
    }

    replaceSymbols(text) {
        let result = text;
        
        // Sort by length (longest first) to avoid partial matches
        const sortedSymbols = Array.from(this.symbols.entries())
            .sort((a, b) => b[0].length - a[0].length);
        
        for (const [latex, unicode] of sortedSymbols) {
            const regex = new RegExp(this.escapeRegExp(latex), 'g');
            result = result.replace(regex, unicode);
        }
        
        return result;
    }

    handleSuperscripts(text) {
        // Handle superscripts with curly braces: x^{123}
        text = text.replace(/\^{([^}]+)}/g, (match, content) => {
            return this.convertToSuperscript(content);
        });
        
        // Handle simple superscripts: x^2
        text = text.replace(/\^([a-zA-Z0-9+\-=()])/g, (match, char) => {
            return this.convertToSuperscript(char);
        });
        
        return text;
    }

    handleSubscripts(text) {
        // Handle subscripts with curly braces: x_{123}
        text = text.replace(/_{([^}]+)}/g, (match, content) => {
            return this.convertToSubscript(content);
        });
        
        // Handle simple subscripts: x_2
        text = text.replace(/_([a-zA-Z0-9+\-=()])/g, (match, char) => {
            return this.convertToSubscript(char);
        });
        
        return text;
    }

    convertToSuperscript(text) {
        return text.split('').map(char => {
            return this.superscriptMap.get(char) || char;
        }).join('');
    }

    convertToSubscript(text) {
        return text.split('').map(char => {
            return this.subscriptMap.get(char) || char;
        }).join('');
    }

    handleFractions(text) {
        // Handle simple fractions: \frac{a}{b}
        text = text.replace(/\\frac{([^}]+)}{([^}]+)}/g, (match, numerator, denominator) => {
            // Convert to Unicode fraction if it's a simple case
            if (numerator.length === 1 && denominator.length === 1) {
                const fractionMap = {
                    '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
                    '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙',
                    '5/6': '⅚', '1/7': '⅐', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝',
                    '7/8': '⅞', '1/9': '⅑', '1/10': '⅒'
                };
                const key = `${numerator}/${denominator}`;
                return fractionMap[key] || `${numerator}/${denominator}`;
            }
            return `${numerator}/${denominator}`;
        });
        
        return text;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Create global instance
const latexConverter = new LaTeXConverter();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaTeXConverter;
}

// Make available globally for content script
if (typeof window !== 'undefined') {
    window.latexConverter = latexConverter;
}