export default function makeFilename(options, ext, outFile) {
    let fileName
    if (outFile) {
        fileName = outFile
    } else if ('name' in options){
        fileName = `${options.name}.${ext}`
    } else if ('cert' in options && 'subject' in options.cert && 'CN' in options.cert.subject) {
        fileName = `${options.cert.subject.CN}.${ext}`
    } else {
        fileName = ext
    }
    return fileName
}
