import path from 'path'

import logger from '../../logger'

export default function getPath(root, subpath, isResolved = true) {
    try {
        if (isResolved) {
            return path.join(root, subpath)
        } else {
            return path.resolve(root, subpath)
        }
    } catch (err) {
        logger.debug('getPath failed', err)
        throw err
    }
}
