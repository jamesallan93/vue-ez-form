import { defineEzFormConfig } from './src/plugin'
import TextInput from './src/playground/components/TextInput.vue'
import SelectInput from './src/playground/components/SelectInput.vue'

export default defineEzFormConfig({
  components: {
    text: TextInput,
    select: SelectInput,
  },
})
