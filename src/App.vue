<script setup lang="ts">
import { ref } from 'vue'
import { z } from 'zod'
import Form from './components/Form.vue'
import type { FormSchema } from './types/field'
import type { FormState } from './types/form-state'

// No local componentMap here: every field type below ('text', 'select') resolves from the
// app-wide config installed in main.ts (`app.use(createEzForm(ezFormConfig))`).

const schema: FormSchema = {
  // Seeds 'category' (no initialValues entry below) and 'tags' (which DOES have one,
  // below; initialValues wins, proving the precedence chain) without every consumer of
  // this schema having to separately wire up initialValues for either.
  defaultValues: {
    category: 'general',
    tags: ['should-be-overridden-by-initialValues'],
  },
  fields: {
    heading: {
      type: 'static',
      tag: 'h1',
      content: 'Contact form',
    },
    name: {
      type: 'text',
      name: 'name',
      label: 'Full name',
      placeholder: 'Jane Doe',
      required: true,
      validate: z.string().min(1, 'Name is required'),
    },
    country: {
      type: 'text',
      name: 'country',
      label: 'Country',
      // Field-level default: no initialValues entry and no schema.defaultValues entry for
      // 'country' exist, so this is the only thing that seeds it.
      defaultValue: 'USA',
    },
    email: {
      type: 'text',
      name: 'email',
      label: 'Email',
      placeholder: 'you@example.com',
      required: true,
      validate: z.string().email('Invalid email address'),
    },
    category: {
      type: 'select',
      name: 'category',
      label: 'Category',
      required: true,
      validate: z.string().min(1, 'Please select a category'),
      fieldProps: {
        options: [
          { label: 'General inquiry', value: 'general' },
          { label: 'Support', value: 'support' },
          { label: 'Sales', value: 'sales' },
        ],
      },
    },
    specialties: {
      type: 'array',
      minItems: 1,
      validate: (value) =>
        Array.isArray(value) && value.some((item) => Number(item?.duration) > 5)
          ? true
          : 'At least one specialty needs 5+ years',
      items: {
        fields: {
          title: {
            type: 'text',
            name: 'title',
            label: 'Specialty',
            placeholder: 'Vue',
            validate: (value) => (value ? true : 'Required'),
          },
          duration: {
            type: 'text',
            name: 'duration',
            label: 'Years',
            placeholder: '3',
          },
        },
      },
    },
    tags: {
      type: 'array',
      maxItems: 5,
      items: {
        type: 'text',
        name: 'tag',
        placeholder: 'tag',
      },
    },
    matrix: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'text',
          name: 'cell',
          placeholder: 'cell',
        },
      },
    },
    shipping: {
      fields: {
        sameAsBilling: {
          type: 'text',
          name: 'sameAsBilling',
          label: 'Same as billing? (yes/no)',
        },
        address: {
          fields: {
            street: {
              type: 'text',
              name: 'street',
              label: 'Street',
            },
          },
        },
      },
      // Cross-field check spanning a direct input child (sameAsBilling) and a nested
      // group child (address). Exercises the fix for nested-group value aggregation.
      validate: (value) => {
        const v = value as { sameAsBilling?: string; address?: { street?: string } }
        if (v.sameAsBilling === 'no' && !v.address?.street) {
          return 'Street is required when not same as billing'
        }
        return true
      },
    },
  },
}

const formRef = ref<InstanceType<typeof Form> | null>(null)
const submittedValues = ref<Record<string, unknown> | null>(null)

const initialValues = {
  specialties: [{ title: 'JS', duration: '6' }],
  tags: ['vue', 'docker'],
  matrix: [
    ['a', 'b'],
    ['c'],
  ],
}

function onSubmit(values: Record<string, unknown>) {
  submittedValues.value = values
}

function onInvalid(state: FormState) {
  console.log('form invalid', state)
}
</script>

<template>
  <main>
    <Form
      ref="formRef"
      :schema="schema"
      :initial-values="initialValues"
      @submit="onSubmit"
      @invalid="onInvalid"
    >
      <!-- The native-element binding: v-bind straight onto a raw <input>, no wrapper
           component needed, mirroring vee-validate's own <Field> `field` slot prop. -->
      <template #email="{ native, binding }">
        <label>Email (native binding demo)</label>
        <input v-bind="native" />
        <p v-if="binding.error">{{ binding.error }}</p>
      </template>
    </Form>
    <button type="button" @click="formRef?.submitForm()">Submit</button>

    <pre v-if="submittedValues">{{ JSON.stringify(submittedValues, null, 2) }}</pre>
  </main>
</template>
