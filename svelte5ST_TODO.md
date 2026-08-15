# создать новую папку для нового проекта

# открыть новую папку в VS Codium

# Склонировть шаблон в пустую папку
git clone https://github.com/AxI0mAn/svelte5ST.git . - обязательно с точкой

проверь, что скопировано не в подпапку!!!

# Удали папку .git целиком из новой папки (rm -rf .git), чтобы полностью стереть историю коммитов старого проекта.

# Наполнить node_modules
npm install

# Запустить сервер разработки
npm run dev

# cоздать новый репозиторий 

# подключить папку к новому репозиторию

-----------------------------------------

#  В каком файле и что необходимо исправить:

================

README.md - актуализировать

================
package.json 
 
"name": "svelte5ST",
"version": "0.0.1",

===============

src/lib/assets/favicon.png - заменить
 
===============

static/manifest.json - актуализировать

===============
src/app.html

<meta name="theme-color" content="#1f1f1f" />
 
===============
Папка
static/
├─ ogImage/ 
│  └─ og_home.jpeg - используется в <meta> - скриншот при отправке с кнопки "SHARE"
├─ .nojekyll - не трогаем
├─ apple-touch-icon.png  - иконка размером 180×180 пикселей
├─ icon-192.png
├─ icon-512.png
├─ manifest.json  - почти все строки нужно актуализировать!
└─ robots.txt - проверить, что открыто сканирование

===============

все <svelte:head> - актуализировать

===============

styles/
├─ _homePages.scss - стили для файлов в папке src/routes/(home)
├─ _instructionPages.scss - стили для файлов в папке src/routes/(instruct)
├─ _layout.scss - стили общие для всех страниц
├─ _mixins.scss
├─ _modal.scss - стили модалок
├─ _reset.scss
├─ _typography.scss - шрифты ЗАМЕНИТЬ
├─ _variables.scss - актуализировать
└─ app.scss

