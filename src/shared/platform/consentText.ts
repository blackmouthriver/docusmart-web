/**
 * Textos del banner de analítica (y de publicidad, W-90) en los 12 idiomas. Es pequeño a propósito: lo
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
  /** Enlace a la política, con texto descriptivo (SEO: nada de "Más información"). */
  more: string
  deny: string
  accept: string
  /** Título y texto cuando los anuncios están activos (W-90): el aviso cubre analítica y publicidad. */
  adsTitle: string
  adsBody: string
}

const TEXTS: Record<string, ConsentText> = {
  es: {
    title: 'Preferencias de analítica',
    body: 'Usamos Google Analytics (Firebase) para saber qué funciones se usan y mejorar DocuSmart. Nunca enviamos tus archivos ni su contenido.',
    current: 'Ahora mismo la tienes {state}.',
    on: 'activada',
    off: 'desactivada',
    more: 'Lee la política de privacidad',
    deny: 'Rechazar',
    accept: 'Aceptar',
    adsTitle: 'Privacidad y cookies',
    adsBody: 'Usamos Google Analytics (Firebase) para mejorar DocuSmart y Google AdSense para mostrar anuncios que mantienen la web gratis; ambos usan cookies. Nunca enviamos tus archivos ni su contenido.',
  },
  en: {
    title: 'Analytics preferences',
    body: 'We use Google Analytics (Firebase) to see which features are used and improve DocuSmart. We never send your files or their content.',
    current: 'It is currently {state}.',
    on: 'on',
    off: 'off',
    more: 'Read the privacy policy',
    deny: 'Decline',
    accept: 'Accept',
    adsTitle: 'Privacy and cookies',
    adsBody: 'We use Google Analytics (Firebase) to improve DocuSmart and Google AdSense to show ads that keep the site free; both use cookies. We never send your files or their content.',
  },
  pt: {
    title: 'Preferências de análise',
    body: 'Usamos o Google Analytics (Firebase) para saber quais funções são usadas e melhorar o DocuSmart. Nunca enviamos seus arquivos nem o conteúdo deles.',
    current: 'Neste momento ela está {state}.',
    on: 'ativada',
    off: 'desativada',
    more: 'Leia a política de privacidade',
    deny: 'Recusar',
    accept: 'Aceitar',
    adsTitle: 'Privacidade e cookies',
    adsBody: 'Usamos o Google Analytics (Firebase) para melhorar o DocuSmart e o Google AdSense para exibir anúncios que mantêm o site gratuito; ambos usam cookies. Nunca enviamos seus arquivos nem o conteúdo deles.',
  },
  de: {
    title: 'Analyse-Einstellungen',
    body: 'Wir nutzen Google Analytics (Firebase), um zu sehen, welche Funktionen genutzt werden, und DocuSmart zu verbessern. Deine Dateien und ihr Inhalt werden nie gesendet.',
    current: 'Sie ist derzeit {state}.',
    on: 'aktiviert',
    off: 'deaktiviert',
    more: 'Datenschutzerklärung lesen',
    deny: 'Ablehnen',
    accept: 'Akzeptieren',
    adsTitle: 'Datenschutz und Cookies',
    adsBody: 'Wir nutzen Google Analytics (Firebase), um DocuSmart zu verbessern, und Google AdSense für Anzeigen, die die Website kostenlos halten; beide verwenden Cookies. Deine Dateien und ihr Inhalt werden nie gesendet.',
  },
  ru: {
    title: 'Настройки аналитики',
    body: 'Мы используем Google Analytics (Firebase), чтобы понимать, какие функции используются, и улучшать DocuSmart. Мы никогда не отправляем ваши файлы и их содержимое.',
    current: 'Сейчас она {state}.',
    on: 'включена',
    off: 'выключена',
    more: 'Политика конфиденциальности',
    deny: 'Отклонить',
    accept: 'Принять',
    adsTitle: 'Конфиденциальность и cookie',
    adsBody: 'Мы используем Google Analytics (Firebase), чтобы улучшать DocuSmart, и Google AdSense для рекламы, благодаря которой сайт остаётся бесплатным; оба используют cookie. Мы никогда не отправляем ваши файлы и их содержимое.',
  },
  ja: {
    title: 'アナリティクスの設定',
    body: 'どの機能が使われているかを把握してDocuSmartを改善するため、Google Analytics（Firebase）を使用しています。ファイルやその内容を送信することはありません。',
    current: '現在は{state}です。',
    on: 'オン',
    off: 'オフ',
    more: 'プライバシーポリシーを読む',
    deny: '拒否',
    accept: '同意',
    adsTitle: 'プライバシーとCookie',
    adsBody: 'DocuSmartの改善にGoogle Analytics（Firebase）を、サイトを無料で提供するための広告表示にGoogle AdSenseを使用しています。どちらもCookieを使用します。ファイルやその内容を送信することはありません。',
  },
  ko: {
    title: '분석 설정',
    body: '어떤 기능이 사용되는지 파악하고 DocuSmart를 개선하기 위해 Google Analytics(Firebase)를 사용합니다. 파일이나 그 내용은 절대 보내지 않습니다.',
    current: '현재 {state} 상태입니다.',
    on: '켜짐',
    off: '꺼짐',
    more: '개인정보 처리방침 보기',
    deny: '거부',
    accept: '동의',
    adsTitle: '개인정보 및 쿠키',
    adsBody: 'DocuSmart 개선을 위해 Google Analytics(Firebase)를, 사이트를 무료로 유지하는 광고 표시를 위해 Google AdSense를 사용합니다. 둘 다 쿠키를 사용합니다. 파일이나 그 내용은 절대 보내지 않습니다.',
  },
  zh: {
    title: '分析偏好设置',
    body: '我们使用 Google Analytics（Firebase）了解哪些功能被使用，以改进 DocuSmart。我们绝不会发送你的文件或其内容。',
    current: '当前为{state}。',
    on: '开启',
    off: '关闭',
    more: '阅读隐私政策',
    deny: '拒绝',
    accept: '接受',
    adsTitle: '隐私与 Cookie',
    adsBody: '我们使用 Google Analytics（Firebase）改进 DocuSmart，并使用 Google AdSense 展示让本站保持免费的广告；两者都会使用 Cookie。我们绝不会发送你的文件或其内容。',
  },
  it: {
    title: 'Preferenze di analisi',
    body: 'Usiamo Google Analytics (Firebase) per sapere quali funzioni vengono usate e migliorare DocuSmart. Non inviamo mai i tuoi file né il loro contenuto.',
    current: 'In questo momento è {state}.',
    on: 'attiva',
    off: 'disattivata',
    more: 'Leggi la privacy policy',
    deny: 'Rifiuta',
    accept: 'Accetta',
    adsTitle: 'Privacy e cookie',
    adsBody: 'Usiamo Google Analytics (Firebase) per migliorare DocuSmart e Google AdSense per mostrare annunci che mantengono il sito gratuito; entrambi usano cookie. Non inviamo mai i tuoi file né il loro contenuto.',
  },
  fr: {
    title: "Préférences d'analyse",
    body: 'Nous utilisons Google Analytics (Firebase) pour savoir quelles fonctions sont utilisées et améliorer DocuSmart. Nous n’envoyons jamais vos fichiers ni leur contenu.',
    current: 'Elle est actuellement {state}.',
    on: 'activée',
    off: 'désactivée',
    more: 'Lire la politique de confidentialité',
    deny: 'Refuser',
    accept: 'Accepter',
    adsTitle: 'Confidentialité et cookies',
    adsBody: 'Nous utilisons Google Analytics (Firebase) pour améliorer DocuSmart et Google AdSense pour afficher des annonces qui gardent le site gratuit ; tous deux utilisent des cookies. Nous n’envoyons jamais vos fichiers ni leur contenu.',
  },
  ca: {
    title: "Preferències d'analítica",
    body: 'Fem servir Google Analytics (Firebase) per saber quines funcions es fan servir i millorar DocuSmart. Mai no enviem els teus fitxers ni el seu contingut.',
    current: 'Ara mateix la tens {state}.',
    on: 'activada',
    off: 'desactivada',
    more: 'Llegeix la política de privacitat',
    deny: 'Rebutjar',
    accept: 'Acceptar',
    adsTitle: 'Privacitat i galetes',
    adsBody: 'Fem servir Google Analytics (Firebase) per millorar DocuSmart i Google AdSense per mostrar anuncis que mantenen el web gratuït; tots dos fan servir galetes. Mai no enviem els teus fitxers ni el seu contingut.',
  },
  eu: {
    title: 'Analitika-hobespenak',
    body: 'Google Analytics (Firebase) erabiltzen dugu zein funtzio erabiltzen diren jakiteko eta DocuSmart hobetzeko. Ez ditugu inoiz zure fitxategiak edo haien edukia bidaltzen.',
    current: 'Une honetan {state} dago.',
    on: 'aktibatuta',
    off: 'desaktibatuta',
    more: 'Irakurri pribatutasun-politika',
    deny: 'Ukatu',
    accept: 'Onartu',
    adsTitle: 'Pribatutasuna eta cookieak',
    adsBody: 'Google Analytics (Firebase) erabiltzen dugu DocuSmart hobetzeko eta Google AdSense webgunea doan mantentzen duten iragarkiak erakusteko; biek cookieak erabiltzen dituzte. Ez ditugu inoiz zure fitxategiak edo haien edukia bidaltzen.',
  },
}

/** Textos para un código de idioma ("en", "en-GB"…); si no lo hay, en español. */
export function consentText(lang: string | null | undefined): ConsentText {
  const base = (lang ?? '').toLowerCase().split('-')[0]
  return TEXTS[base] ?? TEXTS.es
}

export const CONSENT_LANGS = Object.keys(TEXTS)
