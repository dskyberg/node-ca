export default function objToProps(options) {
    let buffer = ''
    for (let attr in options) {
        buffer += `${attr} = ${options[attr]}
`
    }
    return buffer
}
