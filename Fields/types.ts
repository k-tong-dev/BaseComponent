export interface SelectOption {
  id: string | number
  name: string
  avatar?: string
  group?: string
  children?: SelectOption[]
}

export type FieldType =
  | 'selection' | 'many2many' | 'many2one' | 'one2many'
  | 'boolean' | 'string' | 'number' | 'textarea' | 'html' | 'json'
  | 'date' | 'datetime' | 'time' | 'year' | 'month' | 'day'

export interface FieldConfig {
  name: string
  type: FieldType
  label?: string
  placeholder?: string
  required?: boolean
  /**
   * Readonly: the value cannot be edited but is still shown, selectable and
   * submitted. Maps to the control's native `readOnly` attribute.
   */
  readonly?: boolean
  /**
   * Disabled: a separate, isolated state from `readonly`. A disabled control
   * cannot be focused or edited and is rendered muted. Maps to the control's
   * native `disabled` attribute — setting `readonly` must never set this.
   */
  disabled?: boolean
  helper?: string
  options?: SelectOption[]
  fetchUrl?: string
  multiple?: boolean
  groupBy?: string
  tree?: boolean
  searchable?: boolean
  default?: any
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** If set, use this key from fetched item as display name (e.g., 'code' for currency) */
  labelKey?: string
  /** Alternative name used in some configs */
  displayField?: string
  labelField?: string
}

export interface FieldProps {
  config: FieldConfig
  value: any
  onChange: (value: any) => void
  error?: string | null
}
