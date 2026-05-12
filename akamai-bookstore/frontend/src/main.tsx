import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import keycloak from './keycloak.ts'
import { useAuthStore } from './store/auth.store.ts'
import './index.css'

keycloak
  .init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    pkceMethod: 'S256',
  })
  .then(() => {
    if (keycloak.authenticated && keycloak.token && keycloak.tokenParsed) {
      useAuthStore.getState().setAuth(keycloak.token, keycloak.tokenParsed as Record<string, unknown>)
    }

    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
  .catch(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
