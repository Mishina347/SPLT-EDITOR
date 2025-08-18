import * as monaco from 'monaco-editor'
import { EditorTheme } from '../domain/theme/EditorTheme'

export class MonacoThemeService {
	static defineTheme(theme: EditorTheme) {
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
				'editor.foreground': '#000000', // 文字色
				'editor.background': '#000000', // 行背景も同じ色
			},
		})

		monaco.editor.setTheme('myCustomTheme')
	}
}
