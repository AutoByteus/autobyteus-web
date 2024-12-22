
import { defineNuxtPlugin } from '#app'
import VueClickAway from 'vue3-click-away'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(VueClickAway)
})
