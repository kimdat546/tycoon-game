import { Application } from './core/Application';

async function initGame() {
  const loadingElement = document.getElementById('loading');
  
  try {
    // Initialize the game application
    const app = new Application();
    await app.init();
    
    // Hide loading screen
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    console.log('Eternal Tower: Game initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    if (loadingElement) {
      loadingElement.innerHTML = 'Failed to load game. Please refresh the page.';
      loadingElement.style.color = 'red';
    }
  }
}

// Start the game when the page loads
window.addEventListener('load', initGame);