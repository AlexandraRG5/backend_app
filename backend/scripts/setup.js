/**
 * Prepara la base de datos: la crea (si no existe), crea las tablas
 * y carga datos de ejemplo SOLO si las tablas están vacías.
 *
 * Uso:  npm run setup
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { users, products } = require('./seedData');

async function main() {
  const dbName = process.env.DB_NAME || 'roles_app';

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    charset: 'utf8mb4',
    multipleStatements: true,
  });

  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await conn.query(`USE \`${dbName}\``);

    const schema = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf8');
    await conn.query(schema);
    console.log('Tablas listas.');

    const [[{ total: userCount }]] = await conn.query('SELECT COUNT(*) AS total FROM users');
    if (userCount === 0) {
      // Se insertan en orden para que los ids sean 1..N (importa para los roles).
      for (const u of users) {
        await conn.query(
          `INSERT INTO users (username, email, password_hash, firstname, lastname, phone)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [u.username, u.email, bcrypt.hashSync(u.password, 10), u.firstname, u.lastname, u.phone]
        );
      }
      console.log(`Usuarios de ejemplo insertados: ${users.length}`);
    } else {
      console.log('La tabla users ya tiene datos: no se insertó nada.');
    }

    const [[{ total: productCount }]] = await conn.query('SELECT COUNT(*) AS total FROM products');
    if (productCount === 0) {
      for (const p of products) {
        const [cat] = await conn.query(
          'INSERT INTO categories (name) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
          [p.category]
        );
        await conn.query(
          `INSERT INTO products (title, price, description, image, category_id, rating, rating_count)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [p.title, p.price, p.description, p.image, cat.insertId, p.rating, p.count]
        );
      }
      console.log(`Productos de ejemplo insertados: ${products.length}`);
    } else {
      console.log('La tabla products ya tiene datos: no se insertó nada.');
    }

    console.log(`\nListo. Base de datos "${dbName}" preparada.`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Error en setup:', err.message);
  process.exit(1);
});
