import { useMemo } from 'react'
import { go } from '../../../app/state'
import { setChainedFiles } from '../../../shared/files/handoff'
import { useT } from '../../../shared/i18n/I18n'
import { track } from '../../../shared/platform/analytics'
import { Icon } from '../../../shared/ui/Icon'
import type { CatalogTool } from '../core/catalog'
import { resultKind, suggestNextSteps } from '../core/nextSteps'

/**
 * "¿Y ahora?" (W-110): al terminar una herramienta, hasta 3 sugerencias para seguir con el resultado. El archivo pasa
 * a la otra herramienta por `setChainedFiles` (la zona de carga lo recoge al abrirse), sin volver a elegirlo.
 */
export function NextSteps({ file, toolName }: { file: File; toolName: string }) {
  const { t } = useT()
  const steps = useMemo(() => suggestNextSteps(resultKind(file), toolName), [file, toolName])
  if (!steps.length) return null
  const open = (tool: CatalogTool) => {
    setChainedFiles([file])
    track('next_step_click', { from_tool: toolName, to_tool: tool.key })
    go(tool.section, tool.sub)
  }
  return (
    <section className="next-steps" aria-label={t('next.title')}>
      <h3>{t('next.title')}</h3>
      <p className="faint">{t('next.hint')}</p>
      <div className="next-steps-list">
        {steps.map((tool) => (
          <button key={tool.key} type="button" className="btn btn-outline next-step" title={t('next.open', { name: t(tool.name) })} onClick={() => open(tool)}>
            <Icon name={tool.icon} />
            {t(tool.name)}
          </button>
        ))}
      </div>
    </section>
  )
}
