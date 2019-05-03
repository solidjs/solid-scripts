import { createRoot } from 'solid-js';
import { r } from 'solid-js/dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

createRoot(() => document.getElementById('root').appendChild(<App />));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
