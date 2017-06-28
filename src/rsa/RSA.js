import openssl from '../openssl'
import { writeFile, tmpFileSync } from '../utils'
import logger from '../logger'

export default class RSA {


    create(options, password, outFile, writeOpts) {
        logger.verbose('RSA.create generating key')
        let keyFile
        if (outFile) {
            keyFile = outFile
        } else {
            keyFile = `${options.name}.key.pem`
        }
        let keyOpts = {}

        // Add keysize
        if ('size' in options.key) {
            keyOpts[`${options.key.size}`] = false
        }

        if (password && password !== null) {
            keyOpts['passout'] = password
            let dekAlg = 'aes128'
            if('dekAlg' in options.key) {
                dekAlg = options.key.dekAlg
            }
            keyOpts[dekAlg] = true
        }
        logger.verbose('RSA.create key options', keyOpts)
        return openssl('genrsa', keyOpts)
        .then(buffer => {
            if(!outFile) {
                logger.verbose('RSA.create: returning key buffer')
                return buffer.toString()
            }
            return writeFile(keyFile, buffer.toString())
            .then(() => {
                logger.verbose(`RSA.create: saved key to ${keyFile}`)
                return keyFile
            })
            .catch(err => {
                logger.error('RSA.create failed saving file', err)
                throw err
            })
        })
        .then((result) => {
            logger.verbose('RSA.create generated key')
            return result
        })
        .catch(err => {
            logger.error('RSA.create failed generating key', err)
            throw err
        })
    }
}

