import { TokType } from "../common/types.js";
export class Compiler {
    constructor(nodes) {
        this.nodes = nodes;
    }
    compile() {
        let byteCode = new Uint8Array(0x1000);
        let labels = {};
        let derefStack = Array();
        let i = 0;
        let lineNo = 1;
        for (const node of this.nodes) {
            for (const BaseToken of node) {
                switch (BaseToken.type) {
                    case TokType.Number:
                        {
                            let num = BaseToken.value;
                            byteCode[i] = (num & 0xFF00) >> 8;
                            byteCode[i + 1] = (num & 0x00FF);
                            i += 2;
                        }
                        break;
                    case TokType.NewLine:
                        {
                            lineNo++;
                        }
                        break;
                    case TokType.Register:
                        {
                            let num = BaseToken.value;
                            byteCode[i] = (num & 0x00FF);
                            i++;
                        }
                        break;
                    case TokType.Label:
                        {
                            labels[BaseToken.value] = i;
                        }
                        break;
                    case TokType.LabelDeref:
                        {
                            derefStack.push({ pos: i, line: lineNo, label: BaseToken.value });
                            i += 2;
                        }
                        break;
                    case TokType.Bytes:
                        {
                            let str = BaseToken.value;
                            for (let j = 0; j < str.length; j++) {
                                let code = str.charCodeAt(j);
                                if (code == "\\".charCodeAt(0)) {
                                    j++;
                                    code = str.charCodeAt(j);
                                    switch (code) {
                                        case "n".charCodeAt(0):
                                            {
                                                byteCode[i] = "\n".charCodeAt(0);
                                            }
                                            break;
                                        case "\\".charCodeAt(0):
                                            {
                                                byteCode[i] = "\\".charCodeAt(0);
                                            }
                                            break;
                                        case "r".charCodeAt(0):
                                            {
                                                byteCode[i] = "\r".charCodeAt(0);
                                            }
                                            break;
                                    }
                                    i++;
                                }
                                else {
                                    byteCode[i] = code;
                                    i++;
                                }
                            }
                            byteCode[i] = 0;
                            i++;
                        }
                        break;
                    default:
                        {
                            if (BaseToken.type == TokType.Definition)
                                break;
                            byteCode[i] = BaseToken.type;
                            i++;
                        }
                        break;
                }
            }
        }
        while (derefStack.length > 0) {
            let deref = derefStack.pop();
            let loc = deref === null || deref === void 0 ? void 0 : deref.pos;
            let labelPos;
            if ((deref === null || deref === void 0 ? void 0 : deref.label) in labels) {
                labelPos = labels[deref === null || deref === void 0 ? void 0 : deref.label];
                byteCode[loc] = (labelPos & 0xFF00) >> 8;
                byteCode[loc + 1] = (labelPos & 0x00FF);
            }
            else {
                throw new Error(`Undefined label \"${deref === null || deref === void 0 ? void 0 : deref.label}\" at line ${deref === null || deref === void 0 ? void 0 : deref.line}.`);
            }
        }
        return byteCode;
    }
}
//# sourceMappingURL=compiler.js.map