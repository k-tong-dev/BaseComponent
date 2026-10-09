'use client'

import React, {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Printer, Download, X} from 'lucide-react'
import {PrintProps, PrintConfig} from './types'
import {DefaultPrintTemplate} from './DefaultPrintTemplate'

export function Print({config, onClose}: PrintProps) {
    const {data, mode, template: Template, title = 'Print'} = config
    const [customTemplate, setCustomTemplate] = useState<React.ComponentType<any> | null>(null)
    const [isPrinting, setIsPrinting] = useState(false)

    useEffect(() => {
        // Load custom template if specified
        if (Template) {
            setCustomTemplate(() => Template)
        }
    }, [Template])

    const handlePrint = () => {
        setIsPrinting(true)
        setTimeout(() => {
            window.print()
            setIsPrinting(false)
        }, 100)
    }

    const handleDownloadPDF = () => {
        setIsPrinting(true)
        setTimeout(() => {
            window.print()
            setIsPrinting(false)
        }, 100)
    }

    const handleClose = () => {
        if (onClose) {
            onClose()
        }
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-lg mb-4">No print data found</p>
                    <Button onClick={handleClose}>Close</Button>
                </div>
            </div>
        )
    }

    const TemplateComponent = customTemplate || DefaultPrintTemplate

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Print Toolbar - Hidden when printing */}
            <div className="bg-white sticky top-0 border-b p-4 flex items-center justify-between print:hidden">
                <h1 className="text-xl font-bold">{title}</h1>
                <div className="flex gap-2">
                    <Button onClick={handlePrint} color='violet' appearance='primary' size="sm">
                        <Printer className="w-4 h-4 mr-2"/>
                        Print
                    </Button>
                    <Button onClick={handleDownloadPDF} size="sm" appearance="subtle">
                        <Download className="w-4 h-4 mr-2"/>
                        Download PDF
                    </Button>
                    <Button onClick={handleClose} size="sm" appearance="subtle">
                        <X className="w-4 h-4"/>
                    </Button>
                </div>
            </div>

            {/* Print Content */}
            <div className="bg-white">
                {customTemplate ? (
                    React.createElement(customTemplate, {data})
                ) : (
                    <TemplateComponent data={data} mode={mode}/>
                )}
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @page {
                    margin: 0;
                    size: auto;
                }
                @media print {
                    .print\:hidden {
                        display: none !important;
                    }
                    body {
                        background: white;
                        margin: 0;
                    }
                    @page {
                        margin: 0mm;
                    }
                }
            `}</style>
        </div>
    )
}
