/**
 * Wrapper around x509, to provide easier processing
 */
import x509 from 'x509'
import logger from '../logger'

export default class Cert {
    constructor(certFile) {
        try {
            const cert = x509.parseCert(certFile)
            this.serial = cert.serial
            this.subject = cert.subject
            this.issuer = cert.issuer
            this.validity = {
                notBefore: cert.notBefore,
                notAfter: cert.notAfter
            }
            this.signatureAlgorithm = cert.signatureAlgorithm
            this.publicKey = cert.publicKey
            this.subjectAltNames = cert.altNames
            this.extensions = cert.extensions
            this.subjectHash = cert.subjectHash
            this.fingerPrint = cert.fingerPrint
        } catch(err) {
            logger.error('Cert constructor failed', err)
            throw err
        }
    }

}