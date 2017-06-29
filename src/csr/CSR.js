import fs from 'fs'
import openssl from '../openssl'

import { makeSection, makeFilename } from '../utils'
import { writeFile, tmpFileSync } from '../utils'
import logger from '../logger'


export default class CSR {

    /**
     *
     * @param {object} options
     * @param {string} keyFile The file for signing the CSR
     * @param {string} passin The password for the key, or undefined
     * @param {string} outFile Where to put the CSR.  If undefined, the csr is returned.
     */
    create(options, keyFile, passin, outFile) {
        logger.verbose('CSR.create generating CSR')
        const csrFile = makeFilename(options, 'csr.pem', outFile)
        const configFile = tmpFileSync()
        const configOpts = CSR.makeConfig(options)

        logger.verbose('CSR.create config options', configOpts)

        try {
            fs.writeFileSync(configFile, configOpts)
        } catch(err) {
            logger.error(`CSR.create failed writing tmp config file ${configFile}`, err)
            throw err
        }

        const reqOpts = {
            batch: true,
            config: configFile,
            key: keyFile,
            new: true
        }
        if (passin && passin !== null) {
            reqOpts['passin'] = passin
        }

        logger.verbose('CSR.create request options', reqOpts)

        return openssl('req', reqOpts)
        .then(buffer => {
            if(!outFile) {
                return buffer.toString()
            }
            logger.verbose(`CSR.create - writing CSR to ${csrFile}`)
            return writeFile(csrFile, buffer.toString())
            .then(() => {return csrFile})
            .catch(err => {
                logger.error('CSR.create failed writing file', err)
                throw err
            })
        })
        .then((result) =>{
            logger.info('CSR.create generated CSR', result)
            return result
        })
        .catch(err => {
            logger.error('CSR.create failed', err)
            throw err
        })
    }

    static makeConfig(options) {
        const dn_section = 'req_distinguished_name'
        const ext_section = 'v3_exts'
        let reqOpts = {
            default_bits: '2048',
            string_mask: 'utf8only',
            default_md: 'sha256',
            prompt: 'no'
        }
        if ('subject' in options.cert) {
            reqOpts.distinguished_name = dn_section
        }
        if ('extensions' in options.cert) {
            reqOpts.req_extensions = ext_section
        }

        let buffer = makeSection(reqOpts, 'req')
        if ('subject' in options.cert) {
            buffer += makeSection(options.cert.subject, dn_section)
        }
        if ('extensions' in options.cert) {
            buffer += makeSection(options.cert.extensions, ext_section)
        }
        return buffer
    }
}