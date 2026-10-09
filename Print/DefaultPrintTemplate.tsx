'use client'

import React from 'react'

export function DefaultPrintTemplate({data, mode}: {data: any; mode: 'single' | 'bulk'}) {
    const record = Array.isArray(data) ? data[0] : data
    const records = Array.isArray(data) ? data : [data]

    // Convert empty string values to null to prevent validation errors
    const safeRecord = Object.fromEntries(
        Object.entries(record || {}).map(([key, value]) => [key, value === '' ? null : value])
    )
    const safeRecords = records.map(r => 
        Object.fromEntries(Object.entries(r || {}).map(([key, value]) => [key, value === '' ? null : value]))
    )

    return (
        <div className="bg-transparent min-h-screen p-8">
            <h1 className="text-2xl font-bold mb-6">Print Preview</h1>
            
            {mode === 'single' ? (
                <div className="border p-4 rounded">
                    <h2 className="text-lg font-semibold mb-4">Record Details</h2>
                    <table className="w-full">
                        <tbody>
                            {Object.entries(safeRecord).map(([key, value]) => {
                                // Skip rendering if key or value is invalid
                                if (!key) return null
                                const displayValue = typeof value === 'object' && value !== null 
                                    ? JSON.stringify(value) 
                                    : (value !== null && value !== undefined ? String(value) : '')
                                return (
                                    <tr key={key} className="border-b">
                                        <td className="py-2 font-medium">{key}</td>
                                        <td className="py-2">{displayValue}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div>
                    <h2 className="text-lg font-semibold mb-4">Records ({records.length})</h2>
                    {safeRecords.map((record, index) => (
                        <div key={index} className="border p-4 rounded mb-4">
                            <h3 className="font-medium mb-2">Record #{index + 1}</h3>
                            <table className="w-full">
                                <tbody>
                                    {Object.entries(record).map(([key, value]) => {
                                        if (!key) return null
                                        const displayValue = typeof value === 'object' && value !== null 
                                            ? JSON.stringify(value) 
                                            : (value !== null && value !== undefined ? String(value) : '')
                                        return (
                                            <tr key={key} className="border-b">
                                                <td className="py-2 font-medium">{key}</td>
                                                <td className="py-2">{displayValue}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
