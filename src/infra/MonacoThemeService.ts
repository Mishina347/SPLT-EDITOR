import * as monaco from 'monaco-editor'
import { EditorTheme } from '../domain/theme/EditorTheme'
import { saveThemeSettings } from '../utils/themeManager'

export class MonacoThemeService {
	static async defineTheme(theme: EditorTheme) {
		monaco.editor.defineTheme('myCustomTheme', {
			base: 'vs-dark',
			inherit: true,
			rules: [
				{
					token: '',
					foreground: theme.foreground.replace('#', ''),
					background: theme.background.replace('#', ''),
				},
				{ token: 'keyword', foreground: theme.keyword.replace('#', '') },
				{ token: 'string', foreground: theme.string.replace('#', '') },
				{ token: 'comment', foreground: theme.comment.replace('#', '') },
			],
			colors: {
				'editor.foreground': theme.foreground,
				'editor.background': theme.background,
			},
		})

		monaco.editor.setTheme('myCustomTheme')

		// テーマ変更時に設定を保存
		await saveThemeSettings(theme)
	}
}
