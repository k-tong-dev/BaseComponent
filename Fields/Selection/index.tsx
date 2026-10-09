'use client'

import * as React from 'react'
import {SelectPicker, CheckPicker, TreePicker, CheckTreePicker, Avatar, Badge} from 'rsuite'
import {cn} from '@/lib/utils'
import type {SelectOption, FieldProps} from '../types'

const PICKER_STYLE = {
    borderTop: 0,
    borderRight: 0,
    borderLeft: 0,
    borderRadius: 0,
    outlineColor: 'transparent',
    boxShadow: 'none'
}

function toData(options: SelectOption[], renderAvatar?: boolean): any[] {
    return options.map((opt) => ({
        label: renderAvatar && opt.avatar
            ?
            <div className="flex items-center gap-2"><Avatar src={opt.avatar} size="xs" circle/><span>{opt.name}</span>
            </div>
            : opt.name,
        value: String(opt.id),
        role: opt.group,
        children: opt.children ? toData(opt.children, renderAvatar) : undefined,
    }))
}

function findOption(options: SelectOption[], value: string): SelectOption | undefined {
    for (const opt of options) {
        if (String(opt.id) === value) return opt
        if (opt.children) {
            const f = findOption(opt.children, value);
            if (f) return f
        }
    }
}

const SIZE = {sm: 'top-3 text-xs', md: 'top-4 text-sm', lg: 'top-5 text-base'}

export function SelectionField({config, value, onChange, error}: FieldProps) {
    const [open, setOpen] = React.useState(false)
    const [options, setOptions] = React.useState<SelectOption[]>(config.options || [])
    const [loading, setLoading] = React.useState(false)
    const hasValue = value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)

    React.useEffect(() => {
        if (!config.fetchUrl) return
        setLoading(true)
        fetch(config.fetchUrl)
            .then((r) => r.json())
            .then((data) => {
                const items = Array.isArray(data) ? data : data.data || data.records || data.items || []
                setOptions(items.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    avatar: item.avatar || item.image || item.thumbnail,
                    group: item.group,
                    children: item.children,
                })))
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [config.fetchUrl])

    const data = React.useMemo(() => toData(options, true), [options])
    const floating = open || hasValue

    const handleChange = (next: any) => {
        if (config.multiple && Array.isArray(next)) onChange(next)
        else onChange(next ?? null)
    }

    const renderBadge = () => {
        if (!config.multiple || !value || !Array.isArray(value) || value.length === 0) return null
        const vals = value.map((v) => findOption(options, v)).filter(Boolean) as SelectOption[]
        if (vals.length === 0) return null
        return (
            <div className="flex flex-wrap gap-1 mt-1">
                {vals.map((opt) => (
                    <Badge key={opt.id}
                           className="!bg-primary/10 !text-primary !px-2 !py-0.5 !text-xs !font-medium !rounded-full">
                        {opt.avatar ? <div className="flex items-center gap-1"><Avatar src={opt.avatar} size="xs"
                                                                                       circle/><span>{opt.name}</span>
                        </div> : opt.name}
                    </Badge>
                ))}
            </div>
        )
    }

    const pickerProps = {
        data,
        searchable: config.searchable !== false,
        loading,
        placeholder: config.placeholder || ' ',
        disabled: config.readonly,
        style: PICKER_STYLE,
        onOpen: () => setOpen(true),
        onClose: () => setOpen(false)
    }

    return (
        <div className="w-full space-y-1">
            <div className="relative">
                <style>{`.rs-picker-toggle { border-top: 0 !important; border-right: 0 !important; border-left: 0 !important; border-bottom: 0 !important; border-radius: 0 !important; outline: none !important; box-shadow: none !important; }`}</style>
                <div className={cn(
                    'w-full bg-transparent border-b-1 border-b-foreground text-foreground rounded-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200',
                    error ? 'border-destructive' : 'border-border',
                    config.size === 'sm' ? 'text-sm' : config.size === 'lg' ? 'text-base' : 'text-sm',
                )}>
                    {config.tree && config.multiple ? (
                        <CheckTreePicker
                            {...pickerProps as any}
                            value={(value as string[]) || []}
                            onChange={handleChange}
                            cascade={false}
                            cleanable={true}
                            getChildren={undefined}
                            block
                            preventOverflow
                            placement={"auto"}
                        />
                    ) : config.tree ? (
                        <TreePicker
                            {...pickerProps as any}
                            value={(value as string) || null}
                            onChange={handleChange}
                            cleanable={true}
                            getChildren={undefined}
                            block
                            preventOverflow
                            placement={"auto"}
                        />
                    ) : config.multiple ? (
                        <CheckPicker
                            {...pickerProps as any}
                            value={(value as string[]) || []}
                            onChange={handleChange}
                            cleanable={true}
                            sticky={true}
                            block
                            preventOverflow
                            placement={"auto"}
                        />
                    ) : (
                        <SelectPicker
                            {...pickerProps as any}
                            value={(value as string) || null}
                            onChange={handleChange}
                            groupBy={config.groupBy}
                            cleanable={true}
                            block
                            preventOverflow
                            placement={"auto"}
                        />
                    )}
                </div>
                {config.label && (
                    <label
                        className={cn('absolute left-0 z-10 origin-[0] text-muted-foreground duration-200', floating ? '-translate-y-3 scale-75' : 'translate-y-0 scale-100', error ? 'text-destructive' : floating ? 'text-primary' : 'text-muted-foreground', SIZE[config.size || 'md'])}>
                        {config.label}
                    </label>
                )}
                <div
                    className={cn('absolute bottom-0 left-1/2 h-px w-full -translate-x-1/2 scale-x-0 bg-foreground transition-transform duration-200', open && 'scale-x-100', error && 'bg-destructive')}/>
            </div>
            {renderBadge()}
            {(error || config.helper) &&
                <p className={cn('text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{error || config.helper}</p>}
        </div>
    )
}
