function defaultReturn(success, defaultData){
    return {
        success: success,
        message: defaultData.message,
        data: defaultData.data
    }
}

function fail(defaultData){
    return {
        default: defaultReturn(false, defaultData)
    }
}

function success(defaultData, customData){
    const defaultObject = defaultReturn(true, defaultData)
    return {
        default: defaultObject,
        ...customData
    }
}

module.exports = {
    success,
    fail
}