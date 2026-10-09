import React from 'react'

// Widget Props Interface
export interface FieldWidgetProps {
  value: any
  onChange: (value: any) => void
  field: any
  data: any  // Full form data
  disabled?: boolean
  readonly?: boolean
}

// Widget Component Interface
export interface FieldWidgetComponent extends React.FC<FieldWidgetProps> {
  widgetName: string
}

// Registry for field widgets
export const fieldWidgets: Record<string, FieldWidgetComponent> = {}

// Register a widget
export function registerWidget(widget: FieldWidgetComponent) {
  fieldWidgets[widget.widgetName] = widget
}

// Get a widget by name
export function getWidget(name: string): FieldWidgetComponent | undefined {
  return fieldWidgets[name]
}

// Static widget map — always available, no side effects needed
export const widgetMap: Record<string, () => Promise<any>> = {}

// Register a lazily-loaded widget
export function registerLazyWidget(name: string, loader: () => Promise<any>) {
  widgetMap[name] = loader
}
