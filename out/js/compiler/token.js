class BaseToken {
    constructor(type) {
        this.type = type;
    }
}
class Token extends BaseToken {
    constructor(type, value) {
        super(type);
        this.value = value;
    }
}
export { BaseToken, Token };
//# sourceMappingURL=token.js.map