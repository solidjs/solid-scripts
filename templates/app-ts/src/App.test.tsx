import { createRoot } from 'solid-js';
import App from './App';

it('renders without crashing', () => {
  createRoot(dispose => {
    const div = document.createElement('div');
    div.appendChild(<App />);
    div.textContent = '';
    dispose();
  })
});
