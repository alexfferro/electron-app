const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('darkMode', {
  toggle: () => ipcRenderer.invoke('dark-mode:toggle')
})
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  send: (channel, data) => {
    ipcRenderer.send(channel, data)
  }
})
contextBridge.exposeInMainWorld('api', {
  onConnections: (callback) => ipcRenderer.on('connections', (event, connections) => callback(connections)),
  selectConnection: (config) => ipcRenderer.send('select-connection', config),
  buscarDados: () => ipcRenderer.send('buscar-dados')
});