import {TokType} from "../common/types.js"

class BaseToken
{
    type: TokType;

    constructor(type: TokType) 
    {
        this.type = type;
    }
}
class Token<T> extends BaseToken
{
    value: T;

    constructor(type: TokType, value: T) 
    {
        super(type);
        this.value = value;
    }
}

export {BaseToken, Token};