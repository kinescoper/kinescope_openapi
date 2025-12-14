/**
 * Улучшенный конвертер Postman → OpenAPI с поддержкой API
 * Поддерживает работу как с локальным файлом, так и с Postman API
 */

const fs = require('fs');
const path = require('path');
const { syncFromPostman } = require('./sync-from-postman-api');

// Определяем источник данных
const args = process.argv.slice(2);
const useApi = args.includes('--from-api');
const useLocal = args.includes('--local') || !useApi;

let postmanCollectionPath;
let collection;

// Путь к временному файлу из API
const tempCollectionPath = path.join(__dirname, '..', '.postman-collection-temp.json');
const defaultCollectionPath = '/Users/insty/Downloads/Kinescope API.postman_collection.json';
const outputDir = path.join(__dirname, '..');

async function loadCollection() {
  if (useApi) {
    // Используем коллекцию из API (временный файл)
    if (fs.existsSync(tempCollectionPath)) {
      postmanCollectionPath = tempCollectionPath;
      console.log('📥 Использую коллекцию из Postman API\n');
    } else {
      console.log('⚠️  Временный файл не найден. Загружаю из API...\n');
      await syncFromPostman();
      if (fs.existsSync(tempCollectionPath)) {
        postmanCollectionPath = tempCollectionPath;
      } else {
        throw new Error('Не удалось загрузить коллекцию из API');
      }
    }
  } else {
    // Используем локальный файл
    postmanCollectionPath = args.find(arg => arg.endsWith('.json')) || defaultCollectionPath;
    
    if (!fs.existsSync(postmanCollectionPath)) {
      throw new Error(`Файл коллекции не найден: ${postmanCollectionPath}`);
    }
    console.log(`📁 Использую локальный файл: ${postmanCollectionPath}\n`);
  }

  collection = JSON.parse(fs.readFileSync(postmanCollectionPath, 'utf-8'));
  return collection;
}

// Импортируем функции конвертации из основного скрипта
// (в реальности нужно будет скопировать функции или сделать общий модуль)

// Для простоты, используем существующий скрипт
async function convert() {
  await loadCollection();
  
  // Запускаем основной скрипт конвертации
  // Временно сохраняем коллекцию в ожидаемое место
  const tempPath = path.join(__dirname, 'postman-collection-temp.json');
  fs.writeFileSync(tempPath, JSON.stringify(collection, null, 2));
  
  // Модифицируем основной скрипт для использования этой коллекции
  const mainScript = fs.readFileSync(path.join(__dirname, 'postman-to-openapi.js'), 'utf-8');
  const modifiedScript = mainScript.replace(
    /const postmanCollectionPath = .*;/,
    `const postmanCollectionPath = '${tempPath}';`
  );
  
  // Выполняем модифицированный скрипт
  eval(modifiedScript);
}

// Экспортируем для использования в других скриптах
module.exports = { loadCollection, convert };

