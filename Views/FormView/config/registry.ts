// Global form configuration registry for FormView
import { FormConfig } from '../FormView'
// Note: Model-specific configs are now in app/dashboard/[model]/config/
// - productFormConfig: app/dashboard/products/config/formView.ts
// - customerFormConfig: Should be moved to app/dashboard/customers/config/formView.ts
// FormView component is generic and doesn't include specific model configs

export type EntityType = 'product' | 'customer' | 'order' | 'invoice' | 'announcement' | 'user' | 'setting'

export interface FormConfigRegistry {
  [key: string]: FormConfig
}

// Global registry of all form configurations
export const formConfigRegistry: FormConfigRegistry = {
  // product: productFormConfig, // Now at app/dashboard/products/config/formView.ts
  // customer: customerFormConfig, // Should be moved to app/dashboard/customers/config/formView.ts
  // Add more configurations as they are created
  // order: orderFormConfig,
  // invoice: invoiceFormConfig,
  // announcement: announcementFormConfig,
  // user: userFormConfig,
  // setting: settingFormConfig,
}

// Registry management class
export class FormViewRegistry {
  private static instance: FormViewRegistry
  private configs: Map<string, FormConfig> = new Map()

  private constructor() {
    // Initialize with default configurations
    Object.entries(formConfigRegistry).forEach(([key, config]) => {
      this.configs.set(key, config)
    })
  }

  // Singleton pattern
  static getInstance(): FormViewRegistry {
    if (!FormViewRegistry.instance) {
      FormViewRegistry.instance = new FormViewRegistry()
    }
    return FormViewRegistry.instance
  }

  // Register a new form configuration
  register(key: string, config: FormConfig): void {
    this.configs.set(key, config)
    formConfigRegistry[key] = config
  }

  // Get form configuration by key
  get(key: string): FormConfig | undefined {
    return this.configs.get(key)
  }

  // Get all registered configurations
  getAll(): FormConfigRegistry {
    const result: FormConfigRegistry = {}
    this.configs.forEach((config, key) => {
      result[key] = config
    })
    return result
  }

  // Check if configuration exists
  has(key: string): boolean {
    return this.configs.has(key)
  }

  // Remove configuration
  unregister(key: string): boolean {
    const removed = this.configs.delete(key)
    if (removed) {
      delete formConfigRegistry[key]
    }
    return removed
  }

  // Get configurations by entity type
  getByType(entityType: EntityType): FormConfig | undefined {
    return this.get(entityType)
  }

  // Get all entity types
  getEntityTypes(): EntityType[] {
    return Array.from(this.configs.keys()) as EntityType[]
  }

  // Validate configuration
  validate(config: FormConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.entityName) {
      errors.push('entityName is required')
    }

    if (!config.entityNamePlural) {
      errors.push('entityNamePlural is required')
    }

    if (!config.apiEndpoint) {
      errors.push('apiEndpoint is required')
    }

    if (!config.fields || !Array.isArray(config.fields)) {
      errors.push('fields must be an array')
    }

    if (!config.breadcrumbs) {
      errors.push('breadcrumbs is required')
    } else {
      const requiredBreadcrumbs = ['base', 'list', 'create', 'edit']
      requiredBreadcrumbs.forEach(key => {
        if (!config.breadcrumbs[key as keyof typeof config.breadcrumbs]) {
          errors.push(`breadcrumbs.${key} is required`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Get configuration summary
  getSummary(): Array<{ key: string; entityName: string; fieldsCount: number }> {
    const summary: any = []
    this.configs.forEach((config, key) => {
      summary.push({
        key,
        entityName: config.entityName,
        fieldsCount: config.fields?.length || 0,
      })
    })
    return summary
  }
}

// Export singleton instance
export const formViewRegistry = FormViewRegistry.getInstance()

// Export convenience functions
export function registerFormConfig(key: string, config: FormConfig): void {
  formViewRegistry.register(key, config)
}

export function getFormConfig(key: string): FormConfig | undefined {
  return formViewRegistry.get(key)
}

export function getAllFormConfigs(): FormConfigRegistry {
  return formViewRegistry.getAll()
}

export function hasFormConfig(key: string): boolean {
  return formViewRegistry.has(key)
}

// Type-safe getters
// Note: getProductConfig and getCustomerConfig removed - use model-specific configs
// - app/dashboard/products/config/formView.ts
// - app/dashboard/customers/config/formView.ts (to be created)

// Dynamic configuration loader (for future use with lazy loading)
export async function loadFormConfig(key: string): Promise<FormConfig | undefined> {
  // Try registry first
  const cached = formViewRegistry.get(key)
  if (cached) {
    return cached
  }

  // Try dynamic import (for future lazy loading)
  // Note: Configs are now in app/dashboard/[model]/config/
  // This function would need to be updated to use the new structure
  // try {
  //   const module = await import(`@/app/dashboard/${key}s/config/formView`)
  //   const config = module[`${key}FormConfig`]
  //   if (config) {
  //     formViewRegistry.register(key, config)
  //     return config
  //   }
  // } catch (error) {
  //   console.warn(`Failed to load form config for ${key}:`, error)
  // }

  return undefined
}

// Configuration builder for programmatic creation
export class FormConfigBuilder {
  private config: Partial<FormConfig> = {}

  entityName(name: string): FormConfigBuilder {
    this.config.entityName = name
    return this
  }

  entityNamePlural(plural: string): FormConfigBuilder {
    this.config.entityNamePlural = plural
    return this
  }

  apiEndpoint(endpoint: string): FormConfigBuilder {
    this.config.apiEndpoint = endpoint
    return this
  }

  fields(fields: FormConfig['fields']): FormConfigBuilder {
    this.config.fields = fields
    return this
  }

  actions(actions: FormConfig['actions']): FormConfigBuilder {
    this.config.actions = actions
    return this
  }

  breadcrumbs(breadcrumbs: FormConfig['breadcrumbs']): FormConfigBuilder {
    this.config.breadcrumbs = breadcrumbs
    return this
  }

  build(): FormConfig {
    const validation = formViewRegistry.validate(this.config as FormConfig)
    if (!validation.valid) {
      throw new Error(`Invalid form configuration: ${validation.errors.join(', ')}`)
    }
    return this.config as FormConfig
  }
}

// Export builder function
export function createFormConfig(): FormConfigBuilder {
  return new FormConfigBuilder()
}
