/**
 * "Abrir con DocuSmart Desktop" (W-150.4): los archivos que el sistema le pasa a la app instalada (desde el
 * Explorador, el Finder o el gestor de archivos de Linux) y las herramientas que sirven para ellos. Al elegir una,
 * el archivo pasa a esa herramienta como si el usuario lo hubiera elegido (W-110).
 */
import { useEffect, useMemo, useState } from 'react'
import { go } from '../../../app/state'
import { OPENED_FILES_EVENT, clearOpenedFiles, peekOpenedFiles, setChainedFiles } from '../../../shared/files/handoff'
import { useT } from '../../../shared/i18n/I18n'
import { track } from '../../../shared/platform/analytics'
import { FileRow, HeroCard, Notice } from '../../../shared/ui/ui'
import { Icon } from '../../../shared/ui/Icon'
import type { CatalogTool } from '../core/catalog'
import { openWithTools, resultKind } from '../core/nextSteps'

export function OpenWith() {
  const { t } = useT()
  const [files, setFiles] = useState<File[]>(peekOpenedFiles)
  // Otro archivo abierto mientras esta pantalla ya estaba a la vista.
  useEffect(() => {
    const update = () => setFiles(peekOpenedFiles())
    window.addEventListener(OPENED_FILES_EVENT, update)
    return () => window.removeEventListener(OPENED_FILES_EVENT, update)
  }, [])
  const tools = useMemo(() => openWithTools(files), [files])

  const open = (tool: CatalogTool) => {
    setChainedFiles(files)
    clearOpenedFiles()
    track('open_with', { to_tool: tool.key, kind: resultKind(files[0]), count: files.length })
    go(tool.section, tool.sub)
  }

  return (
    <div className="stack">
      <HeroCard title={t('open.title')} subtitle={t(files.length > 1 ? 'open.subtitleMany' : 'open.subtitle')} />
      {!files.length ? (
        <Notice kind="plain">{t('open.none')}</Notice>
      ) : (
        <div className="card stack">
          <ul className="file-list">
            {files.map((f, i) => (
              <FileRow key={i} file={f} />
            ))}
          </ul>
          {tools.length ? (
            <div className="next-steps-list">
              {tools.map((tool) => (
                <button key={tool.key} type="button" className="btn btn-outline next-step" onClick={() => open(tool)}>
                  <Icon name={tool.icon} />
                  {t(tool.name)}
                </button>
              ))}
            </div>
          ) : (
            <Notice kind="plain">{t('open.unsupported')}</Notice>
          )}
        </div>
      )}
      <button type="button" className="btn btn-ghost" onClick={() => go('herramientas')}>
        <Icon name="grid" />
        {t('open.all')}
      </button>
    </div>
  )
}
