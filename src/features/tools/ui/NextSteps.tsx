import { useEffect, useMemo } from 'react'
import { go } from '../../../app/state'
import { setChainedFiles } from '../../../shared/files/handoff'
import { useT } from '../../../shared/i18n/I18n'
import { track } from '../../../shared/platform/analytics'
import { Icon } from '../../../shared/ui/Icon'
import type { CatalogTool } from '../core/catalog'
import { resultKind, suggestNextSteps } from '../core/nextSteps'
import { reportResult } from '../../../shared/files/screenContext'

/**
 * "¿Y ahora?" (W-110): al terminar una herramienta, hasta 3 sugerencias para seguir con el resultado. El archivo pasa
 * a la otra herramienta por `setChainedFiles` (la zona de carga lo recoge al abrirse), sin volver a elegirlo.
 */
export function NextSteps({ file, toolName }: { file: File; toolName: string }) {
  const { t } = useT()
  const steps = useMemo(() => suggestNextSteps(resultKind(file), toolName), [file, toolName])
  const open = (tool: CatalogTool, from = 'next_step_click') => {
    setChainedFiles([file])
    track(from, { from_tool: toolName, to_tool: tool.key })
    go(tool.section, tool.sub)
  }
  // W-151.7: el asistente también puede sugerir estos pasos (con el mismo traspaso del archivo).
  useEffect(() => {
    if (!steps.length) return
    reportResult({ toolName, kind: resultKind(file), open: (key) => {
      const tool = steps.find((s) => s.key === key)
      if (tool) open(tool, 'assistant_next_step')
    } })
    return () => reportResult(null)
  }, [steps, file, toolName])
  if (!steps.length) return null
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
