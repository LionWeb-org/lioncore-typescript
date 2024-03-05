import { extname } from "path"
import { Language, MetaPointer, SerializationChunk, groupBy, MemoisingSymbolTable, conceptsOf, Classifier } from "@lionweb/core"
import { readChunk, tryLoadAllAsLanguages, writeJsonAsFile } from "@lionweb/utilities"
import { separate } from "../language-aware-args.js"

export const executeMeasureCommand = async (args: string[]) => {
    const { chunkPaths, languagePaths } = separate(args)
    const languages = await tryLoadAllAsLanguages(languagePaths)
    chunkPaths.forEach(chunkPath => {
        measureSerializationChunk(chunkPath, languages)
    })
}

const measureSerializationChunk = async (path: string, languages: Language[]) => {
    // TODO - Pass in languages to measure function

    const chunk = await readChunk(path)
    const extLessPath = path.substring(0, path.length - extname(path).length)
    const metricsPath = extLessPath + ".metrics.json"
    writeJsonAsFile(metricsPath, measure(chunk, languages))
    console.log(`Wrote metrics for ${path} --> ${metricsPath}`)
}

// TODO  move all of this to @lionweb/utilities (in the end)

type ClassifierInstantiationMetric = {
    name?: string
    key: string // == key of classifier
    language: string // == key of language
    version: string
    count: number
    // TODO  add property to say the classifier is a concept, or annotation (or enum)?
}

type Metrics = {
    instantiations: ClassifierInstantiationMetric[]
    unusedConcreteConcepts: MetaPointer[]
}

const measure = (serializationChunk: SerializationChunk, languages: Language[]): Metrics => {
    const symbolTable = new MemoisingSymbolTable(languages)

    // Group nodes by classifier key, language, and version
    const instantiationsPerId = groupBy(serializationChunk.nodes, ({ classifier }) => getInstantiationPerId(classifier))

    // Map grouped nodes to instantiations with count
    const instantiations = Object.values(instantiationsPerId).map(nodes => ({
        ...nodes[0].classifier,
        name: symbolTable.entityMatching(nodes[0].classifier)?.name,
        count: nodes.length
    }))

    // Compute all concepts for the language
    const concreteConcepts = languages.flatMap(language => conceptsOf(language).filter(concept => !concept.abstract))
    const unusedConcreteConcepts = concreteConcepts.filter(concept => !instantiations.some(({ key }) => key === concept.key))

    // Return the metrics object with instantiations
    return {
        instantiations,
        unusedConcreteConcepts: unusedConcreteConcepts.map(concept => ({
            language: concept.language.key,
            key: concept.key,
            version: concept.language.version
        }))
    }
}

const getInstantiationPerId = (classifier: MetaPointer) => `${classifier.key}:${classifier.language}:${classifier.version}`
