import fs from 'fs'

import logger from '../../logger'

export default function fileStat(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (err) {
                if (err.code !== 'ENOENT') {
                    logger.debug('fileState failed', err)
                    reject(err)
                } else {
                    resolve()
                }
            } else {
                resolve(stats)
            }
        })
    })
}

export function fileStatSync(path) {
    try {
        return fs.statSync(path)
    } catch(err) {
        if (err.code !== 'ENOENT') {
            logger.debug('fileStatSync failed', err)
            throw err
        }
    }
}

