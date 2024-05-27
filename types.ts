export interface Token {
    type: TokenType;
    value: string;
    pos: number;
    length: number;
}

export enum TokenType {
    WHITESPACE = "WHITESPACE",
    EOF = "EOF",
    IDENT = "IDENT",
    NUMBER = "NUMBER",
    SINGLE_LINE_COMMENT = "SINGLE_LINE_COMMENT",
    OPEN_PAREN = "OPEN_PAREN",
    CLOSE_PAREN = "CLOSE_PAREN",
    OPEN_BRACE = "OPEN_BRACE",
    CLOSE_BRACE = "CLOSE_BRACE",
    OPEN_BRACKET = "OPEN_BRACKET",
    CLOSE_BRACKET = "CLOSE_BRACKET",
    SEMICOLON = "SEMICOLON",
    COLON = "COLON",
    ASTERISK = "ASTERISK",
    COMMA = "COMMA",
    PERCENT = "PERCENT",
    HASH = "HASH",
    AT = "AT",
    PLUS = "PLUS",
    MINUS = "MINUS",
    DOT = "DOT",
    QUESTION = "QUESTION",
    AMPERSAND = "AMPERSAND",
    BAR = "BAR",
    EQUALS = "EQUALS",
    EXCLAMATION = "EXCLAMATION",
    STRING = "STRING",
    SLASH = "SLASH",
    BACKSLASH = "BACKSLASH",
    ILLEGAL = "ILLEGAL",
}
