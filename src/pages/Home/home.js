const taxasContainer = document.getElementById('taxasContainer')
const toggleButton = document.getElementById('toggle-dark-mode');
const icon = toggleButton.querySelector('i');
const modal = document.getElementById('modal');
const closeButton = document.querySelector('.close-button');
const search = document.getElementById('search');

let taxaCount = 1;
const Filiais = []
const Cartoes = []
const Contas_Bancarias = []
const Fornecedores = []
console.log(Fornecedores)

ipcRenderer.on('filiais', (filiais) => {
  filiais.forEach(filial => {
    Filiais.push(filial)
  });
});
ipcRenderer.on('cartoes', (cartoes) => {
  cartoes.forEach(cartao => {
    Cartoes.push(cartao)
  })
})
ipcRenderer.on('contas_bancarias', (contas_bancaria) => {
  contas_bancaria.forEach(conta_bancaria => {
    Contas_Bancarias.push(conta_bancaria)
  })
})
ipcRenderer.on('fornecedores', (fornecedores) => {
  fornecedores.forEach(fornecedor => {
    Fornecedores.push(fornecedor)
  })
})
function capturarDados() {
  const filial = document.getElementById('filialInput').dataset.ordem;
  const cartao = document.getElementById('CartaoInput').dataset.ordem;
  const fornecedor = document.getElementById('fornecedorInput').dataset.ordem;
  const contaBancaria = document.getElementById('ContaBancariaInput').dataset.ordem;
  const diasAPagar = document.getElementById('diasAPagar').value;
  const demaisParcelas = document.getElementById('demaisParcelas').value;
  // Validações básicas
  if (!filial || !cartao || !fornecedor || !contaBancaria) {
    showToast('Todos os campos de seleção são obrigatórios.', false);
    return;
  }
  if (diasAPagar === '' || demaisParcelas === '') {
    showToast('Os campos "Dias a Pagar" e "Demais Parcelas" são obrigatórios.', false);
    return;
  }
  if (isNaN(diasAPagar) || isNaN(demaisParcelas)) {
    showToast('Insira valores numéricos válidos para "Dias a Pagar" e "Demais Parcelas".', false);
    return;
  }

  const taxas = [];
  for (let i = 1; i <= taxaCount; i++) {
    const taxaInput = document.getElementById(`taxa${i}`);
    if (taxaInput && taxaInput.value) {
      const taxaValue = parseFloat(taxaInput.value);
      if (isNaN(taxaValue) || taxaValue <= 0) {
        showToast(`Taxa ${i} deve ser um número positivo.`, false);
        return;
      }
      taxas.push(taxaValue);
    }
  }

  if (taxas.length === 0) {
    showToast('Insira pelo menos uma taxa válida.', false);
    return;
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
  showToast('Taxas inseridas com sucesso!', true)
}
document.querySelector('button[type="submit"]').addEventListener('click', (event) => {
  event.preventDefault();
  try {
    capturarDados()
  } catch (err) {
    showToast(err, false);
  }
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
function showToast(message, isSuccess = true) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.backgroundColor = isSuccess ? '#4CAF50' : '#f44336'; // Verde para sucesso, vermelho para erro
  toast.className = 'show';

  // Remover o toast após 3 segundos
  setTimeout(() => {
    toast.className = toast.className.replace('show', '');
  }, 3000);
}
function abrirModal(dados, inputID) {
  if (!dados || dados.length === 0) {
    showToast('Nenhum dado disponível para exibir.', false);
    return;
  }
  search.innerHTML = ''
  dados.forEach(item => {
    const listItem = document.createElement('li')
    listItem.textContent = `${item.Codigo} - ${item.Nome}`
    listItem.dataset.ordem = item.Ordem
    listItem.addEventListener('click', () => {
      document.getElementById(inputID).value = `${item.Codigo} - ${item.Nome}`
      document.getElementById(inputID).dataset.ordem = item.Ordem
      fecharModal()
    })
    search.appendChild(listItem);
  })
  modal.style.display = 'block'
}

function fecharModal() {
  modal.style.display = 'none';
}
closeButton.addEventListener('click', fecharModal);

window.addEventListener('click', (event) => {
  if (event.target === modal) {
    fecharModal();
  }
});

document.getElementById('searchFornecedorButton').addEventListener('click', () => {
  abrirModal(Fornecedores, 'fornecedorInput');
});
document.getElementById('searchFilialButton').addEventListener('click', () => {
  abrirModal(Filiais, 'filialInput');
});
document.getElementById('searchCartaoButton').addEventListener('click', () => {
  abrirModal(Cartoes, 'cartaoInput');
});
document.getElementById('searchContaBancariaButton').addEventListener('click', () => {
  abrirModal(Contas_Bancarias, 'contaBancariaInput');
});

document.getElementById('searchItem').addEventListener('input', (event) => {
  const searchText = event.target.value.toLowerCase();
  const items = search.getElementsByTagName('li');

  Array.from(items).forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(searchText) ? '' : 'none';
  });
});

function configurarCampo(inputID, lista) {
  const input = document.getElementById(inputID);

  function atualizarInput() {
    const codigoDigitado = Number(input.value.trim());
    const itemEncontrado = lista.find(item => item.Codigo == codigoDigitado);

    if (itemEncontrado) {
      input.value = `${itemEncontrado.Codigo} - ${itemEncontrado.Nome}`;
      input.dataset.ordem = itemEncontrado.Ordem;
    }
  }

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      atualizarInput();
      input.blur();
    }
  });
  input.addEventListener('focusout', () => {
    atualizarInput();
  });
}

configurarCampo('filialInput', Filiais);
configurarCampo('cartaoInput', Cartoes);
configurarCampo('contaBancariaInput', Contas_Bancarias);
configurarCampo('fornecedorInput', Fornecedores);