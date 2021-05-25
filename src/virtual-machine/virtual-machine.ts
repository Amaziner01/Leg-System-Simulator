import {TokType} from "../common/types.js"
import {TeleType} from "../components/teletype.js";

export class VirtualMachine
{
    readonly registers: Int16Array; 
    readonly pc: Uint16Array;

    private zeroFlag: boolean;
    private negFlag: boolean;
    
    private memory: Uint8Array | null;
    
    private stack: Array<Number>;
    private callStack: Array<Number>;

    private tty: TeleType;
    private currInst: Array<HTMLElement>;

    constructor(out: TeleType, currInst: Array<HTMLElement>)
    {
        this.registers = new Int16Array(16);
        this.pc = new Uint16Array(1); 

        this.zeroFlag = false;
        this.negFlag = false;

        this.memory = null;
        this.stack = [];
        this.callStack = [];

        this.tty = out;
        this.currInst = currInst;
    }

    reset()
    {
        this.registers.fill(0);
        this.pc.fill(0);

        this.zeroFlag = false;
        this.negFlag = false;

        this.callStack.length = 0;
        this.stack.length = 0;
    }

    loadProgram(program: Uint8Array)
    {
        this.memory = program;
        this.reset();
    }

    private nextByte(): number
    {
        if (this.pc[0] >= 0x1000) return 0;
        if (this.memory == null) return 0;

        let byte = this.memory[this.pc[0]];
        this.pc[0]++;
        return byte;
    }

    private nextWord(): number
    {
        return (this.nextByte() << 8) | this.nextByte(); 
    }

    cycle(): boolean
    {
        let opcodeIns = ""; 
        let secondCode = ""; 
        let thirdCode = "";

        let running = true;

        if (this.memory == null) return false;

        let opcode = this.nextByte();

        if (opcode > TokType.PrintR) throw new Error(`Unknown instruction. [${opcode}]`)

        if (opcode >= TokType.Add && opcode <= TokType.Cmp)
        {
            let lreg = this.nextByte();
            let rreg = this.nextByte();

            if ((lreg | rreg) > 15) throw new Error("Max register is r15");

            secondCode = "R" + lreg.toString();
            thirdCode = "R" + rreg.toString();

            switch (opcode)
            {
                case TokType.Add: {
                    this.registers[0] = this.registers[lreg] + this.registers[rreg];
                    opcodeIns = "ADD";
                } break;
                case TokType.Sub: {
                    this.registers[0] = this.registers[lreg] - this.registers[rreg];
                    opcodeIns = "SUB";
                } break;
                case TokType.Mul: {
                    this.registers[0] = this.registers[lreg] * this.registers[rreg];
                    opcodeIns = "MUL";
                } break;
                case TokType.Div: {
                    this.registers[0] = this.registers[lreg] / this.registers[rreg];
                    opcodeIns = "DIV";
                } break;
                case TokType.Mod: {
                    this.registers[0] = this.registers[lreg] % this.registers[rreg];
                    opcodeIns = "MOD";
                } break;
                default: {
                    let result = this.registers[lreg] - this.registers[rreg];

                    this.zeroFlag = result == 0;
                    this.negFlag = result < 0;
                    opcodeIns = "CMP";
                } break;
            }
        }
        else if (opcode >= TokType.Jmp && opcode <= TokType.Call)
        {
            let num = this.nextWord();
            if (num >= 0x1000) throw new Error("Memory location out of bounds.");

            secondCode = num.toString();
            thirdCode = "";

            let jmp = false;

            switch (opcode)
            {
                case TokType.Jmp: {
                    jmp = true;
                    opcodeIns = "JMP";
                } break;

                case TokType.Jeq: { 
                    jmp = this.zeroFlag; 
                    opcodeIns = "JEQ";
                } break;

                case TokType.Jne:  {
                    jmp = !this.zeroFlag;
                    opcodeIns = "JNE";
                } break;

                case TokType.Jl: {
                    jmp = this.negFlag;
                    opcodeIns = "JL";
                } break;

                case TokType.Jle: {
                    jmp = this.negFlag || this.zeroFlag;
                    opcodeIns = "JLE";
                } break;

                case TokType.Jg: { 
                    jmp = !this.negFlag && !this.zeroFlag; 
                    opcodeIns = "JG";
                } break;

                case TokType.Jge: { 
                    jmp = !this.negFlag; 
                    opcodeIns = "JGE";
                } break;

                default: { // Call
                    jmp = true;
                    this.callStack.push(this.pc[0]);
                    opcodeIns = "CALL";
                } break;
            }

            if (jmp) this.pc[0] = num;
        }
        else
        {
            switch (opcode)
            {
                case TokType.Halt: {
                    running = false;
                } break;

                case TokType.Nop: break;

                case TokType.Print: {
                    let start = this.registers[0];
                    let str = "";

                    let code;
                    while((code = this.memory[start]) != 0)
                    { str += String.fromCharCode(code); start++; }

                    console.log(str);

                    if (typeof this.tty !== undefined)
                        this.tty?.print(str);

                    opcodeIns = "PRINT";

                } break;

                case TokType.PrintR: {
                    console.log(this.registers[0]);

                    if (typeof this.tty !== undefined)
                        this.tty?.print(this.registers[0].toString());

                    opcodeIns = "PRINTR";

                } break;

                case TokType.Mov: {
                    let reg = this.nextByte();
                    if (reg > 15) throw new Error("Max register is r15");

                    let num = this.nextWord();
                    this.registers[reg] = num;

                    opcodeIns = "MOV";
                    secondCode = "R" + reg.toString();
                    thirdCode = num.toString();

                } break;

                case TokType.Push: {
                    let reg = this.nextByte();
                    if (reg > 15) throw new Error("Max register is r15");

                    this.stack.push(this.registers[reg]);

                    opcodeIns = "PUSH";
                    secondCode = "R" + reg.toString();

                } break;

                case TokType.Pop: {
                    let reg = this.nextByte();
                    if (reg > 15) throw new Error("Max register is r15");

                    this.registers[reg] = this.stack.pop() as number;

                    opcodeIns = "POP";
                    secondCode = "R" + reg.toString();

                } break;

                case TokType.Inc: {
                    let reg = this.nextByte();
                    if (reg > 15) throw new Error("Max register is r15");

                    this.registers[reg] += 1;

                    opcodeIns = "INC";
                    secondCode = "R" + reg.toString();

                } break;

                case TokType.Dec: {
                    let reg = this.nextByte();
                    if (reg > 15) throw new Error("Max register is r15");

                    this.registers[reg] -= 1;

                    opcodeIns = "DEC";
                    secondCode = "R" + reg.toString();

                } break;

                case TokType.Ret: {
                    this.pc[0] = this.callStack.pop() as number;
                    opcodeIns = "RET";

                } break;

                case TokType.Ld: {
                    let num = this.nextWord();
                    if (num >= 0x1000) throw new Error("Memory location out of bounds.");
                    
                    let reg = this.nextByte();
                    if (reg > 15) throw new Error("Max register is r15");
                    
                    this.registers[reg] = num;

                    opcodeIns = "LD";
                    secondCode = num.toString();
                    thirdCode = "R" + reg.toString();

                } break;

                default: { // Str
                    let reg = this.nextByte();
                    if (reg > 15) throw new Error("Max register is r15");
                    
                    let num = this.nextWord();
                    if (num >= 0x1000) throw new Error("Memory location out of bounds.");

                    this.memory[num] = this.registers[reg];

                    opcodeIns = "STR";
                    secondCode = "R" + reg.toString();
                    thirdCode = num.toString();

                } break;
            }
        }

        if (this.currInst != undefined)
        {
            this.currInst[0].innerText = opcodeIns; 
            this.currInst[1].innerHTML = secondCode;
            this.currInst[2].innerHTML = thirdCode; 
        }

        return running;
    }

    run()
    {
        while (this.cycle());
        console.log("System Halted");
    }
}

