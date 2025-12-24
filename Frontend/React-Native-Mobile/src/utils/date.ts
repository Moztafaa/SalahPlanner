export const formatHijriDate = (date: Date, locale: string = "en") => {
  try {
    return new Intl.DateTimeFormat(locale + "-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (e) {
    // Fallback for environments that might not support the specific calendar extension
    console.warn("Hijri calendar not supported, falling back to standard", e);
    return new Intl.DateTimeFormat(locale + "-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }
};
