export const prerender = true;  // все статические страницы (кроме динамических роутов типа [date]) пререндерятся в HTML. Это хорошо для SEO.
// export const ssr = true; // для SEO делается пререндер всех страниц во время сборки проекта
export const ssr = false; // страницы генерируются на стороне клиента.
export const trailingSlash = 'always';
//
// export const csr = false; // УСТАНАВЛИВАЕТСЯ   ВРЕМЕННО: это отключит весь JavaScript в браузере