export type Framework = "next-app" | "next-pages" | "next-mixed" | "configured" | "unknown";

export type ComponentId = string;

export type SourceLocation = {
  file: string;
  line: number;
  column: number;
};

export type FileStats = {
  files: number;
  lines: number;
  code: number;
  blank: number;
  comment: number;
};

export type PageEntry = {
  id: string;
  file: string;
  route: string;
  framework: Framework;
  isSpecialFile: boolean;
};

export type ComponentEntry = {
  id: ComponentId;
  name: string;
  file: string;
  location: SourceLocation;
  loc: number;
  blank: number;
  comment: number;
  isPage: boolean;
  isExternal: false;
  exportKind: "default" | "named" | "none";
  detectedBy: "function" | "arrow" | "class" | "factory" | "default-export";
};

export type ExternalUsage = {
  package: string;
  name: string;
  instances: number;
  sites: SourceLocation[];
};

export type ComponentRef = {
  id: ComponentId;
  name: string;
  file: string;
  loc: number;
  reasons: string[];
};

export type MatrixRow = {
  pageId: string;
  pageRoute: string;
  directComponents: ComponentId[];
  transitiveComponents: ComponentId[];
  externalPackages: string[];
  externalInstanceCount: number;
  locReached: number;
};

export type Warning = {
  kind:
    | "dynamic-import"
    | "polymorphic-usage"
    | "unresolved-module"
    | "mdx-skipped"
    | "parse-error";
  message: string;
  file?: string;
  location?: SourceLocation;
};

export type ScanResult = {
  meta: {
    version: string;
    scannedAt: string;
    rootDir: string;
    framework: Framework;
    durationMs: number;
    fileCount: number;
  };
  pages: PageEntry[];
  components: ComponentEntry[];
  externals: ExternalUsage[];
  matrix: MatrixRow[];
  unused: {
    strictlyUnused: ComponentRef[];
    unreachable: ComponentRef[];
  };
  stats: {
    totalLOC: number;
    totalBlankLOC: number;
    totalCommentLOC: number;
    byLanguage: {
      ts: FileStats;
      tsx: FileStats;
      js: FileStats;
      jsx: FileStats;
    };
    perComponent: { id: ComponentId; loc: number; blank: number; comment: number }[];
  };
  warnings: Warning[];
};

// Intermediate types passed between pipeline stages
export type ComponentDef = {
  id: ComponentId;
  name: string;
  file: string;
  location: SourceLocation;
  startLine: number;
  endLine: number;
  detectedBy: ComponentEntry["detectedBy"];
  exportKind: ComponentEntry["exportKind"];
  isPage: boolean;
};

export type JSXUsage = {
  file: string;
  location: SourceLocation;
  identifier: string;
  memberPath?: string[];
  polymorphicTarget?: string;
};

export type ImportEdge = {
  file: string;
  source: string;
  imported: { local: string; imported: string }[];
  isDynamic: boolean;
  isReExport: boolean;
  dynamicSpecifierIsLiteral: boolean;
};

export type Config = {
  rootDir: string;
  pages?: string[];
  components: {
    include: string[];
    exclude: string[];
  };
  externalPackages: "all" | string[];
  tsconfig: string;
};
