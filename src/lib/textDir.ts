export const isArabic = (text: string) => {
  if (!text) return false;
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
};

export const getTextDir = (text: string) => isArabic(text) ? 'rtl' : 'ltr';
export const getTextAlign = (text: string) => isArabic(text) ? 'text-right font-arabic' : 'text-left';
