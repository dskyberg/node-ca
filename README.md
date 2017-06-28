# node-ca: A Simple CA using openssl
This application provides a simpe CA around the excellent
[openssl wrapper](https://github.com/mgcrea/node-openssl-wrapper)
developed by Olivier Louvignes <olivier@mg-crea.com>
I wrote this primarily to make creating SSL server certs as easy as possible.

## Usage
The goal is to make this brain dead simple.  But there are two pieces you need
to manage - the standard openssl configuration files (`.cnf`), and the options
for certificates (`.json`).

### Managing Configuration Files
There are a couple default `.cnf` files in the configs folder for your pleasure.

__**NOTE**__: When you create a new CA, and select a `.cnf` file from the `config`
folder, that file will be copied to `openssl.cnf` in the root folder of the new CA.
So, modifying the `.cnf` file in the `config` folder will not change the
configuration for an existing CA. It is also perfectly acceptable to modify a CA's
`openssl.cnf`.

### Managing Options Files
Private key and certificate generation require an options file (`.json`).
You wil be prompted for the file name as required.

There are three example files in the `options` folder. One each for a root and
intermediate CA, and one for a server cert.

Unlike the CA configuration files (`.cnf`), the options file is not copied. It's
up to you to maintain it, if you want to reuse it.

See the "Options File Structure" section below for details.

## Requirements

### Node
Install node v8.*.*.  This app makes heavy use of es6+ ECMA features.  The best way is
to install nvm (`brew install nvm`), and then install node by version.
Such as `nvm use 8.1.1`

### Yarn
OK, not really a requirment, but if you are not using it, you should.  So install it.
Just run `brew install yarn`.  You will thank me.

### openssl
This app requires openssl to be installed.  I am currently using v0.9.8 on OS X.

## Installation
1. Download the source from this repo.
2. CD to the local repo folder and run `yarn install` to pull down all the deps
3. Once complete, run `yarn compile` to build the libs.

Done.

## First time
There are a couple steps to get ready for first use.

### (Optional) Change the `package.json` defaults
The only value in there currently is the name of the folder to use as the top
level folder for the CA's you crete.  It's in `ca.dir`.  There is no real reaon
to change this.  But, you can if you want.

### Change the `.cnf` defaults
The two `.cnf` files have default values in their respective dn policy and
disntiguished name sections.

#### `dn_policy`
This section controls what attributes are allowed in the subject of certs and csrs.
It also determines how they are allowed to be handled, and whether the provided
values in requests must be the same as the value in the CA's own cert. Things to note:
- If an attribute isn't in this section, it won't end up in the certificate.
- `match` means the requested value must equal the value in the CA's own cert.
- `optional` means the value is not required, and can be absent in the CSR
- `supplied` means the value is required, and must be in the request

#### `req_distinguished_name`
This section provides default values for the DN attributers listed above.

### (Optional) Change the Options files
The exmaple options files provided in the `options` folder can be modified to
suit you, and used to create the CA's and server certs.  You don't have to use
these.  You can create your own, and place them anywhere you want.

## Running
Run `yarn start` or `node lib/index.js` to run the app.  You should see the following

![interactive][doc/images/interactive1.png]

## Creating CA's
There are configs for a root CA and an intermediate CA.  Create them in that order.

1. First, select `2) Create a new CA`, and hit return (it's an inquirer quirk).
2. You will be promted to select a config - use `root`.
3. You will be prompted for an options file.  If you don't have one, just use the
`root.json`, in the `options` folder.  Ie, enter `./options/root.json` at the prompt.
4. You will be asked if this is self signed.  Click 'y'.

The root CA should be created under the `cas` folder.  If you need them, the
CA's private key is in `cas/root/private/ca.key.pem`, and the cert is in
`cas/root/certs/ca.cert.pem`

Follow the same recipe for the intermediate CA.  Only this time, just hit return
when asked if this is self signed (the promt defaults to no).  You thould then
see the new `cas/intermediate` folder.  You are now ready to mint end user and
server certs.

## Server and user Certs
If you look in the intermediate.cnf, you will see extension definitions for
user_certs and server_certs.  This governs the defaults for both the distinguished
name and v3 extensions for certs.  However, both of these can be overridden
in the options file you provide.

## Options File Structure
No magic here.  Pretty straightforward. Look at `server.json` for a more complete
demo.

Following are the sections of the file
### key
Controls the generation of the RSA key
#### size
Overrides the default size, in bits.
#### alg
Declare the key alg.  Currently ignored, as only RSA is supported for now.
#### dekAlg
Override the encryption alg used to protect the key.  Ignored if a password is
not provided.

### cert
#### days
Override the default validity period in days
#### subject
Override the default DN attributes.  Each attribute is specified as a `key: value`.
These are sent verbatim to openssl.  So, if you want to override a default value,
be sure to use the correct key.

### type
This is important.  It controls the extension definitions, etc., that openssl uses.  The 3 valid types are:
- 'ca': uses `v3_ca`
- 'user'
- 'server'

### name
Controls things such as the file names of outputs.

## Example
````json
{
    "key": {
        "alg": "rsa",
        "size": "2048",
        "dekAlg": "aes128"
    },
    "cert": {
        "days": "3650",
        "subject": {
            "C": "US",
            "ST": "California",
            "L": "San Francisco",
            "O": "My Inc.",
            "CN": "www.myserver.com"
        },
        "extensions": {
            "subjectAltName": "DNS:www.confyrm.com"
        }
    },
    "type": "server",
    "name": "www.myserver.com"
}
````

## License
Licensed freely.  All rights are reserved by David Skyberg.
