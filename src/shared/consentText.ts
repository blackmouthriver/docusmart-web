/**
 * Textos del banner de analítica en los 12 idiomas. Es pequeño a propósito: lo
 * usan la portada y las páginas de herramientas, que no cargan los diccionarios
 * de la app web. El idioma sale de <html lang>.
 */
export type ConsentText = {
  title: string
  body: string
  /** "Ahora mismo la tienes {state}." */
  current: string
  on: string
  off: string
  more: string
  deny: string
  accept: string
}

const TEXTS: Record<string, ConsentText> = {
  es: {
    title: 'Preferencias de analítica',
    body: 'Usamos Google Analytics (Firebase) para saber qué funciones se usan y mejorar DocuSmart. Nunca enviamos tus archivos ni su contenido.',
    current: 'Ahora mismo la tienes {state}.',
    on: 'activada',
    off: 'desactivada',
    more: 'Más información',
    deny: 'Rechazar',
    accept: 'Aceptar',
  },
  en: {
    title: 'Analytics preferences',
    body: 'We use Google Analytics (Firebase) to see which features are used and improve DocuSmart. We never send your files or their content.',
    current: 'It is currently {state}.',
    on: 'on',
    off: 'off',
    more: 'Learn more',
    deny: 'Decline',
    accept: 'Accept',
  },
  pt: {
    title: 'Preferências de análise',
    body: 'Usamos o Google Analytics (Firebase) para saber quais funções são usadas e melhorar o DocuSmart. Nunca enviamos seus arquivos nem o conteúdo deles.',
    current: 'Neste momento ela está {state}.',
    on: 'ativada',
    off: 'desativada',
    more: 'Mais informações',
    deny: 'Recusar',
    accept: 'Aceitar',
  },
  de: {
    title: 'Analyse-Einstellungen',
    body: 'Wir nutzen Google Analytics (Firebase), um zu sehen, welche Funktionen genutzt werden, und DocuSmart zu verbessern. Deine Dateien und ihr Inhalt werden nie gesendet.',
    current: 'Sie ist derzeit {state}.',
    on: 'aktiviert',
    off: 'deaktiviert',
    more: 'Mehr erfahren',
    deny: 'Ablehnen',
    accept: 'Akzeptieren',
  },
  ru: {
    title: 'Настройки аналитики',
    body: 'Мы используем Google Analytics (Firebase), чтобы понимать, какие функции используются, и улучшать DocuSmart. Мы никогда не отправляем ваши файлы и их содержимое.',
    current: 'Сейчас она {state}.',
    on: 'включена',
    off: 'выключена',
    more: 'Подробнее',
    deny: 'Отклонить',
    accept: 'Принять',
  },
  ja: {
    title: 'アナリティクスの設定',
    body: 'どの機能が使われているかを把握してDocuSmartを改善するため、Google Analytics（Firebase）を使用しています。ファイルやその内容を送信することはありません。',
    current: '現在は{state}です。',
    on: 'オン',
    off: 'オフ',
    more: '詳細',
    deny: '拒否',
    accept: '同意',
  },
  ko: {
    title: '분석 설정',
    body: '어떤 기능이 사용되는지 파악하고 DocuSmart를 개선하기 위해 Google Analytics(Firebase)를 사용합니다. 파일이나 그 내용은 절대 보내지 않습니다.',
    current: '현재 {state} 상태입니다.',
    on: '켜짐',
    off: '꺼짐',
    more: '자세히 알아보기',
    deny: '거부',
    accept: '동의',
  },
  zh: {
    title: '分析偏好设置',
    body: '我们使用 Google Analytics（Firebase）了解哪些功能被使用，以改进 DocuSmart。我们绝不会发送你的文件或其内容。',
    current: '当前为{state}。',
    on: '开启',
    off: '关闭',
    more: '了解更多',
    deny: '拒绝',
    accept: '接受',
  },
  it: {
    title: 'Preferenze di analisi',
    body: 'Usiamo Google Analytics (Firebase) per sapere quali funzioni vengono usate e migliorare DocuSmart. Non inviamo mai i tuoi file né il loro contenuto.',
    current: 'In questo momento è {state}.',
    on: 'attiva',
    off: 'disattivata',
    more: 'Maggiori informazioni',
    deny: 'Rifiuta',
    accept: 'Accetta',
  },
  fr: {
    title: "Préférences d'analyse",
    body: 'Nous utilisons Google Analytics (Firebase) pour savoir quelles fonctions sont utilisées et améliorer DocuSmart. Nous n’envoyons jamais vos fichiers ni leur contenu.',
    current: 'Elle est actuellement {state}.',
    on: 'activée',
    off: 'désactivée',
    more: 'En savoir plus',
    deny: 'Refuser',
    accept: 'Accepter',
  },
  ca: {
    title: "Preferències d'analítica",
    body: 'Fem servir Google Analytics (Firebase) per saber quines funcions es fan servir i millorar DocuSmart. Mai no enviem els teus fitxers ni el seu contingut.',
    current: 'Ara mateix la tens {state}.',
    on: 'activada',
    off: 'desactivada',
    more: 'Més informació',
    deny: 'Rebutjar',
    accept: 'Acceptar',
  },
  eu: {
    title: 'Analitika-hobespenak',
    body: 'Google Analytics (Firebase) erabiltzen dugu zein funtzio erabiltzen diren jakiteko eta DocuSmart hobetzeko. Ez ditugu inoiz zure fitxategiak edo haien edukia bidaltzen.',
    current: 'Une honetan {state} dago.',
    on: 'aktibatuta',
    off: 'desaktibatuta',
    more: 'Informazio gehiago',
    deny: 'Ukatu',
    accept: 'Onartu',
  },
}

/** Textos para un código de idioma ("en", "en-GB"…); si no lo hay, en español. */
export function consentText(lang: string | null | undefined): ConsentText {
  const base = (lang ?? '').toLowerCase().split('-')[0]
  return TEXTS[base] ?? TEXTS.es
}

export const CONSENT_LANGS = Object.keys(TEXTS)
