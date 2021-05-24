import {VirtualMachine} from "./virtual-machine/virtual-machine.js"
import {Compiler} from "./compiler/compiler.js"
import {Parser} from "./compiler/parser.js"
import {Lexer} from "./compiler/lexer.js"

import {TeleType} from "./components/teletype.js"

document.addEventListener("DOMContentLoaded", ()=> {
    
    const runBtn = document.getElementById("run-btn") as HTMLButtonElement;
    const stopBtn = document.getElementById("stop-btn") as HTMLButtonElement;
    const stepBtn = document.getElementById("step-btn") as HTMLButtonElement;
    
    const fileUpload = document.getElementById("upload") as HTMLInputElement;

    const editor = document.getElementById("input") as HTMLTextAreaElement;
    const tty_out = document.getElementById("output") as HTMLTextAreaElement;
    
    const tty = new TeleType(tty_out);
    const vm = new VirtualMachine(tty);

    let paused = false;

    let exec = 0;

    stopBtn.style.pointerEvents = "none";
    stepBtn.style.pointerEvents = "none";
    

    let Regs = Array<HTMLElement>(17);

    for(let i = 0; i < 17; i++)
        Regs[i] = document.getElementById("R" + i.toString()) as HTMLElement;
    
    tty.clear();

    function runVirtualMachine() 
    {
        tty.clear();
        clearInterval(exec);
        runBtn.innerHTML = "Stop";

        stopBtn.style.pointerEvents = "all";
        stepBtn.style.pointerEvents = "all";
        
        try {

            let lexer = new Lexer(editor.value);
            let parser = new Parser(lexer.tokenize());
            let compiler = new Compiler(parser.parse());
            let program = compiler.compile();

            console.log(program);
            
            vm.loadProgram(program);
        
            exec = setInterval( () => {
                
                if (!paused)
                {

                    try
                    {
                        let running = vm.cycle();
                        for (let i = 0; i < 16; i++)
                        Regs[i].innerHTML = vm.registers[i].toString();
                    
                        Regs[16].innerHTML = vm.pc[0].toString();
                
                        if (running == false)
                        {
                            tty.print("System Halted!");
                            clearInterval(exec);
                            exec = 0;
                        }
                    }
                    catch (e)
                    {
                        tty.error(e);
                        clearInterval(exec);
                    }
                }
    
            }, 1);
        }
        catch(e)
        {
            tty.error(e);
        }
    
    }

    function stopVirtualMachine() 
    {
        if (exec == 0) return;
        resumeVirtualMachine();
        clearInterval(exec);
        exec = 0;
        tty.print("System Stopped.");
        runBtn.innerHTML = "Run";
        stopBtn.style.pointerEvents = "none";
        stepBtn.style.pointerEvents = "none";

    }
    
    function pauseVirtualMachine() {
        paused = true;
        stopBtn.innerHTML = "Resume";
    }

    function resumeVirtualMachine() {
        paused = false;
        stopBtn.innerHTML = "Pause";
    }

    async function saveFile() {
        let blob = new Blob([editor.value], {type : "application/text"});
        let url = URL.createObjectURL(blob);

        let tmp = document.getElementById("download") as any;

        tmp.style.display = "none";
        tmp.href = url;
        tmp.setAttribute("download", "code.lasm");

        tmp.click();

        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 100);
    }

    async function loadFile() {
        fileUpload.click();
    }

    document.addEventListener("change", () => {
        if (fileUpload == null) return;

        let file = (fileUpload.files as FileList)[0];
        let reader = new FileReader();

        reader.readAsText(file, "UTF-8");
        reader.onload = (e) => {
            editor.value = e.target?.result as string;
        }
        reader.onerror = (e) => {
            throw new Error("Couldn't load file");
        }

    }, false);
    
    document.addEventListener("keydown", (e) => {
        //console.log(e.keyCode);
    
        switch (e.keyCode)
        {
            case 112: runVirtualMachine(); break;
            case 114: loadFile(); break;
            case 115: saveFile(); break;
        }
    });

    stopBtn.onclick = () => {
        console.log(exec);
        if (exec == 0) return;
        paused ? resumeVirtualMachine() : pauseVirtualMachine();
    };

    runBtn.onclick = () => {
        exec == 0 ? runVirtualMachine() : stopVirtualMachine();
    }


    stepBtn.onclick = () => {
        if (exec == 0) return;

        if (!paused) pauseVirtualMachine();

        let halted = vm.cycle();
        for (let i = 0; i < 16; i++)
            Regs[i].innerHTML = vm.registers[i].toString();
                    
        Regs[16].innerHTML = vm.pc[0].toString();

        if (!halted)
        {
            clearInterval(exec);
            exec = 0;
        }
    }
});



/*
function main()
{
    const src = `dec r1`;

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
