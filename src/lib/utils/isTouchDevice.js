/**
 * Определяет, является ли устройство тач-устройством
 * @returns {boolean} - true, если устройство поддерживает касания
 */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Определяет, является ли устройство мобильным/планшетом
 * @returns {boolean}
 */
export function isMobileOrTablet() {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent);

  return isMobile || isTablet;
}