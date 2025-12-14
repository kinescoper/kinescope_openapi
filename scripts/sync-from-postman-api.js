/**
 * Автоматическая синхронизация OpenAPI документации из Postman API
 * 
 * Этот скрипт:
 * 1. Получает коллекцию из Postman API
 * 2. Конвертирует её в OpenAPI формат
 * 3. Сохраняет обновленную документацию
 * 4. Может быть запущен вручную или через CI/CD
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Загружаем конфигурацию
const configPath = path.join(__dirname, '..', 'postman-config.json');
let config = {};

if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
} else {
  // Используем переменные окружения как fallback
  config = {
    postmanApiKey: process.env.POSTMAN_API_KEY,
    collectionId: process.env.POSTMAN_COLLECTION_ID,
    collectionUid: process.env.POSTMAN_COLLECTION_UID,
    workspaceId: process.env.POSTMAN_WORKSPACE_ID
  };
}

// Валидация конфигурации
if (!config.postmanApiKey) {
  console.error('❌ Ошибка: POSTMAN_API_KEY не установлен');
  console.error('   Установите через переменную окружения или postman-config.json');
  process.exit(1);
}

/**
 * Получает коллекцию из Postman API
 */
async function fetchCollectionFromPostman() {
  return new Promise((resolve, reject) => {
    const collectionId = config.collectionId || config.collectionUid;
    
    if (!collectionId) {
      reject(new Error('Collection ID не указан. Установите POSTMAN_COLLECTION_ID или POSTMAN_COLLECTION_UID'));
      return;
    }

    const options = {
      hostname: 'api.getpostman.com',
      path: `/collections/${collectionId}`,
      method: 'GET',
      headers: {
        'X-Api-Key': config.postmanApiKey,
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
              console.log(`✅ Коллекция "${response.collection.info.name}" успешно загружена`);
              resolve(response.collection);
            } else {
              reject(new Error('Неверный формат ответа от Postman API'));
            }
          } catch (e) {
            reject(new Error(`Ошибка парсинга ответа: ${e.message}`));
          }
        } else {
          reject(new Error(`Ошибка API: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Сохраняет коллекцию локально для резервной копии
 */
function saveCollectionBackup(collection) {
  const backupDir = path.join(__dirname, '..', '.postman-backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `collection-${timestamp}.json`);
  
  fs.writeFileSync(backupPath, JSON.stringify(collection, null, 2));
  console.log(`💾 Резервная копия сохранена: ${backupPath}`);
  
  // Удаляем старые резервные копии (оставляем последние 10)
  const backups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('collection-'))
    .sort()
    .reverse();
  
  if (backups.length > 10) {
    backups.slice(10).forEach(file => {
      fs.unlinkSync(path.join(backupDir, file));
    });
  }
}

/**
 * Основная функция синхронизации
 */
async function syncFromPostman() {
  try {
    console.log('🔄 Начинаю синхронизацию из Postman API...\n');

    // Получаем коллекцию из Postman API
    const collection = await fetchCollectionFromPostman();

    // Сохраняем резервную копию
    saveCollectionBackup(collection);

    // Сохраняем коллекцию во временный файл
    const tempCollectionPath = path.join(__dirname, '..', '.postman-collection-temp.json');
    fs.writeFileSync(tempCollectionPath, JSON.stringify(collection, null, 2));

    console.log(`\n📝 Коллекция сохранена во временный файл: ${tempCollectionPath}`);
    console.log(`\n✅ Следующий шаг: запустите скрипт конвертации:`);
    console.log(`   node scripts/postman-to-openapi.js --from-api\n`);

    return collection;
  } catch (error) {
    console.error(`\n❌ Ошибка синхронизации: ${error.message}`);
    process.exit(1);
  }
}

// Запуск если скрипт вызван напрямую
if (require.main === module) {
  syncFromPostman();
}

module.exports = { syncFromPostman, fetchCollectionFromPostman };

