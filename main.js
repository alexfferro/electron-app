const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron/main');
const path = require('node:path');
const { connectToDatabase, executeQuery, readDBConfig } = require('./src/db/db.js');

let selectedConfig;
let sql;


async function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    }
  });
  const connections = readDBConfig()

  if (Array.isArray(connections) && connections.length > 1) {
    await win.loadFile('./src/pages/Loading/loading.html');
    win.webContents.send('connections', connections)
  } else if (connections.length === 1) {
    selectedConfig = connections[0]
    await initializeDatabase(win, selectedConfig)
  } else {
    console.error('Nenhuma conexão encontrada')
  }

  app.on('window-all-closed', () => {
    if (sql) {
      sql.close();
    }
    if (process.platform !== 'darwin') app.quit();
  });
}

async function initializeDatabase(win, config) {
  try {
    sql = await connectToDatabase(config)
    const filiais = await executeQuery('SELECT Ordem, Codigo, Nome FROM Filiais WHERE Ordem > 0', config);
    const fornecedores = await executeQuery('SELECT Ordem, Codigo, Nome FROM Cli_For WHERE Inativo = 0 AND Ordem > 0 AND Codigo > 0', config)
    const contas_bancarias = await executeQuery('SELECT Ordem, Codigo, Nome FROM Contas_Bancarias', config)
    const cartoes = await executeQuery('SELECT Ordem, Codigo, Nome FROM Administradoras_Cartao', config)

    await win.loadFile('./src/pages/Home/home.html')
    win.webContents.send('filiais', filiais);
    win.webContents.send('fornecedores', fornecedores);
    win.webContents.send('contas_bancarias', contas_bancarias);
    win.webContents.send('cartoes', cartoes);
  } catch (err) {
    console.error('Erro ao conectar ao banco: ', err)
  }
}

ipcMain.on('select-connection', async (event, config) => {
  selectedConfig = config
  const win = BrowserWindow.getFocusedWindow()
  await initializeDatabase(win, selectedConfig)
});


ipcMain.handle('dark-mode:toggle', () => {
  if (nativeTheme.shouldUseDarkColors) {
    nativeTheme.themeSource = 'light';
  } else {
    nativeTheme.themeSource = 'dark';
  }
  return nativeTheme.shouldUseDarkColors;
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.on('salvar-dados', async (event, dados) => {
  console.log('Dados recebidos: ', dados);

  const { filial, cartao, fornecedor, contaBancaria, diasAPagar, demaisParcelas, taxas } = dados;

  if (!filial || !cartao || !fornecedor || !contaBancaria || !diasAPagar || !demaisParcelas || !taxas || !Array.isArray(taxas)) {
    console.error("Dados incompletos ou inválidos recebidos");
    return;
  }

  const insertOrUpdateTaxas = async (cartao, filial, taxas, fornecedor, contaBancaria, diasAPagar, demaisParcelas) => {
    const insertOrUpdatePromises = taxas.map(async (taxa, i) => {
      const parcela = i + 1;

      // Query para verificar se o registro já existe
      const checkQuery = `
        SELECT COUNT(*) AS count FROM Administradoras_cartao_filial_conta
        WHERE Ordem_Administradoras_Cartao = @cartao 
          AND Ordem_Filial = @filial
          AND Parcela_Minima = @parcela
          AND Parcela_Maxima = @parcela
      `;

      // Verifica se o registro já existe
      const result = await executeQuery(checkQuery, selectedConfig, { cartao, filial, parcela });
      const exists = result[0]?.count > 0;

      try {
        if (exists) {
          // Se já existir, atualiza o campo Taxa_Adm
          return await executeQuery(`
            UPDATE Administradoras_cartao_filial_conta
            SET Taxa_Adm = @taxa, Ordem_Fornecedor = @fornecedor, Ordem_Conta_Bancaria = @contaBancaria, Dias_Pagar = @diasAPagar, Demais_Parcelas = @demaisParcelas
            WHERE Ordem_Administradoras_Cartao = @cartao 
              AND Ordem_Filial = @filial
              AND Parcela_Minima = @parcela
              AND Parcela_Maxima = @parcela
          `, selectedConfig, {
            taxa,
            fornecedor,
            contaBancaria,
            diasAPagar,
            demaisParcelas,
            cartao,
            filial,
            parcela
          });
        } else {
          // Caso contrário, insere um novo registro
          return await executeQuery(`
            INSERT INTO Administradoras_cartao_filial_conta(
              Ordem_Administradoras_Cartao, Ordem_Filial, Taxa_Adm, Ordem_Fornecedor,
              Ordem_Conta_Bancaria, Dias_Pagar, Demais_Parcelas, Parcela_Minima, Parcela_Maxima
            ) VALUES(@cartao, @filial, @taxa, @fornecedor, @contaBancaria, @diasAPagar, @demaisParcelas, @parcela, @parcela)
          `, selectedConfig, {
            cartao,
            filial,
            taxa,
            fornecedor,
            contaBancaria,
            diasAPagar,
            demaisParcelas,
            parcela
          });
        }
      } catch (error) {
        console.error(`Erro ao processar taxa ${parcela}:`, error);
      }
    });

    // Aguarda todas as operações de inserção/atualização
    await Promise.all(insertOrUpdatePromises);
  };

  try {
    // Chama a função para processar as taxas
    await insertOrUpdateTaxas(cartao, filial, taxas, fornecedor, contaBancaria, diasAPagar, demaisParcelas);
    console.log("Dados processados com sucesso.");
  } catch (err) {
    console.error("Erro ao inserir dados:", err);
  }
});
