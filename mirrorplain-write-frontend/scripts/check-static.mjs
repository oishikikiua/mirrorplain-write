import * as fs from "fs";
import * as path from "path";

/**
 * Static Export Checker
 * Verifies that the Next.js app follows static export constraints:
 * - No SSR/ISR/Edge/API routes
 * - No server-only imports
 * - Dynamic routes must have generateStaticParams
 */

const VIOLATIONS = [];
const CHECKS = {
  serverSideProps: /getServerSideProps/g,
  initialProps: /getInitialProps/g,
  serverActions: /['"]use server['"]/g,
  nextHeaders: /from\s+['"]next\/headers['"]/g,
  nextServer: /from\s+['"]next\/server['"]/g,
  serverOnly: /from\s+['"]server-only['"]/g,
  dynamicForce: /dynamic\s*=\s*['"]force-dynamic['"]/g,
  cookiesUsage: /cookies\(\)/g,
};

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(process.cwd(), filePath);

  for (const [name, regex] of Object.entries(CHECKS)) {
    const matches = content.match(regex);
    if (matches) {
      VIOLATIONS.push({
        file: relativePath,
        violation: name,
        count: matches.length,
      });
    }
  }
}

function scanDirectory(dir, extensions = [".ts", ".tsx", ".js", ".jsx"]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .next, out directories
      if (
        entry.name === "node_modules" ||
        entry.name === ".next" ||
        entry.name === "out" ||
        entry.name.startsWith(".")
      ) {
        continue;
      }
      scanDirectory(fullPath, extensions);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext)) {
        checkFile(fullPath);
      }
    }
  }
}

function checkDynamicRoutes(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const fullPath = path.join(dir, entry.name);

    // Check if directory name contains '[' (dynamic segment)
    if (entry.name.includes("[")) {
      // Check if there's a page.tsx/page.ts with generateStaticParams
      const pageTsx = path.join(fullPath, "page.tsx");
      const pageTs = path.join(fullPath, "page.ts");

      let pageFile = null;
      if (fs.existsSync(pageTsx)) {
        pageFile = pageTsx;
      } else if (fs.existsSync(pageTs)) {
        pageFile = pageTs;
      }

      if (pageFile) {
        const content = fs.readFileSync(pageFile, "utf-8");
        if (!content.includes("generateStaticParams")) {
          VIOLATIONS.push({
            file: path.relative(process.cwd(), pageFile),
            violation: "missingGenerateStaticParams",
            count: 1,
          });
        }
      }
    }

    // Recurse into subdirectories
    checkDynamicRoutes(fullPath);
  }
}

function checkApiRoutes() {
  const appApiDir = path.join(process.cwd(), "app", "api");
  const pagesApiDir = path.join(process.cwd(), "pages", "api");

  if (fs.existsSync(appApiDir)) {
    VIOLATIONS.push({
      file: "app/api",
      violation: "apiRoutesNotAllowed",
      count: 1,
    });
  }

  if (fs.existsSync(pagesApiDir)) {
    VIOLATIONS.push({
      file: "pages/api",
      violation: "apiRoutesNotAllowed",
      count: 1,
    });
  }
}

// Run checks
console.log("🔍 Checking static export constraints...\n");

const appDir = path.join(process.cwd(), "app");
if (fs.existsSync(appDir)) {
  scanDirectory(appDir);
  checkDynamicRoutes(appDir);
}

const pagesDir = path.join(process.cwd(), "pages");
if (fs.existsSync(pagesDir)) {
  scanDirectory(pagesDir);
}

checkApiRoutes();

// Report results
if (VIOLATIONS.length === 0) {
  console.log("✅ All checks passed! Static export is ready.\n");
  process.exit(0);
} else {
  console.error("❌ Static export violations found:\n");
  for (const v of VIOLATIONS) {
    console.error(`  ⚠️  ${v.file}`);
    console.error(`      Violation: ${v.violation} (${v.count}x)\n`);
  }
  console.error("🚫 Please fix the above issues before building for static export.\n");
  process.exit(1);
}

