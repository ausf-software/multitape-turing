const tapeElement = document.getElementById('tape');
const caretElement = document.getElementById('caret');
var emptySymbol = '□'; // Символ пустоты
var tape = '11000000000000000000001'; // Пример содержимого ленты
var headPosition = 0; // Начальная позиция каретки

const tapeWidth = 920;
const cellWidth = 40;
const countCells = tapeWidth / cellWidth;
const midCells = countCells / 2;
const countTempCells = 2;

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

function renderTape(emptySymbol, tape) {
    tapeElement.innerHTML = '';
    for (let i = 0; i < midCells - 1; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = emptySymbol;
        tapeElement.appendChild(cell);
    }
    for (let i = 0; i < tape.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = tape[i] || emptySymbol;
        tapeElement.appendChild(cell);
    }
    for (let i = 0; i < midCells - 1; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.textContent = emptySymbol;
        tapeElement.appendChild(cell);
    }
    updateCaretPosition();
}

function updateCaretPosition() {
    const offset = headPosition * cellWidth;
    tapeElement.style.transform = `translateX(-${offset}px)`;
}

function moveLeft() {
    if (headPosition > 0) {
        headPosition--;
        renderTape();
    }
}

function moveRight() {
    if (headPosition < tape.length) {
        headPosition++;
        renderTape();
    }
}


renderTape(emptySymbol, tape);

function convertString(inputString) {
    const regex = /[a-zA-Z0-9_]+/g;
    var result = inputString.replace(/['"]/g, '');
    result = result.replace(regex, match => `"${match}"`);
    result = '{' + result + '}';
    result = result.replace(/}/g, '},');
    result = result.replace(/([LSR])\n/g, '$1,\n');
    result = result.replace(/,,/g, ',');
    result = result.replace(/},\s*}/g, '}}');
    result = result.replace(/}},\s*},/g, '}}}');
    return result;
}

function validateMoveType(move) {
    if (!MoveType[move]) {
        throw new Error(`Invalid move type: ${move}. Valid types are: ${Object.keys(MoveType).join(', ')}`);
    }
}

function parseTuringMachineProgram(programString, emptySymbol, tape, startState) {
    const program = JSON.parse(convertString(programString));
    const result = new TuringProgram(startState, tape, emptySymbol);
    
    for (const [stateName, transitions] of Object.entries(program)) {
        
        for (const [symbol, action] of Object.entries(transitions)) {
            if (typeof action === 'string') {
                validateMoveType(action);
                result.addTransition(stateName, symbol, new Command(symbol, MoveType[action], stateName));
            } else {
                const { write, move, nextState } = action;
                validateMoveType(move);
                result.addTransition(stateName, symbol, new Command(write || symbol, MoveType[move], nextState || stateName));
            }
        }
    }
    
    return result;
}

const program = `
    q1: {
        1: 'L',
        e: { write: 1, move: 'L', nextState: 'q2' }
    },
    q2: {
        1: { write: 'e', move: 'R', nextState: 'q3' },
        e: { write: 1, move: 'L', nextState: 'q3' }
    },
    q3: {
        1: { write: 'e', move: 'R', nextState: 'q4' },
        e: { write: 1, move: 'L', nextState: 'q4' }
    },
    q4: {
        e: { write: 1, move: 'R', nextState: 'q5' }
    },
    q5: {
        e: { move: 'R', nextState: 'q2' }
    }
`;
//const parsedProgram = parseTuringMachineProgram(program);
//console.log(parsedProgram);

function run() {
    var initialState = document.getElementById('initialState').value;
    var _tape = document.getElementById('tape-input').value;
    var _emptySymbol = document.getElementById('emptySymbol').value;
    var programmText = document.getElementById('rules-string').value;
    var p = parseTuringMachineProgram(programmText, _emptySymbol, _tape, initialState);
    console.log(p);
    var t = new TuringMachine(p);
    var r = t.run(1000);
    console.log(r);

    setResultString(r.tape);
    setResultSteps(r.steps);
    clearAnswer();
    const lineContainer = document.getElementById('lineContainer');
    addLinesToContainer(r.history, lineContainer);

    headPosition = r.headPosition;
    renderTape(_emptySymbol, r.tape)
};