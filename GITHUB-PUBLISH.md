# 📚 Публикация OpenAPI документации на GitHub

Инструкция по публикации OpenAPI документации Kinescope API на GitHub.

## 🚀 Быстрая публикация

### Шаг 1: Подготовка файлов

Убедитесь, что у вас есть:
- ✅ `kinescope-api-openapi.yaml` - OpenAPI спецификация
- ✅ `kinescope-api-openapi.json` - JSON версия
- ✅ `docs/` - HTML файлы для просмотра
- ✅ `OPENAPI-README.md` - Документация

### Шаг 2: Инициализация Git (если еще не сделано)

```bash
git init
git add .
git commit -m "Add OpenAPI documentation for Kinescope API"
```

### Шаг 3: Создание репозитория на GitHub

1. Перейдите на https://github.com/new
2. Создайте новый репозиторий (например, `kinescope-api-docs`)
3. **НЕ** инициализируйте с README (если уже есть файлы)

### Шаг 4: Загрузка на GitHub

```bash
git remote add origin https://github.com/<ваш-username>/<ваш-репозиторий>.git
git branch -M main
git push -u origin main
```

## 🔗 Использование ссылок в документации

После публикации используйте эти ссылки:

### Прямая ссылка на спецификацию

```
https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
```

### Swagger UI (интерактивная документация)

```
https://editor.swagger.io/?url=https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
```

### Redoc (красивая документация)

```
https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
```

## 📄 GitHub Pages (статический сайт)

Для публикации HTML документации:

### Вариант 1: Через настройки GitHub

1. Перейдите в **Settings** → **Pages**
2. В разделе **Source** выберите:
   - Branch: `main`
   - Folder: `/docs`
3. Нажмите **Save**

Ваша документация будет доступна по адресу:
```
https://<username>.github.io/<repo>/
```

### Вариант 2: Через Actions (автоматическая публикация)

Создайте файл `.github/workflows/pages.yml`:

```yaml
name: Deploy Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Pages
        uses: actions/configure-pages@v3
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v1
        with:
          path: './docs'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v1
```

## 🔄 Обновление документации

### Ручное обновление

1. Обновите файлы локально:
   ```bash
   npm run openapi:convert
   ```

2. Закоммитьте и запушьте:
   ```bash
   git add kinescope-api-openapi.yaml kinescope-api-openapi.json
   git commit -m "Update OpenAPI documentation"
   git push
   ```

### Автоматическое обновление (опционально)

GitHub Actions workflow настроен, но **отключен по умолчанию**.

Чтобы включить автоматическое обновление:

1. Добавьте secrets в GitHub:
   - Settings → Secrets → Actions
   - `POSTMAN_API_KEY` - ваш Postman API ключ
   - `POSTMAN_COLLECTION_ID` - ID коллекции

2. Включите автоматический запуск в `.github/workflows/sync-postman.yml`:
   - Раскомментируйте секцию `schedule` для ежедневного запуска
   - Или раскомментируйте `push` для запуска при изменении скриптов

3. Запуск вручную всегда доступен:
   - Actions → Sync Postman to OpenAPI → Run workflow

## 📝 Структура репозитория

```
.
├── kinescope-api-openapi.yaml      # OpenAPI спецификация (YAML)
├── kinescope-api-openapi.json      # OpenAPI спецификация (JSON)
├── docs/                           # HTML документация
│   ├── index.html                  # Redoc версия
│   ├── swagger.html                # Swagger UI версия
│   └── kinescope-api-openapi.yaml  # Копия для локального просмотра
├── scripts/                        # Скрипты конвертации
├── .github/
│   └── workflows/
│       └── sync-postman.yml        # GitHub Actions (отключен)
├── OPENAPI-README.md               # Документация
├── SHARED-DOCS-LINKS.md           # Готовые ссылки для команды
└── README.md                       # Основной README
```

## 🔗 Готовые ссылки для команды

Скопируйте в вашу shared documentation:

```markdown
## Kinescope API Documentation

### 📚 Интерактивная документация
- **Swagger UI**: https://editor.swagger.io/?url=https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
- **Redoc**: https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml

### 📄 Спецификация
- **OpenAPI YAML**: https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
- **OpenAPI JSON**: https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.json

### 🌐 GitHub Pages (если настроен)
- **Документация**: https://<username>.github.io/<repo>/
```

## ✅ Чеклист публикации

- [ ] Файлы подготовлены и проверены
- [ ] Репозиторий создан на GitHub
- [ ] Файлы загружены в репозиторий
- [ ] GitHub Pages настроен (опционально)
- [ ] Ссылки проверены и работают
- [ ] Команда уведомлена о публикации
- [ ] Ссылки добавлены в shared docs

## 🔐 Безопасность

⚠️ **Важно:**
- `postman-config.json` в `.gitignore` - не коммитьте API ключи
- Используйте GitHub Secrets для CI/CD (если включите Actions)
- Проверьте `.gitignore` перед первым коммитом

## 📚 Дополнительные ресурсы

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [OpenAPI Specification](https://swagger.io/specification/)

---

**Готово! Документация опубликована на GitHub! 🎉**

