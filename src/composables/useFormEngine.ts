import { computed, reactive } from 'vue'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type {
    ArrayFieldEntry,
    FieldEntry,
    FieldValidator,
    FormSchema,
    GroupFieldEntry,
    InputFieldEntry,
} from '../types/field'
import type { FieldBinding, NativeFieldBinding } from '../types/field-state'
import type { FormState } from '../types/form-state'
import type { FormEngine, FormEngineOptions } from '../types/form-engine'

interface NormalizedIssue {
    message: string
    path?: ReadonlyArray<PropertyKey>
}

async function normalizeIssues(
    validator: FieldValidator,
    value: unknown,
): Promise<NormalizedIssue[]> {
    if (typeof validator === 'function') {
        const result = validator(value)
        return result === true ? [] : [{ message: result }]
    }

    const schema = validator as StandardSchemaV1
    const result = await schema['~standard'].validate(value)
    return 'issues' in result && result.issues
        ? result.issues.map((issue) => ({ message: issue.message, path: issue.path as PropertyKey[] | undefined }))
        : []
}

function toValidatorList(validate: FieldValidator | FieldValidator[] | undefined): FieldValidator[] {
    if (!validate) return []
    return Array.isArray(validate) ? validate : [validate]
}

/** Runs validators in order, stopping at the first one that reports issues. */
async function runValidators(
    validate: FieldValidator | FieldValidator[] | undefined,
    value: unknown,
): Promise<NormalizedIssue[]> {
    for (const validator of toValidatorList(validate)) {
        const issues = await normalizeIssues(validator, value)
        if (issues.length) return issues
    }
    return []
}

function joinPath(prefix: string, key: string): string {
    return prefix ? `${prefix}.${key}` : key
}

/** Reads a value out of a nested object/array by a dotted path (numeric segments index arrays). */
function getAtPath(source: unknown, path: string): unknown {
    let current: unknown = source
    for (const segment of path.split('.')) {
        if (current == null) return undefined
        current = (current as Record<string, unknown>)[segment]
    }
    return current
}

/** Writes a value into a nested object/array by a dotted path, creating arrays for numeric segments. */
function setAtPath(target: Record<string, unknown>, path: string, value: unknown): void {
    const segments = path.split('.')
    let current: Record<string, unknown> = target
    for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i]!
        const nextIsIndex = /^\d+$/.test(segments[i + 1]!)
        if (current[segment] === undefined) {
            current[segment] = nextIsIndex ? [] : {}
        }
        current = current[segment] as Record<string, unknown>
    }
    current[segments[segments.length - 1]!] = value
}

/** True when `path` is exactly `prefix`, or a descendant of it (`prefix.` + anything). */
function isUnderPath(path: string, prefix: string): boolean {
    return path === prefix || path.startsWith(`${prefix}.`)
}

/** Rewrites `path` from under `oldPrefix` to under `newPrefix`; returns null if unaffected. */
function rewritePath(path: string, oldPrefix: string, newPrefix: string): string | null {
    if (path === oldPrefix) return newPrefix
    if (path.startsWith(`${oldPrefix}.`)) return newPrefix + path.slice(oldPrefix.length)
    return null
}

export function useFormEngine(schema: FormSchema, options: FormEngineOptions = {}): FormEngine {
    const initialValues = options.initialValues ?? {}

    const fieldEntries = new Map<string, InputFieldEntry>()
    const groupEntries = new Map<string, GroupFieldEntry>()
    const arrayEntries = new Map<string, ArrayFieldEntry>()

    const state = reactive<FormState>({
        fields: {},
        groupErrors: {},
        arrayLengths: {},
        arrayErrors: {},
        submitAttempted: false,
        isSubmitting: false,
        isValid: true,
    })

    /**
     * Registers `entry` under `path`, seeding its value from `initialValue` if provided,
     * else `defaultValue` (the same slice of `schema.defaultValues`), else, for a leaf
     * input field, that field's own `defaultValue`. See the field-schema spec's "Default
     * values" requirement for the full precedence chain.
     */
    function registerEntry(path: string, entry: FieldEntry, initialValue: unknown, defaultValue: unknown) {
        if ('fields' in entry) {
            groupEntries.set(path, entry)
            state.groupErrors[path] = []
            for (const [childKey, child] of Object.entries(entry.fields)) {
                registerEntry(
                    joinPath(path, childKey),
                    child,
                    getAtPath(initialValue, childKey),
                    getAtPath(defaultValue, childKey),
                )
            }
            return
        }
        if ('items' in entry) {
            arrayEntries.set(path, entry)
            state.arrayLengths[path] = 0
            state.arrayErrors[path] = []
            const seedArray = Array.isArray(initialValue) ? initialValue : Array.isArray(defaultValue) ? defaultValue : undefined
            const seedLength = seedArray ? seedArray.length : (entry.minItems ?? 0)
            for (let i = 0; i < seedLength; i++) {
                instantiateArrayItem(
                    path,
                    entry,
                    i,
                    Array.isArray(initialValue) ? initialValue[i] : undefined,
                    Array.isArray(defaultValue) ? defaultValue[i] : undefined,
                )
            }
            state.arrayLengths[path] = seedLength
            return
        }
        if (!('name' in entry)) return // static: no state

        fieldEntries.set(path, entry)
        state.fields[path] = {
            value: initialValue !== undefined ? initialValue : defaultValue !== undefined ? defaultValue : entry.defaultValue,
            errors: [],
            touched: false,
            dirty: false,
            validating: false,
        }
    }

    function instantiateArrayItem(
        arrayPath: string,
        entry: ArrayFieldEntry,
        index: number,
        initialValue: unknown,
        defaultValue: unknown,
    ) {
        registerEntry(joinPath(arrayPath, String(index)), entry.items, initialValue, defaultValue)
    }

    /**
     * Resolves one field's seed value for `resetForm`: `source` (`nextValues` or
     * `initialValues`) → `schema.defaultValues` → the field's own `defaultValue` →
     * `undefined`. Same precedence chain as `registerEntry`'s initial seeding.
     */
    function resolveFieldSeed(path: string, source: unknown): unknown {
        const fromSource = getAtPath(source, path)
        if (fromSource !== undefined) return fromSource
        const fromSchemaDefaults = getAtPath(schema.defaultValues, path)
        if (fromSchemaDefaults !== undefined) return fromSchemaDefaults
        return fieldEntries.get(path)?.defaultValue
    }

    /** Walks every registered entry whose path falls under `prefix` and discards its state. */
    function deregisterUnder(prefix: string) {
        for (const key of [...fieldEntries.keys()]) {
            if (isUnderPath(key, prefix)) {
                fieldEntries.delete(key)
                delete state.fields[key]
            }
        }
        for (const key of [...groupEntries.keys()]) {
            if (isUnderPath(key, prefix)) {
                groupEntries.delete(key)
                delete state.groupErrors[key]
            }
        }
        for (const key of [...arrayEntries.keys()]) {
            if (isUnderPath(key, prefix)) {
                arrayEntries.delete(key)
                delete state.arrayLengths[key]
                delete state.arrayErrors[key]
            }
        }
    }

    /** Moves every registered entry whose path falls under `oldPrefix` to the same path under `newPrefix`. */
    function moveSubtree(oldPrefix: string, newPrefix: string) {
        for (const key of [...fieldEntries.keys()]) {
            const newKey = rewritePath(key, oldPrefix, newPrefix)
            if (!newKey) continue
            fieldEntries.set(newKey, fieldEntries.get(key)!)
            fieldEntries.delete(key)
            state.fields[newKey] = state.fields[key]!
            delete state.fields[key]
        }
        for (const key of [...groupEntries.keys()]) {
            const newKey = rewritePath(key, oldPrefix, newPrefix)
            if (!newKey) continue
            groupEntries.set(newKey, groupEntries.get(key)!)
            groupEntries.delete(key)
            state.groupErrors[newKey] = state.groupErrors[key]!
            delete state.groupErrors[key]
        }
        for (const key of [...arrayEntries.keys()]) {
            const newKey = rewritePath(key, oldPrefix, newPrefix)
            if (!newKey) continue
            arrayEntries.set(newKey, arrayEntries.get(key)!)
            arrayEntries.delete(key)
            state.arrayLengths[newKey] = state.arrayLengths[key]!
            state.arrayErrors[newKey] = state.arrayErrors[key]!
            delete state.arrayLengths[key]
            delete state.arrayErrors[key]
        }
    }

    for (const [key, entry] of Object.entries(schema.fields)) {
        registerEntry(key, entry, getAtPath(initialValues, key), getAtPath(schema.defaultValues, key))
    }

    function addArrayItem(path: string, value?: unknown): void {
        const entry = arrayEntries.get(path)
        if (!entry) return
        const length = state.arrayLengths[path] ?? 0
        if (entry.maxItems !== undefined && length >= entry.maxItems) return
        instantiateArrayItem(path, entry, length, value, undefined)
        state.arrayLengths[path] = length + 1
    }

    function removeArrayItem(path: string, index: number): void {
        const entry = arrayEntries.get(path)
        if (!entry) return
        const length = state.arrayLengths[path] ?? 0
        if (index < 0 || index >= length) return
        if (entry.minItems !== undefined && length <= entry.minItems) return

        deregisterUnder(joinPath(path, String(index)))
        for (let i = index + 1; i < length; i++) {
            moveSubtree(joinPath(path, String(i)), joinPath(path, String(i - 1)))
        }
        state.arrayLengths[path] = length - 1
    }

    /** Inserts a new item at `index`, shifting items at/after it up by one. A no-op when
     * `index` is out of `[0, length]` or `maxItems` is already reached. */
    function insertArrayItem(path: string, index: number, value?: unknown): void {
        const entry = arrayEntries.get(path)
        if (!entry) return
        const length = state.arrayLengths[path] ?? 0
        if (index < 0 || index > length) return
        if (entry.maxItems !== undefined && length >= entry.maxItems) return

        // Shift descending so each item's old slot is vacated before the next one moves into it.
        for (let i = length - 1; i >= index; i--) {
            moveSubtree(joinPath(path, String(i)), joinPath(path, String(i + 1)))
        }
        instantiateArrayItem(path, entry, index, value, undefined)
        state.arrayLengths[path] = length + 1
    }

    function prependArrayItem(path: string, value?: unknown): void {
        insertArrayItem(path, 0, value)
    }

    /** Swaps two items' entire state (value, errors, touched, dirty, nested descendants). */
    function swapArrayItems(path: string, indexA: number, indexB: number): void {
        const length = state.arrayLengths[path] ?? 0
        if (indexA < 0 || indexA >= length || indexB < 0 || indexB >= length || indexA === indexB) return

        const tempPath = joinPath(path, '__ezform_swap_temp__')
        moveSubtree(joinPath(path, String(indexA)), tempPath)
        moveSubtree(joinPath(path, String(indexB)), joinPath(path, String(indexA)))
        moveSubtree(tempPath, joinPath(path, String(indexB)))
    }

    /** Moves the item at `fromIndex` to `toIndex`, shifting the items in between. */
    function moveArrayItem(path: string, fromIndex: number, toIndex: number): void {
        const length = state.arrayLengths[path] ?? 0
        if (fromIndex < 0 || fromIndex >= length || toIndex < 0 || toIndex >= length || fromIndex === toIndex) return

        const tempPath = joinPath(path, '__ezform_move_temp__')
        moveSubtree(joinPath(path, String(fromIndex)), tempPath)
        if (fromIndex < toIndex) {
            for (let i = fromIndex; i < toIndex; i++) {
                moveSubtree(joinPath(path, String(i + 1)), joinPath(path, String(i)))
            }
        } else {
            for (let i = fromIndex; i > toIndex; i--) {
                moveSubtree(joinPath(path, String(i - 1)), joinPath(path, String(i)))
            }
        }
        moveSubtree(tempPath, joinPath(path, String(toIndex)))
    }

    /**
     * Writes `value` into every registered field under `path`: directly, if `path` is itself
     * a leaf input field, or into each of its descendant fields (object-shaped item) otherwise,
     * reading each one's own slice via its relative suffix.
     */
    function setValueAtPath(path: string, value: unknown): void {
        const field = state.fields[path]
        if (field) {
            field.value = value
            return
        }
        for (const key of fieldEntries.keys()) {
            if (key === path || !isUnderPath(key, path)) continue
            const suffix = key.slice(path.length + 1)
            const descendant = state.fields[key]
            if (descendant) descendant.value = getAtPath(value, suffix)
        }
    }

    /** Replaces the value at `index` without reordering anything. A no-op if out of range. */
    function updateArrayItem(path: string, index: number, value: unknown): void {
        const length = state.arrayLengths[path] ?? 0
        if (index < 0 || index >= length) return
        setValueAtPath(joinPath(path, String(index)), value)
    }

    /** Replaces the whole array's items with `items`, resizing (respecting minItems/maxItems). */
    function replaceArray(path: string, items: unknown[]): void {
        const entry = arrayEntries.get(path)
        if (!entry) return

        const targetLength = items.length
        while ((state.arrayLengths[path] ?? 0) > targetLength) {
            const before = state.arrayLengths[path] ?? 0
            removeArrayItem(path, before - 1)
            if ((state.arrayLengths[path] ?? 0) === before) break // minItems is blocking further removal
        }
        while ((state.arrayLengths[path] ?? 0) < targetLength) {
            const before = state.arrayLengths[path] ?? 0
            addArrayItem(path)
            if ((state.arrayLengths[path] ?? 0) === before) break // maxItems is blocking further addition
        }

        const length = state.arrayLengths[path] ?? 0
        for (let i = 0; i < length && i < items.length; i++) {
            updateArrayItem(path, i, items[i])
        }
    }

    async function validateField(name: string): Promise<void> {
        const entry = fieldEntries.get(name)
        const field = state.fields[name]
        if (!entry || !field) return

        field.validating = true
        const issues = await runValidators(entry.validate, field.value)
        field.errors = issues.map((issue) => issue.message)
        field.validating = false
    }

    async function validateGroup(name: string): Promise<void> {
        const entry = groupEntries.get(name)
        if (!entry) return

        const childKeys = Object.keys(entry.fields)
        // Refresh each direct child's own errors first, so group issues layer on top of a
        // clean slate instead of accumulating across repeated validateGroup calls. A child
        // that is itself a group or array is refreshed the same way, recursively.
        for (const childKey of childKeys) {
            const childPath = joinPath(name, childKey)
            if (state.fields[childPath]) await validateField(childPath)
            if (groupEntries.has(childPath)) await validateGroup(childPath)
            if (arrayEntries.has(childPath)) await validateArray(childPath)
        }

        // Reconstructed from the full values tree (not just direct field children) so a
        // nested group or array child carries its real value into the cross-field check.
        const values = (getAtPath(buildValues(false), name) ?? {}) as Record<string, unknown>

        const issues = await runValidators(entry.validate, values)
        const groupMessages: string[] = []
        for (const issue of issues) {
            const childKey = issue.path?.[0] !== undefined ? String(issue.path[0]) : undefined
            const childField = childKey ? state.fields[joinPath(name, childKey)] : undefined
            if (childField) {
                childField.errors.push(issue.message)
            } else {
                groupMessages.push(issue.message)
            }
        }
        state.groupErrors[name] = groupMessages
    }

    async function validateArray(path: string): Promise<void> {
        const entry = arrayEntries.get(path)
        if (!entry) return

        const length = state.arrayLengths[path] ?? 0
        // Refresh every item's own validation first, same reasoning as validateGroup.
        for (let i = 0; i < length; i++) {
            const itemPath = joinPath(path, String(i))
            if (state.fields[itemPath]) await validateField(itemPath)
            if (groupEntries.has(itemPath)) await validateGroup(itemPath)
            if (arrayEntries.has(itemPath)) await validateArray(itemPath)
        }

        const value = getAtPath(buildValues(false), path)
        const issues = await runValidators(entry.validate, value)
        state.arrayErrors[path] = issues.map((issue) => issue.message)
    }

    async function validateAll(): Promise<boolean> {
        for (const name of fieldEntries.keys()) {
            await validateField(name)
        }
        for (const name of groupEntries.keys()) {
            await validateGroup(name)
        }
        for (const name of arrayEntries.keys()) {
            await validateArray(name)
        }

        state.isValid =
            Object.values(state.fields).every((field) => field.errors.length === 0) &&
            Object.values(state.groupErrors).every((errors) => errors.length === 0) &&
            Object.values(state.arrayErrors).every((errors) => errors.length === 0)
        return state.isValid
    }

    function getFieldBinding<T = unknown>(name: string): FieldBinding<T> {
        const field = state.fields[name]
        if (!field) {
            throw new Error(`EzForm: no field registered under "${name}", check the schema's field keys.`)
        }
        return {
            modelValue: field.value as T,
            error: field.touched || state.submitAttempted ? field.errors[0] : undefined,
            'onUpdate:modelValue': (value: T) => {
                field.value = value
                field.dirty = value !== resolveFieldSeed(name, initialValues)
                if (field.touched || state.submitAttempted) void validateField(name)
            },
            onBlur: () => {
                field.touched = true
                void validateField(name)
            },
        }
    }

    /**
     * The native-element alternative to `getFieldBinding`: `v-bind` this straight onto an
     * `<input>`/`<textarea>`/`<select>` instead of a v-model component. Reads/writes
     * `.value` as a string, same as the DOM itself does; a field needing real typed values
     * (a checkbox, a number) should use `getFieldBinding` on a wrapping component instead.
     */
    function getNativeFieldBinding(name: string): NativeFieldBinding<string> {
        const field = state.fields[name]
        if (!field) {
            throw new Error(`EzForm: no field registered under "${name}", check the schema's field keys.`)
        }
        return {
            value: field.value as string,
            name,
            onInput: (event: Event) => {
                const value = (event.target as HTMLInputElement).value
                field.value = value
                field.dirty = value !== resolveFieldSeed(name, initialValues)
                if (field.touched || state.submitAttempted) void validateField(name)
            },
            onBlur: () => {
                field.touched = true
                void validateField(name)
            },
        }
    }

    function handleSubmit(
        onValid: (values: Record<string, unknown>) => void,
        onInvalid?: (state: FormState) => void,
    ) {
        return async () => {
            state.submitAttempted = true
            state.isSubmitting = true
            const valid = await validateAll()
            if (valid) {
                onValid(values.value)
            } else {
                onInvalid?.(state)
            }
            state.isSubmitting = false
        }
    }

    function resetForm(nextValues?: Record<string, unknown>) {
        const source = nextValues ?? initialValues

        // Resize every array back to match the target source's length before resetting
        // field values, so add/remove calls made since setup don't leave stale extra (or
        // missing) rows behind.
        for (const path of [...arrayEntries.keys()]) {
            const entry = arrayEntries.get(path)
            if (!entry) continue
            const targetValue = getAtPath(source, path) ?? getAtPath(schema.defaultValues, path)
            const targetLength = Array.isArray(targetValue) ? targetValue.length : (entry.minItems ?? 0)
            while ((state.arrayLengths[path] ?? 0) > targetLength) {
                const before = state.arrayLengths[path] ?? 0
                removeArrayItem(path, before - 1)
                if ((state.arrayLengths[path] ?? 0) === before) break // minItems is blocking further removal
            }
            while ((state.arrayLengths[path] ?? 0) < targetLength) {
                const before = state.arrayLengths[path] ?? 0
                addArrayItem(path)
                if ((state.arrayLengths[path] ?? 0) === before) break // maxItems is blocking further addition
            }
        }

        for (const name of fieldEntries.keys()) {
            const field = state.fields[name]
            if (!field) continue
            field.value = resolveFieldSeed(name, source)
            field.errors = []
            field.touched = false
            field.dirty = false
            field.validating = false
        }
        for (const name of groupEntries.keys()) {
            state.groupErrors[name] = []
        }
        for (const name of arrayEntries.keys()) {
            state.arrayErrors[name] = []
        }
        state.submitAttempted = false
        state.isSubmitting = false
        state.isValid = true
    }

    function setValues(nextValues: Record<string, unknown>) {
        for (const name of fieldEntries.keys()) {
            const field = state.fields[name]
            if (!field) continue
            const value = getAtPath(nextValues, name)
            if (value === undefined) continue
            field.value = value
            field.dirty = value !== resolveFieldSeed(name, initialValues)
        }
    }

    /** Reconstructs a nested values object from the flat/path-keyed field state. */
    function buildValues(dirtyOnly: boolean): Record<string, unknown> {
        const result: Record<string, unknown> = {}
        for (const [path, field] of Object.entries(state.fields)) {
            if (dirtyOnly && !field.dirty) continue
            setAtPath(result, path, field.value)
        }
        return result
    }

    const values = computed<Record<string, unknown>>(() => buildValues(false))
    const dirtyValues = computed<Record<string, unknown>>(() => buildValues(true))

    return {
        state,
        getFieldBinding,
        getNativeFieldBinding,
        validateField,
        validateGroup,
        validateArray,
        addArrayItem,
        removeArrayItem,
        insertArrayItem,
        prependArrayItem,
        swapArrayItems,
        moveArrayItem,
        updateArrayItem,
        replaceArray,
        validateAll,
        handleSubmit,
        resetForm,
        setValues,
        get values() {
            return values.value
        },
        get dirtyValues() {
            return dirtyValues.value
        },
    }
}
