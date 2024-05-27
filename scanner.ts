import { CharacterCodes } from "./codepoints.js";
import { Token, TokenType } from "./types.js";

export interface Scanner {
    scan(): Token;
}

export function createScanner(content: string): Scanner {
    let currentIndex = 0;

    function getCharCode(): number {
        return content[currentIndex++].charCodeAt(0);
    }

    function scanWhitespace() {
        while (currentIndex < content.length) {
            const ch = getCharCode();

            if (!isWhitespace(ch)) {
                currentIndex -= 1;

                break;
            }
        }
    }

    function scanIdentifier(): Token {
        const pos = currentIndex;

        let value = "";

        while (currentIndex < content.length) {
            const ch = getCharCode();

            if (!isPossibleInIdentifier(ch)) {
                currentIndex -= 1;

                break;
            }

            value += String.fromCharCode(ch);
        }

        return {
            type: TokenType.IDENT,
            value,
            pos,
            length: value.length,
        };
    }

    function scanString(): Token {
        const pos = currentIndex;

        let value = "";

        let ch = getCharCode();

        if (ch !== CharacterCodes.doubleQuote) {
            throw new Error(
                `Expected double quote at ${currentIndex}: "${String.fromCharCode(
                    ch
                )}" (${ch})`
            );
        }

        while (currentIndex < content.length) {
            ch = getCharCode();

            if (ch === CharacterCodes.backslash) {
                const ch2 = getCharCode();

                if (ch2 === CharacterCodes.doubleQuote) {
                    value += '"';

                    continue;
                } else {
                    currentIndex -= 1;
                }
            }

            if (ch === CharacterCodes.doubleQuote) {
                break;
            }

            value += String.fromCharCode(ch);
        }

        return {
            type: TokenType.STRING,
            value,
            pos,
            length: value.length,
        };
    }

    function scanNumber(): Token {
        const pos = currentIndex;

        let hadDot = false;

        let value = "";

        while (currentIndex < content.length) {
            const ch = getCharCode();

            if (ch === CharacterCodes.dot) {
                if (hadDot) {
                    throw new Error(
                        `Unexpected dot at ${currentIndex}: "${String.fromCharCode(
                            ch
                        )}" (${ch})`
                    );
                }

                value += String.fromCharCode(ch);

                hadDot = true;

                continue;
            }

            if (!isDigit(ch)) {
                currentIndex -= 1;

                break;
            }

            value += String.fromCharCode(ch);
        }

        return {
            type: TokenType.NUMBER,
            value,
            pos,
            length: value.length,
        };
    }

    function scan(): Token {
        if (currentIndex >= content.length) {
            return {
                type: TokenType.EOF,
                value: "",
                pos: currentIndex,
                length: 0,
            };
        }

        const pos = currentIndex;

        const ch = getCharCode();

        if (isWhitespace(ch)) {
            currentIndex -= 1;

            scanWhitespace();

            return scan();
        } else if (isPossibleAtStartOfIdentifier(ch)) {
            currentIndex -= 1;

            return scanIdentifier();
        } else if (isDigit(ch)) {
            currentIndex -= 1;

            return scanNumber();
        } else {
            switch (ch) {
                case CharacterCodes.slash: {
                    const ch2 = getCharCode();

                    if (ch2 === CharacterCodes.slash) {
                        // read until end of line
                        let comment = "//";

                        while (currentIndex < content.length) {
                            const ch = getCharCode();

                            if (isLineBreak(ch)) {
                                break;
                            }

                            comment += String.fromCharCode(ch);
                        }

                        return {
                            type: TokenType.SINGLE_LINE_COMMENT,
                            value: comment,
                            pos,
                            length: comment.length,
                        };
                    } else {
                        currentIndex -= 1;

                        return {
                            type: TokenType.SLASH,
                            value: "/",
                            pos,
                            length: 1,
                        };
                    }
                }
                case CharacterCodes.openBrace: {
                    return {
                        type: TokenType.OPEN_BRACE,
                        value: "{",
                        pos,
                        length: 1,
                    };
                }
                case CharacterCodes.closeBrace: {
                    return {
                        type: TokenType.CLOSE_BRACE,
                        value: "{",
                        pos,
                        length: 1,
                    };
                }
                case CharacterCodes.equals: {
                    return {
                        type: TokenType.EQUALS,
                        value: "=",
                        pos,
                        length: 1,
                    };
                }
                case CharacterCodes.doubleQuote: {
                    currentIndex -= 1;

                    return scanString();
                }
                case CharacterCodes.openBracket: {
                    return {
                        type: TokenType.OPEN_BRACKET,
                        value: "[",
                        pos,
                        length: 1,
                    };
                }
                case CharacterCodes.closeBracket: {
                    return {
                        type: TokenType.CLOSE_BRACKET,
                        value: "[",
                        pos,
                        length: 1,
                    };
                }
                case CharacterCodes.openParen: {
                    return {
                        type: TokenType.OPEN_PAREN,
                        value: "(",
                        pos,
                        length: 1,
                    };
                }
                case CharacterCodes.closeParen: {
                    return {
                        type: TokenType.CLOSE_PAREN,
                        value: ")",
                        pos,
                        length: 1,
                    };
                }
                case CharacterCodes.comma: {
                    return {
                        type: TokenType.COMMA,
                        value: ",",
                        pos,
                        length: 1,
                    };
                }
                case CharacterCodes.dot: {
                    return {
                        type: TokenType.DOT,
                        value: ".",
                        pos,
                        length: 1,
                    };
                }
                case CharacterCodes.colon: {
                    return {
                        type: TokenType.COLON,
                        value: ":",
                        pos,
                        length: 1,
                    };
                }
                case CharacterCodes.at: {
                    return {
                        type: TokenType.AT,
                        value: "@",
                        pos,
                        length: 1,
                    };
                }
                case CharacterCodes.question: {
                    return {
                        type: TokenType.QUESTION,
                        value: "?",
                        pos,
                        length: 1,
                    };
                }
            }

            throw new Error(
                `Unexpected character at ${pos}: "${String.fromCharCode(
                    ch
                )}" (${ch})`
            );
        }
    }

    return {
        scan,
    };
}

function isAlpha(ch: number): boolean {
    return (
        (ch >= CharacterCodes.a && ch <= CharacterCodes.z) ||
        (ch >= CharacterCodes.A && ch <= CharacterCodes.Z)
    );
}

function isDigit(ch: number): boolean {
    return ch >= CharacterCodes._0 && ch <= CharacterCodes._9;
}

function isAlphaNumeric(ch: number): boolean {
    return isAlpha(ch) || isDigit(ch);
}

function isPossibleAtStartOfIdentifier(ch: number): boolean {
    return isAlpha(ch) || ch === CharacterCodes._;
}

function isPossibleInIdentifier(ch: number): boolean {
    return isAlphaNumeric(ch) || ch === CharacterCodes._;
}

function isWhitespace(ch: number): boolean {
    return (
        ch === CharacterCodes.space ||
        ch === CharacterCodes.tab ||
        ch === CharacterCodes.verticalTab ||
        ch === CharacterCodes.formFeed ||
        ch === CharacterCodes.nonBreakingSpace ||
        ch === CharacterCodes.nextLine ||
        ch === CharacterCodes.ogham ||
        (ch >= CharacterCodes.enQuad && ch <= CharacterCodes.zeroWidthSpace) ||
        ch === CharacterCodes.narrowNoBreakSpace ||
        ch === CharacterCodes.mathematicalSpace ||
        ch === CharacterCodes.ideographicSpace ||
        ch === CharacterCodes.byteOrderMark ||
        isLineBreak(ch)
    );
}

function isLineBreak(ch: number): boolean {
    return (
        ch === CharacterCodes.lineFeed ||
        ch === CharacterCodes.carriageReturn ||
        ch === CharacterCodes.lineSeparator ||
        ch === CharacterCodes.paragraphSeparator
    );
}
