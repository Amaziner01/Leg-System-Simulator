import {BaseToken} from "../compiler/token.js"
import {TokType} from "../common/types.js"
import {Rule, PNode} from "../common/types.js"

export class Parser
{
    private tokens: Array<BaseToken>;
    private rules: Array<Rule>;
    
    constructor(tokens: Array<BaseToken>)
    {
        this.tokens = tokens;
        this.rules = [
            [TokType.Halt],
            [TokType.Label],
            [TokType.Print],
            [TokType.PrintR],
            [TokType.Eof],
            [TokType.NewLine],
            [TokType.Ret],

            [TokType.Jmp, TokType.Number],
            [TokType.Jmp, TokType.LabelDeref],

            [TokType.Dec, TokType.Register],
            [TokType.Inc, TokType.Register],

            [TokType.Push, TokType.Register],
            [TokType.Pop, TokType.Register],

            [TokType.Call, TokType.LabelDeref],
            [TokType.Call, TokType.Number],

            [TokType.Jeq, TokType.Number],
            [TokType.Jne, TokType.Number],
            [TokType.Jl, TokType.Number],
            [TokType.Jle, TokType.Number],
            [TokType.Jg, TokType.Number],
            [TokType.Jge, TokType.Number],

            [TokType.Jeq, TokType.LabelDeref],
            [TokType.Jne, TokType.LabelDeref],
            [TokType.Jl, TokType.LabelDeref],
            [TokType.Jle, TokType.LabelDeref],
            [TokType.Jg, TokType.LabelDeref],
            [TokType.Jge, TokType.LabelDeref],

            [TokType.Definition, TokType.Bytes],

            [TokType.Mov, TokType.Register, TokType.Comma, TokType.Number],
            [TokType.Mov, TokType.Register, TokType.Comma, TokType.LabelDeref],

            [TokType.Add, TokType.Register, TokType.Comma, TokType.Register],
            [TokType.Sub, TokType.Register, TokType.Comma, TokType.Register],
            [TokType.Mul, TokType.Register, TokType.Comma, TokType.Register],
            [TokType.Div, TokType.Register, TokType.Comma, TokType.Register],
            [TokType.Mod, TokType.Register, TokType.Comma, TokType.Register],
            [TokType.Cmp, TokType.Register, TokType.Comma, TokType.Register],


            [TokType.Ld, TokType.Number, TokType.Comma, TokType.Register],
            [TokType.Str, TokType.Register, TokType.Comma, TokType.Number],

            [TokType.Ld, TokType.LabelDeref, TokType.Comma, TokType.Register],
            [TokType.Str, TokType.Register, TokType.Comma, TokType.LabelDeref],

        ];
    }

    parse()
    {
        let nodes = Array<PNode>();
        let lineNo = 1;

        for (let i = 0; i < this.tokens.length; i++)
        {
            let node: PNode = [];
            let offset = 0;

            for (const rule of this.rules)
            {
                for (const type of rule)
                {
                    let token = this.tokens[i + offset];
                    if (token.type != type)
                    {
                        offset = 0;
                        node.length = 0;
                        break;
                    }

                    if (token.type != TokType.Comma)
                        node.push(token);
                    offset++;
                }

                if (offset > 0)
                {
                    if (node[0].type == TokType.Eof) 
                    { break; }

                    if (node[0].type == TokType.NewLine) lineNo++;

                    nodes.push(node);
                    i += offset - 1;
                    break;
                }
                
            }

            if (offset == 0) 
                throw new Error(`Not supported instruction at line ${lineNo}. [${this.tokens[i].type}]`);

        }

        return nodes;
    }
}