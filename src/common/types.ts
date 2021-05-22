import {BaseToken} from "../compiler/token.js"

enum TokType
{
    Halt = 0,
    Nop,
    Mov,
    Inc, Dec,
    Push, Pop,
    Add, Sub, Mul, Div, Mod, Cmp,
    Ld, Str,
    Jmp, Jeq, Jne, Jl, Jg, Jle, Jge, Call, 
    Ret,
    Print, PrintR,
    Number, Bytes, Definition, Label, LabelDeref, Comma, NewLine, Register, Eof
}

type Rule = Array<TokType>;
type PNode = Array<BaseToken>;

export {TokType, Rule, PNode};