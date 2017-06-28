import objToProps  from './objToProps'
export default function makeSection(options, sectionName) {
    let buffer = `[ ${sectionName} ]\n`
    buffer += objToProps(options)
    return buffer
}
