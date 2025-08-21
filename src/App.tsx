import { FilesystemNoteRepository } from './adapters'
import { EditorPage } from './presentation/pages/MainLayout'
import { Settings } from './domain'
import './useMonacoWorker'

// create instances
const repo = new FilesystemNoteRepository()

type AppProps = {
	initSettings: Settings
}

export default function App({ initSettings }: AppProps) {
	return <EditorPage initSettings={initSettings} />
}
