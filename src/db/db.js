const fs = require('fs');
const path = require('path');
const sql = require('mssql');

function readDBConfig() {
  const fileURL = path.join('C:/Shop9/ARQID9.txt')
  try {
    const data = fs.readFileSync(fileURL, 'utf8')
    const config = {
      user: '',
      password: '',
      server: '',
      database: 'S9_REAL',
      port: '',
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    };
    let serverInfo = data.match(/<Servidor>(.*?)<\/Servidor>/);
    let userInfo = data.match(/<Usuario>(.*?)<\/Usuario>/);
    let passwordInfo = data.match(/<Senha>(.*?)<\/Senha>/);
    if (serverInfo) {
      const [ip, port] = serverInfo[1].split(',')
      config.server = ip;
      if (port) config.port = parseInt(port, 10);
    }
    if (userInfo) {
      config.user = userInfo[1]
    }
    if (passwordInfo) {
      config.password = passwordInfo[1]
    }
    return config
  } catch (err) {
    console.error('erro ao ler o arquivo de configuração: ', err)
  }
}

const config = readDBConfig()

async function connectToDatabase() {
  try {
    const pool = await sql.connect(config);
    console.log('Conectado ao banco de dados SQL Server.');
    return pool;
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    throw err;
  }
}
async function executeQuery(query) {
  const pool = await connectToDatabase();
  const result = await pool.request().query(query);
  return result.recordset;
}

module.exports = {
  connectToDatabase,
  executeQuery,
};