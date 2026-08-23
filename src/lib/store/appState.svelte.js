/**
 * src/lib/store/appState.svelte.js - текущее состояние приложения
 */

// import { appStore } from "./appStore.svelte";  

class AppState {
  /** @type {string} */
  now_mode = $state('amoca'); // Режим работы - отображается в окне div class="now_mode"

  // Метод для переключения режима 
  setMode(mode) {
    this.now_mode = mode;
  }

}

export const appState = new AppState;
