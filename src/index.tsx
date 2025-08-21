import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { setupGlobalPhysicsErrorLogging } from './utils/physicsDebugRegistry';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Setup global physics error logging & manual dump helper
setupGlobalPhysicsErrorLogging();
root.render(
  // StrictMode causes double-invocation in dev which can duplicate physics bodies
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
