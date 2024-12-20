import { JsonParser } from "./main.ts";
import { assertEquals } from "@std/assert";

Deno.test(async function addTest() {
  assertEquals(await new JsonParser("test.json").getParsed(), {
    name: "Alice",
    age: 25,
    languages: ["English", "Spanish"],
    isStudent: false,
    address: { street: "123 Main St" },
  });
});
