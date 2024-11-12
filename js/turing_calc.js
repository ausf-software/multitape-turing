const tapeElement = document.getElementById('tapes');
var tapeElements = [];
var tapes = [];
var numsElements = [];
var headPosition = [];
var countTapes = 0;

var emptySymbol = 'f'; // Символ пустоты
var headPosition = 0; // Начальная позиция каретки

var tapeWidth = 362 - 2;
const cellWidth = 40;
var countCells = tapeWidth / cellWidth;
var midCells = countCells / 2;

var caretPosDelta = [];

function addTape() {
    var mainDiv = document.createElement("div");
    mainDiv.id = "tape-container" + countTapes;
    mainDiv.className = "tape-container";

    var numDiv = document.createElement("div");
    var tapeDiv = document.createElement("div");
    numDiv.id = "tape-numbers" + countTapes;
    tapeDiv.id = "tape" + countTapes;
    numDiv.className = "tape";
    tapeDiv.className = "tape";

    var carDiv = document.createElement("div");
    carDiv.className = "caret";
    carDiv.id = "caret";

    mainDiv.appendChild(numDiv);
    mainDiv.appendChild(tapeDiv);
    mainDiv.appendChild(carDiv);

    tapeElement.appendChild(mainDiv);

    tapeElements[countTapes] = tapeDiv;
    numsElements[countTapes] = numDiv;
    headPosition[countTapes] = 0;
    tapes[countTapes] = "";
    caretPosDelta[countTapes] = 0;

    countTapes += 1;
}

addTape();
addTape();

const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
        const { width, height } = entry.contentRect;
        tapeWidth = width;
        console.log("tape size:" + tapeWidth);
        countCells = tapeWidth / cellWidth;
        midCells = countCells / 2;
        render();
    }
});
resizeObserver.observe(document.getElementById('tape-container0'));

function clearAnswer() {
	const lineContainer = document.getElementById('lineContainer');
	lineContainer.innerHTML = "";
}

function setResultString(str) {
	document.getElementById('result_string').innerHTML = `Result: ${str}`;
}

function setResultSteps(str) {
	document.getElementById('result_steps').innerHTML = `Count steps: ${str}`;
}

function renderTape(emptySymbol, tape, element, head, nums, index) {
    element.innerHTML = '';
    nums.innerHTML = '';
    for (let i = 0; i < midCells - 1; i++) {
        const cell = document.createElement('div');
        const num = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = emptySymbol;
        num.className = 'cell-num';
        num.textContent = -Math.floor(midCells) + i - caretPosDelta[index];
        element.appendChild(cell);
        nums.appendChild(num);
    }
    for (let i = 0; i < tape.length; i++) {
        const cell = document.createElement('div');
        const num = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = tape[i] || emptySymbol;
        num.className = 'cell-num';
        num.textContent = i - caretPosDelta[index];
        nums.appendChild(num);
        element.appendChild(cell);
    }
    for (let i = 0; i < midCells - 1; i++) {
        const cell = document.createElement('div');
        const num = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = emptySymbol;
        num.className = 'cell-num';
        num.textContent = tape.length + i - caretPosDelta[index];
        nums.appendChild(num);
        element.appendChild(cell);
    }
    updateCaretPosition(element, head);
}

function updateCaretPosition(element, head) {
    const offset = head * cellWidth;
    element.style.transform = `translateX(-${offset}px)`;
}

function render() {
    for (var i = 0; i < countTapes; i++) {
        renderTape(emptySymbol, tapes[i], tapeElements[i], headPosition[i], numsElements[i], i);
    }
}

render();

function showErrorPopup(message) {
    const popup = document.createElement('div');
    popup.className = 'error-popup';
    popup.innerHTML = `
        <p>${message}</p>
        <button class="close-btn">Close</button>
    `;

    popup.querySelector('.close-btn').onclick = function() {
        document.body.removeChild(popup);
    };
    document.body.appendChild(popup);
}

function run() {
    
};