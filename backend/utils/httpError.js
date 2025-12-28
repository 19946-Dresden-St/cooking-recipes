function httpError(statusCode, message, { code = "ERROR", details = null } = {}) {
    const err = new Error(message);
    err.statusCode = statusCode;
    err.code = code;
    err.details = details;
    return err;
}

module.exports = httpError;
