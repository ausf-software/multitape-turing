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
    constructor(initialState, tape, emptySymbol, countTape) {
        this.initialState = initialState;
        this.tape = tape;
        this.emptySymbol = emptySymbol;
        this.transitionTable = new Map();
        this.countTape = countTape;
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
        this.tape[tape_num] = this.tape[tape_num].substring(0, this.headPosition[tape_num]) + command.symbolToWrite +
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

    run(maxSteps) {
        for (let step = 0; step < maxSteps; step++) {
            if (!this.transitionTable.has(this.currentState)) {
                break;
            }
            var flag = false;
            for (var i = 0; i < this.countTape; i++) {
                const currentSymbol = this.tape[i].charAt(this.headPosition);
                const command = this.getCurrentCommand(currentSymbol, i);

                if (command) {
                    this.commandExecute(command, i);
                } else {
                    flag = true;
                    break;
                }
            }
            if (flag) break;
            this.currentState = this.nextState;
        }
        return new ResultTuring(this.tape, this.history.length, this.headPosition, this.history);
    }

    step() {
        if (!this.transitionTable.has(this.currentState)) {
            return false;
        }
        var flag = false;
        for (var i = 0; i < this.countTape; i++) {
            const currentSymbol = this.tape[i].charAt(this.headPosition[i]);
            const command = this.getCurrentCommand(currentSymbol, i);

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
