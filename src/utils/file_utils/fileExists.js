import fs from 'fs'
import logger from '../../logger'

export default function fileExists(path) {
    return new Promise((resolve, reject) => {
        fs.access(path, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    resolve(false)
                } else {
                    logger.debug('fileExists failed', err)
                    reject(err)
                }
            } else {
                resolve(true)
            }
        })
    })
}

/**
 * Use this for validation methods in inquirer
 * @param {string} path
 */
export function fileExistsSync(path) {
    try {
        fs.accessSync(path)
        return true
    } catch (err) {
        if (err.code === 'ENOENT') {
            return false
        } else {
            logger.debug('fileExistsSync failed', err)
            throw err
        }
    }
}

export function isDirectory(path) {
    if (fileExistsSync(path)) {
        const stats = fs.statSync(path)
        return stats.isDirectory()
    }
}

export function isFile(path) {
    if (fileExistsSync(path)) {
        const status = fs.statSync(path)
        return stats.isFile()
    }
}
