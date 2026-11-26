<script setup lang="ts">
defineProps<{
  label?: string
  description?: string
  required?: boolean
  error?: string
  columns?: number
  /** Passed through via fieldProps, since EzForm's core knows nothing about "options". */
  options?: { label: string; value: string }[]
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
    <select v-model="modelValue" :aria-invalid="!!error" @blur="$emit('blur')">
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <p v-if="description">{{ description }}</p>
    <p v-if="error">{{ error }}</p>
  </div>
</template>
