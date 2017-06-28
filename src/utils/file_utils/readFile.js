import fs from 'fs'

import logger from '../../logger'

export default function readFile(path, options) {
    return new Promise((resolve, reject) => {
        try {
            let opts
            if (options === undefined) {
                opts = {}
            } else {
                opts = options
            }
            fs.readFile(path, opts, (err, data) => {
                if (err) {
                    logger.debug('readFile failed', err)
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        } catch (err) {
            logger.debug('readFile failed', err)
            reject(err)
        }
    })
}

export function readFileSync(path, options) {
    try {
        return fs.readFileSync(path, options)
    } catch(err) {
        logger.debug('readFileSync failed', err)
        throw err
    }
}
