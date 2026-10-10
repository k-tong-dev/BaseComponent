'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * Odoo-style view context — a key-value dict passed to every view.
 *
 * Use it to:
 * - Set default field values (e.g. `default_status: 'draft'`)
 * - Control field visibility/readonly (e.g. `readonly_mode: true`)
 * - Pass data between views (e.g. `parent_id: 123`)
 * - Influence actions (e.g. `active_actions: ['confirm', 'cancel']`)
 *
 * Context can be set from URL params (`?context[default_status]=draft`),
 * from props, or programmatically via `setViewContext`.
 */
export interface ViewContextValue {
    [key: string]: any
}

const ViewContext = createContext<ViewContextValue>({})

export function ViewContextProvider({ value, children }: { value: ViewContextValue; children: ReactNode }) {
    return <ViewContext.Provider value={value}>{children}</ViewContext.Provider>
}

/**
 * Read the current view context. Returns a key-value dict that views and
 * actions can use to influence behavior.
 */
export function useViewContext(): ViewContextValue {
    return useContext(ViewContext)
}

/**
 * Merge partial context into the current context. Useful for setting context
 * from URL params or props.
 */
export function mergeViewContext(current: ViewContextValue, partial: ViewContextValue): ViewContextValue {
    return { ...current, ...partial }
}

/**
 * Parse context from URL search params.
 * Supports `?context[key]=value` format.
 */
export function parseContextFromSearchParams(searchParams: URLSearchParams): ViewContextValue {
    const context: ViewContextValue = {}
    for (const [key, value] of searchParams.entries()) {
        if (key.startsWith('context[') && key.endsWith(']')) {
            const ctxKey = key.slice(8, -1)
            // Try to parse as JSON, fallback to string
            try {
                context[ctxKey] = JSON.parse(value)
            } catch {
                context[ctxKey] = value
            }
        }
    }
    return context
}
