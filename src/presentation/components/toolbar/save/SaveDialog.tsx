import React, { useState, useRef, useEffect } from 'react'
import { Dialog } from '../../../shared'
import styles from './SaveDialog.module.css'

interface SaveDialogProps {
	isOpen: boolean
	onClose: () => void
	onSave: (fileName: string) => Promise<void>
	currentText: string
}

export const SaveDialog: React.FC<SaveDialogProps> = ({
	isOpen,
	onClose,
	onSave,
	currentText,
}) => {
	const [fileName, setFileName] = useState('untitled.txt')
	const [isSaving, setIsSaving] = useState(false)
	const inputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (isOpen && inputRef.current) {
			// ダイアログが開いたらファイル名入力欄にフォーカス
			setTimeout(() => {
				inputRef.current?.focus()
				inputRef.current?.select()
			}, 100)
		}
	}, [isOpen])

	const handleSave = async () => {
		if (!fileName.trim()) {
			alert('ファイル名を入力してください')
			return
		}

		setIsSaving(true)
		try {
			await onSave(fileName.trim())
			onClose()
		} catch (error) {
			alert(error instanceof Error ? error.message : 'ファイルの保存に失敗しました')
		} finally {
			setIsSaving(false)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSave()
		} else if (e.key === 'Escape') {
			e.preventDefault()
			onClose()
		}
	}

	return (
		<Dialog
			isOpen={isOpen}
			onClose={onClose}
			title="ファイルを保存"
			constrainToContainer={true}
			maxWidth="520px"
		>
			<div className={styles.saveDialogContainer} onClick={e => e.stopPropagation()}>
				<div className={styles.saveDialogContent}>
					<label htmlFor="fileName" className={styles.label}>
						ファイル名
					</label>
					<input
						ref={inputRef}
						id="fileName"
						type="text"
						value={fileName}
						onChange={e => setFileName(e.target.value)}
						onKeyDown={handleKeyDown}
						className={styles.input}
						placeholder="untitled.txt"
						disabled={isSaving}
					/>
					<div className={styles.buttonGroup}>
						<button
							className={styles.buttonSecondary}
							onClick={onClose}
							disabled={isSaving}
						>
							キャンセル
						</button>
						<button
							className={styles.buttonPrimary}
							onClick={handleSave}
							disabled={isSaving || !fileName.trim()}
						>
							{isSaving ? '保存中...' : '保存'}
						</button>
					</div>
				</div>
			</div>
		</Dialog>
	)
}
