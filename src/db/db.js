const fs = require('fs');
const path = require('path');
const sql = require('mssql');

function readDBConfig() {
  const fileURL = path.join('C:/Shop9/ARQID9.txt')
  const connections = []

  try {
    const data = fs.readFileSync(fileURL, 'utf8')
    const connectionPattern = /<CONEXAO>([\s\S]*?)<\/CONEXAO>/g
    let match
    while ((match = connectionPattern.exec(data)) !== null) {
      const connectionData = match[1];

      const config = {
        user: connectionData.match(/<Usuario>(.*?)<\/Usuario>/)?.[1],
        password: connectionData.match(/<Senha>(.*?)<\/Senha>/)?.[1],
        server: connectionData.match(/<Servidor>(.*?)<\/Servidor>/)?.[1].split(',')[0],
        port: parseInt(connectionData.match(/<Servidor>(.*?)<\/Servidor>/)?.[1].split(',')[1] || "2019", 10),
        database: 'S9_REAL',
        options: {
          encrypt: true,
          trustServerCertificate: true,
        },
        descricao: connectionData.match(/<Descricao>(.*?)<\/Descricao>/)?.[1],
      };
      connections.push(config)
    }
    return connections
  } catch (err) {
    console.error('erro ao ler o arquivo de configuração: ', err)
  }
}


async function connectToDatabase(config) {
  try {
    const pool = await sql.connect(config);
    return pool;
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    throw err;
  }
}

async function executeQuery(query, config, params) {
  const pool = await connectToDatabase(config);
  const request = pool.request();
  if (params) {
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
  }
  const result = await request.query(query);
  return result.recordset;
}

module.exports = {
  connectToDatabase,
  executeQuery,
  readDBConfig
};
