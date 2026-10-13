import { createApp } from 'vue'
import App from './App.vue'
import install from './install'
import i18n, { setupLocale } from './locales'
import './permission'
import './styles/index.scss'
import 'virtual:svg-icons-register'

setupLocale()

const app = createApp(App)
app.use(install)
app.use(i18n)
app.mount('#app')
