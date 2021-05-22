import {TokType} from "../common/types.js"
import {BaseToken, Token} from "./token.js"
export class Lexer
{
    private srcText: string;
    private currChar: string;
    private position: number;

    private lineNo: number;

    constructor(src: string)
    {
        this.lineNo = 1;                
        this.position = 0;
        this.srcText = src;
        if (this.srcText.length == 0) 
        { throw new Error("Document is empty.") }

        this.currChar = this.srcText[this.position];
    }

    private advance()
    {
        if (this.position > this.srcText.length - 1) 
        { this.currChar = '\0'; return; }
            
        this.position++;
        this.currChar = this.srcText[this.position];
    }

    private skipSpace()
    {
        while (/[ \t\r]/.test(this.currChar)) this.advance();
    }

    private number(): number
    {
        let str = "";
        while (/[0-9]/.test(this.currChar))
        {
            str += this.currChar; 
            this.advance(); 
        }

        return parseInt(str);
    }

    private string(): string
    {
        let str = "";
        while (/[A-Za-z0-9_]/.test(this.currChar))
        { 
            if (this.position > this.srcText.length - 1) break;
            str += this.currChar; 
            this.advance(); 
        }

        return str;
    }

    private advanceUntil(char: string)
    {
        while (this.currChar != char)
        {
            if (this.currChar == undefined) break;
            this.advance();
        }
    }

    private next() : BaseToken
    {
        this.skipSpace();

        if (this.currChar == ';')
        { this.advanceUntil('\n') }

        if (this.currChar == ',')
        { this.advance(); return new BaseToken(TokType.Comma); }

        if (this.currChar == '\n')
        { this.advance(); this.lineNo++; return new BaseToken(TokType.NewLine); }
        
        if (/[0-9]/.test(this.currChar))
            return new Token<number>(TokType.Number, this.number());

        if (this.currChar == '\"')
        { 
            this.advance();
            let str = "";

            while (this.currChar != '\"')
            {
                if (this.currChar == undefined) throw new Error(`Expected final quotation mark. Line: ${this.lineNo}.`);
                str += this.currChar;
                this.advance();
            }

            this.advance();

            return new Token<string>(TokType.Bytes, str);
        }

        if (this.currChar == undefined)
        { return new BaseToken(TokType.Eof); }

        if (/[A-Za-z_]/.test(this.currChar))
        {
            let str = this.string();
            
            if (/^r[0-9]+/.test(str))
            {
                let num = parseInt(str.substring(1));
                if (num >= 16) throw new Error(`Max register is 15. Line: ${this.lineNo}.`);
                return new Token<number>(TokType.Register, num);
            }
            
            switch (str)
            {
                case "mov":     return new BaseToken(TokType.Mov);
                case "halt":    return new BaseToken(TokType.Halt);
                case "nop":     return new BaseToken(TokType.Nop);
                case "inc":     return new BaseToken(TokType.Inc);

                case "jmp":     return new BaseToken(TokType.Jmp);
                case "cmp":     return new BaseToken(TokType.Cmp);

                case "add":     return new BaseToken(TokType.Add);
                case "sub":     return new BaseToken(TokType.Sub);
                case "mul":     return new BaseToken(TokType.Mul);
                case "div":     return new BaseToken(TokType.Div);
                case "mod":     return new BaseToken(TokType.Mod);

                case "push":    return new BaseToken(TokType.Push);
                case "pop":     return new BaseToken(TokType.Pop);

                case "print":   return new BaseToken(TokType.Print);
                case "printr":  return new BaseToken(TokType.PrintR);

                case "call":    return new BaseToken(TokType.Call);
                case "ret":     return new BaseToken(TokType.Ret);

                case "ld":      return new BaseToken(TokType.Ld);
                case "str":     return new BaseToken(TokType.Str);

                case "jeq":     return new BaseToken(TokType.Jeq);
                case "jne":     return new BaseToken(TokType.Jne);
                case "jl":      return new BaseToken(TokType.Jl);
                case "jle":     return new BaseToken(TokType.Jle);
                case "jg":      return new BaseToken(TokType.Jg);
                case "jge":     return new BaseToken(TokType.Jge);

                case "ds":      return new BaseToken(TokType.Definition);
                
                default:
                    if (this.currChar == ':')
                    { this.advance(); return new Token<string>(TokType.Label, str); }
                    
                    return new Token<string>(TokType.LabelDeref, str);
                
            }
        }
        
        throw new Error(`\"${this.currChar}\" not supported. Line: ${this.lineNo}.`);
    }

    tokenize(): Array<BaseToken>
    {
        let tokens = new Array<BaseToken>();

        let tok: BaseToken;
        while ((tok = this.next()).type != TokType.Eof)
            tokens.push(tok);
        tokens.push(tok);

        return tokens;
    }
}