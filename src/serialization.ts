import {Id} from "./types.ts"


export type Ids = Id[]


export type MetaPointer = {
    metamodel: string
    version: string
    key: string
}

export type SerializedProperty = {
    property: MetaPointer
    value: string
}

export type SerializedContainment = {
    containment: MetaPointer
    children: Ids
}

export type SerializedReferenceTarget = {
    resolveInfo?: string
    reference: Id
}

export type SerializedReference = {
    reference: MetaPointer
    targets: SerializedReferenceTarget[]
}

/**
 * Type definition for an AST node serialized to JSON.
 */
export type SerializedNode = {
    concept: MetaPointer
    id: string
    properties: SerializedProperty[]
    children: SerializedContainment[]
    references: SerializedReference[]
    parent?: Id
}


/**
 * Type definition for a serialization of a whole model to JSON.
 */
export type SerializedModel = {
    serializationFormatVersion: string
    metamodels: []
    nodes: SerializedNode[]
}
// TODO  rename -> Serialization?

