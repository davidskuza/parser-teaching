import fs from "fs";
import { tokenize } from "./tokenizer";
import { Token, TokenType } from "./types";
import {
    GeneratorBlock,
    NodeType,
    PrismaSchema,
    Statement,
    StringLiteral,
    PropertyDefinition,
    Expression,
    IdentLiteral,
    NumberLiteral,
    BooleanLiteral,
    ArrayLiteral,
    FunctionCall,
    PositionalParam,
    NamedParam,
    ModelBlock,
    FieldDefinition,
    Annotation,
} from "./ast";

export class SyntaxError extends Error {
    constructor(message: string, public pos: number) {
        super(message);
    }
}

function parseToAst(content: string): PrismaSchema {
    const tokens = tokenize(content);

    let tokenIndex = 0;

    function lookAhead<T>(fn: () => T): T {
        const currentIndex = tokenIndex;

        const result = fn();

        tokenIndex = currentIndex;

        return result;
    }

    function tryParse<T>(fn: () => T): T | null {
        const currentIndex = tokenIndex;

        try {
            return fn();
        } catch (err) {
            tokenIndex = currentIndex;

            return null;
        }
    }

    function scanToken(): Token {
        return tokens[tokenIndex++];
    }

    function scanTokenIf(type: TokenType): Token | null {
        const token = lookAhead(scanToken);

        if (token.type === type) {
            return scanToken();
        }

        return null;
    }

    function scanIdentValue(value: string): Token {
        const token = scanToken();

        if (token.type !== TokenType.IDENT || token.value !== value) {
            throw new SyntaxError(`Expected ${value}`, token.pos);
        }

        return token;
    }

    function scanIdent(): Token {
        const token = scanToken();

        if (token.type !== TokenType.IDENT) {
            throw new SyntaxError(
                `Expected IDENT, found ${token.type}`,
                token.pos
            );
        }

        return token;
    }

    function expectToken(type: TokenType): Token {
        const token = scanToken();

        if (token.type !== type) {
            throw new SyntaxError(
                `Expected ${type}, found ${token.type}`,
                token.pos
            );
        }

        return token;
    }

    function parseString(): StringLiteral {
        const token = scanToken();

        if (token.type !== TokenType.STRING) {
            throw new SyntaxError(
                `Expected STRING, found ${token.type}`,
                token.pos
            );
        }

        return {
            type: NodeType.StringLiteral,
            value: token.value,
            offset: token.pos,
        };
    }

    function parseIdent(): IdentLiteral {
        const token = scanIdent();

        return {
            type: NodeType.IdentLiteral,
            text: token.value,
            offset: token.pos,
        };
    }

    function parseNumber(): NumberLiteral {
        const token = expectToken(TokenType.NUMBER);

        return {
            type: NodeType.NumberLiteral,
            value: Number(token.value),
            offset: token.pos,
        };
    }

    function parseBoolean(): BooleanLiteral {
        const token = scanIdent();

        if (token.value === "true") {
            return {
                type: NodeType.BooleanLiteral,
                value: true,
                offset: token.pos,
            };
        } else if (token.value === "false") {
            return {
                type: NodeType.BooleanLiteral,
                value: false,
                offset: token.pos,
            };
        } else {
            throw new SyntaxError(`Expected true or false`, token.pos);
        }
    }

    function parsePositionalParam(): PositionalParam {
        const expression = parseExpression();

        return {
            type: NodeType.PositionalParam,
            expression,
            offset: expression.offset,
        };
    }

    function parseNamedParam(): NamedParam {
        const name = scanIdent();

        expectToken(TokenType.COLON);

        const expression = parseExpression();

        return {
            type: NodeType.NamedParam,
            name: name.value,
            expression,
            offset: expression.offset,
        };
    }

    function parseParams(): (PositionalParam | NamedParam)[] {
        const params: (PositionalParam | NamedParam)[] = [];

        while (lookAhead(scanToken).type !== TokenType.CLOSE_PAREN) {
            const namedParam = tryParse(parseNamedParam);

            if (namedParam) {
                params.push(namedParam);
            } else {
                const positionalParam = parsePositionalParam();

                params.push(positionalParam);
            }

            scanTokenIf(TokenType.COMMA);
        }

        return params;
    }

    function parseFunctionCall(): FunctionCall {
        const name = scanIdent();

        expectToken(TokenType.OPEN_PAREN);

        const params = parseParams();

        expectToken(TokenType.CLOSE_PAREN);

        return {
            type: NodeType.FunctionCall,
            name: name.value,
            params,
            offset: name.pos,
        };
    }

    function parseArray(): ArrayLiteral {
        const pos = expectToken(TokenType.OPEN_BRACKET).pos;

        const elements: Expression[] = [];

        while (lookAhead(scanToken).type !== TokenType.CLOSE_BRACKET) {
            const expression = parseExpression();

            elements.push(expression);

            scanTokenIf(TokenType.COMMA);
        }

        expectToken(TokenType.CLOSE_BRACKET);

        return {
            type: NodeType.ArrayLiteral,
            elements,
            offset: pos,
        };
    }

    function parseExpression(): Expression {
        const token = lookAhead(scanToken);

        if (token.type === TokenType.STRING) {
            return parseString();
        } else if (token.type === TokenType.NUMBER) {
            return parseNumber();
        } else if (token.type === TokenType.OPEN_BRACKET) {
            return parseArray();
        } else if (token.type === TokenType.IDENT) {
            const boolean = tryParse(parseBoolean);

            if (boolean) {
                return boolean;
            }

            const functionCall = tryParse(parseFunctionCall);

            if (functionCall) {
                return functionCall;
            }

            return parseIdent();
        } else {
            throw new SyntaxError(`Unexpected token: ${token.type}`, token.pos);
        }
    }

    function parsePropertyDefinition(): PropertyDefinition {
        const name = scanIdent();

        expectToken(TokenType.EQUALS);

        const expression = parseExpression();

        return {
            type: NodeType.PropertyDefinition,
            name: name.value,
            value: expression,
            offset: name.pos,
        };
    }

    function parseProperties(): PropertyDefinition[] {
        const properties: PropertyDefinition[] = [];

        while (lookAhead(scanToken).type === TokenType.IDENT) {
            const propertyDefinition = parsePropertyDefinition();

            properties.push(propertyDefinition);
        }

        return properties;
    }

    function parseGeneratorBlock(): GeneratorBlock {
        const pos = scanIdentValue("generator").pos;
        const name = scanIdent();
        expectToken(TokenType.OPEN_BRACE);

        const properties = parseProperties();

        expectToken(TokenType.CLOSE_BRACE);

        return {
            name: name.value,
            type: NodeType.GeneratorBlock,
            properties,
            offset: pos,
        };
    }

    function parseAnnotation(): Annotation {
        expectToken(TokenType.AT);
        const name = scanIdent();

        let params: (PositionalParam | NamedParam)[] = [];

        if (lookAhead(scanToken).type === TokenType.OPEN_PAREN) {
            expectToken(TokenType.OPEN_PAREN);

            params = parseParams();

            expectToken(TokenType.CLOSE_PAREN);
        }

        return {
            type: NodeType.Annotation,
            name: name.value,
            params,
            offset: name.pos,
        };
    }

    function parseField(): FieldDefinition {
        const name = scanIdent();
        const fieldType = scanIdent();

        const isArray = lookAhead(() => {
            const openBrace = !!scanTokenIf(TokenType.OPEN_BRACKET);

            if (openBrace) {
                const closeBrace = !!scanTokenIf(TokenType.CLOSE_BRACKET);

                if (closeBrace) {
                    return true;
                }
            }

            return false;
        });
        let isNullable = false;

        if (isArray) {
            scanToken(); // [
            scanToken(); // ]
        } else {
            isNullable = !!scanTokenIf(TokenType.QUESTION);
        }

        const annotations: Annotation[] = [];

        while (lookAhead(scanToken).type === TokenType.AT) {
            const annotation = parseAnnotation();

            annotations.push(annotation);
        }

        return {
            type: NodeType.FieldDefinition,
            name: name.value,
            fieldType: fieldType.value,
            isNullable,
            isArray,
            annotations,
            offset: name.pos,
        };
    }

    function parseModel(): ModelBlock {
        const pos = scanIdentValue("model").pos;
        const name = scanIdent();

        expectToken(TokenType.OPEN_BRACE);

        const fields: FieldDefinition[] = [];
        const annotations: Annotation[] = [];

        while (lookAhead(scanToken).type === TokenType.IDENT) {
            const field = parseField();

            fields.push(field);
        }

        expectToken(TokenType.CLOSE_BRACE);

        return {
            name: name.value,
            type: NodeType.ModelBlock,
            fields,
            annotations,
            offset: pos,
        };
    }

    const statements: Statement[] = [];

    for (;;) {
        const token = lookAhead(scanToken);

        if (token.type === TokenType.IDENT) {
            if (token.value === "generator") {
                statements.push(parseGeneratorBlock());
            } else if (token.value === "datasource") {
                // Parse datasource block
            } else if (token.value === "enum") {
                // Parse enum block
            } else if (token.value === "model") {
                statements.push(parseModel());
            } else {
                throw new Error(`Unexpected token: ${token.value}`);
            }
        } else if (token.type === TokenType.EOF) {
            break;
        } else if (token.type === TokenType.SINGLE_LINE_COMMENT) {
            scanToken();
        } else {
            throw new SyntaxError(
                `Unexpected token: ${token.type}, ${JSON.stringify(token)}`,
                token.pos
            );
        }
    }

    return {
        type: NodeType.PrismaSchema,
        statements,
        offset: 0,
    };
}

function main() {
    console.log("Parsing schema.prisma");

    const content = fs.readFileSync("schema.prisma", "utf-8");

    const prismaSchema = parseToAst(content);

    console.log(JSON.stringify(prismaSchema, null, 2));
}

main();
