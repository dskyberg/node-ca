const path = require('path')
const chai = require('chai')
const chaiAsPromised = require("chai-as-promised")
chai.use(chaiAsPromised);
const expect = chai.expect

const CSR = require('../../../lib/csr/CSR.js').default

// Because these use path.resolve, they are pathed relative to the project
// root folder
const protectedKey = path.resolve('./test/resources', 'protected.key.pem')
const unprotectedKey = path.resolve('./test/resources', 'unprotected.key.pem')

describe('CSR object', function () {

    it('create an object', function() {
        const options = require(path.resolve('./test/resources', 'csr.json'))
        const buff = CSR.makeConfig(options)
        const compareBuff = `[ req ]
default_bits = 2048
string_mask = utf8only
default_md = sha256
prompt = no
distinguished_name = req_distinguished_name
req_extensions = v3_exts
[ req_distinguished_name ]
C = US
ST = California
L = San Francisco
O = Confyrm Inc.
CN = www.confyrm.com
[ v3_exts ]
subjectAltName = DNS:www.confyrm.com
`
        expect(buff).to.equal(compareBuff);
    })

    it('creates a CSR with an unprotected key', () => {
        const options = require(path.resolve('./test/resources', 'csr.json'))
        const csr = new CSR()
        let pwd
        const outFile = 'test.csr.pem'
        return expect(
            csr.create(options, unprotectedKey)
            .then(result => {
                //console.log('Result:\n', result)
                return result
            })
            .catch(err => {
                console.log(err)
            })
        ).to.eventually.not.be.null

    })

    it('creates a CSR with a protected key', () => {
        const options = require(path.resolve('./test/resources', 'csr.json'))
        const csr = new CSR()
        const pwd = 'pass:password'
        const outFile = 'test.csr.pem'
        return expect(
            csr.create(options, protectedKey, pwd)
            .then(result => {
                //console.log('Result:\n', result)
                return result
            })
            .catch(err => {
                console.log(err)
            })
        ).to.eventually.not.be.null

    })
})