/**
 * LaTeX Snippet Handler
 * Handles auto-expanding LaTeX snippets based on trigger patterns
 */

class LaTeXSnippetHandler {
    constructor(skipAutoLoad = false) {
        this.snippets = null;
        this.activeSnippet = null;
        this.placeholders = [];
        this.currentPlaceholder = 0;
        this.lastSelectedPlaceholder = null;
        if (!skipAutoLoad) {
            this.loadSnippets();
        }
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

        // Check if we're at a placeholder position for nested expansion
        const nestingResult = this.checkNestedExpansion(text, cursorPosition, beforeCursor, afterCursor);
        if (nestingResult.changed) {
            return nestingResult;
        }

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
        // Find all placeholders in the current text
        const currentPlaceholders = this.findPlaceholdersInText(text);
        
        if (currentPlaceholders.length === 0) {
            this.clearActiveSnippet();
            return { text, cursorPosition, changed: false };
        }

        // Ensure we have an active snippet
        if (!this.activeSnippet) {
            this.reactivateSnippet(text);
        }

        // Update our placeholder list with current positions
        this.placeholders = this.organizePlaceholders(currentPlaceholders);
        
        // Get the navigation order for placeholders
        const navigationOrder = this.getNavigationOrder();
        
        // Move to next placeholder
        this.currentPlaceholder++;
        
        if (this.currentPlaceholder >= navigationOrder.length) {
            // Move to $0 or end snippet
            const zeroPlaceholder = this.placeholders.find(p => p.number === 0);
            if (zeroPlaceholder) {
                // Select the $0 placeholder - don't clear yet, wait for user to type
                return {
                    text: text,
                    cursorPosition: zeroPlaceholder.start,
                    changed: false,
                    selectRange: [zeroPlaceholder.start, zeroPlaceholder.end]
                };
            } else {
                this.clearActiveSnippet();
                return { text, cursorPosition, changed: false };
            }
        }

        const placeholder = navigationOrder[this.currentPlaceholder];
        
        // Remember which placeholder was selected
        this.lastSelectedPlaceholder = placeholder;
        
        // Select the placeholder text (don't remove it yet)
        return {
            text: text,
            cursorPosition: placeholder.start,
            changed: false,
            selectRange: [placeholder.start, placeholder.end]
        };
    }

    /**
     * Process placeholders in expanded text
     * @param {string} text - Text with placeholders
     * @param {number} insertPosition - Position where snippet was inserted
     * @returns {object} - Processed result
     */
    processPlaceholders(text, insertPosition) {
        // Enhanced regex to handle nested placeholders (e.g., $00, $01, $02, $10, $11, $12)
        const placeholderRegex = /\$(\d+)/g;
        const placeholders = [];
        let match;
        
        // Find all placeholders
        while ((match = placeholderRegex.exec(text)) !== null) {
            const fullNumber = match[1];
            const level = Math.floor(fullNumber / 10); // 0 for $0-$9, 1 for $10-$19, etc.
            const position = fullNumber % 10; // Position within the level
            
            placeholders.push({
                number: parseInt(fullNumber),
                level: level,
                position: position,
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
            });
        }
        
        if (placeholders.length === 0) {
            return { text, cursorPosition: insertPosition, hasPlaceholders: false };
        }

        // Keep placeholders visible - don't remove them initially
        let processedText = text;
        
        // Store placeholder information without removing them from text
        const finalPlaceholders = [];
        
        for (const placeholder of placeholders) {
            finalPlaceholders.push({
                number: placeholder.number,
                level: placeholder.level,
                position: placeholder.position,
                start: placeholder.start,
                end: placeholder.end,
                text: placeholder.text
            });
        }
        
        // Set up active snippet
        this.activeSnippet = {
            text: processedText,
            startPosition: insertPosition
        };
        
        // Organize placeholders by level and position
        this.placeholders = this.organizePlaceholders(finalPlaceholders);
        this.currentPlaceholder = -1;
        
        // Position cursor at first placeholder
        const firstPlaceholder = this.getFirstPlaceholder();
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
        this.lastSelectedPlaceholder = null;
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
     * Organize placeholders by level and position for proper navigation
     * @param {Array} placeholders - Array of placeholder objects
     * @returns {Array} - Organized placeholders
     */
    organizePlaceholders(placeholders) {
        // Group placeholders by level
        const levels = {};
        for (const placeholder of placeholders) {
            if (!levels[placeholder.level]) {
                levels[placeholder.level] = [];
            }
            levels[placeholder.level].push(placeholder);
        }
        
        // Sort within each level by position
        for (const level in levels) {
            levels[level].sort((a, b) => a.position - b.position);
        }
        
        return placeholders;
    }
    
    /**
     * Get the first placeholder in navigation order
     * @returns {object|null} - First placeholder or null
     */
    getFirstPlaceholder() {
        const navigationOrder = this.getNavigationOrder();
        return navigationOrder.length > 0 ? navigationOrder[0] : null;
    }
    
    /**
     * Get navigation order for placeholders
     * Priority: Level 0 first (1,2,3...), then level 1 (11,12,10...), etc.
     * Special handling for $0 (always last)
     * @returns {Array} - Ordered array of placeholders for navigation
     */
    getNavigationOrder() {
        const orderedPlaceholders = this.placeholders.filter(p => p.number !== 0);
        
        // Sort by level first, then handle position within each level
        orderedPlaceholders.sort((a, b) => {
            if (a.level !== b.level) {
                return a.level - b.level;
            }
            // Within same level, sort by position (0 comes last)
            if (a.position !== b.position) {
                if (a.position === 0) return 1;  // $X0 comes after $X1, $X2, etc.
                if (b.position === 0) return -1; // $X1, $X2, etc. come before $X0
                return a.position - b.position;  // Normal position order
            }
            return a.number - b.number;
        });
        
        return orderedPlaceholders;
    }

    /**
     * Update positions of remaining placeholders after removing one
     * @param {object} removedPlaceholder - The placeholder that was removed
     */
    updatePlaceholderPositions(removedPlaceholder) {
        const removedLength = removedPlaceholder.text.length;
        
        // Update positions of placeholders that come after the removed one
        for (let i = 0; i < this.placeholders.length; i++) {
            if (this.placeholders[i].start > removedPlaceholder.start) {
                this.placeholders[i].start -= removedLength;
                this.placeholders[i].end -= removedLength;
            }
        }
    }

    /**
     * Update positions of remaining placeholders after replacing text
     * @param {number} replaceStart - Start position of replaced text
     * @param {number} replaceEnd - End position of replaced text
     * @param {number} newLength - Length of new text
     */
    updatePlaceholderPositionsAfterReplacement(replaceStart, replaceEnd, newLength) {
        const oldLength = replaceEnd - replaceStart;
        const lengthDiff = newLength - oldLength;
        
        // Remove the replaced placeholder from our list
        this.placeholders = this.placeholders.filter(p => 
            !(p.start === replaceStart && p.end === replaceEnd)
        );
        
        // Update positions of placeholders that come after the replacement
        for (let i = 0; i < this.placeholders.length; i++) {
            if (this.placeholders[i].start > replaceStart) {
                this.placeholders[i].start += lengthDiff;
                this.placeholders[i].end += lengthDiff;
            }
        }
    }

    /**
     * Check if we should perform nested expansion
     * @param {string} text - Full text content
     * @param {number} cursorPosition - Current cursor position
     * @param {string} beforeCursor - Text before cursor
     * @param {string} afterCursor - Text after cursor
     * @returns {object} - Expansion result
     */
    checkNestedExpansion(text, cursorPosition, beforeCursor, afterCursor) {
        // Only check if we have an active snippet
        if (!this.activeSnippet || !beforeCursor.endsWith('//')) {
            return { text, cursorPosition, changed: false };
        }

        // Find the highest level of existing placeholders to determine nesting level
        let maxLevel = 0;
        for (const placeholder of this.placeholders) {
            if (placeholder.level > maxLevel) {
                maxLevel = placeholder.level;
            }
        }
        
        // Create nested placeholders at the next level
        const nextLevel = maxLevel + 1;
        const nestingLevel = nextLevel * 10; // 10 for level 1, 20 for level 2, etc.
        
        // Replace // with nested fraction
        const nestedFraction = `\\frac{$${nestingLevel + 1}}{$${nestingLevel + 2}}$${nestingLevel}`;
        const newBeforeCursor = beforeCursor.slice(0, -2) + nestedFraction;
        const newText = newBeforeCursor + afterCursor;
        
        // Process the new placeholders
        const expandedResult = this.processPlaceholders(newText, newBeforeCursor.length);
        
        return {
            text: expandedResult.text,
            cursorPosition: expandedResult.cursorPosition,
            changed: true,
            hasPlaceholders: expandedResult.hasPlaceholders
        };
    }

    /**
     * Handle text change after typing (to update placeholder positions)
     * @param {string} oldText - Previous text
     * @param {string} newText - New text after typing
     * @param {number} cursorPosition - Current cursor position
     * @returns {object} - Updated state
     */
    handleTextChange(oldText, newText, cursorPosition) {
        // Don't process if no active snippet
        if (!this.activeSnippet) {
            return { text: newText, cursorPosition, changed: false };
        }

        // Simply update our placeholder list based on what's currently in the text
        const currentPlaceholders = this.findPlaceholdersInText(newText);
        
        // If there are still placeholders in the text, keep the snippet active
        if (currentPlaceholders.length > 0) {
            // Update our internal placeholder list with current positions
            this.placeholders = this.organizePlaceholders(currentPlaceholders);
            
            // Reset current placeholder index to prepare for next Tab navigation
            // The next Tab press will increment this to 0 to select the first remaining placeholder
            this.currentPlaceholder = -1;
            
            // Clear last selected placeholder since it might have been replaced
            this.lastSelectedPlaceholder = null;
        } else {
            // No placeholders left, clear the snippet
            this.clearActiveSnippet();
        }
        
        return { text: newText, cursorPosition, changed: false };
    }

    /**
     * Find all placeholders in the given text
     * @param {string} text - Text to search
     * @returns {Array} - Array of placeholder objects
     */
    findPlaceholdersInText(text) {
        const placeholders = [];
        const regex = /\$(\d+)/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const fullNumber = match[1];
            const level = Math.floor(fullNumber / 10);
            const position = fullNumber % 10;
            
            placeholders.push({
                number: parseInt(fullNumber),
                level: level,
                position: position,
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
            });
        }
        
        return placeholders;
    }

    /**
     * Check if all placeholders have been handled
     * @returns {boolean} - True if no placeholders remain
     */
    allPlaceholdersHandled() {
        return this.placeholders.length === 0;
    }

    /**
     * Reactivate snippet mode for text that contains placeholders
     * @param {string} text - Current text content
     */
    reactivateSnippet(text) {
        // Find all placeholders in the text
        const placeholders = this.findPlaceholdersInText(text);
        
        if (placeholders.length > 0) {
            // Reactivate the snippet
            this.activeSnippet = {
                text: text,
                startPosition: 0
            };
            
            // Set up placeholders
            this.placeholders = this.organizePlaceholders(placeholders);
            
            // Reset to the beginning of navigation
            this.currentPlaceholder = -1; // Will be incremented to 0 on first tab
            this.lastSelectedPlaceholder = null;
            
            console.log('Reactivated snippet with placeholders:', this.placeholders.map(p => '$' + p.number));
        }
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