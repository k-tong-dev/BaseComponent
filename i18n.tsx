'use client'

import * as React from 'react'

/**
 * Lightweight i18n bridge for Base components.
 *
 * The Base library must stay self-contained (it is mirrored to the
 * BaseComponent repo), so it does NOT import the app's I18n provider.
 * Instead the app injects its `t()` function here (see how the root
 * layout / I18nProvider wraps children with `<BaseI18nProvider>`).
 *
 * When no provider is mounted, `useTranslate` returns an identity
 * translator, so every label gracefully falls back to the English key.
 */

export type TranslateFn = (key: string, vars?: Record<string, string | number>) => string

const BaseI18nContext = React.createContext<TranslateFn | null>(null)

export function BaseI18nProvider({
  translate,
  children,
}: {
  translate: TranslateFn
  children: React.ReactNode
}) {
  return <BaseI18nContext.Provider value={translate}>{children}</BaseI18nContext.Provider>
}

/** Safe translator: uses the injected `t()` or falls back to the key itself. */
export function useTranslate(): TranslateFn {
  const translate = React.useContext(BaseI18nContext)
  return translate ?? ((key: string) => key)
}