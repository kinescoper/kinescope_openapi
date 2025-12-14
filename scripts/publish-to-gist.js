#!/usr/bin/env node
/**
 * Скрипт для публикации OpenAPI спецификации на GitHub Gist
 * 
 * Требования:
 * - Установите GitHub CLI: brew install gh (macOS) или https://cli.github.com/
 * - Авторизуйтесь: gh auth login
 * 
 * Использование:
 *   node scripts/publish-to-gist.js
 *   или
 *   npm run openapi:publish-gist
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const openApiYamlPath = path.join(__dirname, '..', 'kinescope-api-openapi.yaml');
const openApiJsonPath = path.join(__dirname, '..', 'kinescope-api-openapi.json');

console.log('🚀 Публикация OpenAPI спецификации на GitHub Gist...\n');

// Проверяем наличие файлов
if (!fs.existsSync(openApiYamlPath)) {
  console.error('❌ Файл kinescope-api-openapi.yaml не найден!');
  console.error('   Запустите сначала: npm run openapi:convert');
  process.exit(1);
}

// Проверяем наличие GitHub CLI
try {
  execSync('gh --version', { stdio: 'ignore' });
} catch (e) {
  console.error('❌ GitHub CLI не установлен!');
  console.error('\nУстановите GitHub CLI:');
  console.error('  macOS: brew install gh');
  console.error('  Linux: https://cli.github.com/');
  console.error('\nПосле установки авторизуйтесь:');
  console.error('  gh auth login');
  process.exit(1);
}

// Проверяем авторизацию
try {
  execSync('gh auth status', { stdio: 'ignore' });
} catch (e) {
  console.error('❌ Не авторизованы в GitHub CLI!');
  console.error('\nВыполните: gh auth login');
  process.exit(1);
}

// Читаем содержимое файлов
const yamlContent = fs.readFileSync(openApiYamlPath, 'utf-8');
const jsonContent = fs.readFileSync(openApiJsonPath, 'utf-8');

// Создаем временный файл для gist
const tempDir = require('os').tmpdir();
const gistDescription = 'Kinescope API - OpenAPI 3.0 Specification';
const gistFiles = {
  'kinescope-api-openapi.yaml': { content: yamlContent },
  'kinescope-api-openapi.json': { content: jsonContent }
};

const gistData = {
  description: gistDescription,
  public: true,
  files: gistFiles
};

const tempFile = path.join(tempDir, 'gist-data.json');
fs.writeFileSync(tempFile, JSON.stringify(gistData));

try {
  console.log('📤 Создание Gist...');
  
  // Создаем gist
  const result = execSync(`gh gist create --public -f kinescope-api-openapi.yaml -f kinescope-api-openapi.json -d "${gistDescription}" ${openApiYamlPath} ${openApiJsonPath}`, {
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  
  const gistUrl = result.trim();
  const gistId = gistUrl.split('/').pop();
  
  // Получаем raw URL
  const rawYamlUrl = `https://gist.githubusercontent.com/${getUsername()}/${gistId}/raw/kinescope-api-openapi.yaml`;
  const rawJsonUrl = `https://gist.githubusercontent.com/${getUsername()}/${gistId}/raw/kinescope-api-openapi.json`;
  const swaggerEditorUrl = `https://editor.swagger.io/?url=${encodeURIComponent(rawYamlUrl)}`;
  
  console.log('\n✅ Gist успешно создан!\n');
  console.log('📋 Ссылки для команды:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🔗 Gist: ${gistUrl}`);
  console.log(`📄 Raw YAML: ${rawYamlUrl}`);
  console.log(`📄 Raw JSON: ${rawJsonUrl}`);
  console.log(`🌐 Swagger Editor: ${swaggerEditorUrl}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('💡 Добавьте в ваши shared team docs:\n');
  console.log(`📚 Kinescope API Documentation:`);
  console.log(`- OpenAPI Spec (YAML): ${rawYamlUrl}`);
  console.log(`- Swagger Editor: ${swaggerEditorUrl}`);
  console.log(`- Gist: ${gistUrl}\n`);
  
  // Сохраняем ссылки в файл
  const linksFile = path.join(__dirname, '..', 'GIST-LINKS.md');
  fs.writeFileSync(linksFile, `# GitHub Gist Links

## Kinescope API OpenAPI Documentation

- **Gist**: ${gistUrl}
- **Raw YAML**: ${rawYamlUrl}
- **Raw JSON**: ${rawJsonUrl}
- **Swagger Editor**: ${swaggerEditorUrl}

## Для добавления в shared team docs:

\`\`\`
📚 Kinescope API Documentation:
- OpenAPI Spec: ${rawYamlUrl}
- Swagger Editor: ${swaggerEditorUrl}
- Gist: ${gistUrl}
\`\`\`

*Обновлено: ${new Date().toISOString()}*
`);
  
  console.log(`✅ Ссылки сохранены в: ${linksFile}\n`);
  
} catch (error) {
  console.error('❌ Ошибка при создании Gist:', error.message);
  console.error('\nПопробуйте создать Gist вручную:');
  console.error('1. Перейдите на https://gist.github.com');
  console.error('2. Скопируйте содержимое kinescope-api-openapi.yaml');
  console.error('3. Создайте новый Gist');
  process.exit(1);
} finally {
  // Удаляем временный файл
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
}

function getUsername() {
  try {
    const result = execSync('gh api user', { encoding: 'utf-8', stdio: 'pipe' });
    const user = JSON.parse(result);
    return user.login;
  } catch (e) {
    return 'USERNAME'; // Fallback
  }
}

