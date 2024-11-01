const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron/main');
const path = require('node:path');
const { connectToDatabase, executeQuery } = require('./src/db/db.js');

let filiais = [];
let sql;

async function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    }
  });
  win.loadFile('./src/pages/loading.html');

  try {
    sql = await connectToDatabase();
    filiais = await executeQuery('SELECT Ordem, Codigo, Nome FROM Filiais WHERE Ordem > 0');
    fornecedores = await executeQuery('SELECT Ordem, Codigo, Nome FROM Cli_For WHERE Inativo = 0 AND Ordem > 0')
    contas_bancarias = await executeQuery('SELECT Ordem, Codigo, Nome FROM Contas_Bancarias')
    cartoes = await executeQuery('SELECT Ordem, Codigo, Nome FROM Administradoras_Cartao')

    await win.loadFile('index.html');
    win.webContents.send('filiais', filiais);
    win.webContents.send('fornecedores', fornecedores);
    win.webContents.send('contas_bancarias', contas_bancarias);
    win.webContents.send('cartoes', cartoes);

  } catch (err) {
    console.error('Erro:', err);
  }
  app.on('window-all-closed', () => {
    if (sql) {
      sql.close();
    }
    if (process.platform !== 'darwin') app.quit();
  });
}


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
  // Executa as queries em paralelo para melhor desempenho
  try {
    const insertPromises = taxas.map((taxa, i) => {
      return executeQuery(`
        INSERT INTO Administradoras_cartao_filial_conta(
          Ordem_Administradoras_Cartao, Ordem_Filial, Taxa_Adm, Ordem_Fornecedor,
          Ordem_Conta_Bancaria, Dias_Pagar, Demais_Parcelas, Parcela_Minima, Parcela_Maxima
        ) VALUES(
          ${cartao}, ${filial}, ${taxa}, ${fornecedor}, ${contaBancaria}, ${diasAPagar}, ${demaisParcelas}, ${i + 1}, ${i + 1}
        )`
      );
    });

    // Aguarda todas as inserções
    await Promise.all(insertPromises);
    console.log("Dados inseridos com sucesso");
  } catch (err) {
    console.error("Erro ao inserir dados:", err);
  }
});