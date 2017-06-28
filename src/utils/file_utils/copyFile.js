import fs from 'fs'
import readFile from './readFile'
import writeFile from './writeFile'
import logger from '../../logger'

export default function copyFile(inPath, outPath, writeOptions) {
    return readFile(inPath)
        .then(data => {
            return writeFile(outPath, data, writeOptions)
        })
        .catch(err => {
            logger.debug('copyFile failed:', err)
            throw err
        })
}
