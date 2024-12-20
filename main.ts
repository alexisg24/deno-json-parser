// deno-lint-ignore-file no-explicit-any
export class JsonParser {
  filePath: string;
  constructor(filePath: string) {
    if(!filePath) throw new Error("Please provide a file path");
    if(filePath.split(".").at(-1) !== "json") throw new Error("Please provide a json file");
    this.filePath = filePath;
  }

  async getFileRawData() {
    using file = await Deno.open(this.filePath, {read: true});
    const fileStats = await file.stat()
    const arrayBuffer = new Uint8Array(fileStats.size)
    await file.read(arrayBuffer)
    const decoder = new TextDecoder("utf-8");
    const fileContent = decoder.decode(arrayBuffer);

    return fileContent
    
  }

  async getParsed(){
    const fileContent = await this.getFileRawData();
    let index = 0

    function parseValue (){
        skipWhitespace();
        const char = fileContent[index];
        if (char === "{") return parseObject();
        if (char === "[") return parseArray();
        if (char === '"') return parseString();
        if (char === "-" || isDigit(char)) return parseNumber();
        if (fileContent.startsWith("true", index)) return consumeLiteral("true", true);
        if (fileContent.startsWith("false", index)) return consumeLiteral("false", false);
        if (fileContent.startsWith("null", index)) return consumeLiteral("null", null);
    
        throw new SyntaxError(`Unexpected character at index ${index}: ${char}`);
    }
    

    function parseObject() {
      index++; // Skip '{'
      skipWhitespace();
      const obj:any = {};
  
      if (fileContent[index] === "}") {
        index++; // Skip '}'
        return obj;
      }
  
      while (index < fileContent.length) {
        skipWhitespace();
        const key = parseString();
        skipWhitespace();
        if (fileContent[index] !== ":") throw new SyntaxError(`Expected ':' at index ${index}`);
        index++; // Skip ':'
        skipWhitespace();
        const value = parseValue();
        obj[key] = value;
        skipWhitespace();
        if (fileContent[index] === "}") {
          index++; // Skip '}'
          break;
        }
        if (fileContent[index] !== ",") throw new SyntaxError(`Expected ',' at index ${index}`);
        index++; // Skip ','
      }
  
      return obj;
    }


    function parseArray(): any[] {
      index++; // Skip '['
      skipWhitespace();
      const arr: any[] = [];
  
      if (fileContent[index] === "]") {
        index++; // Skip ']'
        return arr;
      }
  
      while (index < fileContent.length) {
        skipWhitespace();
        arr.push(parseValue());
        skipWhitespace();
        if (fileContent[index] === "]") {
          index++; // Skip ']'
          break;
        }
        if (fileContent[index] !== ",") throw new SyntaxError(`Expected ',' at index ${index}`);
        index++; // Skip ','
      }
  
      return arr;
    }

    function parseString(): string {
      index++; // Skip opening '"'
      let str = "";
      while (index < fileContent.length) {
        const char = fileContent[index++];
        if (char === '"') break; // Closing '"'
        if (char === "\\") {
          const nextChar = fileContent[index++];
          str += escapeCharacter(nextChar);
        } else {
          str += char;
        }
      }
      return str;
    }

    function parseNumber(): number {
      const start = index;
      if (fileContent[index] === "-") index++;
      while (isDigit(fileContent[index])) index++;
      if (fileContent[index] === ".") {
        index++;
        while (isDigit(fileContent[index])) index++;
      }
      const numberStr = fileContent.slice(start, index);
      return parseFloat(numberStr);
    }

    function consumeLiteral(literal: string, value: boolean | number | null) {
      index += literal.length;
      return value;
    }

    function skipWhitespace(): void {
      while (/\s/.test(fileContent[index])) index++;
    }

    function escapeCharacter(char: string): string {
      const escapeMap: Record<string, string> = {
        '"': '"',
        "\\": "\\",
        "/": "/",
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
      };
      return escapeMap[char] || char;
    }

    function isDigit(char: string): boolean {
      return char >= "0" && char <= "9";
    }
  
    return parseValue();
  }

}


if(import.meta.main){
  const [filePath] = Deno.args;
  if(!filePath){
    console.error("Please provide a file path");
    Deno.exit(1);
  }
  try {
    const jsonParser = new JsonParser(filePath);
    const data = await jsonParser.getParsed();
    console.log(data);
    
  } catch (error) {
    console.error(error);
  }
}