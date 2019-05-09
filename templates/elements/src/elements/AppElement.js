import { customElement } from 'solid-element';
import logo from '../logo.svg';
import style from './AppElement.css';

const App = customElement('app-element', () =>
  <>
    <style>{style}</style>
    <div class="App">
      <header class="App-header">
        <img src={logo} class="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          class="App-link"
          href="https://github.com/ryansolid/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid
        </a>
      </header>
    </div>
  </>
)

export default App;
