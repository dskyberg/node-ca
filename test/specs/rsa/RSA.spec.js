const path = require('path')
const chai = require('chai')
const chaiAsPromised = require("chai-as-promised")
chai.use(chaiAsPromised);
const expect = chai.expect

const RSA = require('../../../src/rsa/RSA.js').default

describe('RSA Keys', function () {

    it('creates an unprotected RSA key', () => {
        const options = require(path.resolve('./test/resources', 'csr.json'))
        const rsa = new RSA()
        return expect(
            rsa.create(options)
                .then(result => {
                    //console.log('Result:\n', result)
                    return result
                })
                .catch(err => {
                    console.log(err)
                })
        ).to.eventually.not.be.null

    })

    it('creates an unprotected RSA key, written to a file', () => {
        const options = require(path.resolve('./test/resources', 'csr.json'))
        const rsa = new RSA()
        let pwd
        const outFile = 'test1.rsa.pem'
        return expect(
            rsa.create(options, pwd, outFile)
                .then(result => {
                    //console.log('Result:\n', result)
                    return result
                })
                .catch(err => {
                    console.log(err)
                })
        ).to.eventually.not.be.null
    })

    it('creates a protected RSA key, with default alg', () => {
        const options = require(path.resolve('./test/resources', 'csr.json'))
        const rsa = new RSA()
        const pwd = 'pass:password'
        const outFile = 'test2.rsa.pem'
        return expect(
            rsa.create(options, pwd, outFile)
                .then(result => {
                    //console.log('Result:\n', result)
                    return result
                })
                .catch(err => {
                    console.log(err)
                })
        ).to.eventually.not.be.null
    })

    it('creates a protected RSA key, with default alg', () => {
        const options = require(path.resolve('./test/resources', 'csr.json'))
        const rsa = new RSA()
        const pwd = 'pass:password'
        const outFile = 'test3.rsa.pem'
        return expect(
            rsa.create(options, pwd, outFile)
                .then(result => {
                    //console.log('Result:\n', result)
                    return result
                })
                .catch(err => {
                    console.log(err)
                })
        ).to.eventually.not.be.null
    })

    it('creates a protected RSA key, with dek alg', () => {
        const options = require(path.resolve('./test/resources', 'csr.json'))
        options.key.dekAlg = 'des3'
        const rsa = new RSA()
        const pwd = 'pass:password'
        const outFile = 'test4.rsa.pem'
        return expect(
            rsa.create(options, pwd, outFile)
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