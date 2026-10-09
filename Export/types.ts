export interface ExportField {
  key: string
  label: string
  selected: boolean
}

export interface ExportConfig {
  fields: ExportField[]
  includeId: boolean // "I want to update data" switch
  exportType: 'excel' | 'csv'
}

export interface ExportProps {
  data: any[]
  availableFields: Array<{ key: string; label: string; type?: string }>
  onExport: (config: ExportConfig) => void
  onClose: () => void
}
