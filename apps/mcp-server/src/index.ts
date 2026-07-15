import dotenv from "dotenv";
import { createServer } from "./server.js";
import { createHttpServer } from "./transport/http.js"

// Load environment variables from .env
dotenv.config();

const PORT = process.env.PORT || 3000;

console.log("Starting Gnosis MCP Server...");

// Pass the factory itself (not a single instance) so the HTTP
// transport can create one MCP server per request in stateless mode.
const app = createHttpServer(createServer);

app.listen(PORT, () => {
    console.log(`✅ MCP Server running on http://localhost:${PORT}`)
})

console.log("✅ MCP Server initialized successfully.");
console.log("✅ Http Server initialized successfully.")
