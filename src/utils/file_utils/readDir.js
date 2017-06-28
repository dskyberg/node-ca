import fs from 'fs'

export default function readDir(dir, filter) {
    const files = fs.readdirSync(dir);
    let fileList
    // For OS X
    fileList = files.filter(file => {
        return file !== '.DS_Store'
    })

    if (filter) {
        fileList = fileList.filter(file => {
            return file.match(filter)
        })
    }
    return fileList
}
