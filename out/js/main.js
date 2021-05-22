import { VirtualMachine } from "./virtual-machine/virtual-machine.js";
import { Compiler } from "./compiler/compiler.js";
import { Parser } from "./compiler/parser.js";
import { Lexer } from "./compiler/lexer.js";
import { TeleType } from "./components/teletype.js";
document.addEventListener("DOMContentLoaded", () => {
    const runBtn = document.getElementById("run-btn");
    const stopBtn = document.getElementById("stop-btn");
    const stepBtn = document.getElementById("stop-btn");
    const editor = document.getElementById("input");
    const tty_out = document.getElementById("output");
    const tty = new TeleType(tty_out);
    const vm = new VirtualMachine(tty);
    let exec = 0;
    let Regs = Array(17);
    for (let i = 0; i < 17; i++)
        Regs[i] = document.getElementById("R" + i.toString());
    tty.clear();
    function runVM() {
        tty.clear();
        clearInterval(exec);
        try {
            let lexer = new Lexer(editor.value);
            let parser = new Parser(lexer.tokenize());
            let compiler = new Compiler(parser.parse());
            let program = compiler.compile();
            vm.loadProgram(program);
            exec = setInterval(() => {
                let running = vm.cycle();
                for (let i = 0; i < 16; i++)
                    Regs[i].innerHTML = vm.registers[i].toString();
                Regs[16].innerHTML = vm.pc[0].toString();
                if (running == false) {
                    tty.print("System Halted!");
                    clearInterval(exec);
                    exec = 0;
                }
            }, 1);
        }
        catch (e) {
            tty.error(e);
        }
    }
    function stopVM() {
        if (exec == 0)
            return;
        tty.print("System Stopped");
        clearInterval(exec);
        exec = 0;
    }
    document.addEventListener("keydown", (e) => {
        //console.log(e.keyCode);
        switch (e.keyCode) {
            case 112:
                runVM();
                break;
            case 113:
                stopVM();
                break;
        }
    });
    stopBtn.onclick = () => stopVM();
    runBtn.onclick = () => runVM();
});
/*
function main()
{
    const src = `log_sum:

    mov r0, r1
    printr
    mov r0, str1
    print
    mov r0, r2
    printr
    mov r0, str2
    printr
    add r1, r2
    printr
    
    ret
    
    str1: ds " + "
    str2: ds " is "`;

    let lexer = new Lexer(src);
    let tokens = lexer.tokenize();
    console.log(tokens);

    let parser = new Parser(tokens);
    let nodes = parser.parse();
    console.log(nodes);

    let compiler = new Compiler(nodes);
    let program = compiler.compile();

    console.log(program);

    let vm = new VirtualMachine();
    vm.loadProgram(program);

    vm.run();
}

main();
*/ 
//# sourceMappingURL=main.js.map