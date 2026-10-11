/**
 * Clipboard helper for Base.
 *
 * `navigator.clipboard.writeText()` is rejected whenever the page is not
 * focused, the document is in an insecure context, or the browser denies the
 * Clipboard API permission ("Failed to execute 'writeText' on 'Clipboard':
 * Write permission denied") — common inside embedded webviews and some
 * in-app browsers. Copying must still work there, so we fall back to the
 * legacy hidden-textarea + `execCommand('copy')` path.
 *
 * Returns `true` when the text was actually copied, so callers can decide
 * whether to show a success or a failure toast.
 */

/** Copy `text` to the clipboard, with a legacy fallback. */
export async function copyText(text: string): Promise<boolean> {
  const value = String(text ?? '')

  // Preferred path — async Clipboard API (requires a secure context).
  if (value) {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(value)
        return true
      }
    } catch {
      /* denied / unfocused / insecure context — fall through */
    }
  }

  // Fallback — select the text in a transient textarea and copy it.
  try {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '-9999px'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'
    document.body.appendChild(textarea)

    const selection = document.getSelection()
    const previousRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

    textarea.focus({ preventScroll: true })
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)

    const copied = document.execCommand('copy')

    document.body.removeChild(textarea)

    // Restore the user's previous selection so we leave no trace.
    if (previousRange && selection) {
      selection.removeAllRanges()
      selection.addRange(previousRange)
    }

    return copied
  } catch {
    return false
  }
}
