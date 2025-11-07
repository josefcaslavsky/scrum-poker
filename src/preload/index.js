import { contextBridge } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Add any API methods here later
  platform: process.platform,
  nodeEnv: process.env.NODE_ENV || 'development'
});
