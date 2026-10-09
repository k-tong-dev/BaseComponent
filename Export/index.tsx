"use client";

import React, {useState} from "react";
import {Modal, Button, Checkbox, Radio, RadioGroup, Loader} from "rsuite";
import {Download, FileSpreadsheet, FileText} from "lucide-react";
import {ExportProps, ExportConfig, ExportField} from "./types";
import * as XLSX from "xlsx";

export function Export({
                           data,
                           availableFields,
                           onExport,
                           onClose,
                       }: ExportProps) {
    const [exportType, setExportType] = useState<"excel" | "csv">("excel");
    const [includeId, setIncludeId] = useState(true); // Default to true for "I want to update data"
    const [selectedFields, setSelectedFields] = useState<Set<string>>(
        new Set(availableFields.map((f) => f.key)),
    );
    const [exporting, setExporting] = useState(false);

    const handleFieldToggle = (fieldKey: string) => {
        const newSelected = new Set(selectedFields);
        if (newSelected.has(fieldKey)) {
            newSelected.delete(fieldKey);
        } else {
            newSelected.add(fieldKey);
        }
        setSelectedFields(newSelected);
    };

    const handleSelectAll = () => {
        setSelectedFields(new Set(availableFields.map((f) => f.key)));
    };

    const handleDeselectAll = () => {
        setSelectedFields(new Set());
    };

    const handleExport = async () => {
        setExporting(true);

        try {
            // Build export config
            const config: ExportConfig = {
                fields: availableFields.map((f) => ({
                    key: f.key,
                    label: f.label,
                    selected: selectedFields.has(f.key),
                })),
                includeId,
                exportType,
            };

            // Get fields to export
            let fieldsToExport = availableFields.filter((f) =>
                selectedFields.has(f.key),
            );

            // If "I want to update data" is enabled, ensure ID is included
            if (includeId) {
                const idField = availableFields.find(
                    (f) => f.key === "id" || f.key === "_id",
                );
                if (idField && !selectedFields.has(idField.key)) {
                    fieldsToExport = [idField, ...fieldsToExport];
                }
            }

            // Prepare data for export
            const exportData = data.map((item) => {
                const row: any = {};
                fieldsToExport.forEach((field) => {
                    let value = item[field.key];
                    // Handle nested objects, arrays, dates
                    if (value instanceof Date) {
                        value = value.toISOString();
                    } else if (typeof value === "object" && value !== null) {
                        value = JSON.stringify(value);
                    }
                    row[field.label] = value;
                });
                return row;
            });

            if (exportType === "excel") {
                // Export to Excel
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
                XLSX.writeFile(workbook, `export_${Date.now()}.xlsx`);
            } else {
                // Export to CSV
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const csv = XLSX.utils.sheet_to_csv(worksheet);
                const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `export_${Date.now()}.csv`;
                link.click();
            }

            onExport(config);
            onClose();
        } catch (error) {
            console.error("Export failed:", error);
        } finally {
            setExporting(false);
        }
    };

    return (
        <Modal open={true} onClose={onClose} size="md" backdrop="static" draggable>
            <Modal.Header>
                <div className="flex items-center gap-2">
                    <Download className="w-5 h-5"/>
                    Export Data
                </div>
            </Modal.Header>
            <Modal.Body>
                <div className="space-y-6">
                    {/* Export Type Selection */}
                    <div>
                        <RadioGroup
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "end",
                              gap: "3rem",
                            }}
                            value={exportType}
                            onChange={(value) => setExportType(value as "excel" | "csv")}
                        >
                            <Radio value="excel" color="violet">
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48">
                                      <path fill="#4CAF50" d="M41,10H25v28h16c0.553,0,1-0.447,1-1V11C42,10.447,41.553,10,41,10z"></path><path fill="#FFF" d="M32 15H39V18H32zM32 25H39V28H32zM32 30H39V33H32zM32 20H39V23H32zM25 15H30V18H25zM25 25H30V28H25zM25 30H30V33H25zM25 20H30V23H25z"></path>
                                      <path fill="#2E7D32" d="M27 42L6 38 6 10 27 6z"></path>
                                      <path fill="#FFF" d="M19.129,31l-2.411-4.561c-0.092-0.171-0.186-0.483-0.284-0.938h-0.037c-0.046,0.215-0.154,0.541-0.324,0.979L13.652,31H9.895l4.462-7.001L10.274,17h3.837l2.001,4.196c0.156,0.331,0.296,0.725,0.42,1.179h0.04c0.078-0.271,0.224-0.68,0.439-1.22L19.237,17h3.515l-4.199,6.939l4.316,7.059h-3.74V31z"></path>
                                    </svg>
                                    Excel
                                </div>
                            </Radio>
                            <Radio value="csv" color="violet">
                                <div className="flex items-center gap-2">
                                    <svg viewBox="-4 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="#000000" width="20" height="20">
                                      <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                                      <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                                      <g id="SVGRepo_iconCarrier"> 
                                        <path d="M5.106 0c-2.802 0-5.073 2.272-5.073 5.074v53.841c0 2.803 2.271 5.074 5.073 5.074h45.774c2.801 0 5.074-2.271 5.074-5.074v-38.605l-18.903-20.31h-31.945z" fill-rule="evenodd" clip-rule="evenodd" fill="#45B058"></path> 
                                        <path d="M20.306 43.197c.126.144.198.324.198.522 0 .378-.306.72-.703.72-.18 0-.378-.072-.504-.234-.702-.846-1.891-1.387-3.007-1.387-2.629 0-4.627 2.017-4.627 4.88 0 2.845 1.999 4.879 4.627 4.879 1.134 0 2.25-.486 3.007-1.369.125-.144.324-.233.504-.233.415 0 .703.359.703.738 0 .18-.072.36-.198.504-.937.972-2.215 1.693-4.015 1.693-3.457 0-6.176-2.521-6.176-6.212s2.719-6.212 6.176-6.212c1.8.001 3.096.721 4.015 1.711zm6.802 10.714c-1.782 0-3.187-.594-4.213-1.495-.162-.144-.234-.342-.234-.54 0-.361.27-.757.702-.757.144 0 .306.036.432.144.828.739 1.98 1.314 3.367 1.314 2.143 0 2.827-1.152 2.827-2.071 0-3.097-7.112-1.386-7.112-5.672 0-1.98 1.764-3.331 4.123-3.331 1.548 0 2.881.467 3.853 1.278.162.144.252.342.252.54 0 .36-.306.72-.703.72-.144 0-.306-.054-.432-.162-.882-.72-1.98-1.044-3.079-1.044-1.44 0-2.467.774-2.467 1.909 0 2.701 7.112 1.152 7.112 5.636.001 1.748-1.187 3.531-4.428 3.531zm16.994-11.254l-4.159 10.335c-.198.486-.685.81-1.188.81h-.036c-.522 0-1.008-.324-1.207-.81l-4.142-10.335c-.036-.09-.054-.18-.054-.288 0-.36.323-.793.81-.793.306 0 .594.18.72.486l3.889 9.992 3.889-9.992c.108-.288.396-.486.72-.486.468 0 .81.378.81.793.001.09-.017.198-.052.288z" fill="#ffffff"></path> 
                                        <g fill-rule="evenodd" clip-rule="evenodd"> 
                                          <path d="M56.001 20.357v1h-12.8s-6.312-1.26-6.128-6.707c0 0 .208 5.707 6.003 5.707h12.925z" fill="#349C42"></path> 
                                          <path d="M37.098.006v14.561c0 1.656 1.104 5.791 6.104 5.791h12.8l-18.904-20.352z" opacity=".5" fill="#ffffff"></path> 
                                        </g> 
                                      </g>
                                    </svg>
                                    CSV (.csv)
                                </div>
                            </Radio>
                        </RadioGroup>
                    </div>

                    {/* "I want to update data" Switcher */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                            <div className="font-medium">I want to update data</div>
                            <div className="text-sm text-muted-foreground">
                                Include ID field even if not selected (required for re-import)
                            </div>
                        </div>
                        <Checkbox
                            color={"violet"}
                            checked={includeId}
                            onChange={(value, checked) => setIncludeId(checked as boolean)}
                        />
                    </div>

                    {/* Field Selection */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Fields to Export</label>
                            <div className="flex gap-2">
                                <Button size="xs" onClick={handleSelectAll}>
                                    Select All
                                </Button>
                                <Button size="xs" onClick={handleDeselectAll}>
                                    Deselect All
                                </Button>
                            </div>
                        </div>
                        <div className="border rounded-lg max-h-64 overflow-y-auto p-2 space-y-1">
                            {availableFields.map((field) => (
                                <div
                                    key={field.key}
                                    className="flex items-center gap-2 p-2 hover:bg-muted rounded"
                                >
                                    <Checkbox
                                        color="violet"
                                        checked={selectedFields.has(field.key)}
                                        onChange={(checked) => handleFieldToggle(field.key)}
                                    />
                                    <span className="flex-1">{field.label}</span>
                                    {field.type && (
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                          {field.type}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose} appearance="subtle">
                    Cancel
                </Button>
                <Button
                    color="violet"
                    onClick={handleExport}
                    appearance="primary"
                    disabled={selectedFields.size === 0 || exporting}
                    loading={exporting}
                >
                    Export
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
