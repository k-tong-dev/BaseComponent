// Global FormView API client for unified data operations
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export class FormViewAPI {
  private baseURL: string

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
  }

  // Generic CRUD operations
  async get<T>(endpoint: string, params?: PaginationParams): Promise<T[]> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`)
    }

    return response.json()
  }

  async getById<T>(endpoint: string, id: string): Promise<T | null> {
    const response = await fetch(`${this.baseURL}${endpoint}/${id}`)
    
    if (response.status === 404) {
      return null
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch item: ${response.statusText}`)
    }

    return response.json()
  }

  async create<T>(endpoint: string, data: any): Promise<APIResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Failed to create item: ${response.statusText}`,
      }
    }

    return {
      success: true,
      data: result.data || result,
    }
  }

  async update<T>(endpoint: string, id: string, data: any): Promise<APIResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `Failed to update item: ${response.statusText}`,
      }
    }

    return {
      success: true,
      data: result.data || result,
    }
  }

  async delete(endpoint: string, id: string): Promise<APIResponse> {
    const response = await fetch(`${this.baseURL}${endpoint}/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const result = await response.json()
      return {
        success: false,
        error: result.error || `Failed to delete item: ${response.statusText}`,
      }
    }

    return {
      success: true,
      message: 'Item deleted successfully',
    }
  }

  // Specialized operations
  async archive(endpoint: string, id: string): Promise<APIResponse> {
    const response = await fetch(`${this.baseURL}${endpoint}/${id}/archive`, {
      method: 'POST',
    })

    if (!response.ok) {
      const result = await response.json()
      return {
        success: false,
        error: result.error || `Failed to archive item: ${response.statusText}`,
      }
    }

    return {
      success: true,
      message: 'Item archived successfully',
    }
  }

  async duplicate(endpoint: string, id: string, data?: any): Promise<APIResponse> {
    const duplicateData = data || {
      id: undefined,
      name: `${data?.name || 'Item'} (Copy)`,
    }

    return this.create(endpoint, duplicateData)
  }

  // Batch operations
  async batchDelete(endpoint: string, ids: string[]): Promise<APIResponse> {
    const response = await fetch(`${this.baseURL}${endpoint}/batch-delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    })

    if (!response.ok) {
      const result = await response.json()
      return {
        success: false,
        error: result.error || `Failed to delete items: ${response.statusText}`,
      }
    }

    return {
      success: true,
      message: `${ids.length} items deleted successfully`,
    }
  }

  async batchUpdate(endpoint: string, updates: Array<{ id: string; data: any }>): Promise<APIResponse> {
    const response = await fetch(`${this.baseURL}${endpoint}/batch-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    })

    if (!response.ok) {
      const result = await response.json()
      return {
        success: false,
        error: result.error || `Failed to update items: ${response.statusText}`,
      }
    }

    return {
      success: true,
      message: `${updates.length} items updated successfully`,
    }
  }
}

// Create singleton instance for global usage
export const formViewAPI = new FormViewAPI()

// Export factory function for custom instances
export function createFormViewAPI(baseURL?: string): FormViewAPI {
  return new FormViewAPI(baseURL)
}
