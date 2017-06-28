export default function isSelfSigned(cert) {
    if (cert.subject.length !== cert.issuer.length) {
        return false
    }
    for (let attr in cert.subject) {
        if (!(attr in cert.issuer) || cert.subject[attr] !== cert.issuer[attr]) {
            return false
        }
    }
    return true
}
