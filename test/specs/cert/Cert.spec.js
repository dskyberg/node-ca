const path = require('path')
const chai = require('chai')
const chaiAsPromised = require("chai-as-promised")
chai.use(chaiAsPromised);
const expect = chai.expect

import Cert from '../../../src/cert/Cert'

describe('Cert', function () {
    it('parses a cert', () => {
        const certPath = path.resolve('./test/resources', 'cert.pem')
        const cert = new Cert(certPath)
        expect(cert.subject.countryName).to.equal('US')
    })

})