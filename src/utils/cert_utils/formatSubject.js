/*
      * C -country,
      * O - organization,
      * OU - organizational unit,
      * DC - domain component
      * DNQualifier - distinguished name qualifier,
      * emailAddress - email address
      * ST - state or province name,
      * CN - common name (e.g., "Susan Housley"), and
      * SerialNumber - serial number.
      * L - locality,
      * T - title,
      * SN - surname,
      * GN - given name
*/

export default function formatSubject(attrs) {
    let subj = ''
    if ('C' in attrs) {
        subj += `/C=${attrs.C}`
    } else if ('country' in attrs) {
        subj += `/C=${attrs.country}`
    }

    if ('ST' in attrs) {
        subj += `/ST=${attrs.ST}`
    } else if ('state' in attrs) {
        subj += `/ST=${attrs.state}`
    }

    if ('L' in attrs) {
        subj += `/L=${attrs.L}`
    } else if ('locale' in attrs) {
        subj += `/L=${attrs.locale}`
    }

    if ('O' in attrs) {
        subj += `/O=${attrs.O}`
    } else if ('organization' in attrs) {
        subj += `/O=${attrs.organization}`
    }

    if ('OU' in attrs) {
        subj += `/OU=${attrs.OU}`
    } else if ('organizational unit' in attrs) {
        subj += `/OU=${attrs['organizational unit']}`
    }

    if ('DC' in attrs) {
        subj += `/DC=${attrs.C}`
    } else if ('domain component' in attrs) {
        subj += `/DC=${attrs['domain component']}`
    }

    if ('dnQualifier' in attrs) {
        subj += `/dnQualifier=${attrs.dnQualifier}`
    } else if ('distinguished name qualifier' in attrs) {
        subj += `/dnQualifier=${attrs['distinguished name qualifier']}`
    }

    if ('email' in attrs) {
        subj += `/emailAddress=${attrs.email}`
    } else if ('emailAddress' in attrs) {
        subj += `/emailAddress=${attrs.emailAddress}`
    } else if ('email address' in attrs) {
        subj += `/emailAddress=${attrs['email address']}`
    }

    if ('CN' in attrs) {
        subj += `/CN=${attrs.CN}`
    } else if ('common name' in attrs) {
        subj += `/CN=${attrs['common name']}`
    }

    if ('serialNumber' in attrs) {
        subj += `/serialNumber=${attrs.serialNumber}`
    } else if ('serial number' in attrs) {
        subj += `/serialNumber=${attrs['serial number']}`
    }

    if ('SN' in attrs) {
        subj += `/SN=${attrs.SN}`
    } else if ('surname' in attrs) {
        subj += `/SN=${attrs.surname}`
    }

    if ('GN' in attrs) {
        subj += `/GN=${attrs.GN}`
    } else if ('given name' in attrs) {
        subj += `/GN=${attrs['given name']}`
    }

    return subj
}
