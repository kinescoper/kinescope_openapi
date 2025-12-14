# Установка и использование @mux/mcp

Пакет `@mux/mcp` успешно установлен локально в проект.

## Что это?

`@mux/mcp` - это официальный MCP (Model Context Protocol) сервер для работы с Mux API. Mux - это платформа для видео стриминга и аналитики.

## Установка

Пакет уже установлен. Если нужно переустановить:

```bash
npm install @mux/mcp
```

## Использование

### 1. Через командную строку (npx)

Самый простой способ - использовать через npx:

```bash
# Базовое использование
npx -y @mux/mcp@latest --client=cursor --tools=dynamic

# С переменными окружения
MUX_TOKEN_ID=your_token_id \
MUX_TOKEN_SECRET=your_secret \
npx -y @mux/mcp@latest --client=cursor
```

### 2. Через npm скрипт

В `package.json` добавлен скрипт:

```bash
npm run mcp:run
```

### 3. Программно (через код)

См. файл `example-mcp.js` для примера использования в коде.

## Доступные ресурсы

Пакет предоставляет доступ к следующим ресурсам Mux API:

- **video.assets** - управление видео активами
- **video.live_streams** - управление живыми стримами  
- **video.uploads** - загрузка видео
- **video.playback_ids** - управление playback ID
- **video.playback_restrictions** - ограничения воспроизведения
- **data.metrics** - метрики и аналитика
- **data.video_views** - просмотры видео
- **data.incidents** - инциденты
- **system.signing_keys** - ключи подписи
- И многие другие...

## Настройка переменных окружения

Для работы с Mux API нужны учетные данные:

```bash
export MUX_TOKEN_ID="your_token_id"
export MUX_TOKEN_SECRET="your_secret"
export MUX_WEBHOOK_SECRET="your_webhook_secret"  # опционально
export MUX_SIGNING_KEY="your_signing_key"        # опционально
export MUX_PRIVATE_KEY="your_private_key"         # опционально
export MUX_AUTHORIZATION_TOKEN="your_auth_token" # опционально
```

## Дополнительная информация

- Полная документация: `node_modules/@mux/mcp/README.md`
- Официальный репозиторий: https://github.com/muxinc/mux-node-sdk
- Документация Mux API: https://docs.mux.com/

## Примеры команд

```bash
# Список доступных инструментов
npx -y @mux/mcp@latest --list

# Фильтрация по ресурсам
npx -y @mux/mcp@latest --resource=video.assets --operation=read

# Для Cursor клиента
npx -y @mux/mcp@latest --client=cursor --capability=tool-name-length=40
```

