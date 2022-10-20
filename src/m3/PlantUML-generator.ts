import {
    Concept,
    ConceptInterface,
    Containment,
    Enumeration,
    Feature,
    Link,
    Metamodel,
    MetamodelElement,
    Multiplicity,
    PrimitiveType,
    unresolved
} from "./types.ts"
import {
    isPlural,
    nonRelationalFeatures,
    relationsOf,
    sortByStringKey,
    type
} from "./functions.ts"


const indented = (lines: string[]) =>
    lines.map((line) => `  ${line}`).join("\n")


const sortByName = (metamodelElements: MetamodelElement[]) =>
    sortByStringKey(metamodelElements, (element) => element.simpleName)


export const generateForMetamodel = ({qualifiedName, elements}: Metamodel) =>
`@startuml

' qualified name: "${qualifiedName}"


${sortByName(elements).map(generateForMetamodelElement).join("\n")}


' relations:

${sortByName(elements).map((element) => generateForRelationsOf(element)).join("")}
@enduml
`


const generateForEnumeration = ({simpleName, literals}: Enumeration) =>
`enum ${simpleName} {
${indented(literals.map(({name}) => name))}
}
`


const generateForConcept = ({simpleName, features, abstract: abstract_, extends: extends_, implements: implements_}: Concept) => {
    const nonRelationalFeatures_ = nonRelationalFeatures(features)
    const fragments: string[] = []
    if (abstract_) {
        fragments.push(`abstract`)
    }
    fragments.push(`class`, simpleName)
    if (extends_ !== undefined && extends_ !== unresolved) {
        fragments.push(`extends`, extends_.simpleName)
    }
    if (implements_.length > 0) {
        fragments.push(`implements`, implements_.map((conceptInterface) => conceptInterface.simpleName).sort().join(", "))
    }
    return `${fragments.join(" ")}${nonRelationalFeatures_.length === 0 ? `` : ` {
${indented(nonRelationalFeatures_.map(generateForNonRelationalFeature))}
}`}
`
}


const generateForConceptInterface = ({simpleName, extends: extends_, features}: ConceptInterface) => {
    const nonRelationalFeatures_ = nonRelationalFeatures(features)
    const fragments: string[] = [`interface`, simpleName]
    if (extends_.length > 0) {
        fragments.push(`extends`, extends_.map((superInterface) => superInterface.simpleName).join(", "))
    }
    return `${fragments.join(" ")}${nonRelationalFeatures_.length === 0 ? `` : ` {
${indented(nonRelationalFeatures_.map(generateForNonRelationalFeature))}
}`}
`
}


const generateForNonRelationalFeature = (feature: Feature) => {
    const {simpleName, multiplicity, derived} = feature
    const isListy = isPlural(multiplicity)
    const type_ = type(feature)
    return `${simpleName}${derived ? `()` : ``}: ${isListy ? `List<` : ``}${type_ === unresolved ? `???` : type_.simpleName}${isPlural(multiplicity) ? `>` : ``}${multiplicity === Multiplicity.Optional ? `?` : ``}`
}


const generateForPrimitiveType = ({simpleName}: PrimitiveType) =>
`' primitive type: "${simpleName}"
`
// Note: No construct for PrimitiveType exists in PlantUML.


const generateForMetamodelElement = (metamodelElement: MetamodelElement) => {
    if (metamodelElement instanceof Enumeration) {
        return generateForEnumeration(metamodelElement)
    }
    if (metamodelElement instanceof Concept) {
        return generateForConcept(metamodelElement)
    }
    if (metamodelElement instanceof ConceptInterface) {
        return generateForConceptInterface(metamodelElement)
    }
    if (metamodelElement instanceof PrimitiveType) {
        return generateForPrimitiveType(metamodelElement)
    }
    return `' unhandled metamodel element: ${metamodelElement.simpleName}
`
}


const generateForRelationsOf = (metamodelElement: MetamodelElement) => {
    const relations = relationsOf(metamodelElement)
    return relations.length === 0
        ? ``
        : relations
            .map((relation) => generateForRelation(metamodelElement, relation))
            .join("\n") + "\n\n"
}


const generateForRelation = ({simpleName: leftName}: MetamodelElement, relation: Link) => {
    const {simpleName: relationName, multiplicity, type} = relation
    const rightName = type === unresolved ? `???` : type.simpleName
    const isContainment = relation instanceof Containment
    const leftMultiplicity = isContainment ? `1` : `*`
    const rightMultiplicity = (() => {
        switch (multiplicity) {
            case Multiplicity.OneOrMore: return "*"
            case Multiplicity.Optional: return "0..1"
            case Multiplicity.Single: return "1"
            case Multiplicity.ZeroOrMore: return "*"
        }
    })()
    return `${leftName} "${leftMultiplicity}" ${isContainment ? `o` : ``}-- "${rightMultiplicity}" ${rightName}: ${relationName}`
}


/*
 Notes:
    1. No construct for PrimitiveType in PlantUML.
 */

