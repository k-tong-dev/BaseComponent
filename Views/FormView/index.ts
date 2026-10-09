// Global FormView exports for easy usage across the application
export { FormView } from './FormView'
export type { FormConfig, FormField, Entity, MutableEntity } from './FormView'

// Note: Form configurations are now model-specific
// - productFormConfig: app/dashboard/products/config/formView.ts
// - customerFormConfig: Should be moved to app/dashboard/customers/config/formView.ts
// FormView component is generic and doesn't include specific model configs

// Export utilities
export { FormViewAPI, formViewAPI, createFormViewAPI } from './utils/api-client'
export type { APIResponse, PaginationParams } from './utils/api-client'
export { FormViewValidator, commonValidations } from './utils/validation'
export type { ValidationRule, ValidationRules } from './utils/validation'


// Export configuration registry
export { 
  formConfigRegistry, 
  FormViewRegistry, 
  registerFormConfig, 
  getFormConfig, 
  getAllFormConfigs, 
  hasFormConfig,
  loadFormConfig,
  createFormConfig
} from './config/registry'
export type { EntityType, FormConfigRegistry } from './config/registry'
