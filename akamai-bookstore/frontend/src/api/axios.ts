import axios from 'axios'
import keycloak from '../keycloak.ts'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (config) => {
  if (keycloak.authenticated) {
    try {
      await keycloak.updateToken(30)
      config.headers.Authorization = `Bearer ${keycloak.token}`
    } catch {
      keycloak.login()
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && keycloak.authenticated) {
      keycloak.login()
    }
    return Promise.reject(err)
  },
)

export default api
