var expect = require('chai').expect;

var makeFilename = require('../../../lib/utils/cert_utils/makeFilename').default

describe('makeFilename', () => {
    it('should generate a default filename from the provided ext', () => {
        const compareName = 'test.ext'
        const options = {}
        const result = makeFilename(options, compareName)
        expect(result).to.equal(compareName)
    })

    it('should generate a filename from the provided default name', () => {
        let ext
        const compareName = 'test.txt'
        const options = {}
        const result = makeFilename(options, ext, compareName)
        expect(result).to.equal(compareName)
    })

    it('should generate a filename from the provided default name', () => {
        const ext = '.pem'
        const outFile = 'test.txt'
        const compareName = 'test.txt'
        const options = {}
        const result = makeFilename(options, ext, outFile)
        expect(result).to.equal(compareName)
    })

    it('should generate a filename from the option name and ext', () => {
        const ext = 'pem'
        let outFile
        const compareName = 'test.pem'
        const options = {
            name: 'test',
            cert: {
                subject: {
                    CN: `cn`
                }
            }
        }
        const result = makeFilename(options, ext, outFile)
        expect(result).to.equal(compareName)
    })
    it('should generate a filename from the option CN and ext', () => {
        const ext = 'pem'
        let outFile
        const compareName = 'cn.pem'
        const options = {
            cert: {
                subject: {
                    CN: `cn`
                }
            }
        }
        const result = makeFilename(options, ext, outFile)
        expect(result).to.equal(compareName)
    })
})
