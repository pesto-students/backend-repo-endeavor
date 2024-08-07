const console_logging = (req, res, next) => {
    console.log(`Received request for ${req.url}`);
    next();
}

module.exports = console_logging