async function TReference(reference, fields){
    // Build return object
    const referenceInfo = {
        atId: await ( async () => {
            if ('atId' in fields){
                return reference["@Id"]
            } else {
                return null
            }
        })(),
        identifier: await ( async () => {
            if ('identifier' in fields){
                return reference.identifier
            } else {
                return null
            }
        })(),
        sender: await ( async () => {
            if ('sender' in fields){
                return reference.sender
            } else {
                return null
            }
        })(),
        sent: await ( async () => {
            if ('sent' in fields){
                const date = new Date(reference.sent)
                return date.toISOString()
            } else {
                return null
            }
        })()
    }
    // Return requested data
    return referenceInfo
}

module.exports = TReference