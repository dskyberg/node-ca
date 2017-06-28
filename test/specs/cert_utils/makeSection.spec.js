var expect = require('chai').expect;

var makeSection = require('../../../lib/utils/cert_utils/makeSection').default

describe('makeSection', () => {

    it('should create an empty section with passed section name', () => {
        var options  = {}
        var sectionName = 'test_section_name'
        var compareBuff = `[ ${sectionName} ]
`
        var newBuf = makeSection(options, sectionName)
        expect(newBuf).to.equal(compareBuff);
    })

    it('should create a section with values', () => {
        var options = {
            C: "US",
            ST: "California",
            L: "San Francisco",
            O: "Confyrm Inc.",
            CN: "www.confyrm.com"
        }
        var compareBuff = `[ req_distinguished_name ]
C = US
ST = California
L = San Francisco
O = Confyrm Inc.
CN = www.confyrm.com
`
        var newBuf = makeSection(options, 'req_distinguished_name')
        expect(newBuf).to.equal(compareBuff);
    });

})

