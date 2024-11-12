const tapeElement = document.getElementById('tapes');
const editorHeaderElement = document.getElementById('editor-header');
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

/////////////////////
var states = ["q0"];
var state_symbol = new Map();
var select_state = 0;

var name_states = 1;

var moveType = ["R", "L", "S"]

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
        cell.onclick = () => handleCellClick(index);
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
        cell.onclick = () => handleCellClick(index);
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
        cell.onclick = () => handleCellClick(index);
        nums.appendChild(num);
        element.appendChild(cell);
    }
    updateCaretPosition(element, head);
}

function handleCellClick(index) {
    let userInput = prompt("Enter text to tape " + index + ":");
    if (userInput == null) userInput = "";
    tapes[index] = userInput;
    render();
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


////////////////////////////////////////////////////////


function generateMoveSelect(state, symbol, tape_num, selected) {
    const select = document.createElement('select');

    moveType.forEach((optionText, index) => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        if (selected !== undefined && optionText === selected) {
            option.selected = true;
        } else if (typeof selected === 'undefined' && index === 0) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    select.id = `move_type-${state}-${symbol}-${tape_num}`;
    select.className = "symbol-field";
    return select;
}

function generateStateSelect(state, symbol, selected) {
    const select = document.createElement('select');

    states.forEach((optionText, index) => {
        const option = document.createElement('option');
        option.value = optionText;
        option.textContent = optionText;
        if (selected !== undefined && optionText === selected) {
            option.selected = true;
        } else if (typeof selected === 'undefined' && index === 0) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    select.id = `next_state-${state}-${symbol}`;
    select.className = "symbol-field";
    return select;
}

function addState() {
    var name = `q${name_states}`;
    states.push(name);
    name_states += 1;
    var raz = document.getElementById("editor-content");
    var n = document.createElement("div");
    n.className = "editor-content";
    n.id = `edit-${name}`;
    raz.appendChild(n);
    renderEditor()
}

function removeState(num) {
    if (states.length > 1) {
        states.splice(num, 1);
        state_symbol.splice(num, 1);
        renderEditor();
    }
}

function addStateSymbol(state) {
    if (!state_symbol.has(state)) {
        state_symbol.set(state, []);
    }
    var addAr = [emptySymbol, state];
    for (var i = 0; i < countTapes; i++) {
        addAr.push(emptySymbol);
        addAr.push("S");
    }
    state_symbol.get(state).push(addAr);
    renderEditor();
}

function changeEdit(index) {
    var c = document.getElementById(`edit-${states[select_state]}`);
    c.style.display = "none";
    var n = document.getElementById(`edit-${states[index]}`);
    n.style.display = "flex";
    select_state = index;
    renderEditor();
}

function renderHeader() {
    editorHeaderElement.innerHTML = "";
    editorHeaderElement.innerHTML += 
    `<div class="states-buttons">
        <a class="state-button">
            States
        </a>
    </div>
    <div class="states-buttons">
        <a class="state-button">
            Symbol read
        </a>
    </div>
    <div class="states-buttons">
        <a class="state-button">
            Next state
        </a>
    </div>`;
    for (var i = 0; i < countTapes; i++) {
        editorHeaderElement.innerHTML +=
        `
        <div class="states-buttons">
            <a class="state-button">
                Tape #${i} symbol
            </a>
        </div>
        <div class="states-buttons">
            <a class="state-button">
                Tape #${i} move
            </a>
        </div>
        `;
    }
}

function renderStatePanel() {
    var panel = document.getElementById("states-buttons");
    panel.innerHTML = "";
    states.forEach((st, index) => {
        if (index === select_state)
            panel.innerHTML += `<a class="state-button selected">${st}</a>`;
        else
            panel.innerHTML += `<a class="state-button" onclick="changeEdit(${index})">${st}</a>`;
    });
    panel.innerHTML += `<a class="state-button" onclick="addState()">+</a>`;
}

function renderContentEditor(state) {
    var edit = document.getElementById(`edit-${state}`);
    edit.innerHTML = "";
    var temp = "";
    var com_ar = state_symbol.get(state) || [];
    com_ar.forEach((command, index) => {
        temp += `<input type="text" class="symbol-field" id="symbol-${state}-${index}" placeholder="0" value="${command[0]}"
        onblur="state_symbol.get('${state}')[${index}][0] = document.getElementById('symbol-${state}-${index}').value;"></input>`;
    });
    temp += `<a class="state-button" onclick="addStateSymbol('${state}')">+</a>`;
    edit.innerHTML += `<div class="states-buttons">${temp}</div>`;

    ///
    var nextStateDivCon = document.createElement("div");
    nextStateDivCon.className = "states-buttons";
    com_ar.forEach((command, index) => {
        var t = generateStateSelect(state, command[0], command[1])
        t.addEventListener('change', (event) => {
            state_symbol.get(state)[index][1] = t.value;
        });
        nextStateDivCon.appendChild(t);
    });
    var tempDiv = document.createElement("a");
    tempDiv.className = "state-button";
    tempDiv.textContent = "+";
    tempDiv.onclick = () => addStateSymbol(state);
    nextStateDivCon.appendChild(tempDiv);
    edit.appendChild(nextStateDivCon);
    
    for (var i = 0; i < countTapes; i++) {
        var tapeCon = document.createElement("div");
        tapeCon.className = "states-buttons";
        com_ar.forEach((command, index) => {
            var g = i;
            tapeCon.innerHTML += `<input type="text" class="symbol-field" id="${state}-${command[0]}-tape-${index}" placeholder="0" value="${command[2 + i * 2]}"
            onblur="state_symbol.get('${state}')[${index}][2 + ${g} * 2] = document.getElementById('${state}-${command[0]}-tape-${index}').value;"></input>`;
        });
        tapeCon.innerHTML += `<a class="state-button" onclick="addStateSymbol('${state}')">+</a>`;
        edit.appendChild(tapeCon);

        var tapeCon2 = document.createElement("div");
        tapeCon2.className = "states-buttons";
        com_ar.forEach((command, index) => {
            var g = i;
            var t = generateMoveSelect(state, command[0], index, command[3 + g * 2]);
            t.addEventListener('change', (event) => {
                state_symbol.get(state)[index][3 + g * 2] = t.value;
            });
            tapeCon2.appendChild(t);
        });
        var tempDiv = document.createElement("a");
        tempDiv.className = "state-button";
        tempDiv.textContent = "+";
        tempDiv.onclick = () => addStateSymbol(state);
        tapeCon2.appendChild(tempDiv);
        edit.appendChild(tapeCon2);
    }
}

function renderEditor() {
    renderHeader()
    renderStatePanel();
    renderContentEditor(states[select_state]);
}

renderEditor();


function run() {
    
};