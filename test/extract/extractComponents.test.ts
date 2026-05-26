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

test("detects class component extending React.Component", async () => {
  const defs = await components("C.tsx", `
    import React from "react";
    export class Foo extends React.Component { render() { return <div/>; } }
  `);
  expect(defs[0]?.name).toBe("Foo");
  expect(defs[0]?.detectedBy).toBe("class");
});

test("detects default-export function with filename PascalCase", async () => {
  const defs = await components("Foo.tsx", `
    export default function() { return <div/>; }
  `);
  expect(defs[0]?.name).toBe("Foo");
  expect(defs[0]?.exportKind).toBe("default");
});

test("detects default-export arrow with filename PascalCase", async () => {
  const defs = await components("Bar.tsx", `
    export default () => <div/>;
  `);
  expect(defs[0]?.name).toBe("Bar");
});

test("skips next/font/local factory (localFont) as non-component", async () => {
  const defs = await components("layout.tsx", `
    import localFont from "next/font/local";
    const Satoshi = localFont({ src: "./satoshi.woff2", variable: "--font-satoshi" });
    export default function Layout({ children }) { return <body className={Satoshi.className}>{children}</body>; }
  `);
  expect(defs.find((d) => d.name === "Satoshi")).toBeUndefined();
});

test("skips next/font/google factories (Inter, Geist, etc.) as non-components", async () => {
  const defs = await components("layout.tsx", `
    import { Inter, Geist_Mono } from "next/font/google";
    const Primary = Inter({ subsets: ["latin"] });
    const Mono = Geist_Mono({ subsets: ["latin"] });
    export const Header = () => <header className={Primary.className}/>;
  `);
  expect(defs.map((d) => d.name).sort()).toEqual(["Header"]);
});

test("skips cva (class-variance-authority) factory as non-component", async () => {
  const defs = await components("buttonStyles.ts", `
    import { cva } from "class-variance-authority";
    export const ButtonVariants = cva("inline-flex", { variants: { size: { sm: "px-2", lg: "px-4" } } });
  `);
  expect(defs.find((d) => d.name === "ButtonVariants")).toBeUndefined();
});

test("skips createContext as non-component", async () => {
  const defs = await components("ThemeContext.tsx", `
    import { createContext } from "react";
    export const ThemeContext = createContext({ theme: "light" });
  `);
  expect(defs.find((d) => d.name === "ThemeContext")).toBeUndefined();
});

test("skips zod schema (z.object) as non-component", async () => {
  const defs = await components("schema.ts", `
    import { z } from "zod";
    export const UserSchema = z.object({ name: z.string() });
  `);
  expect(defs.find((d) => d.name === "UserSchema")).toBeUndefined();
});

test("still detects real factory components (forwardRef, styled.button)", async () => {
  // Regression check: the denylist must not break legitimate factory detection
  const defs = await components("Btn.tsx", `
    import styled from "styled-components";
    import { forwardRef } from "react";
    export const Btn = styled.button\`color: red\`;
    export const Wrapper = forwardRef((props, ref) => <div ref={ref}/>);
  `);
  expect(defs.map((d) => d.name).sort()).toEqual(["Btn", "Wrapper"]);
});
