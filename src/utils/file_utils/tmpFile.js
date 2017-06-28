import fs from 'fs'
import tmp from 'tmp'

import logger from '../../logger'
import appendFile from './appendFile'

export default function tmpFile(options) {
    return new Promise((resolve, reject) => {
        try {
            const tmpOpts = options && options || {
                prefix: 'node_ca',
                postfix: '.cnf',
                discardDescriptor: true
            }
            tmp.file(tmpOpts, (err, path) => {
                if (err) {
                    logger.debug('tmpFile failed', err)
                    reject(err)
                } else {
                    resolve(path)
                }
            })
        } catch (err) {
            logger.debug('tmpFile failed', err)
            reject(err)
        }
    })
}

export function tmpFileSync(options) {
    const tmpOpts = options && options || {
        prefix: 'node_ca_',
        postfix: '.cnf',
        discardDescriptor: true,
        keep: true
    }
    let retVal
    try {
        const tmpObj = tmp.fileSync(tmpOpts)
        if (tmpObj && tmpObj.name) {
            retVal = tmpObj.name
        }
    } catch (err) {
        logger.debug('tmpFileSync failed:', err)
        throw err
    }
    return retVal
}

export function copyToTmp(inPath, buffer, tmpOptions, writeOptions) {
    return tmpFile(tmpOptions)
        .then(tmpPath => {
            return copyFile(inPath, tmpPath, writeOptions)
                .then(() => {
                    if (buffer) {
                        return appendFile(tmpPath, buffer)
                    } else {
                        return
                    }
                })
                .then(() => {
                    return tmpPath
                })
        })
        .catch(err => {
            logger.debug('copyToTmp failed', err)
            throw err
        })


}
