// Global validation utilities for FormView
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationRules {
  [fieldName: string]: ValidationRule
}

export class FormViewValidator {
  // Common validation patterns
  static patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[\d\s\-\(\)]+$/,
    url: /^https?:\/\/.+/,
    zipCode: /^\d{5}(-\d{4})?$/,
    alphanumeric: /^[a-zA-Z0-9]+$/,
    numbersOnly: /^\d+$/,
    lettersOnly: /^[a-zA-Z\s]+$/,
  }

  // Common validation messages
  static messages = {
    required: 'This field is required',
    minLength: (min: number) => `Must be at least ${min} characters`,
    maxLength: (max: number) => `Must be no more than ${max} characters`,
    min: (min: number) => `Must be at least ${min}`,
    max: (max: number) => `Must be no more than ${max}`,
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number',
    url: 'Please enter a valid URL',
    zipCode: 'Please enter a valid ZIP code',
    alphanumeric: 'Only letters and numbers allowed',
    numbersOnly: 'Only numbers allowed',
    lettersOnly: 'Only letters allowed',
  }

  // Validate a single field
  static validateField(value: any, rules: ValidationRule): string | null {
    // Required validation
    if (rules.required && (!value || value === '' || value === null || value === undefined)) {
      return this.messages.required
    }

    // Skip other validations if field is empty and not required
    if (!value || value === '' || value === null || value === undefined) {
      return null
    }

    // String validations
    if (typeof value === 'string') {
      // Min length
      if (rules.minLength && value.length < rules.minLength) {
        return this.messages.minLength(rules.minLength)
      }

      // Max length
      if (rules.maxLength && value.length > rules.maxLength) {
        return this.messages.maxLength(rules.maxLength)
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        return rules.custom ? rules.custom(value) : 'Invalid format'
      }
    }

    // Number validations
    if (typeof value === 'number') {
      // Min value
      if (rules.min !== undefined && value < rules.min) {
        return this.messages.min(rules.min)
      }

      // Max value
      if (rules.max !== undefined && value > rules.max) {
        return this.messages.max(rules.max)
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value)
    }

    return null
  }

  // Validate entire form
  static validateForm(data: any, rules: ValidationRules): { [fieldName: string]: string | null } {
    const errors: { [fieldName: string]: string | null } = {}

    Object.keys(rules).forEach(fieldName => {
      errors[fieldName] = this.validateField(data[fieldName], rules[fieldName])
    })

    return errors
  }

  // Check if form has any errors
  static hasErrors(errors: { [fieldName: string]: string | null }): boolean {
    return Object.values(errors).some(error => error !== null)
  }

  // Get first error message
  static getFirstError(errors: { [fieldName: string]: string | null }): string | null {
    const errorValues = Object.values(errors).filter(error => error !== null)
    return errorValues.length > 0 ? errorValues[0] : null
  }

  // Common validation rule builders
  static required(): ValidationRule {
    return { required: true }
  }

  static minLength(min: number): ValidationRule {
    return { minLength: min }
  }

  static maxLength(max: number): ValidationRule {
    return { maxLength: max }
  }

  static range(min: number, max: number): ValidationRule {
    return { min, max }
  }

  static email(): ValidationRule {
    return {
      pattern: this.patterns.email,
      custom: () => this.messages.email,
    }
  }

  static phone(): ValidationRule {
    return {
      pattern: this.patterns.phone,
      custom: () => this.messages.phone,
    }
  }

  static url(): ValidationRule {
    return {
      pattern: this.patterns.url,
      custom: () => this.messages.url,
    }
  }

  static zipCode(): ValidationRule {
    return {
      pattern: this.patterns.zipCode,
      custom: () => this.messages.zipCode,
    }
  }

  static password(): ValidationRule {
    return {
      minLength: 8,
      custom: (value: string) => {
        if (!/(?=.*[a-z])/.test(value)) return 'Must contain at least one lowercase letter'
        if (!/(?=.*[A-Z])/.test(value)) return 'Must contain at least one uppercase letter'
        if (!/(?=.*\d)/.test(value)) return 'Must contain at least one number'
        if (!/(?=.*[@$!%*?&])/.test(value)) return 'Must contain at least one special character'
        return null
      },
    }
  }

  static custom(validator: (value: any) => string | null): ValidationRule {
    return { custom: validator }
  }

  // Combine multiple rules
  static combine(...rules: ValidationRule[]): ValidationRule {
    const combined: ValidationRule = {}

    rules.forEach(rule => {
      Object.assign(combined, rule)
    })

    return combined
  }
}

// Pre-built validation rule sets for common use cases
export const commonValidations = {
  name: FormViewValidator.combine(
    FormViewValidator.required(),
    FormViewValidator.minLength(2),
    FormViewValidator.maxLength(100),
    FormViewValidator.custom((value: string) => {
      if (!FormViewValidator.patterns.lettersOnly.test(value.trim())) {
        return 'Name can only contain letters and spaces'
      }
      return null
    })
  ),

  email: FormViewValidator.combine(
    FormViewValidator.required(),
    FormViewValidator.email()
  ),

  phone: FormViewValidator.combine(
    FormViewValidator.phone()
  ),

  price: FormViewValidator.combine(
    FormViewValidator.required(),
    FormViewValidator.range(0, 999999.99)
  ),

  stock: FormViewValidator.combine(
    FormViewValidator.range(0, 999999)
  ),

  rating: FormViewValidator.combine(
    FormViewValidator.range(0, 9.99)
  ),

  description: FormViewValidator.combine(
    FormViewValidator.maxLength(1000)
  ),

  zipCode: FormViewValidator.combine(
    FormViewValidator.zipCode()
  ),

  password: FormViewValidator.password(),
}
