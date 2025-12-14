# Архитектурный анализ пакета @mux/mcp

## Общая информация

**Пакет:** `@mux/mcp` версия 12.8.1  
**Тип:** MCP (Model Context Protocol) Server  
**Язык:** TypeScript (скомпилирован в JavaScript)  
**Модульная система:** CommonJS (с поддержкой ES modules через .mjs)  
**Лицензия:** Apache-2.0

## Технологический стек

### Основные зависимости:

1. **@modelcontextprotocol/sdk** (^1.11.5)
   - **Официальный TypeScript SDK** из репозитория [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk)
   - Это **основа всей архитектуры** MCP сервера
   - Репозиторий: `git+https://github.com/modelcontextprotocol/typescript-sdk.git`
   - Последняя версия SDK: 1.24.3 (в @mux/mcp используется 1.11.5)
   - Предоставляет базовые классы `McpServer`, транспорты (`StdioServerTransport`, `StreamableHTTPServerTransport`)
   - Обработка JSON-RPC протокола
   - **11k+ звезд на GitHub**, активно поддерживается

2. **@mux/mux-node** (^12.8.1)
   - Официальный Node.js SDK для Mux API
   - Используется для выполнения реальных API запросов к Mux

3. **zod** (^3.25.20) + **zod-to-json-schema** (^3.24.5)
   - Валидация схем данных
   - Конвертация Zod схем в JSON Schema для MCP инструментов
   - Типобезопасность на уровне TypeScript

4. **express** (^5.1.0) + **cors** (^2.8.5)
   - HTTP сервер для удаленного доступа (transport=http)
   - REST API endpoints для MCP через HTTP

5. **yargs** (^17.7.2)
   - Парсинг командной строки
   - Обработка опций и флагов

6. **@cloudflare/cabidela** (^0.2.4)
   - Утилита для работы с OpenAPI спецификациями
   - Используется в динамических инструментах

## Архитектура

### Структура модулей

```
@mux/mcp/
├── index.js              # Точка входа (CLI)
├── server.js             # Ядро сервера, инициализация
├── tools.js              # Экспорт всех endpoints
├── tools/                # Генерированные инструменты
│   ├── data/             # Инструменты для аналитики
│   ├── system/           # Системные инструменты
│   └── index.js          # Агрегация всех endpoints
├── compat.js             # Совместимость с разными клиентами
├── dynamic-tools.js      # Динамические инструменты
├── options.js             # Парсинг CLI опций
├── http.js                # HTTP транспорт
├── stdio.js               # STDIO транспорт
├── filtering.js           # Фильтрация инструментов
└── headers.js             # Обработка HTTP заголовков
```

### Архитектурные паттерны

#### 1. **Стратегия транспортов (Transport Strategy)**

Сервер поддерживает два типа транспортов:

- **STDIO** (`stdio.js`): 
  - Стандартный ввод/вывод для локального использования
  - Используется при запуске через `npx` или как дочерний процесс
  - Протокол: JSON-RPC через stdin/stdout

- **HTTP** (`http.js`):
  - Express.js сервер для удаленного доступа
  - Streamable HTTP транспорт из MCP SDK
  - Поддержка OAuth авторизации
  - Протокол: JSON-RPC через HTTP POST

```javascript
// Выбор транспорта в index.js
switch (options.transport) {
    case 'stdio':
        await launchStdioServer(options);
        break;
    case 'http':
        await launchStreamableHTTPServer(options, port);
        break;
}
```

#### 2. **Фабрика инструментов (Tool Factory)**

Инструменты генерируются автоматически из OpenAPI спецификации Mux API:

- **Статические инструменты**: Один инструмент = один API endpoint
- **Динамические инструменты**: Три универсальных инструмента:
  - `list_api_endpoints` - поиск endpoints
  - `get_api_endpoint_schema` - получение схемы endpoint
  - `invoke_api_endpoint` - выполнение любого endpoint

#### 3. **Адаптер совместимости (Compatibility Adapter)**

Модуль `compat.js` обеспечивает совместимость с разными MCP клиентами:

- **Claude**: Не поддерживает top-level unions, требует парсинг JSON строк
- **Cursor**: Ограничения на длину имен инструментов (50 символов), нет поддержки refs/unions
- **OpenAI Agents**: Ограниченная поддержка unions
- **Claude Code**: Полная поддержка всех возможностей

Трансформации схем:
- `truncateToolNames()` - обрезка длинных имен
- `removeTopLevelUnions()` - удаление union типов верхнего уровня
- `inlineRefs()` - инлайнинг $ref ссылок
- `removeAnyOf()` - удаление anyOf конструкций
- `removeFormats()` - удаление format валидаций

#### 4. **Цепочка фильтров (Filter Chain)**

Модуль `filtering.js` позволяет фильтровать инструменты по:
- Имени инструмента (`--tool`)
- Ресурсу (`--resource`)
- Операции (`--operation`: read/write)
- Тегам (`--tag`)
- Исключения (`--no-tool`, `--no-resource`)

#### 5. **Ленивая инициализация (Lazy Initialization)**

Инструменты загружаются только при первом запросе:

```javascript
let providedEndpoints = null;
let endpointMap = null;

const initTools = async (implementation) => {
    if (providedEndpoints === null) {
        providedEndpoints = await selectTools(endpoints, options);
        endpointMap = Object.fromEntries(...);
    }
};
```

## Поток выполнения

### Инициализация сервера:

```
1. index.js (main)
   ↓
2. parseCLIOptions() → options.js
   ↓
3. selectTools() → server.js
   ↓
4. applyCompatibilityTransformations() → compat.js
   ↓
5. initMcpServer() → server.js
   ↓
6. Установка обработчиков:
   - ListToolsRequestSchema → список инструментов
   - CallToolRequestSchema → выполнение инструмента
   ↓
7. Подключение транспорта (stdio/http)
```

### Выполнение запроса:

```
1. MCP Client → JSON-RPC запрос
   ↓
2. CallToolRequestSchema handler
   ↓
3. Поиск endpoint в endpointMap
   ↓
4. executeHandler()
   ↓
5. Парсинг аргументов (если нужно)
   ↓
6. Вызов handler(client, args)
   ↓
7. @mux/mux-node → HTTP запрос к Mux API
   ↓
8. Возврат результата клиенту
```

## Генерация кода

**Важно:** Код инструментов **генерируется автоматически** из OpenAPI спецификации Mux API.

Комментарий в коде: `"File generated from our OpenAPI spec by Stainless"`

Это означает:
- Инструменты не пишутся вручную
- Они синхронизированы с актуальной версией Mux API
- При обновлении API автоматически генерируются новые инструменты
- Используется инструмент Stainless для генерации

## Особенности реализации

### 1. Поддержка Deno и Node.js

```javascript
const readEnv = (env) => {
    if (typeof globalThis.process !== 'undefined') {
        return globalThis.process.env?.[env]?.trim();  // Node.js
    }
    else if (typeof globalThis.Deno !== 'undefined') {
        return globalThis.Deno.env?.get?.(env)?.trim();  // Deno
    }
};
```

### 2. Автоопределение клиента

```javascript
if (implementation.name.toLowerCase().includes('claude')) {
    mcpOptions.client = 'claude';
} else if (implementation.name.toLowerCase().includes('cursor')) {
    mcpOptions.client = 'cursor';
}
```

### 3. OAuth поддержка (HTTP транспорт)

- Endpoint: `/.well-known/oauth-authorization-server`
- Endpoint: `/.well-known/oauth-protected-resource`
- Авторизация через заголовки: `Authorization`, `x-mux-token-id`, `x-mux-token-secret`

### 4. Парсинг вложенного JSON

Некоторые клиенты (Claude) передают JSON как строки:

```javascript
function parseEmbeddedJSON(args, schema) {
    // Пытается распарсить строки в JSON объекты
    // Если строка валидный JSON объект → парсит
    // Иначе оставляет как есть
}
```

## Производительность

### Оптимизации:

1. **Ленивая загрузка** - инструменты загружаются только при необходимости
2. **Кэширование endpointMap** - маппинг имя → endpoint создается один раз
3. **Фильтрация на этапе инициализации** - неиспользуемые инструменты не загружаются
4. **Статическая генерация** - инструменты генерируются на этапе сборки

### Ограничения:

- При использовании всех инструментов (>100 endpoints) может быть большой размер контекста
- Решение: использование динамических инструментов (`--tools=dynamic`)

## Безопасность

1. **Авторизация через переменные окружения**
2. **OAuth поддержка** для HTTP транспорта
3. **Валидация через Zod** - все входные данные валидируются
4. **CORS** настроен для HTTP транспорта

## Расширяемость

### Добавление кастомных инструментов:

```javascript
const myCustomEndpoint = {
    tool: {
        name: 'my_custom_tool',
        description: 'My custom tool',
        inputSchema: zodToJsonSchema(z.object({ 
            a_property: z.string() 
        })),
    },
    handler: async (client, args) => {
        return { myResponse: 'Hello world!' };
    }
};

initMcpServer({ 
    server: myServer, 
    endpoints: [createVideoAssets, myCustomEndpoint] 
});
```

## Основа архитектуры: MCP TypeScript SDK

**Важно:** Пакет `@mux/mcp` построен на основе официального **Model Context Protocol TypeScript SDK** из репозитория [modelcontextprotocol/typescript-sdk](https://github.com/modelcontextprotocol/typescript-sdk).

### Использование SDK в коде:

```javascript
// server.js
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");

// stdio.js
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");

// http.js
const streamableHttp_js_1 = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
```

### Что предоставляет SDK:

1. **McpServer** - базовый класс сервера
2. **Транспорты:**
   - `StdioServerTransport` - для локального использования
   - `StreamableHTTPServerTransport` - для HTTP доступа
3. **JSON-RPC обработка** - автоматическая обработка протокола MCP
4. **Типы и схемы** - TypeScript типы для всех MCP операций

### Архитектурная роль SDK:

SDK является **фундаментом** архитектуры, предоставляя:
- Протокольный слой (JSON-RPC)
- Транспортный слой (stdio/HTTP)
- Базовую инфраструктуру сервера

Пакет `@mux/mcp` добавляет поверх SDK:
- Интеграцию с Mux API
- Генерацию инструментов из OpenAPI
- Адаптацию под разные клиенты
- Фильтрацию и динамические инструменты

## Выводы

**Сильные стороны:**
- ✅ Построен на официальном MCP TypeScript SDK
- ✅ Автоматическая генерация из OpenAPI
- ✅ Поддержка множества клиентов с адаптацией
- ✅ Гибкая фильтрация инструментов
- ✅ Два типа транспортов (stdio/http)
- ✅ Типобезопасность через TypeScript и Zod

**Архитектурные решения:**
- Модульная структура с четким разделением ответственности
- Паттерн Strategy для транспортов
- Adapter для совместимости с клиентами
- Factory для создания инструментов
- Lazy loading для оптимизации
- **Использование официального SDK как основы**

**Технологии:**
- **@modelcontextprotocol/typescript-sdk** - официальный SDK (основа)
- TypeScript → JavaScript (CommonJS)
- Express.js для HTTP
- Zod для валидации
- Автогенерация кода из OpenAPI

Это профессионально спроектированный пакет, построенный на официальном SDK с четкой архитектурой, хорошей расширяемостью и поддержкой различных сценариев использования.

