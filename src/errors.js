export const error4xx = (err, req, res, next) => {
    if (err.status === 400) res.status(400).send(err.message || "Something is missing")
    else if (err.status === 401) res.status(401).send(err.message || "You are not logged in!")
    else if (err.status === 403) res.status(403).send(err.message || "You are not allowed to do that!")
    else if (err.status === 404) res.status(404).send(err.message || "You are lost")
    else next(err)
}

export const catchAllHandler = (err, req, res, next) => {
    res.status(500).send(err.message)
}
