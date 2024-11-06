function showLoading() {
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'loading-overlay';
  loadingOverlay.style.position = 'fixed';
  loadingOverlay.style.top = '0';
  loadingOverlay.style.left = '0';
  loadingOverlay.style.width = '100%';
  loadingOverlay.style.height = '100%';
  loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  loadingOverlay.style.display = 'flex';
  loadingOverlay.style.justifyContent = 'center';
  loadingOverlay.style.alignItems = 'center';
  loadingOverlay.style.zIndex = '9999';

  // Criação do spinner
  const spinner = document.createElement('div');
  spinner.classList.add('spinner');

  // Estilos do spinner
  const style = document.createElement('style');
  style.innerHTML = `
    .spinner {
      border: 8px solid rgba(255, 255, 255, 0.3);
      border-top: 8px solid #fff;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  loadingOverlay.appendChild(spinner);
  document.body.appendChild(loadingOverlay);
}

window.api.onConnections((connections) => {
  const container = document.getElementById('connection-list');
  container.innerHTML = '';

  connections.forEach((connection, index) => {
    const connectionElement = document.createElement('div');
    const connectionIcon = document.createElement('i')
    const connectionText = document.createElement('span')

    connectionText.innerHTML = `${connection.descricao}`

    connectionIcon.classList.add('ph')
    connectionIcon.classList.add('ph-link')

    connectionElement.style.cursor = 'pointer';
    connectionElement.classList.add('connection')
    connectionElement.appendChild(connectionIcon)
    connectionElement.appendChild(connectionText)

    connectionElement.addEventListener('click', () => {
      showLoading()
      window.api.selectConnection(connection);
    });
    container.appendChild(connectionElement);
  });
});