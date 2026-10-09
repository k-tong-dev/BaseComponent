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
  readonly?: boolean
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
}

export interface FieldProps {
  config: FieldConfig
  value: any
  onChange: (value: any) => void
  error?: string | null
}
