<script>
	// src/lib/components/input/CheckBox.svelte

	/**
	 * @typedef {Object} Props
	 * @property {boolean} [checked=false]
	 * @property {string} [label='']
	 * @property {boolean} [disabled=false]
	 * @property {string} [customClass='']
	 */

	let { checked = $bindable(false), label = '', disabled = false, customClass = '' } = $props();

	function handleChange(e) {
		checked = e.currentTarget.checked;
	}
</script>

<label class="checkbox-container {customClass}" class:is-disabled={disabled}>
	<input type="checkbox" class="checkbox-native" {checked} {disabled} onchange={handleChange} />
	<span class="checkbox-box" aria-hidden="true">
		<svg class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor">
			<polyline
				points="20 6 9 17 4 12"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	</span>
	{#if label}
		<span class="checkbox-label">{label}</span>
	{/if}
</label>

<!-- 
применение 
<script>
  import CheckBox from './CheckBox.svelte';

  // Создаем реактивные состояния
  let notifications = $state(true);
  let darkMode = $state(false);
  let autoSave = $state(true);

  function resetSettings() {
    notifications = false;
    darkMode = false;
    autoSave = false;
  }
</script>

<div class="settings-card">
  <h3>Настройки приложения</h3>

  <div class="options">
     Двустороннее связывание через bind:checked  
    <CheckBox bind:checked={notifications} label="Включить уведомления" />
    <CheckBox bind:checked={darkMode} label="Темная тема" />
    <CheckBox bind:checked={autoSave} label="Автосохранение" />
  </div>

  <div class="status">
    <p>Уведомления: <strong>{notifications ? 'Вкл' : 'Выкл'}</strong></p>
    <p>Тема: <strong>{darkMode ? 'Темная' : 'Светлая'}</strong></p>
    <p>Автосохранение: <strong>{autoSave ? 'Вкл' : 'Выкл'}</strong></p>
  </div>

  <button type="button" onclick={resetSettings}>Сбросить всё</button>
</div>

<style lang="scss">
  @use '../../../styles/_variables.scss' as *;

  .settings-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 300px;
    padding: 20px;
    background: $clr-bg-card;
    border-radius: 12px;
    color: $clr-white;

    .options {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .status {
      font-size: 0.85rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 12px;

      strong {
        color: $clr-teal;
      }
    }

    button {
      padding: 8px 12px;
      border: 1px solid $clr-pink;
      background: transparent;
      color: $clr-pink;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover {
        background: rgba($clr-pink, 0.1);
      }
    }
  }
</style>
-->

<style lang="scss">
	@use '../../../styles/_variables.scss' as *;

	.checkbox-container {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		cursor: pointer;
		user-select: none;

		.checkbox-native {
			position: absolute;
			opacity: 0;
			width: 0;
			height: 0;

			&:focus-visible + .checkbox-box {
				border-color: $clr-teal;
				box-shadow: 0 0 0 2px rgba($clr-teal, 0.4);
			}

			&:checked + .checkbox-box {
				background: $clr-teal;
				border-color: $clr-teal;

				.checkmark {
					transform: scale(1);
					opacity: 1;
				}
			}
		}

		.checkbox-box {
			width: 22px;
			height: 22px;
			border-radius: 6px;
			border: 2px solid rgba(255, 255, 255, 0.2);
			background: $clr-bg-card;
			display: flex;
			align-items: center;
			justify-content: center;
			transition:
				background 0.2s ease,
				border-color 0.2s ease,
				box-shadow 0.2s ease;
			box-shadow: inset 1px 1px 3px rgba(0, 0, 0, 0.4);

			.checkmark {
				width: 14px;
				height: 14px;
				color: $clr-bg-dark;
				transform: scale(0);
				opacity: 0;
				transition:
					transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275),
					opacity 0.15s ease;
			}
		}

		&:hover .checkbox-box {
			border-color: $clr-teal;
		}

		.checkbox-label {
			font-size: 0.95rem;
			color: $clr-text-accent;
		}

		&.is-disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	}
</style>
