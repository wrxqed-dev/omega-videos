const timeStrings = {
  en: {
    justNow: 'just now',
    minute: ['minute', 'minutes'],
    hour: ['hour', 'hours'],
    day: ['day', 'days'],
    week: ['week', 'weeks'],
    month: ['month', 'months'],
    year: ['year', 'years'],
    ago: 'ago',
    min: 'min',
    h: 'h',
    d: 'd',
    w: 'w'
  },
  ru: {
    justNow: 'только что',
    minute: ['минуту', 'минуты', 'минут'],
    hour: ['час', 'часа', 'часов'],
    day: ['день', 'дня', 'дней'],
    week: ['неделю', 'недели', 'недель'],
    month: ['месяц', 'месяца', 'месяцев'],
    year: ['год', 'года', 'лет'],
    ago: 'назад',
    min: 'мин',
    h: 'ч',
    d: 'д',
    w: 'нед'
  }
}

function pluralize(n, forms, lang) {
  if (lang === 'en') {
    return n === 1 ? forms[0] : forms[1]
  }
  // Russian pluralization
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return forms[2]
  if (mod10 === 1) return forms[0]
  if (mod10 >= 2 && mod10 <= 4) return forms[1]
  return forms[2]
}

export function formatTimeAgo(dateStr, lang = 'en') {
  if (!dateStr) return ''
  
  const strings = timeStrings[lang] || timeStrings.en
  const date = new Date(dateStr.replace(' ', 'T'))
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 0 || diff < 60) return strings.justNow

  if (diff < 3600) {
    const mins = Math.floor(diff / 60)
    return `${mins} ${pluralize(mins, strings.minute, lang)} ${strings.ago}`
  }

  if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours} ${pluralize(hours, strings.hour, lang)} ${strings.ago}`
  }

  if (diff < 604800) {
    const days = Math.floor(diff / 86400)
    return `${days} ${pluralize(days, strings.day, lang)} ${strings.ago}`
  }

  if (diff < 2592000) {
    const weeks = Math.floor(diff / 604800)
    return `${weeks} ${pluralize(weeks, strings.week, lang)} ${strings.ago}`
  }

  if (diff < 31536000) {
    const months = Math.floor(diff / 2592000)
    return `${months} ${pluralize(months, strings.month, lang)} ${strings.ago}`
  }

  const years = Math.floor(diff / 31536000)
  return `${years} ${pluralize(years, strings.year, lang)} ${strings.ago}`
}

export function formatCount(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  return n.toString()
}

export function formatCommentTime(dateStr, lang = 'en') {
  if (!dateStr) return ''
  
  const strings = timeStrings[lang] || timeStrings.en
  const date = new Date(dateStr.replace(' ', 'T'))
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 0 || diff < 60) return strings.justNow
  if (diff < 3600) return `${Math.floor(diff / 60)} ${strings.min}`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ${strings.h}`
  if (diff < 604800) return `${Math.floor(diff / 86400)} ${strings.d}`
  if (diff < 2592000) return `${Math.floor(diff / 604800)} ${strings.w}`
  
  const locale = lang === 'ru' ? 'ru-RU' : 'en-US'
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}
