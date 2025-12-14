/**
 * Универсальный скрипт синхронизации и конвертации
 * Поддерживает:
 * - Загрузку из Postman API
 * - Работу с локальным файлом
 * - Автоматическую конвертацию в OpenAPI
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Импортируем функции конвертации
const convertScript = require('./postman-to-openapi.js');

// Загружаем конфигурацию
function loadConfig() {
  const configPath = path.join(__dirname, '..', 'postman-config.json');
  let config = {};

  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } else {
    config = {
      postmanApiKey: process.env.POSTMAN_API_KEY,
      collectionId: process.env.POSTMAN_COLLECTION_ID || process.env.POSTMAN_COLLECTION_UID,
      workspaceId: process.env.POSTMAN_WORKSPACE_ID
    };
  }

  return config;
}

/**
 * Получает коллекцию из Postman API
 */
function fetchCollectionFromPostman(apiKey, collectionId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.getpostman.com',
      path: `/collections/${collectionId}`,
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        'Accept': 'application/json'
      }
    };

    console.log(`📥 Загружаю коллекцию ${collectionId} из Postman API...`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            if (response.collection) {
              console.log(`✅ Коллекция "${response.collection.info.name}" загружена`);
              resolve(response.collection);
            } else {
              reject(new Error('Неверный формат ответа от Postman API'));
            }
          } catch (e) {
            reject(new Error(`Ошибка парсинга: ${e.message}`));
          }
        } else {
          reject(new Error(`API ошибка ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Сохраняет коллекцию во временный файл для конвертации
 */
function saveCollectionForConversion(collection) {
  const tempPath = path.join(__dirname, '..', '.postman-collection-temp.json');
  fs.writeFileSync(tempPath, JSON.stringify(collection, null, 2));
  return tempPath;
}

/**
 * Основная функция
 */
async function main() {
  const args = process.argv.slice(2);
  const useApi = args.includes('--from-api');
  const localFile = args.find(arg => arg.endsWith('.json') && !arg.startsWith('--'));

  let collectionPath;

  try {
    if (useApi) {
      // Загружаем из Postman API
      const config = loadConfig();
      
      if (!config.postmanApiKey) {
        throw new Error('POSTMAN_API_KEY не установлен. Создайте postman-config.json или установите переменную окружения');
      }

      if (!config.collectionId) {
        throw new Error('POSTMAN_COLLECTION_ID не установлен. Создайте postman-config.json или установите переменную окружения');
      }

      const collection = await fetchCollectionFromPostman(config.postmanApiKey, config.collectionId);
      collectionPath = saveCollectionForConversion(collection);
      
      // Сохраняем резервную копию
      const backupDir = path.join(__dirname, '..', '.postman-backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      fs.writeFileSync(
        path.join(backupDir, `collection-${timestamp}.json`),
        JSON.stringify(collection, null, 2)
      );
    } else {
      // Используем локальный файл
      collectionPath = localFile || '/Users/insty/Downloads/Kinescope API.postman_collection.json';
      
      if (!fs.existsSync(collectionPath)) {
        throw new Error(`Файл не найден: ${collectionPath}`);
      }
      
      console.log(`📁 Использую локальный файл: ${collectionPath}\n`);
    }

    // Запускаем конвертацию
    console.log('🔄 Начинаю конвертацию в OpenAPI...\n');
    
    // Модифицируем глобальную переменную в конвертирующем скрипте
    // Для этого нужно переписать скрипт как модуль или использовать другой подход
    // Временно используем прямое выполнение
    
    // Загружаем коллекцию
    const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf-8'));
    
    // Вызываем функцию конвертации (нужно будет экспортировать из postman-to-openapi.js)
    // Пока используем временное решение - перезаписываем путь в скрипте
    
    console.log('⚠️  Для полной автоматизации нужно обновить postman-to-openapi.js как модуль');
    console.log(`   Используйте: node scripts/postman-to-openapi.js`);
    console.log(`   Или укажите файл: node scripts/postman-to-openapi.js ${collectionPath}`);

  } catch (error) {
    console.error(`\n❌ Ошибка: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, fetchCollectionFromPostman };

