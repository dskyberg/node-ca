import fs from 'fs'
import logger from '../../logger'

export default function appendFile(inPath, buffer, options) {
    return new Promise((resolve, reject) => {
        try {
            fs.appendFile(inPath, buffer, options, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        } catch (err) {
            logger.debug('appendFile failed', err)
            reject(err)
        }
    })
}
