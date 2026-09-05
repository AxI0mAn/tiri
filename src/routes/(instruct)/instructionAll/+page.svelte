<script>
	import BtnImg from '$lib/components/Btn/BtnImg.svelte';

	import imgDate from '$lib/assets/iconPic/128/date.webp';
	import imgAdd from '$lib/assets/iconPic/128/add.webp';
	import imgDone from '$lib/assets/iconPic/128/done.webp';
	import imgSettings from '$lib/assets/iconPic/128/settings.webp';

	import maleWebp from '$lib/assets/iconPic/128/male.webp';
	import male_beardeWebp from '$lib/assets/iconPic/128/male_bearded.webp';
	import femaleWebp from '$lib/assets/iconPic/128/female.webp';
	import coloristWebp from '$lib/assets/iconPic/128/colorist.webp';
	import childWebp from '$lib/assets/iconPic/128/child.webp';

	import cardBWebp from '$lib/assets/iconPic/128/cardB.webp';
	import cardGWebp from '$lib/assets/iconPic/128/cardG.webp';
	import cashWebp from '$lib/assets/iconPic/128/cash.webp';
	import cryptoWebp from '$lib/assets/iconPic/128/crypto.webp';

	import notesWebp from '$lib/assets/iconPic/128/notes.webp';
	import phoneWebp from '$lib/assets/iconPic/128/phone.webp';
	import nameWebp from '$lib/assets/iconPic/128/name.webp';

	import myPercWebp from '$lib/assets/iconPic/128/myPerc.webp';
	import tipsWebp from '$lib/assets/iconPic/128/tips.webp';
	import sumWebp from '$lib/assets/iconPic/128/sum.webp';

	import logo_job3dWebp from '$lib/assets/iconPic/64/logo_job3d.webp';
	import imgReport3d from '$lib/assets/iconPic/64/logo_report3d.webp';

	import favicon from '$lib/assets/iconPic/64/logo3d.webp';

	// @ts-ignore
	import { base } from '$app/paths';
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';

	// кнопка ВВЕРХ
	import { createScrollTopButton } from '$lib/utils/createScrollTopButton';

	$effect(() => {
		// Запускаем создание и сохраняем функцию удаления
		const destroyButton = createScrollTopButton('top-anchor');

		// Эта часть сработает, когда пользователь уйдет с этой страницы
		return () => {
			destroyButton();
		};
	});
</script>

<header class="header" id="top-anchor">
	<BtnBack />
	<h1 class="headerSlogan">Инструкция и ответы на вопросы.</h1>
</header>

<main class="homeTextPage">
	<h2><em>Все данные приложения - хранятся только на Вашем устройстве!</em></h2>
	<h2>Ничего и никуда не отправляется!</h2>
	<section class="section">
		<div class="card">
			<h2>Первый шаг - подготовить приложение на странице "Настройки".</h2>
			<a class="bigLink" href="{base}/settings">
				<span>Нажми, чтоб настроить приложение сейчас.</span>
				<BtnImg
					src={imgSettings}
					alt="test btn img"
					size={32}
					onclick="null"
					customClass="actionBtnImg"
				/></a
			>
			<p>✅ - включает опцию.</p>
			<p>❌ - отключает опцию.</p>
			<ul>
				<li>
					<strong>Имя Мастера.</strong> Придумайте и введите имя мастера, который будет пользоваться этим
					приложением. Запомните или запишите Имя Мастера - оно будет нужно для работы с приложением.
				</li>
				<li><strong> Язык приложения.</strong> Сейчас доступен только русский язык.</li>
				<li>
					<strong> Конструктор заметки.</strong> Какие данные необходимо обрабатывать приложению. Настройте
					как Вам удобно!
				</li>

				<li>
					<ul>
						<li><strong>Стрижка (Услуги)</strong> - выберите те которые Вы оказываете.</li>
						<li>
							<BtnImg size={32} src={maleWebp} onclick="null" />
							<BtnImg size={32} src={male_beardeWebp} onclick="null" />
							<BtnImg size={32} src={femaleWebp} onclick="null" />
							<BtnImg size={32} src={coloristWebp} onclick="null" />
							<BtnImg size={32} src={childWebp} onclick="null" />
						</li>
						<li>
							<strong>Настройки оплаты.</strong>
						</li>
						<li>Оставьте как есть или введите те значения, что используются чаще всего.</li>
						<ul>
							<li>
								<BtnImg size={32} src={myPercWebp} onclick="null" />
								<p>
									- Обратите внимание, что указывается процент, который <em>остаётся</em> у мастера.
								</p>
							</li>
							<li>
								<BtnImg size={32} src={sumWebp} onclick="null" />
								<p>- Средний чек или стоимость самой популярной услуги.</p>
							</li>
							<li>
								<BtnImg size={32} src={tipsWebp} onclick="null" />
								<p>- Сумма чаевых в среднем.</p>
							</li>
						</ul>
						<li>
							<strong>Форма оплаты.</strong>
						</li>
						<ul>
							<li>
								<BtnImg size={32} src={cashWebp} onclick="null" />
								<p>- наличные мастеру;</p>
							</li>
							<li>
								<BtnImg size={32} src={cardGWebp} onclick="null" />
								<p>- карта мастера;</p>
							</li>
							<li>
								<BtnImg size={32} src={cardBWebp} onclick="null" />
								<p>- карта для оплаты процента (аренды);</p>
							</li>
							<li>
								<BtnImg size={32} src={cryptoWebp} onclick="null" />
								<p>- наличные для оплаты процента (аренды).</p>
							</li>
						</ul>
						<li>
							<strong
								>Заметки - дополнительная информация. Хранится в бланке заказа или записи.
								Используется для поиска по приложению.</strong
							>
						</li>
						<ul>
							<li>
								<BtnImg size={32} src={nameWebp} onclick="null" />
								<p>- Имя клиента.</p>
							</li>
							<li>
								<BtnImg size={32} src={phoneWebp} onclick="null" />
								<p>- Номер телефона клиента.</p>
							</li>
							<li>
								<BtnImg size={32} src={notesWebp} onclick="null" />
								<p>
									- Особенности: насадки для стрижки, рецепт для окрашивания, любимый напиток и т.д.
								</p>
							</li>
						</ul>
					</ul>
				</li>
				<li>Все настройки можно поменять в любой момент.</li>
			</ul>
			<a class="bigLink" href="{base}/settings">
				<span>Нажми, чтоб перейти к настройкам сейчас.</span>
				<BtnImg
					src={imgSettings}
					alt="test btn img"
					size={32}
					onclick="null"
					customClass="actionBtnImg"
				/></a
			>
		</div>
	</section>
	<section class="section">
		<div class="card">
			<h2>Второй шаг - использовать приложение.</h2>
			<ul>
				<li><strong>Учёт посетителей.</strong></li>
				<li>
					<ul>
						<li>
							<BtnImg size={32} src={imgDate} onclick="null" />
							<p>Страница рабочего дня (смены);</p>
						</li>
						<li>
							<BtnImg size={32} src={imgAdd} onclick="null" />
							<p>Напоминание о записи клиента на конкретное время и день;</p>
						</li>
						<li>
							<BtnImg size={32} src={imgDone} onclick="null" />
							<p>Выполненная работа.</p>
						</li>
						<li>
							<BtnImg size={44} src={logo_job3dWebp} onclick="null" />
							<p>Посмотреть x-отчёт.</p>
						</li>
						<li>
							<BtnImg size={44} src={imgReport3d} onclick="null" />
							<p>Посмотреть z-отчёт.</p>
						</li>
					</ul>
				</li>
			</ul>
		</div>
	</section>

	<section class="section">
		<div class="card">
			<h2><strong>Правила использования:</strong></h2>
			<ul class="rules">
				<li>x-отчёт - текущее - рассчитывается на момент создания.</li>
				<li>z-отчёт - итог - рассчитывается за весь день.</li>
				<li></li>
				<li>z-отчёт создаётся Мастером после закрытия смены.</li>
				<li>
					Если z-отчёт ещё не создан, то можно создавать и редактировать бланки заказов за сегодня.
				</li>
				<li>
					Чтоб создать z-отчёт, необходимо закончить или перенести все Напоминания за сегодняшний
					день.
				</li>
				<li>
					Если z-отчёт создан, его можно посмотреть и/или отправить другому пользователю через любой
					мессенджер.
				</li>

				<li>Решение об отправке z-отчёта принимает сам пользователь.</li>
				<li>Нельзя создать или перенести напоминание в прошлое.</li>
				<li>Нельзя редактировать заметки из прошлого.</li>
			</ul>
		</div>
	</section>

	<section class="section">
		<div class="card">
			<h2><strong>Правила расчётов для отчётов:</strong></h2>
			<ul class="rules">
				<BtnImg size={44} src={logo_job3dWebp} onclick="null" />
				<li>x-отчёт:</li>
				<li>Касса (без чаевых) - сколько заплатили клиенты за услуги;</li>
				<li>Оплатить % - сколько нужно заплатить как % от кассы;</li>
				<li>Мои с чаевыми - сколько на данный момент заработано.</li>
			</ul>
			<ul class="rules">
				<BtnImg size={44} src={imgReport3d} onclick="null" />
				<li>z-отчёт, как итог за смену (день).</li>
				<li>Клиенты - сколько и каких услуг было оказано.</li>
				<li>Доход:</li>
				<li>
					<ul>
						<li>Валовый - Всё что получено от клиентов (оплата и чаевые).</li>
						<li>Работа - Заработано после оплаты аренды (без чаевых).</li>
						<li>Чаевые - Заработано чаевых.</li>
						<li>Итого - Заработано за день (с чаевыми).</li>
					</ul>
				</li>
				<li>Аренда или %:</li>
				<li>
					<ul>
						<li>Уже оплачено - Суммы, которые уже оплачены на карту и/или в счёт аренды (%).</li>
						<li>Доплатить - Остаток, которые необходимо оплатить в счёт аренды (%).</li>
						<li>Всего - Сколько необходимо оплатить за аренду (%).</li>
					</ul>
				</li>
			</ul>
		</div>
	</section>
	<section class="section">
		<div class="card">
			<a class="bigLink" href="{base}/contactUs">
				<strong>Написать нам:</strong>
				<BtnImg
					src={favicon}
					alt="test btn img"
					size={32}
					onclick="null"
					customClass="actionBtnImg"
				/></a
			>
		</div>
	</section>
</main>

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;
	h1,
	h2 {
		color: $clr-text-accent;
	}

	strong {
		font-size: medium;
	}

	em {
		// аналогично .font-digits
		color: red;
		font-family: 'Rajdhani', sans-serif;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
	}

	ul li {
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.card {
		color: $clr-text-main;
		margin-bottom: 1rem;
		background-color: transparent;
		.bigLink {
			display: flex;
			flex-flow: row nowrap;
			align-items: center;
			gap: 1rem;
			align-self: flex-end;
			width: fit-content;
			border: 1px solid $clr-white;
			border-radius: 2rem;
			background-color: rgba(255, 255, 255, 0.4);
			padding: 0.5rem 1rem;
			transition: all 0.5s;
			span {
				padding: 0.25rem;
			}
			:hover {
				color: $clr-teal;
				box-shadow: 2px 2px 4px 4px $clr-teal;
				background-color: rgba(255, 255, 255, 0.8);

				border-right: 1px double $clr-teal;
				border-radius: 0.5rem;
				transition: all 0.5s;
			}
		}
		.learnMore {
			text-align: right;
			margin-top: 0.5rem;
			padding: 0.5rem 2rem;
		}
	}
</style>
