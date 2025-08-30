// 既存のエクスポート（依存関係の少ないものから）
export { Diff2HtmlAdapter } from './Diff2HtmlAdapter'
export { PaginationService } from './PaginationService'
export { DocxExporter } from './docx/DocxExporter'

// 依存性注入
export { container, Injectable, Inject } from './di/Container'
export { serviceFactory } from './factories/ServiceFactory'

// コマンドパターン
export type {Command} from '../application/commands/Command'
export {
	AbstractCommand,
	TextEditCommand,
	SettingChangeCommand,
	FileOperationCommand,
} from '../application/commands/Command'
export { commandManager } from '../application/commands/CommandManager'

// オブザーバーパターン
export { EventBus, eventBus, EVENTS } from '../application/observers/EventBus'
