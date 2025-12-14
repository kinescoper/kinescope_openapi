# Kinescope API Documentation

Эта папка содержит статические HTML файлы для просмотра OpenAPI документации.

## Файлы

- `index.html` - Redoc документация (красивый интерфейс)
- `swagger.html` - Swagger UI документация (интерактивный интерфейс)
- `index-standalone.html` - Standalone версия Swagger UI
- `kinescope-api-openapi.yaml` - OpenAPI спецификация

## Локальный просмотр

Откройте любой HTML файл в браузере:

```bash
open index.html        # Redoc
open swagger.html      # Swagger UI
open index-standalone.html  # Standalone Swagger UI
```

Или используйте простой HTTP сервер:

```bash
python3 -m http.server 8000
# Откройте http://localhost:8000/index.html
```

## Публикация

Для публикации загрузите всю папку `docs/` на:
- GitHub Pages
- Netlify
- Vercel
- Любой статический хостинг

Подробные инструкции см. в `../PUBLISH-OPENAPI.md`

