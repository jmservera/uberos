import App from './App.svelte';
import './app.css';

// Mount the UberOS window-manager shell.
const app = new App({
  target: document.getElementById('app'),
});

export default app;
