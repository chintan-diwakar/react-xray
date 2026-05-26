import { expect, test } from "vitest";
import { parseFile } from "../../src/parse/parseFile.js";
import { extractJSXUsages } from "../../src/extract/extractJSXUsages.js";

async function usages(file: string, code: string) {
  const ast = await parseFile(file, code);
  return extractJSXUsages(file, ast);
}

test("captures plain JSX identifiers", async () => {
  const u = await usages("p.tsx", `export default () => <Foo><Bar/></Foo>;`);
  expect(u.map((x) => x.identifier).sort()).toEqual(["Bar", "Foo"]);
});

test("captures compound member expressions with memberPath", async () => {
  const u = await usages("p.tsx", `export default () => <Card.Header/>;`);
  expect(u[0]?.identifier).toBe("Card");
  expect(u[0]?.memberPath).toEqual(["Card", "Header"]);
});

test("captures polymorphic `as` prop target", async () => {
  const u = await usages("p.tsx", `export default () => <Box as={Custom}/>;`);
  const polymorphic = u.find((x) => x.polymorphicTarget);
  expect(polymorphic?.polymorphicTarget).toBe("Custom");
});

test("ignores lowercase tags (host elements)", async () => {
  const u = await usages("p.tsx", `export default () => <div><span/></div>;`);
  expect(u).toEqual([]);
});
