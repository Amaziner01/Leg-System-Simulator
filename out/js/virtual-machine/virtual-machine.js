import { TokType } from "../common/types.js";
export class VirtualMachine {
    constructor(out) {
        this.registers = new Int16Array(16);
        this.pc = new Uint16Array(1);
        this.zeroFlag = false;
        this.negFlag = false;
        this.memory = null;
        this.stack = [];
        this.callStack = [];
        this.tty = out;
    }
    reset() {
        this.registers.fill(0);
        this.pc.fill(0);
        this.zeroFlag = false;
        this.negFlag = false;
        this.callStack.length = 0;
        this.stack.length = 0;
    }
    loadProgram(program) {
        this.memory = program;
        this.reset();
    }
    nextByte() {
        if (this.pc[0] >= 0x1000)
            return 0;
        if (this.memory == null)
            return 0;
        let byte = this.memory[this.pc[0]];
        this.pc[0]++;
        return byte;
    }
    nextWord() {
        return (this.nextByte() << 8) | this.nextByte();
    }
    cycle() {
        var _a, _b;
        if (this.memory == null)
            return false;
        let opcode = this.nextByte();
        if (opcode == TokType.Halt)
            return false;
        if (opcode == TokType.Nop)
            return true;
        if (opcode == TokType.Print) {
            let start = this.registers[0];
            let str = "";
            let code;
            while ((code = this.memory[start]) != 0) {
                str += String.fromCharCode(code);
                start++;
            }
            console.log(str);
            if (typeof this.tty !== undefined)
                (_a = this.tty) === null || _a === void 0 ? void 0 : _a.print(str);
            return true;
        }
        if (opcode == TokType.PrintR) {
            console.log(this.registers[0]);
            if (typeof this.tty !== undefined)
                (_b = this.tty) === null || _b === void 0 ? void 0 : _b.print(this.registers[0].toString());
            return true;
        }
        if (opcode >= TokType.Add && opcode <= TokType.Cmp) {
            let lreg = this.nextByte();
            let rreg = this.nextByte();
            if ((lreg | rreg) > 15)
                throw new Error("Max register is r15");
            switch (opcode) {
                case TokType.Add:
                    {
                        this.registers[0] = this.registers[lreg] + this.registers[rreg];
                    }
                    break;
                case TokType.Sub:
                    {
                        this.registers[0] = this.registers[lreg] - this.registers[rreg];
                    }
                    break;
                case TokType.Mul:
                    {
                        this.registers[0] = this.registers[lreg] * this.registers[rreg];
                    }
                    break;
                case TokType.Div:
                    {
                        this.registers[0] = this.registers[lreg] / this.registers[rreg];
                    }
                    break;
                case TokType.Mod:
                    {
                        this.registers[0] = this.registers[lreg] % this.registers[rreg];
                    }
                    break;
                default:
                    {
                        let result = this.registers[lreg] - this.registers[rreg];
                        this.zeroFlag = result == 0;
                        this.negFlag = result < 0;
                    }
                    break;
            }
            return true;
        }
        if (opcode >= TokType.Jmp && opcode <= TokType.Call) {
            let num = this.nextWord();
            if (num >= 0x1000)
                throw new Error("Memory location out of bounds.");
            let jmp = false;
            switch (opcode) {
                case TokType.Jmp:
                    jmp = true;
                    break;
                case TokType.Jeq:
                    jmp = this.zeroFlag;
                    break;
                case TokType.Jne:
                    jmp = !this.zeroFlag;
                    break;
                case TokType.Jl:
                    jmp = this.negFlag;
                    break;
                case TokType.Jle:
                    jmp = this.negFlag || this.zeroFlag;
                    break;
                case TokType.Jg:
                    jmp = !this.negFlag && !this.zeroFlag;
                    break;
                case TokType.Jge:
                    jmp = !this.negFlag;
                    break;
                default:
                    {
                        jmp = true;
                        this.callStack.push(this.pc[0]);
                    }
                    break;
            }
            if (jmp)
                this.pc[0] = num;
            return true;
        }
        switch (opcode) {
            case TokType.Mov:
                {
                    let reg = this.nextByte();
                    if (reg > 15)
                        throw new Error("Max register is r15");
                    let num = this.nextWord();
                    this.registers[reg] = num;
                }
                break;
            case TokType.Push:
                {
                    let reg = this.nextByte();
                    if (reg > 15)
                        throw new Error("Max register is r15");
                    this.stack.push(this.registers[reg]);
                }
                break;
            case TokType.Pop:
                {
                    let reg = this.nextByte();
                    if (reg > 15)
                        throw new Error("Max register is r15");
                    this.registers[reg] = this.stack.pop();
                }
                break;
            case TokType.Inc:
                {
                    let reg = this.nextByte();
                    if (reg > 15)
                        throw new Error("Max register is r15");
                    this.registers[reg] += 1;
                }
                break;
            case TokType.Ret:
                {
                    this.pc[0] = this.callStack.pop();
                }
                break;
            case TokType.Ld:
                {
                    let num = this.nextWord();
                    if (num >= 0x1000)
                        throw new Error("Memory location out of bounds.");
                    let reg = this.nextByte();
                    if (reg > 15)
                        throw new Error("Max register is r15");
                    this.registers[reg] = num;
                }
                break;
            case TokType.Str:
                {
                    let reg = this.nextByte();
                    if (reg > 15)
                        throw new Error("Max register is r15");
                    let num = this.nextWord();
                    if (num >= 0x1000)
                        throw new Error("Memory location out of bounds.");
                    this.memory[num] = this.registers[reg];
                }
                break;
            default: throw new Error(`Unknown instruction. [${opcode}]`);
        }
        return true;
    }
    run() {
        while (this.cycle())
            ;
        console.log("System Halted");
    }
}
//# sourceMappingURL=virtual-machine.js.map