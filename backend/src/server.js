require('dotenv').config();

const os = require('os');
const app = require('./app');
const Database = require('./config/Database');

const PORT = Number(process.env.PORT || 3000);

function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i && i.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
}

async function main() {
  if (!process.env.JWT_SECRET) {
    console.error('Falta JWT_SECRET en el archivo .env (copia .env.example como .env).');
    process.exit(1);
  }

  try {
    await Database.ping();
    console.log('Conexión a MySQL exitosa');
  } catch (err) {
    console.error('ERROR MYSQL COMPLETO:');
    console.error(err);
    process.exit(1);
  }

  // 0.0.0.0 para que el celular pueda acceder al servidor
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API lista en http://localhost:${PORT}/api`);

    lanAddresses().forEach((ip) => {
      console.log(
        `Desde tu celular (misma red Wi-Fi): http://${ip}:${PORT}/api`
      );
    });
  });
}

main();
