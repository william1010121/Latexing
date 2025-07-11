
function saveData(input, latexType) {
    chrome.storage.sync.set({input: input, latexType: latexType}, function() {
        console.log("Save");
    });
}

function loadData() {
    chrome.storage.sync.get(['input', 'latexType'], function(data) {
        if(data.input) {
            document.getElementById("inputBox").value = data.input;
        }
        if(data.latexType) {
            document.getElementById("latexType").value = data.latexType;
        }
        updateOutput();
    });
}


// focus on input box
document.getElementById('inputBox').focus();

document.getElementById('inputBox').addEventListener('input', updateOutput);
document.getElementById('latexType').addEventListener('change', updateOutput);

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

loadData();
