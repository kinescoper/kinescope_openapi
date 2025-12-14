/**
 * Пример использования @mux/mcp пакета
 * 
 * Этот файл демонстрирует, как можно использовать MCP сервер для работы с Mux API
 */

// Импорт сервера и функций инициализации (CommonJS)
const { server, endpoints, initMcpServer, newMcpServer } = require("@mux/mcp/server");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

// Пример инициализации сервера
async function startMCPServer() {
  try {
    // Создание нового сервера или использование существующего
    const mcpServer = newMcpServer();
    
    // Инициализация сервера с endpoints
    initMcpServer({ 
      server: mcpServer, 
      endpoints: endpoints,
      clientOptions: {
        // Опционально: настройки клиента Mux
        // tokenId: process.env.MUX_TOKEN_ID,
        // tokenSecret: process.env.MUX_TOKEN_SECRET,
      }
    });

    // Создание транспорта для stdio (стандартный ввод/вывод)
    const transport = new StdioServerTransport();
    
    // Подключение сервера к транспорту
    await mcpServer.connect(transport);
    
    console.log("MCP Server started successfully!");
    console.log("Available endpoints:", endpoints.length);
  } catch (error) {
    console.error("Error starting MCP server:", error);
  }
}

// Запуск сервера (раскомментируйте, если хотите запустить)
// startMCPServer();

// Пример использования через командную строку:
// npx -y @mux/mcp@latest --client=cursor --tools=dynamic

console.log(`
Пакет @mux/mcp успешно установлен!

Для использования через командную строку:
  npx -y @mux/mcp@latest --client=cursor --tools=dynamic

Или с переменными окружения:
  MUX_TOKEN_ID=your_token_id \\
  MUX_TOKEN_SECRET=your_secret \\
  npx -y @mux/mcp@latest --client=cursor

Доступные ресурсы:
  - video.assets - управление видео активами
  - video.live_streams - управление живыми стримами
  - video.uploads - загрузка видео
  - data.metrics - метрики и аналитика
  - и многие другие...

См. README.md в node_modules/@mux/mcp/ для полной документации.
`);

