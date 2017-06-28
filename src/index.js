import fs from 'fs'
import path from 'path'
import process from 'process'

import inquirer from 'inquirer'

import { getPath, IS_NOT_RESOLVED, createNewDir, readDir, readFile, writeFile,
    fileExistsSync } from './utils'
import { isSelfSigned } from './utils'
import CA from './ca/CA.js'
import Cert from './cert/Cert'

import packageJson from '../package.json'

import logger from './logger'
logger.addFile(packageJson)

// For incremental process notification
const ui = new inquirer.ui.BottomBar()
logger.addUI(ui)

// Location of CA folders.  Each CA has its own folder under this
const rootDir = path.resolve(packageJson.ca.dir)

// List of openssl .cnf files
const configFiles = readDir('./configs', /\.cnf$/)

// List of json files for cert subject and key creation
const optionsFiles = readDir('./configs', /\.json$/ )

// List of CAs.
let CAs = []

/**
 * Initialize the system. This basically means create the top level folder
 */
function handleInit() {
    return createNewDir(rootDir)
    .then((dir) => {
        logger.info('Root folder created')
    })
}

/**
 * Create a new CA.  Takes 3 parameters:
 *   Name - this is the folder name under the rootDir
 *   Config - select a .cnf file from the configs folder
 *   Options - select a .json file from the configs folder
 */
function handleCreateCa() {
    return inquirer.prompt([
        {
            type: 'list',
            name: 'config',
            message: 'Which config (.cnf) file?',
            choices: configFiles
        },
        {
            type: 'input',
            name: 'options',
            message: 'Where is the options file?',
            validate: function (value) {
                if (fileExistsSync(value)) {
                    return true
                }
                return 'Please enter a valid file';
            }
        },
        {
            type: 'confirm',
            name: 'selfsigned',
            message: 'Is this CA self signed?',
            default: false
        },
        {
            type: 'list',
            name: 'signing_ca',
            message: 'Which CA shold sign this',
            choices: CAs,
            when: (answers) => {return !answers.selfsigned}
        }
    ]).then(answers => {
        const options = require(getPath('./', answers.options, IS_NOT_RESOLVED))
        let newCaName
        if ('name' in options) {
            newCaName = options.name
        } else {
            newCaName = path.basename(answers.config, '.cnf')
        }
        const newCaDir = getPath(rootDir, newCaName)
        const config = getPath('./configs', answers.config, IS_NOT_RESOLVED)
        const isSelfSigned = answers.selfsigned
        const newCA = new CA(newCaDir)
        return newCA.create(config, isSelfSigned, options)
        .catch(err => {
            // It seems cert generation failed
            logger.error(`CA creation failed: ${err}`)
            throw err
        })
        .then((response) => {
            // If this is self signed, we're done.  Return the response.
            // Otherwise, send the CSR to the signing CA, and return the
            // resulting cert, along with the key from this response
            if(isSelfSigned) {
                return response
            } else {
                const signingCaDir = getPath(rootDir, answers.signing_ca)
                const signingCA = new CA(signingCaDir)
                return signingCA.signCSR(response.csr, options)
                .then( cert => {
                    // We now have a signed cert from the signing CA.  Give it
                    // back to the new CA for storing.
                    return newCA.storeOwnCert(cert)
                    .then(cert => {
                        return cert
                    })
                })
                .catch(err => {
                   logger.error(`Failed to sign CA cert: ${err}`)
                    throw err
                })
            }
        })
        .then((response) => {
            CAs.push(newCaName)
        })
    })
}
function handleCreateCert() {
    return inquirer.prompt([
        {
            type: 'list',
            name: 'signing_ca',
            message: 'Which CA shold sign this',
            choices: CAs,
        },
        {
            type: 'input',
            name: 'options',
            message: 'Where is the options file?',
            validate: function (value) {
                if (fileExistsSync(value)) {
                    return true
                }
                return 'Please enter a valid file';
            }
        }
    ]).then(answers => {
        const path = getPath('./', answers.options, IS_NOT_RESOLVED)
        const options = require(path)
        const signingCaDir = getPath(rootDir, answers.signing_ca)
        const signingCA = new CA(signingCaDir)

        return signingCA.createCertAndKey(options)
        .catch(err => {
            // It seems cert generation failed
            logger.error('Cert creation failed')
        })
    })
}

function handleSignCRL() {
    return Promise.resolve()
}

function loadCACerts() {
    let certs = {}
    for (let idx in CAs) {
        const certFile =  getPath(rootDir, `${CAs[idx]}/certs/ca.cert.pem`)
        const ca = new Cert(certFile)
        certs[ca.subject.commonName] = {ca: ca, certFile: certFile}
    }
    return certs
}

/**
 * Walk a chain, and produce a chain pem.
 * This function walks from cert issuer to cert issuer.
 * Matches are determined only on commonName. So, if two CA's have the same
 * common name, but differ in other subject attributes, it will find the first
 * match.
 */
function handleGetChain() {
    return inquirer.prompt([
        {
            type: 'input',
            name: 'cert',
            message: 'Where is the cert file?',
            validate: function (value) {
                if (fileExistsSync(value)) {
                    return true
                }
                return 'Please enter a valid file name';
            }
        },
         {
            type: 'input',
            name: 'chain',
            message: 'Where do you want the chain?',
            default: `${process.cwd()}/chain.pem`
        }
    ]).then(answers => {
        const cas = loadCACerts()
        const certPath = getPath('./', answers.cert, false)
        const cert = new Cert(certPath)
        const chain = []

        // If this is a self signed cert, nothing to do
        if (isSelfSigned(cert)) {
            // done
            logger.info('this is a self signed cert')
            return
        }
        // Seed by setting commonName to this cert's issuer.
        let commonName = cert.issuer.commonName
        while (true) {
            // Is the current issuer in our set of CA's?
            if (commonName in cas) {
                // Yep.  Grab it, ans stuff it in the chain.
                const ca = cas[commonName]
                chain.push(ca)

                // If this is a self signed, root cert, we're done
                if (isSelfSigned(ca.ca)) {
                    break
                }
                // Walk up the chain, by looking at this cert's issuer.
                commonName = ca.ca.issuer.commonName
            } else {
                break
            }
        }
        chain.forEach(elem => {
            const buffer = fs.readFileSync(elem.certFile, 'utf-8')
            if (buffer) {
                fs.appendFileSync(answers.chain, buffer)
            }
        })
    })

}

function handleRenewCert() {
    return Promise.resolve()
}

/**
 * Command line loop.  This function gets
 * recalled by each handler function
 */
function cli() {

    inquirer.prompt([
        {
            type: 'rawlist',
            name: 'command',
            message: 'Select an action: ',
            choices: [
                'Create a new CA',
                'Create a cert and key',
                'Renew a cert',
                'Sign a cert request',
                'Get CA cert chain',
                'Quit',
            ],
            filter: (value) => {
                if (value === 'Create a new CA') return 'create_ca';
                else if (value === 'Create a cert and key') return 'create_cert';
                else if (value === 'Sign a cert request') return 'sign_crl';
                else if (value === 'Get CA cert chain') return 'get_ca_chain';
                else if (value === 'Renew a cert') return 'renew_cert';
                else return 'quit';
            },
            default: 1,
            pageSize: 20
        },
        {
            type: 'confirm',
            name: 'really_init',
            message: 'Are you sure you want ot initialize the system?',
            when: (answers) => {answers.command === 'init'}
        }
    ])
        .then(answer => {
            if (answer.command === 'init_system') {
                if (!answer.really_init) {
                   return cli()
                }
                handleInit().then(cli)
            } else if (answer.command === 'create_ca') {
                return handleCreateCa().then(cli)
            } else if (answer.command === 'create_cert') {
                return handleCreateCert().then(cli)
            } else if (answer.command === 'sign_cert') {
                return handleSignCRL().then(cli)
            } else if (answer.command === 'get_ca_chain') {
                return handleGetChain().then(cli)
            } else if (answer.command === 'renew_cert') {
                return handleRenewCert().then(cli)
            }
        })
        .catch(err => {
            logger.error('epic fail!', err)
            throw err
        })
}

/**
 * Start the service
 */
if (!fileExistsSync(rootDir)) {
    handleInit().then(() => {
        CAs = readDir(rootDir)
    })
} else {
    CAs = readDir(rootDir)
}
logger.info(`Using root dir: ${rootDir}`)
logger.info(`Current CAs: ${CAs}`)
logger.info(`Current CA configs: ${configFiles}`)

cli()
