'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {Input, InputNumber, Loader, NumberInput, SelectPicker, Textarea, Toggle} from 'rsuite'
import { showToast } from '@/lib/ui/toast'
import { ConfigField, ConfigSection, ConfigView, useSettingsConfigQuery } from '@/components/Base/Settings'
import { useRegisterSettingsActions } from '@/components/Base/Settings/actions'
import { useTranslate } from '@/components/Base/i18n'
import { useDebugValue } from '@/components/Base/Debug'
import type {
  SettingApp,
  SettingField,
  SettingViewApi,
  SettingViewConfig,
} from './types'

/** JSON-safe deep copy — settings payloads are plain JSON. */
const clone = <T,>(value: T): T =>
  value == null ? value : (JSON.parse(JSON.stringify(value)) as T)

function getByPath(source: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc == null ? undefined : (acc as Record<string, unknown>)[part],
      source,
    )
}

/** Mutating helper — always call on a clone. Creats missing intermediate objects. */
function setAtPath(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split('.')
  let cur: Record<string, unknown> = target
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    const next = cur[part]
    if (next == null || typeof next !== 'object') cur[part] = {}
    cur = cur[part] as Record<string, unknown>
  }
  cur[parts[parts.length - 1]] = value
  return target
}

/**
 * Whitelist payload: only config-declared keys go out on save — never stray
 * columns the GET envelope happened to include.
 *
 * Non-dotted keys are sent individually (undefined = untouched, skipped so the
 * server keeps its value). Dotted keys (`message_templates.order_created`)
 * mean "this object is one config field": the whole root object is serialized,
 * so editing one leaf never drops sibling leaves the PUT would otherwise wipe.
 */
function collectConfigFields(
  apps: SettingApp[],
  form: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  const nestedRoots = new Set<string>()

  for (const app of apps) {
    for (const block of app.blocks) {
      for (const field of block.settings) {
        if (field.key.includes('.')) {
          nestedRoots.add(field.key.split('.')[0])
          continue
        }
        const value = getByPath(form, field.key)
        if (value !== undefined) payload[field.key] = value
      }
    }
  }

  for (const root of nestedRoots) {
    const value = form[root]
    if (value !== undefined && value !== null) payload[root] = value
  }

  return payload
}

function SettingFieldControl({
  field,
  api,
}: {
  field: SettingField
  api: SettingViewApi
}) {
  const translate = useTranslate()
  const value = getByPath(api.form, field.key)
  const onChange = (next: unknown) => api.set(field.key, next)

  const control = (() => {
    switch (field.type) {
      case 'password':
        return (
          <Input
            type="password"
            value={(value as string) ?? ''}
            onChange={(v) => onChange(v)}
            placeholder={field.placeholder}
            {...field.inputProps}
          />
        )
      case 'text':
        return (
          <Textarea
            rows={3}
            value={(value as string) ?? ''}
            onChange={(v) => onChange(v)}
            placeholder={field.placeholder}
          />
        )
      case 'boolean':
        return (
          <Toggle
            color={"violet"}
            checked={Boolean(value)}
            onChange={(v) => onChange(v)}
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        )
      case 'number':
        return (
          <NumberInput
            value={(value as number) ?? null}
            onChange={(v:any) => onChange(v)}
          />
        )
      case 'selection':
        return (
          <SelectPicker
            data={(field.options ?? []).map((o) => ({ label: o.label, value: o.value }))}
            value={(value as string) ?? null}
            onChange={(v) => onChange(v)}
            searchable={false}
            cleanable={false}
            style={{ width: '100%' }}
          />
        )
      default:
        return (
          <Input
            value={(value as string) ?? ''}
            onChange={(v) => onChange(v)}
            placeholder={field.placeholder}
          />
        )
    }
  })()

  return (
    <ConfigField
      label={translate(field.string)}
      required={field.required}
      hint={field.help ? translate(field.help) : field.help}
    >
      {control}
    </ConfigField>
  )
}

/**
 * Config-driven Odoo-style settings view.
 *
 * The config declares apps → blocks → settings (`SettingViewConfig`), the
 * component loads GET / saves PUT against `apiEndpoint`, tracks dirty state,
 * and publishes Save/Discard to the shell's action bar — so a settings page is
 * just `<SettingView config={…} />`.
 */
export function SettingView({ config }: { config: SettingViewConfig }) {
  const { apiEndpoint, apps, title } = config
  const translate = useTranslate()
  const query = useSettingsConfigQuery()
  /** While a search is active only matching sections are shown — the config
   *  footer (e.g. a Test button) is chrome, not a setting, so detach it. */
  const searching = query.trim().length > 0

  const [form, setForm] = useState<Record<string, unknown>>({})
  const [saved, setSaved] = useState<Record<string, unknown>>({})
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busy, setBusyState] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoaded(false)
    fetch(apiEndpoint, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return
        const next = clone((data?.data ?? {}) as Record<string, unknown>)
        setForm(next)
        setSaved(next)
      })
      .catch(() => {
        if (!cancelled)
          showToast(
            'error',
            translate('Could not load settings'),
            translate('The settings could not be read.'),
          )
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [apiEndpoint, translate])

  const dirty = JSON.stringify(form) !== JSON.stringify(saved)

  // Publish settings state to the Base DebugPanel (no-op unless debug is on).
  useDebugValue('view-context', {
    title: apps[0]?.string ?? title ?? 'Settings',
    apiEndpoint,
    blockCount: apps.flatMap((a) => a.blocks).length,
    fieldCount: apps.flatMap((a) => a.blocks).flatMap((b) => b.settings).length,
    dirty,
    saving,
    busy,
    loaded,
  })
  useDebugValue('view-state', {
    form,
    saved,
    dirtyKeys: Object.keys(form).filter((k) => JSON.stringify(form[k]) !== JSON.stringify(saved[k])),
  })

  const set = useCallback((key: string, value: unknown) => {
    setForm((prev) => setAtPath(clone(prev), key, value))
  }, [])

  const save = useCallback(
    async (options?: { silent?: boolean }) => {
      setSaving(true)
      try {
        const res = await fetch(apiEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(collectConfigFields(apps, form)),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.success) throw new Error(data.error || 'save failed')
        setSaved(clone(form))
        if (!options?.silent)
          showToast('success', translate('Settings saved'), translate('New settings apply immediately.'))
        return true
      } catch {
        showToast('error', translate('Could not save'), translate('The settings were not updated.'))
        return false
      } finally {
        setSaving(false)
      }
    },
    [apiEndpoint, apps, form, translate],
  )

  const discard = useCallback(() => {
    setForm(clone(saved))
    showToast('info', translate('Changes discarded'))
  }, [saved, translate])

  const setBusy = useCallback((value: boolean) => setBusyState(value), [])

  const api = useMemo<SettingViewApi>(
    () => ({ form, saved, dirty, saving, busy, set, save, discard, setBusy }),
    [form, saved, dirty, saving, busy, set, save, discard, setBusy],
  )

  useRegisterSettingsActions(
    loaded
      ? {
          label: translate(title ?? apps[0]?.string ?? 'Settings'),
          save: () => void save(),
          discard,
          dirty,
          saving,
          busy,
        }
      : null,
  )

  if (!loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader center content={translate('Loading...')} vertical />
      </div>
    )
  }

  return (
    <ConfigView>
      {apps
        .flatMap((app) => app.blocks)
        .map((block) => (
          <ConfigSection
            key={block.key}
            title={translate(block.string)}
            description={block.help ? translate(block.help) : block.help}
          >
            <div className={block.columns === 1 ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
              {block.settings.map((field) => (
                <SettingFieldControl key={field.key} field={field} api={api} />
              ))}
            </div>
          </ConfigSection>
        ))}
      {!searching && config.footer && <div className="px-4 py-3">{config.footer(api)}</div>}
    </ConfigView>
  )
}