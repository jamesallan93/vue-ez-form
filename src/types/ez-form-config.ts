import type { Component } from 'vue'

/** App-wide EzForm configuration, installed once via the `createEzForm` plugin. */
export interface EzFormConfig {
    /** Maps a field's `type` string to the component that renders it, e.g. `'text': TextInput`. */
    components: Record<string, Component>
}
