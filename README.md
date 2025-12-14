# Kinescope API - OpenAPI Documentation

OpenAPI 3.0.3 спецификация для Kinescope API, автоматически сгенерированная из Postman коллекции.

## 📚 Документация

### Интерактивная документация

- **Swagger UI**: [Открыть в Swagger Editor](https://editor.swagger.io/?url=https://raw.githubusercontent.com/kinescoper/kinescope_openapi/main/kinescope-api-openapi.yaml)
- **Redoc**: [Открыть в Redoc](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/kinescoper/kinescope_openapi/main/kinescope-api-openapi.yaml)

### Файлы спецификации

- [`kinescope-api-openapi.yaml`](./kinescope-api-openapi.yaml) - OpenAPI спецификация (YAML)
- [`kinescope-api-openapi.json`](./kinescope-api-openapi.json) - OpenAPI спецификация (JSON)

## 📊 Статистика

- **Endpoints**: 128
- **Paths**: 70 уникальных путей
- **Tags**: 33 тега (группы endpoints)
- **Версия OpenAPI**: 3.0.3

## 🚀 Использование

### Для ИИ-ассистентов

OpenAPI спецификация идеально подходит для использования с ChatGPT, Claude, Cursor и другими ИИ:

1. Загрузите файл `kinescope-api-openapi.yaml` в контекст
2. ИИ автоматически поймет структуру API
3. Может генерировать код для работы с API

### Для разработчиков

#### Генерация клиентов

```bash
# TypeScript
openapi-generator-cli generate -i kinescope-api-openapi.yaml -g typescript-axios -o ./client-ts

# Python
openapi-generator-cli generate -i kinescope-api-openapi.yaml -g python -o ./client-python

# Go
openapi-generator-cli generate -i kinescope-api-openapi.yaml -g go -o ./client-go
```

#### Импорт в инструменты

- **Postman**: Import → File → выберите `kinescope-api-openapi.yaml`
- **Insomnia**: File → Import → From File
- **VS Code**: Установите расширение "OpenAPI (Swagger) Editor"

## 🔄 Обновление документации

### Ручное обновление

```bash
# Конвертация из локального файла Postman
npm run openapi:convert

# Или укажите путь к файлу
node scripts/postman-to-openapi.js /path/to/collection.json
```

### Автоматическое обновление (опционально)

GitHub Actions workflow настроен, но **отключен по умолчанию**.

Чтобы включить автоматическую синхронизацию из Postman:

1. Добавьте secrets в GitHub: Settings → Secrets → Actions
   - `POSTMAN_API_KEY`
   - `POSTMAN_COLLECTION_ID`

2. Включите автоматический запуск в `.github/workflows/sync-postman.yml`

3. Подробные инструкции: [`AUTOMATION-SETUP.md`](./AUTOMATION-SETUP.md)

## 🔐 Аутентификация

Все endpoints требуют Bearer Token аутентификации:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_KEY" \
  https://api.kinescope.io/v1/videos
```

## 📁 Структура проекта

```
.
├── kinescope-api-openapi.yaml      # OpenAPI спецификация (YAML)
├── kinescope-api-openapi.json      # OpenAPI спецификация (JSON)
├── docs/                           # HTML документация
│   ├── index.html                  # Redoc версия
│   └── swagger.html                # Swagger UI версия
├── scripts/                        # Скрипты конвертации
│   ├── postman-to-openapi.js      # Конвертер Postman → OpenAPI
│   └── sync-from-postman-api.js   # Синхронизация из Postman API
├── .github/
│   └── workflows/
│       └── sync-postman.yml       # GitHub Actions (отключен)
└── README.md                       # Этот файл
```

## 📚 Дополнительная документация

- [`OPENAPI-README.md`](./OPENAPI-README.md) - Подробная документация по использованию
- [`AUTOMATION-SETUP.md`](./AUTOMATION-SETUP.md) - Настройка автоматической синхронизации
- [`GITHUB-PUBLISH.md`](./GITHUB-PUBLISH.md) - Инструкции по публикации
- [`SHARED-DOCS-LINKS.md`](./SHARED-DOCS-LINKS.md) - Готовые ссылки для команды

## 🔗 Полезные ссылки

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger Editor](https://editor.swagger.io/)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [Kinescope Dashboard](https://kinescope.io)

## 📝 Лицензия

Документация предоставляется "как есть" для использования командой Kinescope.

---

**Версия**: 1.0.0  
**Последнее обновление**: Автоматически из Postman коллекции  
**Стандарт**: OpenAPI 3.0.3

