'use client'

export interface PrintTemplateProps {
    data: any
    mode: 'single' | 'bulk'
}

export interface PrintConfig {
    data: any[]
    mode: 'single' | 'bulk'
    template?: React.ComponentType<PrintTemplateProps>
    title?: string
}

export interface PrintProps {
    config: PrintConfig
    onClose?: () => void
}
