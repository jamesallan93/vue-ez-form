import type { App, ComputedRef, InjectionKey, Plugin } from 'vue'
import type { EzFormConfig } from './types/ez-form-config'

export const EZFORM_CONFIG: InjectionKey<EzFormConfig> = Symbol('ezform-config')

/**
 * Each `<Form>` instance `provide`s its own reconstructed `values` under this key, so any
 * descendant component (one dispatched via `componentMap`, or one rendered inside a custom
 * per-field slot, at any depth) can read the whole form's current values with `inject`,
 * without `Form.vue` having to pass it as a prop to every single component whether or not
 * it declared one. Passing it as a prop would otherwise fall through as a stray DOM attribute on
 * components that didn't.
 */
export const EZFORM_VALUES: InjectionKey<ComputedRef<Record<string, unknown>>> = Symbol('ezform-values')

/** Installs `config` app-wide so every `<Form>` resolves its `componentMap` from it. */
export function createEzForm(config: EzFormConfig): Plugin {
    return {
        install(app: App) {
            app.provide(EZFORM_CONFIG, config)
        },
    }
}

/**
 * Identity helper for a dedicated `ez-form.config.ts` file. Gives the config object type
 * inference and editor support. EzForm never reads this file itself; the consumer imports it
 * and passes it to `createEzForm`.
 */
export function defineEzFormConfig(config: EzFormConfig): EzFormConfig {
    return config
}
