import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: (import.meta.env.VITE_KEYCLOAK_URL as string | undefined) ?? window.location.origin,
  realm: (import.meta.env.VITE_KEYCLOAK_REALM as string | undefined) ?? 'bookstore',
  clientId: (import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string | undefined) ?? 'bookstore-web',
})

export default keycloak
