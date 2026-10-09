'use client'

import React, {useState, useEffect, useRef} from 'react'
import {Badge, Popover, Whisper} from 'rsuite'
import {Group as GroupIcon} from 'lucide-react'
import {Button} from "@/components/ui/button";

export interface GroupField {
    key: string
    label: string
}

export interface GroupByProps {
    fields?: GroupField[]
    value?: string | null
    onChange?: (fieldKey: string | null) => void
    className?: string
}

export function GroupBy({
    fields = [],
    value = null,
    onChange,
    className = ""
}: GroupByProps) {
    const [selectedField, setSelectedField] = useState<string | null>(value)
    const whisperRef = useRef<any>(null)

    // Sync with external value only when it actually changes
    useEffect(() => {
        if (value !== selectedField) {
            setSelectedField(value)
        }
    }, [value])

    // Notify parent when selected field changes
    useEffect(() => {
        if (onChange) {
            onChange(selectedField)
        }
    }, [selectedField, onChange])

    const handleFieldSelect = (fieldKey: string) => {
        setSelectedField(fieldKey)
        whisperRef.current?.close()
    }

    const handleClearGroup = () => {
        setSelectedField(null)
        whisperRef.current?.close()
    }

    const getFieldLabel = (fieldKey: string) => {
        const field = fields.find(f => f.key === fieldKey)
        return field?.label || fieldKey
    }

    return (
      <div className={className}>
        <Whisper
          trigger="click"
          placement="bottomEnd"
          ref={whisperRef}
          speaker={
            <Popover style={{ padding: 0 }}>
              <div className="p-4 min-w-[200px]">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium">Group By</span>
                  {selectedField && (
                    <Button
                      size={"xs"}
                      color={"violet"}
                      appearance={"primary"}
                      onClick={handleClearGroup}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Field Selector */}
                <div className="flex flex-col gap-1">
                  {fields.map((field) => (
                    <button
                      type="button"
                      key={field.key}
                      onClick={() => handleFieldSelect(field.key)}
                      className={`text-left px-2 py-1 rounded text-sm ${
                        selectedField === field.key
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              </div>
            </Popover>
          }
        >
          <Badge content={""} invisible={!selectedField}>
            <button
              type="button"
              onClick={() => whisperRef.current?.open()}
              className="flex items-center gap-1 px-3 py-1.5 border rounded text-sm transition-colors hover:bg-gray-100"
            >
              <GroupIcon size={14} />
              {selectedField ? (
                <span>{getFieldLabel(selectedField)}</span>
              ) : (
                <span>Group</span>
              )}
            </button>
          </Badge>
        </Whisper>
      </div>
    );
}
