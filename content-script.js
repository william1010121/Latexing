// Content script for floating LaTeX editor
class FloatingLatexEditor {
    constructor() {
        console.log('FloatingLatexEditor constructor called');
        this.isVisible = false;
        this.overlay = null;
        this.editor = null;
        this.snippetHandler = null;
        this.setupKeyboardListener();
        this.initializeSnippetHandler();
        console.log('FloatingLatexEditor initialized');
    }

    initializeSnippetHandler() {
        if (typeof LaTeXSnippetHandler !== 'undefined') {
            this.snippetHandler = new LaTeXSnippetHandler();
        }
    }

    setupKeyboardListener() {
        console.log('Setting up keyboard listener');
        document.addEventListener('keydown', (event) => {
            console.log('Key pressed:', event.key, 'metaKey:', event.metaKey, 'ctrlKey:', event.ctrlKey);
            if ((event.metaKey || event.ctrlKey) && event.key === 'l') {
                console.log('Command+L detected, toggling editor');
                event.preventDefault();
                this.toggle();
            }
        });

        // Listen for chrome commands
        if (typeof chrome !== 'undefined' && chrome.commands) {
            console.log('Setting up chrome commands listener');
            chrome.commands.onCommand.addListener((command) => {
                console.log('Chrome command received:', command);
                if (command === 'toggle_latex_editor') {
                    this.toggle();
                }
            });
        }
    }

    toggle() {
        console.log('Toggle called, current visibility:', this.isVisible);
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        console.log('Show called');
        if (!this.overlay) {
            console.log('Creating overlay');
            this.createOverlay();
        }
        console.log('Setting overlay display to flex');
        this.overlay.style.display = 'flex';
        this.isVisible = true;
        this.focusInput();
        this.loadData();
        console.log('Editor should now be visible');
    }

    hide() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
        this.isVisible = false;
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'latex-editor-overlay';
        this.overlay.innerHTML = `
            <div class="latex-editor-container">
                <div class="latex-editor-header">
                    <h3>LaTeX Editor</h3>
                    <button class="close-btn" id="latex-close-btn">×</button>
                </div>
                <textarea id="latex-input" placeholder="Enter your LaTeX here..."></textarea>
                <select id="latex-type">
                    <option value="inline">Inline \\( \\)</option>
                    <option value="display">Display \\[ \\]</option>
                </select>
                <div id="latex-preview"></div>
                <div class="latex-editor-buttons">
                    <button id="latex-copy-image">Copy as Image</button>
                    <button id="latex-copy-unicode">Copy as Unicode</button>
                </div>
                <canvas id="latex-canvas" style="display: none;"></canvas>
            </div>
        `;

        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            #latex-editor-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: Arial, sans-serif;
            }

            .latex-editor-container {
                background: white;
                border-radius: 8px;
                padding: 20px;
                width: 500px;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }

            .latex-editor-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .latex-editor-header h3 {
                margin: 0;
                color: #333;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #666;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .close-btn:hover {
                color: #000;
                background: #f0f0f0;
                border-radius: 50%;
            }

            #latex-input {
                width: 100%;
                height: 120px;
                padding: 10px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-family: monospace;
                font-size: 14px;
                resize: vertical;
                box-sizing: border-box;
            }

            #latex-type {
                width: 100%;
                padding: 8px;
                margin: 10px 0;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
                box-sizing: border-box;
            }

            #latex-preview {
                min-height: 80px;
                padding: 15px;
                border: 1px solid #ccc;
                border-radius: 4px;
                margin: 10px 0;
                background: #f9f9f9;
                text-align: center;
            }

            .latex-editor-buttons {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }

            .latex-editor-buttons button {
                flex: 1;
                padding: 10px;
                border: none;
                border-radius: 4px;
                background: #007cba;
                color: white;
                cursor: pointer;
                font-size: 14px;
            }

            .latex-editor-buttons button:hover {
                background: #005a87;
            }

            .latex-editor-buttons button:active {
                background: #004666;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(this.overlay);

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close button
        const closeBtn = this.overlay.querySelector('#latex-close-btn');
        closeBtn.addEventListener('click', () => this.hide());

        // Click outside to close
        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) {
                this.hide();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });

        // Input and type change handlers
        const input = this.overlay.querySelector('#latex-input');
        const typeSelect = this.overlay.querySelector('#latex-type');
        
        input.addEventListener('input', () => this.updatePreview());
        input.addEventListener('keyup', (event) => this.handleKeyUp(event));
        input.addEventListener('keydown', (event) => this.handleKeyDown(event));
        typeSelect.addEventListener('change', () => this.updatePreview());

        // Copy buttons
        const copyImageBtn = this.overlay.querySelector('#latex-copy-image');
        const copyUnicodeBtn = this.overlay.querySelector('#latex-copy-unicode');
        
        copyImageBtn.addEventListener('click', () => this.copyAsImage());
        copyUnicodeBtn.addEventListener('click', () => this.copyAsUnicode());
    }

    handleKeyDown(event) {
        if (!this.snippetHandler) return;
        
        const inputBox = this.overlay.querySelector('#latex-input');
        
        // Handle Tab key for placeholder navigation
        if (event.key === 'Tab') {
            if (this.snippetHandler.hasActiveSnippet()) {
                event.preventDefault();
                
                const text = inputBox.value;
                const cursorPosition = inputBox.selectionStart;
                
                const result = this.snippetHandler.handleTab(text, cursorPosition);
                
                if (result.selectRange) {
                    inputBox.setSelectionRange(result.selectRange[0], result.selectRange[1]);
                } else {
                    inputBox.setSelectionRange(result.cursorPosition, result.cursorPosition);
                }
                
                return;
            }
        }
        
        // Clear active snippet on other keys (except arrow keys)
        if (this.snippetHandler.hasActiveSnippet() && 
            !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) {
            if (event.key !== 'Tab') {
                this.snippetHandler.clearActiveSnippet();
            }
        }
    }

    handleKeyUp(event) {
        if (!this.snippetHandler) return;
        
        const inputBox = this.overlay.querySelector('#latex-input');
        const text = inputBox.value;
        const cursorPosition = inputBox.selectionStart;
        
        // Skip processing if Tab key (handled in keydown)
        if (event.key === 'Tab') {
            return;
        }
        
        // Process snippets
        const result = this.snippetHandler.processText(text, cursorPosition);
        
        if (result.changed) {
            inputBox.value = result.text;
            
            if (result.selectRange) {
                inputBox.setSelectionRange(result.selectRange[0], result.selectRange[1]);
            } else {
                inputBox.setSelectionRange(result.cursorPosition, result.cursorPosition);
            }
            
            this.updatePreview();
        }
    }

    focusInput() {
        const input = this.overlay.querySelector('#latex-input');
        if (input) {
            input.focus();
        }
    }

    updatePreview() {
        const input = this.overlay.querySelector('#latex-input').value;
        const type = this.overlay.querySelector('#latex-type').value;
        const preview = this.overlay.querySelector('#latex-preview');
        
        preview.innerHTML = (type === "inline" ? `\\(${input}\\)` : `\\[${input}\\]`);
        
        if (typeof MathJax !== 'undefined') {
            MathJax.typesetPromise([preview]).then(() => {
                this.renderLatexToCanvas(input, type);
            });
        }
        
        this.saveData(input, type);
    }

    renderLatexToCanvas(latex, type) {
        const canvas = this.overlay.querySelector('#latex-canvas');
        const context = canvas.getContext('2d');
        const preview = this.overlay.querySelector('#latex-preview');

        const svgElement = preview.querySelector('svg');
        if (svgElement) {
            const data = new XMLSerializer().serializeToString(svgElement);
            const img = new Image();
            img.onload = function() {
                const k = Math.max(1, Math.ceil(150/img.width));
                const margin = 20;
                const width = img.width * k + 2 * margin;
                const height = img.height * k + 2 * margin;
                canvas.width = width;
                canvas.height = height;

                context.clearRect(0, 0, canvas.width, canvas.height);
                context.fillStyle = 'white';
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, margin, margin, img.width, img.height);
            };
            img.src = 'data:image/svg+xml;base64,' + btoa(data);
        }
    }

    copyAsImage() {
        const canvas = this.overlay.querySelector('#latex-canvas');
        canvas.toBlob((blob) => {
            const item = new ClipboardItem({'image/png': blob});
            navigator.clipboard.write([item]).then(() => {
                console.log('Image copied to clipboard');
            }).catch((error) => {
                console.error('Error copying image: ', error);
            });
        });
    }

    copyAsUnicode() {
        const input = this.overlay.querySelector('#latex-input').value;
        if (input.trim() === '') {
            return;
        }
        
        if (typeof latexConverter !== 'undefined') {
            const unicodeText = latexConverter.convertToUnicode(input);
            navigator.clipboard.writeText(unicodeText).then(() => {
                console.log('Unicode text copied to clipboard');
            }).catch((error) => {
                console.error('Error copying Unicode text: ', error);
            });
        }
    }

    saveData(input, latexType) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.set({
                floatingInput: input, 
                floatingLatexType: latexType
            }, () => {
                console.log("Floating editor data saved");
            });
        }
    }

    loadData() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.sync.get(['floatingInput', 'floatingLatexType'], (data) => {
                if (data.floatingInput) {
                    this.overlay.querySelector('#latex-input').value = data.floatingInput;
                }
                if (data.floatingLatexType) {
                    this.overlay.querySelector('#latex-type').value = data.floatingLatexType;
                }
                this.updatePreview();
            });
        }
    }
}

// Initialize the floating editor when the page loads
console.log('LaTeX Editor content script loaded');

if (document.readyState === 'loading') {
    console.log('Document loading, waiting for DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOMContentLoaded fired, initializing FloatingLatexEditor');
        new FloatingLatexEditor();
    });
} else {
    console.log('Document already loaded, initializing FloatingLatexEditor immediately');
    new FloatingLatexEditor();
}