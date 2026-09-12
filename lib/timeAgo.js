// Korean relative-time formatting, Goondori/Everytime style
// ("1분 미만 전", "3일 전"), without pulling in a locale bundle.
export function timeAgo(dateString) {
  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return '1분 미만 전'
  if (diffMin < 60) return `${diffMin}분 전`

  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour}시간 전`

  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay}일 전`

  const diffWeek = Math.floor(diffDay / 7)
  if (diffDay < 30) return `${diffWeek}주 전`

  const diffMonth = Math.floor(diffDay / 30)
  if (diffDay < 365) return `${diffMonth}개월 전`

  const diffYear = Math.floor(diffDay / 365)
  return `${diffYear}년 전`
}
