import { expect, test } from "vitest";
import { parseFile } from "../../src/parse/parseFile.js";
import { extractComponents } from "../../src/extract/extractComponents.js";

async function components(file: string, code: string) {
  const ast = await parseFile(file, code);
  return extractComponents(file, ast);
}

test("detects function declaration with JSX body", async () => {
  const defs = await components("Foo.tsx", `
    export function Foo() { return <div/>; }
  `);
  expect(defs.map((d) => d.name)).toEqual(["Foo"]);
  expect(defs[0]!.detectedBy).toBe("function");
});

test("detects arrow function const with JSX body", async () => {
  const defs = await components("Foo.tsx", `
    export const Foo = () => <div/>;
  `);
  expect(defs.map((d) => d.name)).toEqual(["Foo"]);
  expect(defs[0]!.detectedBy).toBe("arrow");
});

test("ignores lowercase identifiers", async () => {
  const defs = await components("foo.tsx", `
    export function helper() { return <div/>; }
  `);
  expect(defs).toEqual([]);
});

test("ignores functions without JSX in body", async () => {
  const defs = await components("Foo.tsx", `
    export function Foo() { return 1; }
  `);
  expect(defs).toEqual([]);
});

test("captures location", async () => {
  const defs = await components("Foo.tsx", `\nexport function Foo() { return <div/>; }\n`);
  expect(defs[0]!.location.line).toBe(2);
});

test("detects forwardRef-wrapped component", async () => {
  const defs = await components("Foo.tsx", `
    import { forwardRef } from "react";
    export const Foo = forwardRef((props, ref) => <div ref={ref}/>);
  `);
  expect(defs[0]?.name).toBe("Foo");
  expect(defs[0]?.detectedBy).toBe("factory");
});

test("detects memo-wrapped component", async () => {
  const defs = await components("Foo.tsx", `
    import { memo } from "react";
    export const Foo = memo(function Inner() { return <div/>; });
  `);
  expect(defs[0]?.name).toBe("Foo");
});

test("detects styled-components factory (no JSX body required)", async () => {
  const defs = await components("Btn.tsx", `
    import styled from "styled-components";
    export const Btn = styled.button\`color: red\`;
  `);
  expect(defs[0]?.name).toBe("Btn");
  expect(defs[0]?.detectedBy).toBe("factory");
});

test("detects createIcon factory", async () => {
  const defs = await components("Icon.tsx", `
    export const Icon = createIcon({ name: "x" });
  `);
  expect(defs[0]?.name).toBe("Icon");
});
