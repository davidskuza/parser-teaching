import { createScanner } from "./scanner.ts";
import { Token, TokenType } from "./types.ts";

export function tokenize(content: string): Token[] {
    const scanner = createScanner(content);

    const tokens: Token[] = [];

    for (;;) {
        const token = scanner.scan();

        tokens.push(token);

        if (token.type === TokenType.EOF) {
            break;
        }
    }

    return tokens;
}
