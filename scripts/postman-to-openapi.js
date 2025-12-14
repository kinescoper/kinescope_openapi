/**
 * Конвертер Postman коллекции в OpenAPI 3.0 формат
 * Преобразует Postman коллекцию Kinescope API в OpenAPI спецификацию
 * для использования ИИ и как shared documentation
 */

const fs = require('fs');
const path = require('path');

// Путь к Postman коллекции (можно переопределить через аргументы или переменную окружения)
let postmanCollectionPath = process.env.POSTMAN_COLLECTION_PATH 
  || process.argv.find(arg => arg.endsWith('.json') && !arg.startsWith('--'))
  || '/Users/insty/Downloads/Kinescope API.postman_collection.json';

// Проверяем временный файл из API синхронизации
const tempCollectionPath = path.join(__dirname, '..', '.postman-collection-temp.json');
if (fs.existsSync(tempCollectionPath) && !process.env.POSTMAN_COLLECTION_PATH) {
  postmanCollectionPath = tempCollectionPath;
  console.log('📥 Использую коллекцию из Postman API синхронизации\n');
}

const outputDir = path.join(__dirname, '..');

// Загружаем Postman коллекцию
if (!fs.existsSync(postmanCollectionPath)) {
  console.error(`❌ Файл коллекции не найден: ${postmanCollectionPath}`);
  console.error('   Используйте: node scripts/postman-to-openapi.js <путь-к-файлу>');
  console.error('   Или установите POSTMAN_COLLECTION_PATH');
  process.exit(1);
}

const collection = JSON.parse(fs.readFileSync(postmanCollectionPath, 'utf-8'));

/**
 * Извлекает схему JSON из примера body
 */
function inferSchemaFromExample(data, depth = 0) {
  if (depth > 10) return {}; // Защита от бесконечной рекурсии
  
  if (data === null || data === undefined) {
    return { type: 'string', nullable: true };
  }
  
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return { type: 'array', items: { type: 'object' } };
    }
    return {
      type: 'array',
      items: inferSchemaFromExample(data[0], depth + 1)
    };
  }
  
  if (typeof data === 'object') {
    const properties = {};
    const required = [];
    
    for (const [key, value] of Object.entries(data)) {
      properties[key] = inferSchemaFromExample(value, depth + 1);
      if (value !== null && value !== undefined && value !== '') {
        required.push(key);
      }
    }
    
    return {
      type: 'object',
      properties,
      ...(required.length > 0 && { required })
    };
  }
  
  if (typeof data === 'number') {
    return Number.isInteger(data) ? { type: 'integer', example: data } : { type: 'number', example: data };
  }
  
  if (typeof data === 'boolean') {
    return { type: 'boolean', example: data };
  }
  
  return { type: 'string', example: data };
}

/**
 * Конвертирует Postman path в OpenAPI path
 */
function convertPath(postmanPath) {
  return postmanPath
    .map(segment => segment.startsWith(':') ? `{${segment.substring(1)}}` : segment)
    .join('/');
}

/**
 * Извлекает path параметры из URL
 */
function extractPathParams(url) {
  const params = [];
  if (url.variable && Array.isArray(url.variable)) {
    for (const variable of url.variable) {
      params.push({
        name: variable.key,
        in: 'path',
        required: true,
        description: `ID параметр: ${variable.key}`,
        schema: { type: 'string' },
        example: variable.value
      });
    }
  }
  return params;
}

/**
 * Извлекает query параметры
 */
function extractQueryParams(url) {
  const params = [];
  if (url.query && Array.isArray(url.query)) {
    for (const query of url.query) {
      if (!query.disabled && query.key) {
        params.push({
          name: query.key,
          in: 'query',
          required: false,
          description: query.description || '',
          schema: { type: 'string' },
          example: query.value || undefined
        });
      }
    }
  }
  return params;
}

/**
 * Извлекает request body схему
 */
function extractRequestBody(request) {
  if (!request.body) return null;
  
  const body = request.body;
  
  if (body.mode === 'raw' && body.raw) {
    try {
      const jsonData = JSON.parse(body.raw);
      return {
        required: true,
        content: {
          'application/json': {
            schema: inferSchemaFromExample(jsonData),
            example: jsonData
          }
        }
      };
    } catch (e) {
      // Если не JSON, возвращаем как текст
      return {
        required: true,
        content: {
          'text/plain': {
            schema: { type: 'string' },
            example: body.raw
          }
        }
      };
    }
  }
  
  if (body.mode === 'formdata' && body.formdata) {
    const properties = {};
    const required = [];
    
    for (const field of body.formdata) {
      if (!field.disabled) {
        if (field.type === 'file') {
          properties[field.key] = {
            type: 'string',
            format: 'binary',
            description: 'Файл для загрузки'
          };
        } else {
          properties[field.key] = {
            type: 'string',
            example: field.value || undefined
          };
        }
        if (field.value !== undefined && field.value !== '') {
          required.push(field.key);
        }
      }
    }
    
    return {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            properties,
            ...(required.length > 0 && { required })
          }
        }
      }
    };
  }
  
  if (body.mode === 'urlencoded' && body.urlencoded) {
    const properties = {};
    const required = [];
    
    for (const field of body.urlencoded) {
      if (!field.disabled) {
        properties[field.key] = {
          type: 'string',
          example: field.value || undefined
        };
        if (field.value !== undefined && field.value !== '') {
          required.push(field.key);
        }
      }
    }
    
    return {
      required: true,
      content: {
        'application/x-www-form-urlencoded': {
          schema: {
            type: 'object',
            properties,
            ...(required.length > 0 && { required })
          }
        }
      }
    };
  }
  
  return null;
}

/**
 * Извлекает примеры ответов из Postman responses
 */
function extractResponses(item) {
  const responses = {
    '200': {
      description: 'Успешный ответ',
      content: {
        'application/json': {
          schema: { type: 'object' }
        }
      }
    }
  };
  
  if (item.response && Array.isArray(item.response)) {
    for (const response of item.response) {
      if (response.code && response.body) {
        const statusCode = response.code.toString();
        let schema = { type: 'object' };
        let example = null;
        
        try {
          if (response.body) {
            const bodyData = typeof response.body === 'string' 
              ? JSON.parse(response.body) 
              : response.body;
            schema = inferSchemaFromExample(bodyData);
            example = bodyData;
          }
        } catch (e) {
          // Если не удалось распарсить, оставляем базовую схему
        }
        
        responses[statusCode] = {
          description: response.name || `HTTP ${statusCode}`,
          content: {
            'application/json': {
              schema,
              ...(example && { example })
            }
          }
        };
      }
    }
  }
  
  // Добавляем стандартные ошибки на основе документации
  if (!responses['400']) {
    responses['400'] = {
      description: 'Bad request parameters',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
                  message: { type: 'string' },
                  detail: { type: 'string' }
                }
              }
            }
          },
          example: {
            error: {
              code: 400301,
              message: 'invalid uuid format',
              detail: 'see https://en.wikipedia.org/wiki/Universally_unique_identifier'
            }
          }
        }
      }
    };
  }
  
  if (!responses['401']) {
    responses['401'] = {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    };
  }
  
  if (!responses['403']) {
    responses['403'] = {
      description: 'Access denied',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    };
  }
  
  if (!responses['404']) {
    responses['404'] = {
      description: 'Object not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'integer' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    };
  }
  
  return responses;
}

/**
 * Рекурсивно извлекает все endpoints из Postman коллекции
 */
function extractEndpoints(items, basePath = '', endpoints = []) {
  for (const item of items) {
    if (item.item) {
      // Это папка
      const newPath = basePath ? `${basePath}/${item.name}` : item.name;
      extractEndpoints(item.item, newPath, endpoints);
    } else if (item.request) {
      // Это endpoint
      const req = item.request;
      const method = (req.method || 'GET').toLowerCase();
      const url = req.url;
      
      if (!url || !url.path) {
        continue;
      }
      
      const pathStr = Array.isArray(url.path) ? url.path.join('/') : url.path;
      const openApiPath = '/' + convertPath(url.path);
      
      const pathParams = extractPathParams(url);
      const queryParams = extractQueryParams(url);
      const requestBody = extractRequestBody(req);
      const responses = extractResponses(item);
      
      endpoints.push({
        path: openApiPath,
        method,
        operation: {
          tags: basePath ? basePath.split('/').filter(Boolean) : [],
          summary: item.name || `${method.toUpperCase()} ${openApiPath}`,
          description: item.description || item.name || '',
          operationId: generateOperationId(method, openApiPath, item.name),
          parameters: [...pathParams, ...queryParams],
          ...(requestBody && { requestBody }),
          responses,
          security: [{ bearerAuth: [] }]
        }
      });
    }
  }
  return endpoints;
}

/**
 * Генерирует уникальный operationId
 */
function generateOperationId(method, path, name) {
  // Используем имя из Postman, если оно есть
  if (name) {
    const operationId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return operationId || `${method}_${path.replace(/[^a-z0-9]/gi, '_')}`;
  }
  
  // Иначе генерируем из path и method
  const pathParts = path
    .split('/')
    .filter(p => p && !p.startsWith('{'))
    .map(p => p.replace(/[^a-z0-9]/gi, '_'));
  
  return `${method}_${pathParts.join('_')}`;
}

/**
 * Группирует endpoints по path
 */
function groupEndpointsByPath(endpoints) {
  const paths = {};
  
  for (const endpoint of endpoints) {
    if (!paths[endpoint.path]) {
      paths[endpoint.path] = {};
    }
    paths[endpoint.path][endpoint.method] = endpoint.operation;
  }
  
  return paths;
}

/**
 * Извлекает теги из структуры коллекции
 */
function extractTags(items, baseTag = '', tags = []) {
  for (const item of items) {
    if (item.item) {
      const tagName = baseTag ? `${baseTag}/${item.name}` : item.name;
      tags.push({
        name: tagName,
        description: item.description || `API endpoints для ${item.name}`
      });
      extractTags(item.item, tagName, tags);
    }
  }
  return tags;
}

/**
 * Основная функция конвертации
 */
function convertToOpenAPI() {
  console.log('🔄 Начинаю конвертацию Postman коллекции в OpenAPI...\n');
  
  // Извлекаем информацию о коллекции
  const info = collection.info;
  
  // Извлекаем описание и парсим markdown
  const description = info.description || '';
  
  // Извлекаем все endpoints
  const allEndpoints = extractEndpoints(collection.item);
  console.log(`✅ Найдено ${allEndpoints.length} endpoints`);
  
  // Группируем по path
  const paths = groupEndpointsByPath(allEndpoints);
  console.log(`✅ Создано ${Object.keys(paths).length} уникальных paths`);
  
  // Извлекаем теги
  const tags = extractTags(collection.item);
  console.log(`✅ Создано ${tags.length} тегов`);
  
  // Создаем OpenAPI спецификацию
  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: info.name || 'Kinescope API',
      description: description,
      version: '1.0.0',
      contact: {
        name: 'Kinescope API Support',
        url: 'https://kinescope.io'
      }
    },
    servers: [
      {
        url: 'https://api.kinescope.io',
        description: 'Production server'
      },
      {
        url: 'https://api-staging.kinescope.io',
        description: 'Staging server'
      }
    ],
    tags: tags,
    paths: paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Bearer Token authentication. Получите Access Key в dashboard.'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: {
                  type: 'integer',
                  description: 'Код ошибки'
                },
                message: {
                  type: 'string',
                  description: 'Сообщение об ошибке'
                },
                detail: {
                  type: 'string',
                  description: 'Детали ошибки'
                }
              }
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: {
                  code: 400301,
                  message: 'invalid uuid format',
                  detail: 'see https://en.wikipedia.org/wiki/Universally_unique_identifier'
                }
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        Forbidden: {
          description: 'Access denied',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Object not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        PaymentRequired: {
          description: 'Payment required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  };
  
  return openApiSpec;
}

// Выполняем конвертацию
const openApiSpec = convertToOpenAPI();

// Сохраняем в JSON
const jsonOutputPath = path.join(outputDir, 'kinescope-api-openapi.json');
fs.writeFileSync(jsonOutputPath, JSON.stringify(openApiSpec, null, 2));
console.log(`\n✅ OpenAPI JSON сохранен: ${jsonOutputPath}`);

// Пытаемся сохранить в YAML (если установлен js-yaml)
let yamlOutputPath = null;
try {
  const yaml = require('js-yaml');
  yamlOutputPath = path.join(outputDir, 'kinescope-api-openapi.yaml');
  fs.writeFileSync(yamlOutputPath, yaml.dump(openApiSpec, {
    indent: 2,
    lineWidth: 120,
    noRefs: false
  }));
  console.log(`✅ OpenAPI YAML сохранен: ${yamlOutputPath}`);
} catch (e) {
  console.log(`\n⚠️  Для сохранения YAML установите: npm install js-yaml`);
  console.log(`   JSON файл сохранен и может быть конвертирован в YAML позже`);
}

console.log(`\n📊 Статистика:`);
console.log(`   - Endpoints: ${Object.values(openApiSpec.paths).reduce((sum, path) => sum + Object.keys(path).length, 0)}`);
console.log(`   - Paths: ${Object.keys(openApiSpec.paths).length}`);
console.log(`   - Tags: ${openApiSpec.tags.length}`);
console.log(`\n✨ Конвертация завершена!`);

