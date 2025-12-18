// Правильное форматирование времени на русском
export function formatTimeAgo(dateStr) {
  if (!dateStr) return ''
  
  // Parse the date - SQLite returns local time now
  const date = new Date(dateStr.replace(' ', 'T'))
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  // Future date check (shouldn't happen but just in case)
  if (diff < 0) return 'только что'

  // Меньше минуты
  if (diff < 60) {
    return 'только что'
  }

  // Минуты
  if (diff < 3600) {
    const mins = Math.floor(diff / 60)
    return `${mins} ${pluralize(mins, 'минуту', 'минуты', 'минут')} назад`
  }

  // Часы
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours} ${pluralize(hours, 'час', 'часа', 'часов')} назад`
  }

  // Дни
  if (diff < 604800) {
    const days = Math.floor(diff / 86400)
    return `${days} ${pluralize(days, 'день', 'дня', 'дней')} назад`
  }

  // Недели
  if (diff < 2592000) {
    const weeks = Math.floor(diff / 604800)
    return `${weeks} ${pluralize(weeks, 'неделю', 'недели', 'недель')} назад`
  }

  // Месяцы
  if (diff < 31536000) {
    const months = Math.floor(diff / 2592000)
    return `${months} ${pluralize(months, 'месяц', 'месяца', 'месяцев')} назад`
  }

  // Годы
  const years = Math.floor(diff / 31536000)
  return `${years} ${pluralize(years, 'год', 'года', 'лет')} назад`
}

// Склонение слов
function pluralize(n, one, few, many) {
  const mod10 = n % 10
  const mod100 = n % 100

  if (mod100 >= 11 && mod100 <= 19) {
    return many
  }

  if (mod10 === 1) {
    return one
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return few
  }

  return many
}

// Форматирование чисел
export function formatCount(n) {
  if (!n) return '0'
  if (n >= 1000000) {
    return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  }
  return n.toString()
}

// Форматирование даты для комментариев (более короткое)
export function formatCommentTime(dateStr) {
  if (!dateStr) return ''
  
  const date = new Date(dateStr.replace(' ', 'T'))
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)

  if (diff < 0) return 'сейчас'
  if (diff < 60) return 'сейчас'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`
  if (diff < 604800) return `${Math.floor(diff / 86400)} д`
  if (diff < 2592000) return `${Math.floor(diff / 604800)} нед`
  
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}
