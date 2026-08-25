<script>
	import BtnBack from '$lib/components/Btn/BtnBack.svelte';
</script>

<svelte:head>
	<meta name="robots" content="index,follow" />
	<title>tiri about</title>
</svelte:head>

<header class="header">
	<BtnBack />
	<h1 class="headerSlogan">about</h1>
</header>

<main class="homeTextPage about">
	<!-- Hero -->

	<section class="hero">
		<h2>Hero</h2>

		<p class="lead">A business.</p>
	</section>

	<!-- Workspace -->

	<section class="card">
		<h2>Workspace</h2>

		<p>M e.</p>

		<p>T e.</p>

		<p>Co er.</p>
	</section>

	<!-- Features -->

	<section class="card">
		<h2>Features</h2>

		<ul>
			<li>B</li>

			<li>E</li>

			<li>T</li>

			<li>F</li>

			<li>P</li>
		</ul>
	</section>

	<!-- Future -->

	<section class="card">
		<h2>Future</h2>

		<p>New added.</p>

		<ul>
			<li>D</li>

			<li>F</li>

			<li>C</li>

			<li>G</li>

			<li>...and many more.</li>
		</ul>
	</section>

	<!-- PWA -->

	<section class="card">
		<h2>Progressive Web App</h2>

		<p>Install the Application directly from your browser.</p>

		<p>Launch it from your Home Screen or Desktop.</p>

		<p>Many features continue working even without an Internet connection.</p>

		<p>Your settings and calculation history stay on your own device.</p>
	</section>

	<!-- Privacy -->

	<section class="card">
		<h2>Privacy First</h2>

		<p>No registration.</p>

		<p>No user accounts.</p>

		<p>Your calculations remain on your own device.</p>

		<p>Anonymous analytics may be used only to improve the Application.</p>
	</section>

	<!-- Audience -->

	<section class="card">
		<h2>Built for Everyone</h2>

		<p>S .</p>
	</section>

	<!-- Feedback -->

	<section class="card">
		<h2>Help Shape the Project</h2>

		<p>This is an actively growing project.</p>

		<p>Many new tools are inspired directly by user suggestions.</p>
	</section>
</main>

<style lang="scss">
	// src/styles/_homePages.scss

	// Hero

	.hero {
		text-align: center;

		padding: 1.5rem;

		line-height: 2.25rem;
		font-size: 1.75rem;
		letter-spacing: 0.25rem;

		// Lead

		.lead {
			padding-top: 1.5rem;
			text-align: justify;
			font-size: 1.5rem;

			color: $clr-teal-soft;

			@media screen and (max-width: 767px) {
				text-align: left;
			}
		}
	}
</style>
