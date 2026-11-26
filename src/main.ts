import './assets/base.css'

import { createApp } from 'vue'
import App from './App.vue'
import { createEzForm } from './plugin'
import ezFormConfig from '../ez-form.config'

createApp(App).use(createEzForm(ezFormConfig)).mount('#app')
