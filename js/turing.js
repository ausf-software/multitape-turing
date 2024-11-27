class Command {
    constructor(symbolToWrite, move, nextState) {
        this.symbolToWrite = symbolToWrite;
        this.move = move; // MoveType
        this.nextState = nextState;
    }
}

const MoveType = {
    L: 'LEFT',
    R: 'RIGHT',
    S: 'STAY',
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    STAY: 'STAY',
};

class ResultTuring {
    constructor(tape, steps, headPosition, history) {
        this.tape = tape;
        this.steps = steps;
        this.headPosition = headPosition;
        this.history = history; // Assuming history is an array
    }
}

class TuringProgram {
    constructor(initialState, tape, emptySymbol, countTape, name, transitionTable) {
        this.initialState = initialState;
        this.tape = tape;
        this.emptySymbol = emptySymbol;
        this.transitionTable = transitionTable || new Map();
        this.countTape = countTape;
        this.name = name;
    }

    addTransition(state, symbol, tape_num, command) {
        if (!this.transitionTable.has(state)) {
            this.transitionTable.set(state, new Map());
        }
        if (!this.transitionTable.get(state).has(symbol)) {
            this.transitionTable.get(state).set(symbol, new Map());
        }
        this.transitionTable.get(state).get(symbol).set(tape_num, command);
    }

    toJSON() {
        const transitionTableObj = {};
        this.transitionTable.forEach((symbolMap, state) => {
            transitionTableObj[state] = {};
            symbolMap.forEach((tapeMap, symbol) => {
                transitionTableObj[state][symbol] = {};
                tapeMap.forEach((command, tape_num) => {
                    transitionTableObj[state][symbol][tape_num] = command;
                });
            });
        });

        return JSON.stringify({
            initialState: this.initialState,
            tape: this.tape,
            emptySymbol: this.emptySymbol,
            transitionTable: transitionTableObj,
            countTape: this.countTape,
            name: this.name
        }, null, 2);
    }

    static fromJSON(jsonString) {
        const data = JSON.parse(jsonString);
        const transitionTable = new Map();

        for (const state in data.transitionTable) {
            const symbolMap = new Map();
            for (const symbol in data.transitionTable[state]) {
                const tapeMap = new Map();
                for (const tape_num in data.transitionTable[state][symbol]) {
                    const commandData = data.transitionTable[state][symbol][tape_num];
                    // Создаем экземпляр Command
                    const command = new Command(commandData.symbolToWrite, commandData.move, commandData.nextState);
                    tapeMap.set(tape_num, command);
                }
                symbolMap.set(symbol, tapeMap);
            }
            transitionTable.set(state, symbolMap);
        }

        return new TuringProgram(
            data.initialState,
            data.tape,
            data.emptySymbol,
            data.countTape,
            data.name,
            transitionTable
        );
    }

    static serializeArray(programs) {
        return JSON.stringify(programs.map(program => JSON.parse(program.toJSON())));
    }

    static deserializeArray(jsonString) {
        const dataArray = JSON.parse(jsonString);
        return dataArray.map(data => TuringProgram.fromJSON(JSON.stringify(data)));
    }
}


function countDots(str) {
    return str.split('.').length - 1;
}
function escapeRegexExceptDots(str) {
    var t = str;
    return t.replace(/[-\/\\^$*+?()|[\]{}]/g, '\\$&');
}

class TuringMachine {
    constructor(program) {
        this.transitionTable = new Map(program.transitionTable);
        this.currentState = program.initialState;
        this.tape = program.tape;
        this.headPosition = Array(program.countTape).fill(0);
        this.caretPosDelta = Array(program.countTape).fill(0);
        this.emptySymbol = program.emptySymbol;
        this.history = [];
        this.countTape = program.countTape;
        this.nextState = this.currentState;
    }

    moveCaret(type, tape_num) {
        switch (type) {
            case MoveType.LEFT:
                this.headPosition[tape_num] -= 1;
                if (this.headPosition[tape_num] < 0) {
                    this.tape[tape_num] = this.emptySymbol + this.tape[tape_num]; // Add symbol to the left
                    this.headPosition[tape_num] = 0;
                    this.caretPosDelta[tape_num] += 1;
                }
                break;
            case MoveType.RIGHT:
                this.headPosition[tape_num] += 1;
                if (this.headPosition[tape_num] >= this.tape[tape_num].length) {
                    this.tape[tape_num] += this.emptySymbol; // Add symbol to the right
                }
                break;
            case MoveType.STAY:
                // Do nothing
                break;
        }
    }

    commandExecute(command, tape_num) {
        this.history.push(`${this.currentState} | tape #${tape_num} | ${this.tape[tape_num].charAt(this.headPosition[tape_num])} | ${command.symbolToWrite}`);
        // Write the symbol
        this.tape[tape_num] = this.tape[tape_num].substring(0, this.headPosition[tape_num]) + (command.symbolToWrite === '.' ? this.tape[tape_num].charAt(this.headPosition[tape_num]) : command.symbolToWrite) +
                                this.tape[tape_num].substring(this.headPosition[tape_num] + 1);
        // Move the caret
        this.moveCaret(command.move, tape_num);
        // Transition to the new state
        this.nextState = command.nextState;
    }

    getCurrentCommand(currentSymbol, tape_num) {
        const symbols = this.transitionTable.get(this.currentState) || new Map();
        const commands = symbols.get(currentSymbol) || new Map();
        return commands.get(tape_num);
    }

    getCurrentCommandMap() {
        const symbols = this.transitionTable.get(this.currentState) || new Map();
        return symbols;
    }

    step() {
        if (!this.transitionTable.has(this.currentState)) {
            return false;
        }
        var flag = false;
        var currentSymbol = "";
        for (var i = 0; i < this.countTape; i++) {
            currentSymbol += this.tape[i].charAt(this.headPosition[i]);
        }
        var countPoint = Number.POSITIVE_INFINITY;
        var mask = null;
        var minCount = 0;
        const keys = Array.from(this.getCurrentCommandMap().keys());
        for (const key of keys) {
            const regex = new RegExp(`^${escapeRegexExceptDots(key)}$`);
            if (regex.test(currentSymbol)) {
                //console.log(`The string '${currentSymbol}' matches the regular expression /${key}/`);
                var m = countDots(key);
                if (m < countPoint) {
                    countPoint = m;
                    mask = key;
                    minCount = 1;
                }
                if (minCount == m) {
                    minCount++;
                }
            }
        }
        if (minCount > 1) {
            showErrorPopup("Кабум! Количество подходящих кортежей под кортеж считанных символов больше одного.");
            return false;
        }
        //console.log(mask)
        for (var i = 0; i < this.countTape; i++) {
            const command = this.getCurrentCommand(mask, i);

            if (command) {
                this.commandExecute(command, i);
            } else {
                flag = true;
                break;
            }
        }
        this.currentState = this.nextState;
        return !flag;
    }
}
