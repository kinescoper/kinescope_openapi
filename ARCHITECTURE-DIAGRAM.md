# Визуальная схема архитектуры @mux/mcp

## Общая архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Client (Cursor/Claude)                │
└───────────────────────┬─────────────────────────────────────┘
                        │ JSON-RPC
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐              ┌───────────────┐
│  STDIO        │              │  HTTP         │
│  Transport    │              │  Transport     │
│  (stdio.js)   │              │  (http.js)    │
└───────┬───────┘              └───────┬───────┘
        │                               │
        └───────────────┬───────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   MCP Server Core     │
            │    (server.js)        │
            └───────────┬───────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌───────────────┐              ┌───────────────┐
│   Tools       │              │ Compatibility  │
│  (tools.js)   │              │   (compat.js)  │
└───────┬───────┘              └───────┬─────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │   @mux/mux-node       │
            │   (Mux API Client)    │
            └───────────┬───────────┘
                        │
                        ▼
            ┌───────────────────────┐
            │    Mux API            │
            │   (REST API)          │
            └───────────────────────┘
```

## Поток данных при выполнении запроса

```
1. MCP Client
   │
   │ JSON-RPC: CallToolRequest
   │ { name: "create_video_assets", arguments: {...} }
   │
   ▼
2. Transport Layer (stdio/http)
   │
   │ Парсинг JSON-RPC
   │
   ▼
3. MCP Server (server.js)
   │
   │ CallToolRequestSchema handler
   │
   ├─► Поиск endpoint в endpointMap
   │
   ├─► executeHandler()
   │   │
   │   ├─► Парсинг аргументов (parseEmbeddedJSON)
   │   │
   │   └─► Валидация через Zod schema
   │
   ▼
4. Tool Handler
   │
   │ handler(client, args)
   │
   ▼
5. @mux/mux-node Client
   │
   │ HTTP Request к Mux API
   │ POST /video/v1/assets
   │
   ▼
6. Mux API
   │
   │ Обработка запроса
   │
   ▼
7. Response обратно по цепочке
   │
   │ JSON-RPC: CallToolResult
   │ { content: [{ type: "text", text: "..." }] }
   │
   ▼
8. MCP Client получает результат
```

## Структура модулей и зависимостей

```
index.js (CLI Entry Point)
├── options.js (CLI parsing)
│   └── yargs
├── server.js (Core)
│   ├── @modelcontextprotocol/sdk
│   ├── tools.js
│   │   └── tools/index.js (Generated)
│   ├── compat.js
│   │   └── zod
│   ├── dynamic-tools.js
│   │   └── @cloudflare/cabidela
│   └── filtering.js
├── stdio.js (STDIO Transport)
│   └── @modelcontextprotocol/sdk/server/stdio
└── http.js (HTTP Transport)
    ├── express
    ├── cors
    └── @modelcontextprotocol/sdk/server/streamableHttp
```

## Типы инструментов

### Статические инструменты (по умолчанию)

```
tools/
├── video/
│   ├── assets/
│   │   ├── create_video_assets
│   │   ├── retrieve_video_assets
│   │   ├── list_video_assets
│   │   └── ...
│   ├── live_streams/
│   │   ├── create_video_live_streams
│   │   └── ...
│   └── ...
├── data/
│   ├── metrics/
│   ├── video_views/
│   └── ...
└── system/
    └── ...
```

**Каждый инструмент:**
- Имеет уникальное имя
- Описание
- Zod схему для валидации
- Handler функцию

### Динамические инструменты (--tools=dynamic)

```
dynamic-tools.js
├── list_api_endpoints
│   └── Поиск по имени/ресурсу/тегу
├── get_api_endpoint_schema
│   └── Получение схемы endpoint
└── invoke_api_endpoint
    └── Выполнение любого endpoint
```

## Совместимость с клиентами

```
compat.js
│
├── knownClients
│   ├── claude
│   │   ├── topLevelUnions: false
│   │   └── validJson: false (требует парсинг)
│   │
│   ├── cursor
│   │   ├── toolNameLength: 50
│   │   ├── refs: false
│   │   └── unions: false
│   │
│   └── openai-agents
│       └── topLevelUnions: false
│
└── Transformations
    ├── truncateToolNames()
    ├── removeTopLevelUnions()
    ├── inlineRefs()
    ├── removeAnyOf()
    └── removeFormats()
```

## Фильтрация инструментов

```
options.js (CLI)
│
├── --tool=name
├── --resource=video.assets
├── --operation=read|write
├── --tag=tag_name
├── --no-tool=name (исключение)
└── --no-resource=resource (исключение)
    │
    ▼
filtering.js
│
└── query(filters, endpoints)
    │
    └── Возвращает отфильтрованный список
```

## Инициализация сервера

```
1. newMcpServer()
   └── Создает экземпляр McpServer

2. initMcpServer({ server, endpoints, clientOptions })
   │
   ├─► Создает Mux client (@mux/mux-node)
   │
   ├─► Устанавливает ListToolsRequest handler
   │   └── Возвращает список доступных инструментов
   │
   └─► Устанавливает CallToolRequest handler
       └── Выполняет инструмент и возвращает результат

3. server.connect(transport)
   └── Подключает транспорт (stdio/http)
```

## Генерация кода

```
OpenAPI Spec (Mux API)
    │
    │ Stainless Generator
    │
    ▼
tools/index.js (Generated)
    │
    ├── Экспортирует все endpoints
    │
    └── Каждый endpoint:
        ├── tool: { name, description, inputSchema }
        ├── handler: async (client, args) => {...}
        └── metadata: { resource, operation, tags }
```

## Безопасность

```
HTTP Transport
│
├── OAuth Endpoints
│   ├── /.well-known/oauth-authorization-server
│   └── /.well-known/oauth-protected-resource
│
├── Authorization Headers
│   ├── Authorization: Bearer <token>
│   ├── x-mux-token-id
│   └── x-mux-token-secret
│
└── CORS настроен для безопасного доступа
```

## Оптимизации

```
Ленивая загрузка:
┌─────────────────────────────────────┐
│ providedEndpoints = null            │
│ endpointMap = null                  │
│                                     │
│ initTools() вызывается только при   │
│ первом запросе                      │
└─────────────────────────────────────┘

Кэширование:
┌─────────────────────────────────────┐
│ endpointMap создается один раз      │
│ и переиспользуется                 │
└─────────────────────────────────────┘

Фильтрация:
┌─────────────────────────────────────┐
│ Неиспользуемые инструменты не      │
│ загружаются в память               │
└─────────────────────────────────────┘
```

