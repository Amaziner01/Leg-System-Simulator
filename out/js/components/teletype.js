var TeletypeMode;
(function (TeletypeMode) {
    TeletypeMode[TeletypeMode["Normal"] = 0] = "Normal";
    TeletypeMode[TeletypeMode["Error"] = 1] = "Error";
})(TeletypeMode || (TeletypeMode = {}));
export class TeleType {
    constructor(output) {
        this.output = output;
        this.mode = TeletypeMode.Normal;
    }
    print(message) {
        if (this.mode != TeletypeMode.Normal) {
            this.mode = TeletypeMode.Normal;
            this.output.setAttribute("style", "color: white;");
        }
        this.output.value += message;
        this.output.scrollTop = this.output.scrollHeight;
    }
    error(message) {
        if (this.mode != TeletypeMode.Error) {
            this.mode = TeletypeMode.Error;
            this.output.setAttribute("style", "color: red;");
        }
        this.output.value += message;
    }
    clear() {
        this.output.value = "";
    }
}
//# sourceMappingURL=teletype.js.map