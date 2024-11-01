const taxaxContainer = document.getElementById('taxasContainer')
const toggleButton = document.getElementById('toggle-dark-mode');
const icon = toggleButton.querySelector('i');
let taxaCount = 1;

ipcRenderer.on('filiais', (filiais) => {
  const select = document.getElementById('filialSelect');
  filiais.forEach(filial => {
    const option = document.createElement('option');
    option.value = filial.Ordem;
    option.textContent = filial.Nome;
    select.appendChild(option);
  });
});
ipcRenderer.on('cartoes', (cartoes) => {
  const select = document.getElementById('cartoesSelect')
  cartoes.forEach(cartao => {
    const option = document.createElement('option')
    option.value = cartao.Ordem
    option.textContent = cartao.Nome
    select.appendChild(option)
  })
})
ipcRenderer.on('fornecedores', (fornecedores) => {
  const select = document.getElementById('fornecedorSelect')
  fornecedores.forEach(fornecedor => {
    const option = document.createElement('option')
    option.value = fornecedor.Ordem
    option.textContent = fornecedor.Nome
    select.appendChild(option)
  })
})
ipcRenderer.on('contas_bancarias', (contas_bancaria) => {
  const select = document.getElementById('contaBancariaSelect')
  contas_bancaria.forEach(conta_bancaria => {
    const option = document.createElement('option')
    option.value = conta_bancaria.Ordem
    option.textContent = conta_bancaria.Nome
    select.appendChild(option)
  })
})
function capturarDados() {
  const filial = document.getElementById('filialSelect').value;
  const cartao = document.getElementById('cartoesSelect').value;
  const fornecedor = document.getElementById('fornecedorSelect').value;
  const contaBancaria = document.getElementById('contaBancariaSelect').value;
  const diasAPagar = document.getElementById('diasAPagar').value;
  const demaisParcelas = document.getElementById('demaisParcelas').value;
  const taxas = [];
  for (let i = 1; i <= taxaCount; i++) {
    const taxaInput = document.getElementById(`taxa${i}`);
    if (taxaInput && taxaInput.value) {
      taxas.push(Number(taxaInput.value));
    }
  }
  ipcRenderer.send('salvar-dados', {
    filial,
    cartao,
    fornecedor,
    contaBancaria,
    diasAPagar,
    demaisParcelas,
    taxas
  })
}
function limparCampos() {
  document.getElementById('filialSelect').selectedIndex = 0;
  document.getElementById('cartoesSelect').selectedIndex = 0;
  document.getElementById('fornecedorSelect').selectedIndex = 0;
  document.getElementById('contaBancariaSelect').selectedIndex = 0;
  document.getElementById('diasAPagar').value = '';
  document.getElementById('demaisParcelas').value = '';
  for (let i = 1; i <= 12; i++) {
    const taxaInput = document.getElementById(`taxa${i}`);
    if (taxaInput) {
      taxaInput.value = '';
    }
  }
}

document.querySelector('button[type="submit"]').addEventListener('click', (event) => {
  event.preventDefault();
  capturarDados();
});
document.querySelector('button[type="reset"]').addEventListener('click', (event) => {
  event.preventDefault()
  limparCampos()
})
document.getElementById('toggle-dark-mode').addEventListener('click', async () => {
  const isDarkMode = await window.darkMode.toggle()
  if (isDarkMode) {
    icon.classList.replace('ph-moon-stars', 'ph-sun');
  } else {
    icon.classList.replace('ph-sun', 'ph-moon-stars');
  }
})

document.getElementById('addTaxa').addEventListener('click', () => {
  taxaCount++;
  const newInput = document.createElement('input');
  newInput.type = 'number';
  newInput.id = `taxa${taxaCount}`;
  newInput.placeholder = `${taxaCount}º Taxa`;
  taxasContainer.appendChild(newInput);
});
document.getElementById('removeTaxa').addEventListener('click', () => {
  if (taxaCount > 1) {
    const lastInput = document.getElementById(`taxa${taxaCount}`);
    taxasContainer.removeChild(lastInput);
    taxaCount--;
  }
});