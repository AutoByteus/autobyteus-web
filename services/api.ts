import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { getServerUrls } from '~/utils/serverConfig'

class ApiService {
  private axiosInstance: AxiosInstance

  constructor() {
    // Get server URLs from our centralized configuration
    const serverUrls = getServerUrls()
    const baseURL = serverUrls.rest
    
    // Log the configuration for debugging
    console.log('API Service: Initializing with base URL:', baseURL)
    
    if (!baseURL) {
      throw new Error('REST base URL is not configured')
    }

    this.axiosInstance = axios.create({
      baseURL,
      // Add other default configurations here
    })

    // Set up request interceptors if needed
    this.axiosInstance.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // For example, attach auth tokens here
        // const token = getAuthToken()
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`
        // }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Set up response interceptors if needed
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        // Handle global errors here
        // For example, redirect to login on 401
        // if (error.response.status === 401) {
        //   redirectToLogin()
        // }
        return Promise.reject(error)
      }
    )
  }

  // Generic GET request
  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.get<T>(url, config)
  }

  // Generic POST request
  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.axiosInstance.post<T>(url, data, config)
  }

  // Similarly, you can add put, delete, etc.
}

// Export a singleton instance
const apiService = new ApiService()
export default apiService
