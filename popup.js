
// Initialize snippet handler
let snippetHandler = null;
let previousText = '';

function initializeSnippetHandler() {
    snippetHandler = new LaTeXSnippetHandler();
}

function saveData(input, latexType, shortcutEnabled = null) {
    const data = {input: input, latexType: latexType};
    if (shortcutEnabled !== null) {
        data.shortcutEnabled = shortcutEnabled;
    }
    chrome.storage.sync.set(data, function() {
        // data saved
    });
}

function loadData() {
    chrome.storage.sync.get(['input', 'latexType', 'shortcutEnabled'], function(data) {
        if(data.input) {
            document.getElementById("inputBox").value = data.input;
        }
        if(data.latexType) {
            document.getElementById("latexType").value = data.latexType;
        }
        // Load shortcut toggle state, default to true
        const shortcutEnabled = data.shortcutEnabled !== undefined ? data.shortcutEnabled : true;
        document.getElementById("shortcutToggle").checked = shortcutEnabled;
        snippetHandler.setEnabled(shortcutEnabled);
        updateOutput();
    });
}


// focus on input box
document.getElementById('inputBox').focus();

document.getElementById('inputBox').addEventListener('input', handleInputChange);
document.getElementById('inputBox').addEventListener('keyup', handleKeyUp);
document.getElementById('inputBox').addEventListener('keydown', handleKeyDown);
document.getElementById('latexType').addEventListener('change', updateOutput);
document.getElementById('shortcutToggle').addEventListener('change', handleShortcutToggle);

function handleInputChange() {
    const inputBox = document.getElementById('inputBox');
    previousText = inputBox.value;
    updateOutput();
}

function handleShortcutToggle(event) {
    const enabled = event.target.checked;
    snippetHandler.setEnabled(enabled);
    saveData(document.getElementById('inputBox').value, document.getElementById('latexType').value, enabled);
}

function handleKeyDown(event) {
    if (!snippetHandler || !snippetHandler.enabled) return;
    
    const inputBox = document.getElementById('inputBox');
    
    // Handle Tab key for placeholder navigation
    if (event.key === 'Tab') {
        const text = inputBox.value;
        const cursorPosition = inputBox.selectionStart;
        
        // Check if text contains any placeholders
        const hasPlaceholders = /\$\d+/.test(text);
        
        if (hasPlaceholders) {
            event.preventDefault();
            
            const result = snippetHandler.handleTab(text, cursorPosition);
            
            if (result.changed) {
                inputBox.value = result.text;
            }
            
            if (result.selectRange) {
                // Select the placeholder text so user can type to replace it
                inputBox.setSelectionRange(result.selectRange[0], result.selectRange[1]);
            } else {
                inputBox.setSelectionRange(result.cursorPosition, result.cursorPosition);
            }
            
            // Update the output since text may have changed
            if (result.changed) {
                updateOutput();
            }
            
            return;
        }
    }
    
    // Don't clear active snippet when typing - let it persist until all placeholders are handled
    // Only clear on specific navigation keys that indicate the user is done with the snippet
    if (snippetHandler.hasActiveSnippet() && 
        ['Escape', 'Enter'].includes(event.key)) {
        snippetHandler.clearActiveSnippet();
    }
}

function handleKeyUp(event) {
    if (!snippetHandler || !snippetHandler.enabled) return;
    
    const inputBox = document.getElementById('inputBox');
    const text = inputBox.value;
    const cursorPosition = inputBox.selectionStart;
    
    // Skip processing if Tab key (handled in keydown)
    if (event.key === 'Tab') {
        previousText = text;
        return;
    }
    
    // Handle text change (for placeholder position updates)
    if (previousText !== text) {
        const changeResult = snippetHandler.handleTextChange(previousText, text, cursorPosition);
        previousText = text;
    }
    
    // Process snippets
    const result = snippetHandler.processText(text, cursorPosition);
    
    if (result.changed) {
        inputBox.value = result.text;
        previousText = result.text;
        
        if (result.selectRange) {
            inputBox.setSelectionRange(result.selectRange[0], result.selectRange[1]);
        } else {
            inputBox.setSelectionRange(result.cursorPosition, result.cursorPosition);
        }
        
        updateOutput();
    }
}

function updateOutput() {
    var input = document.getElementById('inputBox').value; var latexType = document.getElementById('latexType').value;
    document.getElementById('outputBox').innerHTML = (latexType == "inline" ? `\\(${input}\\)` : `\\[${input}\\]`);
    MathJax.typesetPromise([document.getElementById('outputBox')]).then(() => {
        renderLatexToCanvas(input, latexType);
    });
    saveData(input, latexType);
}
document.getElementById('copyButton').addEventListener('click', function() {
    var canvas = document.getElementById('latexCanvas');
    canvas.toBlob(function(blob) {
        var item = new ClipboardItem({'image/png': blob});
        navigator.clipboard.write([item]).then(function() {
        }).catch(function(error) {
            console.error('Error copying image: ', error);
        });
    });
});

document.getElementById('copyUnicodeButton').addEventListener('click', function() {
    var input = document.getElementById('inputBox').value;
    if (input.trim() === '') {
        return;
    }
    
    var unicodeText = latexConverter.convertToUnicode(input);
    
    navigator.clipboard.writeText(unicodeText).then(function() {
        // Unicode text copied successfully
    }).catch(function(error) {
        console.error('Error copying Unicode text: ', error);
    });
});

function renderLatexToCanvas(latex) {
    var canvas = document.getElementById('latexCanvas');
    var context = canvas.getContext('2d');
    var outputBox = document.getElementById('outputBox');

    var svgElement = outputBox.querySelector('svg');
    if (svgElement) {
        var data = new XMLSerializer().serializeToString(svgElement);
        var img = new Image();
        img.onload = function() {
            var k = Math.max( 1, Math.ceil(150/img.width));
            let margin = 20;
            var width = img.width * k + 2 * margin;
            var height = img.height * k + 2 * margin;
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

// Initialize everything
initializeSnippetHandler();
loadData();
