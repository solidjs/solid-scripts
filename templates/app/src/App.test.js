import { createRoot } from 'solid-js';
import { r } from 'solid-js/dom';
import App from './App';

it('renders without crashing', () => {
  createRoot(dispose => {
    const div = document.createElement('div');
    div.appendChild(<App />);
    div.textContent = '';
    dispose();
  })
});
