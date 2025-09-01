import { logger } from '@/utils/logger'
import { Command } from './Command'

// コマンドマネージャー
export class CommandManager {
	private static instance: CommandManager
	private undoStack: Command[] = []
	private redoStack: Command[] = []
	private maxStackSize: number = 50

	private constructor() {}

	static getInstance(): CommandManager {
		if (!CommandManager.instance) {
			CommandManager.instance = new CommandManager()
		}
		return CommandManager.instance
	}

	// コマンドを実行
	async executeCommand(command: Command): Promise<void> {
		try {
			await command.execute()
			this.undoStack.push(command)

			// スタックサイズを制限
			if (this.undoStack.length > this.maxStackSize) {
				this.undoStack.shift()
			}

			// 新しいコマンドが実行されたらredoスタックをクリア
			this.redoStack = []

			logger.debug('CommandManager', `Command executed: ${command.getDescription()}`)
		} catch (error) {
			logger.error('CommandManager', 'Failed to execute command', error)
			throw error
		}
	}

	// undoを実行
	async undo(): Promise<boolean> {
		if (this.undoStack.length === 0) {
			logger.debug('CommandManager', 'No commands to undo')
			return false
		}

		const command = this.undoStack.pop()!
		try {
			await command.undo()
			this.redoStack.push(command)
			logger.debug('CommandManager', `Undo executed: ${command.getDescription()}`)
			return true
		} catch (error) {
			logger.error('CommandManager', 'Failed to undo command', error)
			// エラーが発生した場合はundoスタックに戻す
			this.undoStack.push(command)
			throw error
		}
	}

	// redoを実行
	async redo(): Promise<boolean> {
		if (this.redoStack.length === 0) {
			logger.debug('CommandManager', 'No commands to redo')
			return false
		}

		const command = this.redoStack.pop()!
		try {
			await command.redo()
			this.undoStack.push(command)
			logger.debug('CommandManager', `Redo executed: ${command.getDescription()}`)
			return true
		} catch (error) {
			logger.error('CommandManager', 'Failed to redo command', error)
			// エラーが発生した場合はredoスタックに戻す
			this.redoStack.push(command)
			throw error
		}
	}

	// 複数のコマンドを一括実行
	async executeCommands(commands: Command[]): Promise<void> {
		const compositeCommand = new CompositeCommand(commands)
		await this.executeCommand(compositeCommand)
	}

	// undo可能かチェック
	canUndo(): boolean {
		return this.undoStack.length > 0
	}

	// redo可能かチェック
	canRedo(): boolean {
		return this.redoStack.length > 0
	}

	// スタックの状態を取得
	getStackInfo(): { undoCount: number; redoCount: number } {
		return {
			undoCount: this.undoStack.length,
			redoCount: this.redoStack.length,
		}
	}

	// スタックをクリア
	clear(): void {
		this.undoStack = []
		this.redoStack = []
		logger.debug('CommandManager', 'Command stacks cleared')
	}

	// 最大スタックサイズを設定
	setMaxStackSize(size: number): void {
		this.maxStackSize = size
		logger.debug('CommandManager', `Max stack size set to: ${size}`)
	}
}

// 複合コマンド（複数のコマンドをまとめて実行）
export class CompositeCommand implements Command {
	private commands: Command[]

	constructor(commands: Command[]) {
		this.commands = commands
	}

	async execute(): Promise<void> {
		for (const command of this.commands) {
			await command.execute()
		}
	}

	async undo(): Promise<void> {
		// 逆順でundoを実行
		for (let i = this.commands.length - 1; i >= 0; i--) {
			await this.commands[i].undo()
		}
	}

	async redo(): Promise<void> {
		for (const command of this.commands) {
			await command.redo()
		}
	}

	getDescription(): string {
		return `Composite command: ${this.commands.length} operations`
	}
}

// グローバルコマンドマネージャーインスタンス
export const commandManager = CommandManager.getInstance()
