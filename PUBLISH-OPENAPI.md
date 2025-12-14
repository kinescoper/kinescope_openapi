# Публикация OpenAPI документации для команды

Есть несколько способов опубликовать OpenAPI спецификацию Kinescope API для использования в shared team docs:

## 🚀 Вариант 1: GitHub (Рекомендуется)

### Шаг 1: Загрузите файлы в GitHub репозиторий

```bash
# Если у вас еще нет репозитория
git init
git add kinescope-api-openapi.yaml kinescope-api-openapi.json docs/
git commit -m "Add OpenAPI specification for Kinescope API"
git remote add origin <your-repo-url>
git push -u origin main
```

### Шаг 2: Используйте Raw GitHub URL

После загрузки в GitHub, используйте прямую ссылку на raw файл:

```
https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
```

**Примеры использования:**

1. **Swagger Editor** (онлайн просмотр):
   ```
   https://editor.swagger.io/?url=https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
   ```

2. **Redoc** (красивая документация):
   ```
   https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
   ```

3. **Swagger UI** (интерактивная документация):
   ```
   https://petstore.swagger.io/?url=https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
   ```

### Шаг 3: GitHub Pages (Статический сайт)

1. Включите GitHub Pages в настройках репозитория
2. Выберите папку `docs/` как источник
3. Ваша документация будет доступна по адресу:
   ```
   https://<username>.github.io/<repo>/
   ```

## 🌐 Вариант 2: Redocly (Бесплатный хостинг)

1. Зарегистрируйтесь на https://redocly.com/
2. Создайте новый проект
3. Загрузите `kinescope-api-openapi.yaml`
4. Получите публичную ссылку вида:
   ```
   https://redocly.com/docs/<your-project-id>
   ```

## 📦 Вариант 3: SwaggerHub

1. Зарегистрируйтесь на https://swaggerhub.com/
2. Создайте новый API
3. Импортируйте `kinescope-api-openapi.yaml`
4. Опубликуйте и получите ссылку:
   ```
   https://app.swaggerhub.com/apis/<username>/kinescope-api/1.0.0
   ```

## 🔗 Вариант 4: Stoplight

1. Зарегистрируйтесь на https://stoplight.io/
2. Создайте новый проект
3. Импортируйте OpenAPI файл
4. Получите публичную ссылку на документацию

## 📄 Вариант 5: Локальный HTML файл

Используйте созданные HTML файлы в папке `docs/`:

1. **Redoc версия** (`docs/index.html`):
   ```bash
   # Откройте в браузере
   open docs/index.html
   ```

2. **Swagger UI версия** (`docs/swagger.html`):
   ```bash
   # Откройте в браузере
   open docs/swagger.html
   ```

Для публикации HTML файлов:
- Загрузите папку `docs/` на любой хостинг (Netlify, Vercel, GitHub Pages)
- Или используйте простой HTTP сервер:
  ```bash
  cd docs
  python3 -m http.server 8000
  # Откройте http://localhost:8000
  ```

## 🔗 Быстрые ссылки для команды

После публикации добавьте в вашу shared documentation:

### Если используете GitHub:

```markdown
## Kinescope API Documentation

- **OpenAPI Spec**: https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
- **Swagger UI**: https://editor.swagger.io/?url=https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
- **Redoc**: https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
```

### Если используете GitHub Pages:

```markdown
## Kinescope API Documentation

- **Документация**: https://<username>.github.io/<repo>/
- **OpenAPI Spec**: https://raw.githubusercontent.com/<username>/<repo>/main/kinescope-api-openapi.yaml
```

### Если используете Redocly/SwaggerHub:

```markdown
## Kinescope API Documentation

- **Документация**: <ваша-публичная-ссылка>
- **OpenAPI Spec**: <ссылка-на-спецификацию>
```

## 💡 Рекомендации

1. **Для команды Kinescope**: Используйте GitHub + GitHub Pages
   - Бесплатно
   - Автоматическое обновление при push
   - Версионирование через git
   - Легко обновлять

2. **Для быстрого доступа**: Используйте Redocly или SwaggerHub
   - Красивый интерфейс из коробки
   - Не требует настройки
   - Поддержка версионирования

3. **Для локальной разработки**: Используйте HTML файлы в `docs/`
   - Работает офлайн
   - Быстрый доступ
   - Не требует интернета

## 🔄 Обновление документации

После обновления Postman коллекции:

```bash
# 1. Обновите OpenAPI спецификацию
npm run openapi:convert

# 2. Закоммитьте изменения
git add kinescope-api-openapi.yaml kinescope-api-openapi.json
git commit -m "Update OpenAPI specification"
git push

# 3. Документация автоматически обновится (если используете GitHub Pages)
```

## 📝 Примеры интеграции

### В Notion/Confluence:

Добавьте embed блок с ссылкой на Swagger UI или Redoc.

### В Slack/Discord:

Отправьте ссылку на документацию в канал команды.

### В README проекта:

```markdown
## API Documentation

📚 [View API Documentation](https://your-link-here)
📄 [OpenAPI Spec](https://raw.githubusercontent.com/.../kinescope-api-openapi.yaml)
```

---

**Выберите наиболее подходящий вариант для вашей команды!**
