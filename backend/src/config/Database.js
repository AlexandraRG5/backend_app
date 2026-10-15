const mysql = require('mysql2/promise');

/**
 * Acceso único a MySQL (pool de conexiones).
 * Los Modelos usan esta clase; nada más en la app habla directamente con la BD.
 */
class Database {
  static #pool = null;

  static getPool() {
    if (!Database.#pool) {
      Database.#pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'roles_app',
        charset: 'utf8mb4',
        decimalNumbers: true,
        waitForConnections: true,
        connectionLimit: 10,
      });
    }
    return Database.#pool;
  }

  /** SELECT: devuelve el arreglo de filas. */
  static async query(sql, params = []) {
    const [rows] = await Database.getPool().query(sql, params);
    return rows;
  }

  /** INSERT / UPDATE / DELETE: devuelve el resultado (insertId, affectedRows...). */
  static async run(sql, params = []) {
    const [result] = await Database.getPool().query(sql, params);
    return result;
  }

  static async ping() {
    await Database.query('SELECT 1');
  }
}

module.exports = Database;
