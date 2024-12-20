import * as path from "jsr:@std/path";
import { JsonParser } from "./main.ts";
async function loadJsonExample() {
  const filePath = path.join(Deno.cwd(), "test.json");
  const jsonParser = new JsonParser(filePath);
  const data = await jsonParser.getParsed();
  console.log(data);
}

loadJsonExample();
