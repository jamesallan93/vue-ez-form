<template>
  <DefineFieldRenderer v-slot="{ field, fieldKey, containerCols }">
    <!-- group: recurse into children, show group-level error if any -->
    <div v-if="'fields' in field" :class="field.class">
      <template v-for="(child, childKey) in field.fields" :key="childKey">
        <ReuseFieldRenderer
          :field="child"
          :field-key="joinFieldKey(fieldKey, String(childKey))"
          :container-cols="distributeColumns(Object.keys(field.fields).length)"
        />
      </template>
      <div v-if="engine.state.groupErrors[fieldKey]?.length">
        {{ engine.state.groupErrors[fieldKey]?.[0] }}
      </div>
    </div>

    <!-- array: repeat the items template once per current length -->
    <div v-else-if="'items' in field">
      <slot
        :name="fieldKey"
        :field="field"
        :values="engine.values"
        :length="engine.state.arrayLengths[fieldKey] ?? 0"
        :add="(value?: unknown) => engine.addArrayItem(fieldKey, value)"
        :remove="(index: number) => engine.removeArrayItem(fieldKey, index)"
        :insert="(index: number, value?: unknown) => engine.insertArrayItem(fieldKey, index, value)"
        :prepend="(value?: unknown) => engine.prependArrayItem(fieldKey, value)"
        :swap="(indexA: number, indexB: number) => engine.swapArrayItems(fieldKey, indexA, indexB)"
        :move="(fromIndex: number, toIndex: number) => engine.moveArrayItem(fieldKey, fromIndex, toIndex)"
        :update="(index: number, value: unknown) => engine.updateArrayItem(fieldKey, index, value)"
        :replace="(items: unknown[]) => engine.replaceArray(fieldKey, items)"
      >
        <template v-for="index in arrayIndices(engine.state.arrayLengths[fieldKey] ?? 0)" :key="index">
          <ReuseFieldRenderer :field="field.items" :field-key="`${fieldKey}.${index}`" />
          <button type="button" @click="engine.removeArrayItem(fieldKey, index)">Remove</button>
        </template>
        <button type="button" @click="engine.addArrayItem(fieldKey)">Add</button>
        <div v-if="engine.state.arrayErrors[fieldKey]?.length">
          {{ engine.state.arrayErrors[fieldKey]?.[0] }}
        </div>
      </slot>
    </div>

    <!-- static: visual only, overridable via the same per-field slot convention as inputs -->
    <slot v-else-if="'tag' in field" :name="fieldKey" :field="field" :values="engine.values">
      <component :is="field.tag">{{ field.content }}</component>
    </slot>

    <!-- input: dispatch to the user's component -->
    <slot
      v-else
      :name="fieldKey"
      :field="field"
      :binding="engine.getFieldBinding(fieldKey)"
      :native="engine.getNativeFieldBinding(fieldKey)"
      :values="engine.values"
    >
      <component
        :is="resolvedComponentMap[field.type]"
        v-bind="{ ...field.fieldProps, ...engine.getFieldBinding(fieldKey) }"
        :label="field.label"
        :required="field.required"
        :description="field.description"
        :placeholder="field.placeholder"
        :columns="field.columns ?? containerCols"
      />
    </slot>
  </DefineFieldRenderer>

  <slot name="header" />

  <slot name="fields">
    <template v-for="(field, key) in schema.fields" :key="key">
      <ReuseFieldRenderer :field="field" :field-key="String(key)" />
    </template>
  </slot>
</template>

<script setup lang="ts">
import { computed, inject, provide, type Component } from 'vue'
import { useFormEngine } from '../composables/useFormEngine'
import { distributeColumns } from '../utils/columns'
import { EZFORM_CONFIG, EZFORM_VALUES } from '../plugin'
import type { FieldEntry, FormSchema } from '../types/field'
import type { FormState } from '../types/form-state'
import { createReusableTemplate } from '@vueuse/core'

interface FormProps {
  schema: FormSchema
  componentMap?: Record<string, Component>
  initialValues?: Record<string, unknown>
}

const { schema, componentMap, initialValues } = defineProps<FormProps>()

const globalConfig = inject(EZFORM_CONFIG, undefined)

// Local prop entries win per type key, so a single form can override or extend the
// app-wide map without needing to repeat the whole thing.
const resolvedComponentMap = computed<Record<string, Component>>(() => ({
  ...globalConfig?.components,
  ...componentMap,
}))

const emit = defineEmits<{
  (e: 'submit', values: Record<string, unknown>): void
  (e: 'invalid', state: FormState): void
}>()

const engine = useFormEngine(schema, { initialValues })

const submitForm = engine.handleSubmit(
  (values) => emit('submit', values),
  (state) => emit('invalid', state),
)

const values = computed(() => engine.values)

// Lets any descendant component (one dispatched via componentMap, or one rendered inside
// a custom per-field slot, at any depth) read the whole form's current values with
// inject(EZFORM_VALUES), without forcing every single component to declare an unused
// 'values' prop just to avoid it falling through as a stray DOM attribute. The per-field
// slot scope also hands it over directly as `values`, for a destructure instead of inject.
provide(EZFORM_VALUES, values)

defineExpose({
  submitForm,
  resetForm: engine.resetForm,
  setValues: engine.setValues,
  state: engine.state,
  values,
  dirtyValues: computed(() => engine.dirtyValues),
})

/** 0-based indices for a v-for over an array field's current length. */
function arrayIndices(length: number): number[] {
  return Array.from({ length }, (_, i) => i)
}

/** Builds a child's full dotted path from its parent's, matching the engine's own path keys. */
function joinFieldKey(parent: string, child: string): string {
  return parent ? `${parent}.${child}` : child
}

const [DefineFieldRenderer, ReuseFieldRenderer] = createReusableTemplate<{
  field: FieldEntry
  fieldKey: string
  containerCols?: number
}>()
</script>

<style scoped></style>
