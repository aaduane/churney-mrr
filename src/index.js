import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <App />
);

/* forces console clear on hot reload during development */
window.addEventListener('message', e => {
	if (process.env.NODE_ENV !== 'production' && e.data && e.data.type === 'webpackInvalid') {
		console.clear();
	}
});