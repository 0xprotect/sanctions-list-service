import crypto from "node:crypto"

export function sha256(contents: string, descriptor: string): string {
    const hash = crypto.createHash('sha256')
    hash.update(contents)
    const result = hash.digest('hex')
    console.log(JSON.stringify({
        class: 'helpers',
        action: 'sha256',
        note: `hashing: ${descriptor}`,
        hash: result
    }))
    return result
}