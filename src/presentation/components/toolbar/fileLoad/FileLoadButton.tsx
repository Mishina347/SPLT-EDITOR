import React from 'react'
import { loadTextFile, LoadedFile } from '../../../../usecases/file/loadTextFile'
import buttonStyles from '../../../shared/Button.module.css'
import styles from './FileLoadButton.module.css'

interface FileLoadButtonProps {
	onFileLoad: (content: string, fileName: string) => void
	disabled?: boolean
}

export const FileLoadButton: React.FC<FileLoadButtonProps> = ({ onFileLoad, disabled = false }) => {
	const handleFileLoad = async () => {
		try {
			const loadedFile: LoadedFile = await loadTextFile()
			onFileLoad(loadedFile.content, loadedFile.fileName)
		} catch (error) {
			console.error('ファイル読み込みエラー:', error)
			alert(`ファイルの読み込みに失敗しました: ${error}`)
		}
	}

	return (
		<button
			className={`${styles.fileLoadButton} ${buttonStyles.button} ${buttonStyles.buttonSecondary}`}
			onClick={handleFileLoad}
			disabled={disabled}
			aria-label="ファイルを読み込む"
		>
			📁 読込み
		</button>
	)
}
