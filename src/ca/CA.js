import path from 'path'
import fs from 'fs'
import process from 'process'
import readline from 'readline'
import openssl from '../openssl'
import logger from '../logger'

import CSR from '../csr/CSR'
import RSA from '../rsa/RSA'

import { getPath, createNewDir, readFile, readFileSync, writeFile,
    makeFilename, fileStat, copyFile, formatSubject, copyToTmp} from '../utils'

const CA_DIR_REPLACE = '__replace_me__'
const CA_CERTS_DIR = 'certs'
const CA_CRL_DIR = 'crl'
const CA_NEWCERTS_DIR = 'newcerts'
const CA_CSRS_DIR = 'csrs'
const CA_PRIVATE_KEY_DIR = 'private'
const CA_CONFIG_FILE = 'openssl.cnf'
const CA_PRIVATE_KEY_FILE = 'ca.key.pem'
const CA_CERT_FILE = 'ca.cert.pem'
const CA_CSR_FILE = 'ca.csr.pem'
const CA_DB_FILE = 'index.txt'
const CA_SERIALNUMBER_FILE = 'serial'
const CA_CRLNUMBER_FILE = 'crlnumber'

export default class CA {

    /**
     * The constructor sets up the logical paths and file names needed by the
     * rest of the CA methods.
     * @param {string} rootDir
     * @param {string} configFile
     */
    constructor(rootDir) {
        this.rootDir = rootDir
        this.name = path.basename(rootDir)
        this.configFile = getPath(rootDir, CA_CONFIG_FILE)
        this.certsDir = getPath(rootDir, CA_CERTS_DIR)
        this.crlDir = getPath(rootDir, CA_CRL_DIR)
        this.newCertsDir = getPath(rootDir, CA_NEWCERTS_DIR)
        this.csrsDir = getPath(rootDir, CA_CSRS_DIR)
        this.privateDir = getPath(rootDir, CA_PRIVATE_KEY_DIR)

        this.caPrivateKeyFile = getPath(this.privateDir, CA_PRIVATE_KEY_FILE)
        this.caCertFile = getPath(this.certsDir, CA_CERT_FILE)
    }

    /**
     * Creates a key and CSR using the provided options.  Then creates a
     * cert from the CSR.
     *
     * @param {object} options Options for the key and CSR/Cert
     * @param {string} certOutFile Where to put the cert
     * @param {string} keyOutFile Where to put the private key
     * @param {string} passout Optional password for private key
     */
    createCertAndKey(options, certOutFile, keyOutFile, passout) {
        // Manage the private key file name
        const keyFile = makeFilename(options, 'key.pem', keyOutFile)
        const certFile = makeFilename(options, 'cert.pem', certOutFile)

        // This is not threadsafe.  Good thing node isn't multi-threaded!
        const serial = readFileSync(`${this.rootDir}/serial`, 'utf-8')
        const csrFile = `${this.csrsDir}/${serial}.pem`

        // Create the private key
        const rsa = new RSA()
        return rsa.create(options, passout, keyFile)
        .catch(err => {
            logger.error('CA.createCertAndKey failed creating private key', err)
            throw err
        })
        // Create the CSR
        .then(keyFile => {
            const csr = new CSR()
            return csr.create(options, keyFile, passout, csrFile)
            .catch(err => {
                logger.error('CA.createCertAndKey failed creating CSR', err)
                throw err
            })
        })
        // Create the certificate
        .then(result => {
            return this.signCSR(options, csrFile)
            .catch(err => {
                logger.error('CA.createCertAndKey failed signing CSR', err)
                throw err
            })
            .then(buffer => {
                return writeFile(certFile, buffer.toString())
                .then(() => {
                    return buffer
                })
                .catch(err => {
                    logger.error('CA.createCertAndKey failed saving cert: ', err)
                    throw err
                })
            })
        })
    }

    signCSR(options, csrFile, certFile) {
        // const privateKeyPassword = 'password'
        logger.info(`CA [${this.name}]: creating certificate from CSR `)
        try {
            let cnfFile = this.configFile
            let caOpts = {
                config: this.configFile,
                in: csrFile,
                notext: true,
                batch: true
            }

            // Overrides the default in the cnf
            if (options && ('cert' in options) && ('days' in options.cert)) {
                caOpts['days'] = options.cert.days
            }

            // The v3 extensions are determined by cert type
            if ('type' in options) {
                if (options.type === 'ca') {
                    caOpts['extensions'] = 'v3_intermediate_ca'
                } else if (options.type === 'server') {
                    caOpts['extensions'] = 'server_cert'
                } else {
                    caOpts['extensions'] = 'user_cert'
                }
            }

            // Sign the certificate
            return openssl('ca', caOpts)
            .then(buffer => {
                logger.info(`CA [${this.name}]: certificate created`)
                if (certFile) {
                    return writeFile(certFile, buffer)
                    .then(() => {
                        logger.debug('CA.signCSR: wrote cert file', certFile)
                        return certFile
                    })
                    .catch(err => {
                        logger.error('CA.signCSR failed writing cert file', err)
                        throw err
                    })
                }
                return buffer
            })
            .catch(err => {
                logger.error('CA.signCSR openssl error:', err)
                throw err
            })

        } catch(err) {
            logger.error('CA.signCSR failed:', this.name, err)
            throw err
        }
    }

    /**
     * Called after the CA's cert has be created from a CSR.
     * @param {string} cert
     */
    storeOwnCert(cert) {
        logger.info(`CA [${this.name}]: saving certificate...`)
        return writeFile(this.caCertFile, cert.toString())
        .then(() => {
            logger.info(`CA [${this.name}]: certificate saved`)
            return cert
        })
        .catch(err => {
            logger.error(`CA [${this.name}]: failed saving certificate`, err)
            throw err
        })
    }

    /**
     * Public method
     * createCA performs 3 functions:
     * 1. Create the folder structure, and copy the .cnf file to the root
     * 2. Create the CA private key
     * 3. Create the CA certificate
     *
     *
     * @param {object} options
     */
    create(configFile, isSelfSigned, options) {
        try {
            if (isSelfSigned) {
                logger.info(`CA [${this.name}]: Initializing as self signed...`)
            } else {
                logger.info(`CA [${this.name}]: Initializing with CSR...`)
            }

            return this.createFolderStructure()
            .catch(err => {
                logger.error('CA.create failed to create folder structure', err)
                throw err
            })
            .then(() => {
                return writeFile(getPath(this.rootDir, CA_DB_FILE), '')
                .catch(err => {
                    logger.error(`CA.create failed creating ${CA_DB_FILE}`, err)
                    throw err
                })
            })
            .then(() => {
                return writeFile(getPath(this.rootDir, CA_SERIALNUMBER_FILE), '1000')
                .catch(err => {
                    logger.error(`CA.create failed creating ${CA_SERIALNUMBER_FILE}`, err)
                    throw err
                })
            })
            .then(() => {
                return writeFile(getPath(this.rootDir, CA_CRLNUMBER_FILE), '1000')
                .catch(err => {
                    logger.error(`CA.create failed creating ${CA_SERIALNUMBER_FILE}`, err )
                    throw err
                })
            })
            .then(() => {
                // Once the folders are created, copy the config to the root
                return this.copyWithFixups(configFile)
                .catch(err => {
                    logger.error('CA.create failed to copy config file', err)
                    throw err
                })
            })
            .then(() => {
                // And create the private key
                const rsa = new RSA()
                const keyFile = `${this.privateDir}/${CA_PRIVATE_KEY_FILE}`
                let passout  // Don't encrypt the key

                // Use default key size, if not specified in options
                if (!('size' in options.key)) {
                    options.key.size = '4096'
                }
                // Create the CA's private key
                return rsa.create(options, passout, keyFile)
                .catch(err => {
                    logger.error('CA.create failed to create private key', err)
                    throw err
                })
            })
            .then((keyResult) => {
                // Now that the private key exists, create the cert or csr.
                // If self signed, create the cert
                if (isSelfSigned) {
                    return this.createCACert(options)
                    .then(certResult => {
                        // Return both the key and the cert
                        return ({key: keyResult, cert: certResult})
                    })
                    .catch(err => {
                        logger.error('CA.create failed to create self signed cert', err)
                        throw err
                    })
                } else {
                    // Otherwise, create the csr
                    const csr = new CSR()
                    const csrFile = `${this.csrsDir}/${CA_CSR_FILE}`
                    let passin
                    return csr.create(options, keyResult, passin, csrFile)
                    .then(csrResult => {
                        // Return both the key and the cert
                        return {key: keyResult, csr: csrResult}
                    })
                    .catch(err => {
                        logger.error('CA.create failed to create csr', err)
                        throw err
                    })
                }
            })
            .then(result => {
                logger.debug('CA.create completed returning result.', result)
                logger.info(`CA [${this.name}]: Initialization complete`)
                return result
            })
        } catch(err) {
            logger.error('CA.create failed', err)
            throw err
        }
    }

    /**
     * Private method
     * createFolderStructure is called by createCA.
     */
    createFolderStructure = () => {
        // The set of folders under the CA to create
        const folders = [
            this.certsDir,
            this.crlDir,
            this.csrsDir,
            this.newCertsDir,
            this.privateDir
        ]
        // Create the root folder
        return createNewDir(this.rootDir)
        .then(() => {
            logger.info('CA root folder created')
            let promises = []
            // Now create all the sub folders
            folders.forEach(folder => {
                promises.push(createNewDir(folder))
            })
            return Promise.all(promises)
            .catch(err => {
                logger.error('Failed creating CA folders', err)
                throw err
            })
        })
        .then(() => {
            logger.info('CA folder structure created')
        })
        .catch(err => {
            logger.error('Error creating CA folders', err)
            throw err
        })
    }

    /**
     * Private method
     * createCACert generates a self signed cert.  This is called by createCA
     *
     */
    createCACert = (options) => {
        // const privateKeyPassword = 'password'
        const subjAttrs = options.cert.subject
        const subject = formatSubject(subjAttrs)

        const reqOpts =  {
            config:  this.configFile,
            key: this.caPrivateKeyFile,
            new: true,
            x509: true,
            extensions: 'v3_ca',
            subj: subject,
            utf8: true,
            batch: true
        }

        // Override the default
        if ('days' in options.cert) {
            reqOpts.days = options.cert.days
        }

        return openssl('req',reqOpts)
        .then(buffer => {
            return writeFile(this.caCertFile, buffer.toString())
            .then(() => {
                return buffer
            })
            .catch(err => {
                logger.error('CA.createCACert - writeFile failed: ', err)
                throw err
            })
        })
        .then(buffer => {
        	logger.info('CA: created CA certificate');
            return buffer
        })
        .catch(err => {
            logger.error('CA.createCACert - openssl failed: ', err)
            throw err
        })
    }

     /**
     * Private method
     * Change the 'dir' setting in the provided .cnf file
     */
    copyWithFixups = (configFile) => {
        return new Promise((resolve, reject) => {
            try {
                const regexStr = `^dir\\s*=\\s*${CA_DIR_REPLACE}`
                let buffer = ''
                let inputFile = fs.createReadStream(configFile)
                const rl = readline.createInterface({
                    input: inputFile
                })
                rl.on('line', (input) => {
                    if (input.match(new RegExp(regexStr))) {
                        const newline = input.replace(CA_DIR_REPLACE, this.rootDir)
                        buffer += `${newline}\n`
                    } else {
                        buffer += `${input}\n`
                    }
                })
                rl.on('close', () => {
                    inputFile.close();
                    return writeFile(this.configFile, buffer)
                    .catch(err => {
                        logger.error(`copyWithFixups - writeFile failed: `, err)
                        reject(err)
                    })
                    .then(() => {
                        resolve(buffer)
                    })
                });
            } catch(err) {
                logger.error('readline failed', err)
                reject(err)
            }
        })
    }
}
