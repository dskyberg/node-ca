import fs from 'fs'

import logger from '../../logger'

export default function writeFile(path, data, optionsArg) {
    const options = optionsArg && optionsArg || {}
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, options, (err) => {
            if (err) {
                logger.debug('writeFile failed', err)
                reject(err)
            } else {
                resolve()
            }
        });
    })
}

export function writeFileSync(path, data, optionsArg) {
    try {
        fs.writeFileSync(path, data, optionsArg)
    } catch(err) {
        logger.debug('writeFileSync failed', err)
        throw err
    }
}
