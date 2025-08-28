import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// -------------------- Helpers --------------------

// Check if a file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Check if an object is exported from a file
function isObjectExported(filePath, objectName) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");

    // Regex checks for:
    // - export const|let|var|function|class objectName
    // - export { ... objectName ... }
    // - export default objectName
    const exportRegex = new RegExp(
      `export\\s+(?:const|let|var|function|class)\\s+${objectName}\\b|` +
      `export\\s+\\{[^}]*\\b${objectName}\\b[^}]*\\}|` +
      `export\\s+default\\s+${objectName}\\b`
    );

    return exportRegex.test(fileContent);
  } catch (error) {
    console.error(`❌ Error reading file ${filePath}: ${error.message}`);
    return false;
  }
}

// Pretty logging
function logError(message) {
  console.error(`\x1b[31m${message}\x1b[0m`); // red
}
function logSuccess(message) {
  console.log(`\x1b[32m${message}\x1b[0m`); // green
}
function logInfo(message) {
  console.log(`\x1b[34m${message}\x1b[0m`); // blue
}

// -------------------- Main --------------------

function checkLanggraphPaths() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const langgraphPath = path.join(__dirname, "..", "langgraph.json");

  if (!fileExists(langgraphPath)) {
    logError("langgraph.json not found in the root directory");
    process.exit(1);
  }

  let hasError = false;

  try {
    const langgraphContent = JSON.parse(fs.readFileSync(langgraphPath, "utf8"));
    const graphs = langgraphContent.graphs;

    if (!graphs || typeof graphs !== "object") {
      logError('Invalid or missing "graphs" object in langgraph.json');
      process.exit(1);
    }

    for (const [key, value] of Object.entries(graphs)) {
      const [filePath, objectName] = value.split(":");
      const fullPath = path.join(__dirname, "..", filePath);

      logInfo(`Checking "${key}" → ${filePath}:${objectName}`);

      if (!fileExists(fullPath)) {
        logError(`File not found: ${fullPath}`);
        hasError = true;
        continue;
      }

      if (!isObjectExported(fullPath, objectName)) {
        logError(`Object "${objectName}" is not exported from ${fullPath}`);
        hasError = true;
      }
    }

    if (hasError) {
      process.exit(1);
    } else {
      logSuccess("✅ All paths in langgraph.json are valid and objects are exported correctly.");
    }
  } catch (error) {
    logError(`Error parsing langgraph.json: ${error.message}`);
    process.exit(1);
  }
}

checkLanggraphPaths();
