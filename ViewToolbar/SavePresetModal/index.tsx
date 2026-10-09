'use client'

import {useCallback, type KeyboardEvent} from 'react'
import {Modal} from '@/components/ui/modal'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Popover, Whisper} from 'rsuite'
import {Bookmark, Info} from "lucide-react";

export interface SavePresetModalProps {
    open: boolean
    presetName: string
    onPresetNameChange: (name: string) => void
    onSave: () => void
    onClose: () => void
}

export function SavePresetModal({open, presetName, onPresetNameChange, onSave, onClose}: SavePresetModalProps) {
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') onSave()
    }, [onSave])

    return (
        <Modal open={open} backdrop="static" onClose={onClose}>
            <Modal.Header>
                <Modal.Title>
                    <span className="inline-flex items-center gap-2">
                        <Bookmark size={16} color="orange"/>
                        Save View Preset
                        <Whisper trigger="click" placement="top" speaker={
                            <Popover className="!p-3">
                                <p className="text-xs text-muted-foreground m-0">Name your current view configuration so you can reload it later.</p>
                            </Popover>
                        }>
                            <button type="button" className="inline-flex text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                <Info size={14}/>
                            </button>
                        </Whisper>
                    </span>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Input
                    placeholder="e.g. Default product list"
                    value={presetName}
                    onChange={(e) => onPresetNameChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    fullWidth={true}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button onClick={onClose} appearance="default">
                    Cancel
                </Button>
                <Button
                    onClick={onSave}
                    appearance="primary"
                    color="violet"
                >
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    )
}
