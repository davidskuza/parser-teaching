import fs from "fs";
import { tokenize } from "./tokenizer";

function main() {
    console.log("Parsing schema.prisma");

    const content = fs.readFileSync("schema.prisma", "utf-8");

    const tokens = tokenize(content);

    console.log(tokens);
}

main();
