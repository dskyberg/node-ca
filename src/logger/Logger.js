/* Setup logging to file */
import process from 'process'
import path from 'path'
import fs from 'fs'
import winston from 'winston'

import { fileExistsSync, isDirectory } from '../utils'


export default class Logger {
    constructor() {
        winston.remove(winston.transports.Console);
        winston.level = 'silly'
        this.uiLevel = 'error'
        this.ui = null
    }
    setLogLevel(level) {
        winston.level = level
    }
    setUILevel(level) {
        this.uiLevel = level
    }
    addFile(packageJson) {
        try {
        let logFile
        if ('ca' in packageJson && 'logs' in packageJson.ca) {
            logFile = path.resolve('./', packageJson.ca.logs, 'node-ca.log')
        } else {
            logFile = path.resolve(process.cwd(), 'node-ca.log')
        }
        const logDir = path.dirname(logFile)
        if (!isDirectory(logDir)) {
            fs.mkdirSync(logDir)
        }
        winston.add(winston.transports.File, {
            filename: logFile,
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
        all.forEach(part => {str.push(`${part}`)})
        return all.join(' ')
    }

    log(level, message, ...all) {
        try {
            const txt = this.combineParts(message, all)
            winston.log(level, txt)
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
