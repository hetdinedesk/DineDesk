// Clear the export cache
const { exportCache } = require('../src/routes/clients.js');

if (exportCache) {
  exportCache.delete('cmnd5kehd0000vogh3tzzz2ws');
  console.log('✅ Cleared export cache for client cmnd5kehd0000vogh3tzzz2ws');
} else {
  console.log('❌ Export cache not found');
}
