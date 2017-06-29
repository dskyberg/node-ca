/* Setup logging to file */
import process from 'process'
import path from 'path'
import fs from 'fs'
import winston from 'winston'

import { fileExistsSync, isDirectory } from '../utils'


export default class Logger {
    constructor() {
        this.logFile = null
        winston.level = 'silly'
        this.uiLevel = 'error'
        this.ui = null
    }

    removeConsole() {
        winston.remove(winston.transports.Console);
    }

    setLogLevel(level) {
        winston.level = level
    }
    setUILevel(level) {
        this.uiLevel = level
    }
    addFile(packageJson) {
        try {
        if ('ca' in packageJson && 'logs' in packageJson.ca) {
            this.logFile = path.resolve('./', packageJson.ca.logs, 'node-ca.log')
        } else {
            this.logFile = path.resolve(process.cwd(), 'node-ca.log')
        }
        const logDir = path.dirname(this.logFile)
        if (!isDirectory(logDir)) {
            fs.mkdirSync(logDir)
        }
        winston.add(winston.transports.File, {
            filename: this.logFile,
            handleExceptions: true,
            humanReadableUnhandledException: true
        });
        } catch(err) {
            console.log('Failed adding file to Logger', err)
            throw err
        }
    }

    addUI(ui) {
        this.ui = ui
    }

    // make sure all the pieces are toString'd
    combineParts(message, ...all) {
        let strs = []
        if (!all || all === null || all.length === 0) {
            return message
        }
        strs.push(message)
        all.forEach(part => {strs.push(`${part}`)})
        return strs.join(' ')
    }

    log(level, message, ...all) {
        try {
            const txt = this.combineParts(message, all)
            if(!this.ui && !this.logFile) {
                console.log(message, ...all)
                return
            }
            if (this.logFile !== null) {
                winston.log(level, message, ...all)
            }
            if (this.ui !== null && level <= this.uiLevel) {
                this.ui.log.write(message)
            }
        } catch(err) {
            console.log('Logger failed writing log:', err)
            throw err
        }
    }

    error(message, ...all) {
        this.log('error', message, ...all)
    }
    warn(message, ...all) {
        this.log('warn', message, ...all)
    }
    info(message, ...all) {
        this.log('info', message, ...all)
    }
    verbose(message, ...all) {
        this.log('verbose', message, ...all)
    }
    debug(message, ...all) {
        this.log('debug', message, ...all)
    }
    silly(message, ...all) {
        this.log('silly', message, ...all)
    }
}
