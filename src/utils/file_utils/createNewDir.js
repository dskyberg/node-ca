import fs from 'fs'

import logger from '../../logger'

export default function createNewDir(dir) {
    if (!fs.existsSync(dir)) {
        return new Promise((resolve, reject) => {
            fs.mkdir(dir, err => {
                if (err) {
                    logger.debug('createNewDir failed', err)
                    reject(err)
                } else {
                    resolve(dir)
                }
            })
        })
    } else {
        return Promise.resolve()
    }
}
