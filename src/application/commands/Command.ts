import { logger } from '@/utils/logger'

// コマンドインターフェース
export interface Command {
	execute(): Promise<void>
	undo(): Promise<void>
	redo(): Promise<void>
	getDescription(): string
}

// 抽象コマンドクラス
export abstract class AbstractCommand implements Command {
	protected description: string
	protected executed: boolean = false

	constructor(description: string) {
		this.description = description
	}

	abstract execute(): Promise<void>
	abstract undo(): Promise<void>
	abstract redo(): Promise<void>

	getDescription(): string {
		return this.description
	}

	protected logExecution(action: string): void {
		logger.debug('Command', `${action}: ${this.description}`)
	}
}

// テキスト編集コマンド
export class TextEditCommand extends AbstractCommand {
	private oldText: string
	private newText: string
	private textUpdater: (text: string) => void

	constructor(oldText: string, newText: string, textUpdater: (text: string) => void) {
		super(`Text edit: ${oldText.length} → ${newText.length} characters`)
		this.oldText = oldText
		this.newText = newText
		this.textUpdater = textUpdater
	}

	async execute(): Promise<void> {
		this.textUpdater(this.newText)
		this.executed = true
		this.logExecution('Execute')
	}

	async undo(): Promise<void> {
		this.textUpdater(this.oldText)
		this.logExecution('Undo')
	}

	async redo(): Promise<void> {
		this.textUpdater(this.newText)
		this.logExecution('Redo')
	}
}

// 設定変更コマンド
export class SettingChangeCommand<T> extends AbstractCommand {
	private oldValue: T
	private newValue: T
	private settingUpdater: (value: T) => void
	private settingName: string

	constructor(settingName: string, oldValue: T, newValue: T, settingUpdater: (value: T) => void) {
		super(`Setting change: ${settingName}`)
		this.settingName = settingName
		this.oldValue = oldValue
		this.newValue = newValue
		this.settingUpdater = settingUpdater
	}

	async execute(): Promise<void> {
		this.settingUpdater(this.newValue)
		this.executed = true
		this.logExecution('Execute')
	}

	async undo(): Promise<void> {
		this.settingUpdater(this.oldValue)
		this.logExecution('Undo')
	}

	async redo(): Promise<void> {
		this.settingUpdater(this.newValue)
		this.logExecution('Redo')
	}
}

// ファイル操作コマンド
export class FileOperationCommand extends AbstractCommand {
	private operation: () => Promise<void>
	private reverseOperation: () => Promise<void>

	constructor(
		description: string,
		operation: () => Promise<void>,
		reverseOperation: () => Promise<void>
	) {
		super(description)
		this.operation = operation
		this.reverseOperation = reverseOperation
	}

	async execute(): Promise<void> {
		await this.operation()
		this.executed = true
		this.logExecution('Execute')
	}

	async undo(): Promise<void> {
		await this.reverseOperation()
		this.logExecution('Undo')
	}

	async redo(): Promise<void> {
		await this.operation()
		this.logExecution('Redo')
	}
}
