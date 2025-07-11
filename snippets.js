/**
 * LaTeX Snippet Handler
 * Handles auto-expanding LaTeX snippets based on trigger patterns
 */

class LaTeXSnippetHandler {
    constructor() {
        this.snippets = null;
        this.activeSnippet = null;
        this.placeholders = [];
        this.currentPlaceholder = 0;
        this.loadSnippets();
    }

    async loadSnippets() {
        try {
            // Check if we're in a content script (chrome.runtime available)
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                const response = await fetch(chrome.runtime.getURL('snippets.json'));
                this.snippets = await response.json();
            } else {
                // Fallback for popup context
                const response = await fetch('./snippets.json');
                this.snippets = await response.json();
            }
        } catch (error) {
            console.error('Failed to load snippets:', error);
            this.snippets = {};
        }
    }

    /**
     * Process text input and expand snippets
     * @param {string} text - The current text content
     * @param {number} cursorPosition - Current cursor position
     * @returns {object} - {text: newText, cursorPosition: newPosition, changed: boolean}
     */
    processText(text, cursorPosition) {
        if (!this.snippets) {
            return { text, cursorPosition, changed: false };
        }

        // Get text before cursor
        const beforeCursor = text.substring(0, cursorPosition);
        const afterCursor = text.substring(cursorPosition);

        // Try to expand snippets
        const result = this.expandSnippets(beforeCursor, afterCursor);
        
        if (result.changed) {
            const newText = result.beforeCursor + result.afterCursor;
            const expandedResult = this.processPlaceholders(newText, result.beforeCursor.length + result.cursorOffset);
            return {
                text: expandedResult.text,
                cursorPosition: expandedResult.cursorPosition,
                changed: true,
                hasPlaceholders: expandedResult.hasPlaceholders
            };
        }

        return { text, cursorPosition, changed: false };
    }

    /**
     * Handle tab navigation between placeholders
     * @param {string} text - Current text content
     * @param {number} cursorPosition - Current cursor position
     * @returns {object} - {text: newText, cursorPosition: newPosition, changed: boolean}
     */
    handleTab(text, cursorPosition) {
        if (!this.activeSnippet || this.placeholders.length === 0) {
            return { text, cursorPosition, changed: false };
        }

        // Move to next placeholder
        this.currentPlaceholder++;
        
        // Check if we've reached the end or $0
        const numberedPlaceholders = this.placeholders.filter(p => p.number !== 0);
        
        if (this.currentPlaceholder >= numberedPlaceholders.length) {
            // Move to $0 or end snippet
            const zeroPlaceholder = this.placeholders.find(p => p.number === 0);
            if (zeroPlaceholder) {
                this.clearActiveSnippet();
                return {
                    text,
                    cursorPosition: zeroPlaceholder.start,
                    changed: false
                };
            } else {
                this.clearActiveSnippet();
                return { text, cursorPosition, changed: false };
            }
        }

        const placeholder = numberedPlaceholders[this.currentPlaceholder];
        return {
            text,
            cursorPosition: placeholder.start,
            changed: false,
            selectRange: [placeholder.start, placeholder.start] // Select at current position
        };
    }

    /**
     * Process placeholders in expanded text
     * @param {string} text - Text with placeholders
     * @param {number} insertPosition - Position where snippet was inserted
     * @returns {object} - Processed result
     */
    processPlaceholders(text, insertPosition) {
        const placeholderRegex = /\$(\d+)/g;
        const placeholders = [];
        let match;
        
        // Find all placeholders
        while ((match = placeholderRegex.exec(text)) !== null) {
            placeholders.push({
                number: parseInt(match[1]),
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
            });
        }
        
        if (placeholders.length === 0) {
            return { text, cursorPosition: insertPosition, hasPlaceholders: false };
        }

        // Sort placeholders by position (reverse order for replacement)
        const sortedForReplacement = [...placeholders].sort((a, b) => b.start - a.start);
        
        // Replace placeholders with empty strings, working backwards
        let processedText = text;
        
        for (const placeholder of sortedForReplacement) {
            const replacement = '';
            processedText = processedText.substring(0, placeholder.start) + 
                          replacement + 
                          processedText.substring(placeholder.end);
        }
        
        // Recalculate placeholder positions after removal
        const finalPlaceholders = [];
        let offset = 0;
        
        // Sort placeholders by original position for offset calculation
        const sortedByPosition = [...placeholders].sort((a, b) => a.start - b.start);
        
        for (const placeholder of sortedByPosition) {
            const newStart = placeholder.start - offset;
            finalPlaceholders.push({
                number: placeholder.number,
                start: newStart,
                end: newStart,
                text: placeholder.text
            });
            offset += placeholder.text.length; // Account for removed placeholder text
        }
        
        // Set up active snippet
        this.activeSnippet = {
            text: processedText,
            startPosition: insertPosition
        };
        
        // Separate $0 from other placeholders
        const zeroPlaceholder = finalPlaceholders.find(p => p.number === 0);
        const numberedPlaceholders = finalPlaceholders.filter(p => p.number !== 0);
        
        // Sort numbered placeholders by number
        numberedPlaceholders.sort((a, b) => a.number - b.number);
        
        this.placeholders = numberedPlaceholders;
        if (zeroPlaceholder) {
            this.placeholders.push(zeroPlaceholder);
        }
        
        this.currentPlaceholder = -1;
        
        // Position cursor at first placeholder
        const firstPlaceholder = numberedPlaceholders[0];
        const cursorPosition = firstPlaceholder ? firstPlaceholder.start : insertPosition;
        
        return {
            text: processedText,
            cursorPosition,
            hasPlaceholders: true,
            selectRange: firstPlaceholder ? [firstPlaceholder.start, firstPlaceholder.start] : null
        };
    }

    /**
     * Clear active snippet state
     */
    clearActiveSnippet() {
        this.activeSnippet = null;
        this.placeholders = [];
        this.currentPlaceholder = 0;
    }

    /**
     * Check if currently in an active snippet
     * @returns {boolean}
     */
    hasActiveSnippet() {
        return this.activeSnippet !== null;
    }

    /**
     * Expand snippets in the text
     * @param {string} beforeCursor - Text before cursor
     * @param {string} afterCursor - Text after cursor
     * @returns {object} - Expansion result
     */
    expandSnippets(beforeCursor, afterCursor) {
        // Check all snippet categories
        const categories = ['basic_snippets', 'greek_letters', 'subscript_snippets', 'accent_snippets', 'custom_snippets'];
        
        for (const category of categories) {
            if (!this.snippets[category]) continue;
            
            const result = this.expandCategory(beforeCursor, afterCursor, category);
            if (result.changed) {
                return result;
            }
        }

        // Check fraction snippets separately (special handling)
        const fractionResult = this.expandFractions(beforeCursor, afterCursor);
        if (fractionResult.changed) {
            return fractionResult;
        }

        return { beforeCursor, afterCursor, cursorOffset: 0, changed: false };
    }

    /**
     * Expand snippets for a specific category
     * @param {string} beforeCursor - Text before cursor
     * @param {string} afterCursor - Text after cursor
     * @param {string} category - Snippet category
     * @returns {object} - Expansion result
     */
    expandCategory(beforeCursor, afterCursor, category) {
        const categoryData = this.snippets[category];
        if (!categoryData || !categoryData.snippets) {
            return { beforeCursor, afterCursor, cursorOffset: 0, changed: false };
        }

        // Sort snippets by length (longest first) to avoid partial matches
        const sortedSnippets = Object.entries(categoryData.snippets)
            .sort((a, b) => b[0].length - a[0].length);

        for (const [trigger, replacement] of sortedSnippets) {
            if (beforeCursor.endsWith(trigger)) {
                // Check conditions
                if (!this.checkConditions(beforeCursor, trigger, category)) {
                    continue;
                }

                // Apply the replacement
                const newBeforeCursor = beforeCursor.slice(0, -trigger.length) + replacement;
                
                // Handle cursor positioning for templates with placeholders
                let cursorOffset = 0;
                if (replacement.includes('{}')) {
                    // Find first empty braces and position cursor there
                    const braceIndex = replacement.indexOf('{}');
                    if (braceIndex !== -1) {
                        cursorOffset = braceIndex + 1 - replacement.length;
                    }
                } else if (replacement.includes('$1')) {
                    // Handle YASnippet-style placeholders
                    const placeholderIndex = replacement.indexOf('$1');
                    if (placeholderIndex !== -1) {
                        cursorOffset = placeholderIndex - replacement.length;
                    }
                }

                return {
                    beforeCursor: newBeforeCursor,
                    afterCursor,
                    cursorOffset,
                    changed: true
                };
            }
        }

        return { beforeCursor, afterCursor, cursorOffset: 0, changed: false };
    }

    /**
     * Check conditions for snippet expansion
     * @param {string} beforeCursor - Text before cursor
     * @param {string} trigger - Snippet trigger
     * @param {string} category - Snippet category
     * @returns {boolean} - Whether conditions are met
     */
    checkConditions(beforeCursor, trigger, category) {
        const categoryData = this.snippets[category];
        
        if (!categoryData.condition) {
            return true;
        }

        switch (categoryData.condition) {
            case 'after_single_letter':
                // Check if there's a single letter before the trigger
                const beforeTrigger = beforeCursor.slice(0, -trigger.length);
                if (beforeTrigger.length === 0) return false;
                const lastChar = beforeTrigger[beforeTrigger.length - 1];
                return /^[a-zA-Z]$/.test(lastChar);

            case 'latex_symbol_before':
                // Check if there's a LaTeX symbol before the trigger
                const beforeTrigger2 = beforeCursor.slice(0, -trigger.length);
                return /\\[a-zA-Z]+$/.test(beforeTrigger2);

            default:
                return true;
        }
    }

    /**
     * Handle fraction snippets with special logic
     * @param {string} beforeCursor - Text before cursor
     * @param {string} afterCursor - Text after cursor
     * @returns {object} - Expansion result
     */
    expandFractions(beforeCursor, afterCursor) {
        if (!this.snippets.fraction_snippets) {
            return { beforeCursor, afterCursor, cursorOffset: 0, changed: false };
        }

        // Handle // -> \frac{$1}{$2} $0
        if (beforeCursor.endsWith('//')) {
            const newBeforeCursor = beforeCursor.slice(0, -2) + '\\frac{$1}{$2} $0';
            return {
                beforeCursor: newBeforeCursor,
                afterCursor,
                cursorOffset: 0,
                changed: true
            };
        }

        // Handle ab/ -> \frac{ab}{$1} $0
        const fractionMatch = beforeCursor.match(/([a-zA-Z0-9_^{}\\]+)\/$/)
        if (fractionMatch) {
            const content = fractionMatch[1];
            const beforeContent = beforeCursor.slice(0, -content.length - 1);
            const newBeforeCursor = beforeContent + `\\frac{${content}}{$1} $0`;
            return {
                beforeCursor: newBeforeCursor,
                afterCursor,
                cursorOffset: 0,
                changed: true
            };
        }

        return { beforeCursor, afterCursor, cursorOffset: 0, changed: false };
    }

    /**
     * Get all available snippets for display/editing
     * @returns {object} - All snippets organized by category
     */
    getAllSnippets() {
        return this.snippets;
    }

    /**
     * Update snippets configuration
     * @param {object} newSnippets - New snippets configuration
     */
    updateSnippets(newSnippets) {
        this.snippets = newSnippets;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LaTeXSnippetHandler;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.LaTeXSnippetHandler = LaTeXSnippetHandler;
}