function getISTDate() {
    const date = new Date();
    const offset = 5.5 * 60 * 60 * 1000; // IST offset is 5 hours and 30 minutes ahead of UTC
    return new Date(date.getTime() + offset);
}

module.exports = { getISTDate };