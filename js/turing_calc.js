Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}


const tapeElement = document.getElementById('tapes');
const editorHeaderElement = document.getElementById('editor-header');
var tapeElements = [];
var tapes = [];
var numsElements = [];
var headPosition = [];
var countTapes = 0;

var isModificationAllowed = true;

var emptySymbol = 'f';

var tapeWidth = 362 - 2;
const cellWidth = 40;
var countCells = tapeWidth / cellWidth;
var midCells = countCells / 2;

var caretPosDelta = [];

var deletingStr = false;

/////////////////////
var states = ["q0"];
var state_symbol = new Map();
var select_state = 0;
var maxSteps = 1000;
var stepsInterval = 500;
var programmName = "Untitled";
var initialState = 0;

var name_states = 1;

var moveType = ["R", "L", "S"]

function addTape() {
    if (isModificationAllowed) {
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
        tapes[countTapes] = "f";
        caretPosDelta[countTapes] = 0;

        for (var st_i = 0; st_i < states.length; st_i++) {
            if (state_symbol.has(states[st_i])) {
                for (var i = 0; i < state_symbol.get(states[st_i]).length; i++) {
                    state_symbol.get(states[st_i])[i].push(emptySymbol);
                    state_symbol.get(states[st_i])[i].push("S");
                    state_symbol.get(states[st_i])[i][0] += emptySymbol;
                }
            }
        }

        countTapes += 1;
        render();
        renderEditor();
    } else {
        showErrorPopup("Machine is run");
    }
}

function removeTape() {
    if (isModificationAllowed) {
        if (countTapes > 1) {
            countTapes -= 1;

            var lastTapeId = "tape-container" + countTapes;
            var lastTapeElement = document.getElementById(lastTapeId);

            if (lastTapeElement) {
                lastTapeElement.remove();
            } else {
                return;
            }


            tapeElements.pop();
            numsElements.pop();
            headPosition.pop();
            tapes.pop();
            caretPosDelta.pop();

            for (var st_i = 0; st_i < states.length; st_i++) {
                if (state_symbol.has(states[st_i])) {
                    for (var i = 0; i < state_symbol.get(states[st_i]).length; i++) {
                        state_symbol.get(states[st_i])[i].pop();
                        state_symbol.get(states[st_i])[i].pop();
                        var a = state_symbol.get(states[st_i])[i][0];
                        state_symbol.get(states[st_i])[i][0] = a.substring(0, a.length - 1);
                    }
                }
            }
            
            console.log("Удалена лента с ID:", countTapes);
            render();
            renderEditor();
        } else {
            console.log("Нет лент для удаления.");
        }
    } else {
        showErrorPopup("Machine is run");
    }
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
    updateCaretPosition(element, nums, head);
}

function handleCellClick(index) {
    if (isModificationAllowed) {
        let userInput = prompt("Enter text to tape " + index + ":");
        if (userInput == null || userInput.length == 0) userInput = "f";
        tapes[index] = userInput;
        headPosition[index] = 0;
        caretPosDelta[index] = 0;
        render();
    } else {
        showErrorPopup("Machine is run");
    }
}

function updateCaretPosition(element, nums, head) {
    const offset = head * cellWidth;
    element.style.transform = `translateX(-${offset}px)`;
    nums.style.transform = `translateX(-${offset}px)`;
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

function removeStateSymbol() {
    if (isModificationAllowed) {
        deletingStr = !deletingStr;
        renderEditor();
    } else {
        showErrorPopup("Machine is run");
    }
}

function removeStr(num) {
    state_symbol.get(states[select_state]).splice(num, 1);
    renderEditor();
}

function addState() {
    if (isModificationAllowed) {
        var name = `q${name_states}`;
        states.push(name);
        state_symbol.set(name, []);
        name_states += 1;
        var raz = document.getElementById("editor-content");
        var n = document.createElement("div");
        n.className = "editor-content";
        n.id = `edit-${name}`;
        raz.appendChild(n);
        renderEditor()
        renderSettings();
    } else {
        showErrorPopup("Machine is run");
    }
}

function removeState(num) {
    if (states.length > 1) {
        state_symbol.delete(states[num]);
        document.getElementById(`edit-${states[num]}`).remove();
        states.splice(num, 1);
        if (initialState > num) {
            initialState--;
        }
        if (initialState == num) {
            initialState = 0;
        }
        if (select_state > num) {
            select_state--;
        }
        renderEditor();
    }
}

function addStateSymbol(state) {
    if (isModificationAllowed) {
        if (!state_symbol.has(state)) {
            state_symbol.set(state, []);
        }
        var st = `${state_symbol.get(state).length}_`;
        for (var i = 0; i < countTapes; i++) {
            st += emptySymbol;
        }
        var addAr = [st, state];
        for (var i = 0; i < countTapes; i++) {
            addAr.push(emptySymbol);
            addAr.push("S");
        }
        state_symbol.get(state).push(addAr);
        renderEditor();
    } else {
        showErrorPopup("Machine is run");
    }
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
    `;
    for (var i = 0; i < countTapes; i++) {
        editorHeaderElement.innerHTML +=
        `
        <div class="states-buttons">
            <a class="state-button" onclick="removeStateSymbol()">
                Tape #${i} read
            </a>
        </div>
        `;
    }
    editorHeaderElement.innerHTML += `
    <div class="states-buttons">
        <a class="state-button" onclick="removeStateSymbol()">
            Next state
        </a>
    </div>
    `;
    for (var i = 0; i < countTapes; i++) {
        editorHeaderElement.innerHTML +=
        `
        <div class="states-buttons">
            <a class="state-button" onclick="removeStateSymbol()">
                Tape #${i} write
            </a>
        </div>
        <div class="states-buttons">
            <a class="state-button" onclick="removeStateSymbol()">
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
            panel.innerHTML += `<a class="state-button ${deletingStr ? "deleting" : ""}"
                                onclick="${deletingStr ? `removeState(${index})` : `changeEdit(${index})`}">${st}</a>`;
    });
    if (!deletingStr)
        panel.innerHTML += `<a class="state-button" onclick="addState()">+</a>`;
}

function replaceCharAt(str, index, replacement) {
    if (index < 0 || index >= str.length) {
        return str;
    }
    return str.slice(0, index) + replacement + str.slice(index + 1);
}

function replaceST(state, index, i, r) {
    var a = state_symbol.get(state)[index][0];
    state_symbol.get(state)[index][0] = a.split("_")[0] + "_" + replaceCharAt(a.split("_")[1], i, r);
}

function renderContentEditor(state) {
    var edit = document.getElementById(`edit-${state}`);
    edit.innerHTML = "";
    var temp = "";
    var com_ar = state_symbol.get(state) || [];
    for (var i = 0; i < countTapes; i++) {
        temp = "";
        com_ar.forEach((command, index) => {
            temp += `<input type="text" class="symbol-field ${deletingStr ? "deleting" : ""}" id="symbol-${state}-${index}-${i}" placeholder="0" value="${command[0].split("_")[1].charAt(i)}"
            onblur="replaceST('${state}', ${index}, ${i}, document.getElementById('symbol-${state}-${index}-${i}').value);"
            ${deletingStr ? `onclick="removeStr(${index})"` : ""}></input>`;
        });
        if (!deletingStr)
            temp += `<a class="state-button" onclick="addStateSymbol('${state}')">+</a>`;
        edit.innerHTML += `<div class="states-buttons">${temp}</div>`;
    }

    ///
    var nextStateDivCon = document.createElement("div");
    nextStateDivCon.className = "states-buttons";
    com_ar.forEach((command, index) => {
        var t = generateStateSelect(state, command[0], command[1])
        t.addEventListener('change', (event) => {
            state_symbol.get(state)[index][1] = t.value;
        });
        if (deletingStr) {
            t.classList.add("deleting");
            t.onclick = () => removeStr(index);
        }
        nextStateDivCon.appendChild(t);
    });
    if (!deletingStr) {
        var tempDiv = document.createElement("a");
        tempDiv.className = "state-button";
        tempDiv.textContent = "+";
        tempDiv.onclick = () => addStateSymbol(state);
        nextStateDivCon.appendChild(tempDiv);
    }
    edit.appendChild(nextStateDivCon);
    
    for (var i = 0; i < countTapes; i++) {
        var tapeCon = document.createElement("div");
        tapeCon.className = "states-buttons";
        com_ar.forEach((command, index) => {
            var g = i;
            tapeCon.innerHTML += `<input type="text" class="symbol-field ${deletingStr ? "deleting" : ""}" id="${state}-${command[0]}-tape-${g}" placeholder="0" value="${command[2 + i * 2]}"
            onblur="state_symbol.get('${state}')[${index}][2 + ${g} * 2] = document.getElementById('${state}-${command[0]}-tape-${g}').value;"
            ${deletingStr ? `onclick="removeStr(${index})"` : ""}></input>`;
        });
        if (!deletingStr)
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
            if (deletingStr) {
                t.classList.add("deleting");
                t.onclick = () => removeStr(index);
            }
            tapeCon2.appendChild(t);
        });
        
        if (!deletingStr) {
            var tempDiv = document.createElement("a");
            tempDiv.className = "state-button";
            tempDiv.textContent = "+";
            tempDiv.onclick = () => addStateSymbol(state);
            tapeCon2.appendChild(tempDiv);
        }
        
        edit.appendChild(tapeCon2);
    }
}

function renderEditor() {
    renderHeader()
    renderStatePanel();
    renderContentEditor(states[select_state]);
}

renderEditor();

const emptySymbolElement = document.getElementById('emptySymbol');
const maxStepsElement = document.getElementById('max-steps');
const stepsIntervalElement = document.getElementById('steps-interval');
const programmNameElement = document.getElementById('name-string');
const initialStateElement = document.getElementById('initialState');

function renderSettings() {
    while (initialStateElement.options.length > 0) {
        initialStateElement.remove(0);
    }
    states.forEach((state, index) => {
        initialStateElement.appendChild(new Option(state, index));
    });
    initialStateElement.value = initialState;
}

renderSettings();

initialStateElement.addEventListener('blur', function() {
    if (isModificationAllowed) {
        var temp = initialStateElement.value;
        if (temp)
            initialState = temp;
        else {
            initialState = 0;
            initialStateElement.value = initialState;
        }
    } else {
        showErrorPopup("Machine is run");
        initialStateElement.value = initialState;
    }
    render();
});

emptySymbolElement.addEventListener('blur', function() {
    if (isModificationAllowed) {
        var temp = emptySymbolElement.value;
        if (temp && temp.length == 1)
            emptySymbol = temp;
        else {
            emptySymbol = 'f';
            emptySymbolElement.value = 'f';
        }
    } else {
        showErrorPopup("Machine is run");
        emptySymbolElement.value = emptySymbol;
    }
    render();
});

programmNameElement.addEventListener('blur', function() {
    if (isModificationAllowed) {
        var temp = programmNameElement.value;
        if (temp)
            programmName = temp;
        else {
            programmName = 'Untitled';
            programmNameElement.value = programmName;
        }
    } else {
        showErrorPopup("Machine is run");
        programmNameElement.value = programmName;
    }
    render();
});

maxStepsElement.addEventListener('blur', function() {
    if (isModificationAllowed) {
        var temp = maxStepsElement.value;
        if (temp)
            maxSteps = temp;
        else {
            maxSteps = 1000;
            maxStepsElement.value = maxSteps;
        }
    } else {
        showErrorPopup("Machine is run");
        maxStepsElement.value = maxSteps;
    }
    render();
});

stepsIntervalElement.addEventListener('blur', function() {
    if (isModificationAllowed) {
        var temp = stepsIntervalElement.value;
        if (temp)
            stepsInterval = temp;
        else {
            stepsInterval = 500;
            stepsIntervalElement.value = stepsInterval;
        }
    } else {
        showErrorPopup("Machine is run");
        stepsIntervalElement.value = stepsInterval;
    }
    render();
});

function convertToTuringProgramm() {
    var program = new TuringProgram(states[initialState], tapes, emptySymbol, countTapes, programmName);
    console.log(`------------------`)
    console.log(`programm:`)
    var h = new Map();
    var f = false;
    states.forEach((state, state_index) => {
        if (state_symbol.has(state)) {
            state_symbol.get(state).forEach((ar, ar_index) => {
                var symbol = ar[0].split("_")[1];
                if (h.has(symbol)) {
                    f = true;
                } else {
                    h.set(symbol, 1);
                }
                var new_st = ar[1];
                for (var i = 0; i < countTapes; i++) {
                    program.addTransition(state, symbol, i, new Command(ar[2 + i * 2], MoveType[ar[3 + i * 2]], new_st));
                    console.log(`${state} | ${symbol} | tape ${i} | ${ar[2 + i * 2]} | ${ar[3 + i * 2]}`)
                }
            });
        }
    });
    console.log(`------------------`)
    if(f) return null;
    return program;
}

var intervalId;

function startExecution(program, maxSteps) {
    const machine = new TuringMachine(program);
    let stepsTaken = 0;
    //console.log(machine);
    intervalId = setInterval(() => {
        if (stepsTaken < maxSteps) {
            const result = machine.step();
            if (!result) {
                clearInterval(intervalId);
                isModificationAllowed = true;
                return;
            }
            stepsTaken++;
            tapes = machine.tape;
            headPosition = machine.headPosition;
            caretPosDelta = machine.caretPosDelta;
            //console.log(`Step: ${stepsTaken}, Tape: ${tapes}, Head Position: ${headPosition}`);
            clearAnswer();
            render();
            document.getElementById("result_steps").innerHTML = "Count steps: " + stepsTaken;
            const lineContainer = document.getElementById('lineContainer');
            addLinesToContainer(machine.history, lineContainer);
        } else {
            clearInterval(intervalId);
            isModificationAllowed = true;
        }
    }, stepsInterval);
}

function run() {
    isModificationAllowed = false;
    clearInterval(intervalId);
    var prog = convertToTuringProgramm();
    if (prog == null) {
        showErrorPopup("The program contains an identical tuple of read characters.");
        return;
    }
    //console.log(prog);
    startExecution(prog, maxSteps);
};

function stop() {
    clearInterval(intervalId);
    isModificationAllowed = true;
}

/////////////////
var programs = [];

function downloadProgramms() {
    const blob = new Blob([TuringProgram.serializeArray(programs)], { type: 'application/json' });
	const filename = "turing_program.dmtm";
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'data.json';

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.getElementById('fileInput').addEventListener('change', (event) => {
	const file = event.target.files[0];

	if (file) {
		const reader = new FileReader();
		reader.onload = function(event) {
			const serializedData = event.target.result;
			const pro = TuringProgram.deserializeArray(serializedData);
			//console.log(pro);
			programs = pro;
			proggramDivUpdate();
            render();
            renderEditor();
		};
		reader.readAsText(file);
	} else {
		showErrorPopup('Пожалуйста, выберите файл для загрузки.');
	}
});

function addProgramm () {
	programs.push(convertToTuringProgramm())
	proggramDivUpdate();
}

function removeProgramm(n) {
	programs.splice(n, 1);
	proggramDivUpdate();
}

// TODO
function convertFromTuringProgram(program) {
    tapes = program.tape;
    console.log(program.countTape);
    for (var i = 1; i < program.countTape; i++) {
        addTape()
    }
    states = [];
    state_symbol = new Map();
    emptySymbol = program.emptySymbol;
    programmName = program.name;
    


    //console.log(program);

    // Извлечение состояний и переходов
    program.transitionTable.forEach((symbolMap, state) => {
        states.push(state);
        let symbolCounter = 0;
        symbolMap.forEach((tapeMap, symbol) => {
            var tst = "" + symbolCounter + "_" + symbol;
            var temp = [tst]
            var p = false;
            tapeMap.forEach((command, tapeNum) => {
                if (!state_symbol.has(state)) {
                    state_symbol.set(state, []);
                }
                const newState = command.nextState;
                const writeSymbol = command.symbolToWrite;
                const moveType = command.move.charAt(0);
                if (!p) {
                    p = true;
                    temp.push(newState);
                } 

                temp.push(writeSymbol);
                temp.push(moveType);
            });
            state_symbol.get(state).push(temp);
            symbolCounter++;
        });
    });

    console.log(`------------------`);
    console.log(`programm:`);
    states.forEach((state) => {
        if (state_symbol.has(state)) {
            state_symbol.get(state).forEach((ar) => {
                const symbol = ar[0];
                const newState = ar[1];
                const writeSymbol = ar[2];
                const moveType = ar[3];
                console.log(`${state} | ${symbol} | tape | ${writeSymbol} | ${moveType}`);
            });
        }
    });
    console.log(`------------------`);
}

function loadProgramm(n) {
	var p = programs[n];
    select_state = 0;

    convertFromTuringProgram(p);
    tapes = p.tape;
    console.log(programs)

    console.log(states)
    var raz = document.getElementById("editor-content");
    raz.innerHTML = `<div class="states-buttons" id="states-buttons"></div>`;
    states.forEach((state) => {
        var n = document.createElement("div");
        n.className = "editor-content";
        n.id = `edit-${state}`;
        raz.appendChild(n);
    });

    renderSettings();
	programmNameElement.value = programmName;
    initialState.value = states.indexOf(p.initialState);
    emptySymbolElement.value = emptySymbol;
    render();
    renderEditor();
}

function proggramDivUpdate() {
	var div = document.getElementById("programms_div");
	div.innerHTML = "";

	var res = "";
	for (var i = 0; i < programs.length; i++) {
		res += "<div class='program'>";
		res += `<span class="program-name">${programs[i].name}</span>`;
		res += '<div class="programm-buttons">';
		res += `<button onclick='loadProgramm(${i})' class="btn download">Load</button>`;
		res += `<button onclick='removeProgramm(${i})' class="btn delete">Remove</button>`;
		//res += `<button onclick='updateProgramm(${i})' class="btn save">Update</button>`;
		res += '</div>';
		res += "</div>";
	}
	div.innerHTML = res;
}