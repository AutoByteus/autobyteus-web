// /services/api.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// Define a class to encapsulate Axios instance and related methods
class ApiService {
  private axiosInstance: AxiosInstance

  constructor(baseURL: string) {
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
const apiService = new ApiService(process.env.NUXT_PUBLIC_BACKEND_REST_URL || 'http://localhost:8000/rest')

export default apiService
