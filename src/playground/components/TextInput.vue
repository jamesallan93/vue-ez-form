<script setup lang="ts">
defineProps<{
  label?: string
  description?: string
  required?: boolean
  error?: string
  placeholder?: string
  columns?: number
}>()

defineEmits<{
  blur: []
}>()

const modelValue = defineModel<string>()
</script>

<template>
  <div>
    <label v-if="label">
      {{ label }}
      <span v-if="required">*</span>
    </label>
    <input
      v-model="modelValue"
      :placeholder="placeholder"
      :aria-invalid="!!error"
      @blur="$emit('blur')"
    />
    <p v-if="description">{{ description }}</p>
    <p v-if="error">{{ error }}</p>
  </div>
</template>
