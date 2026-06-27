const fs = require('fs');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../database/test_office_assets.db');

module.exports = async () => {
  try {
    if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);
  } catch (e) {}
};
