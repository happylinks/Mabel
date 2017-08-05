if (!global._babelPolyfill) {
   require('babel-polyfill');
}

const queryString = require('query-string');

const mabel = require('./mabel');

const command = (event, context, callback) => {
    const body = event.body;
    const data = queryString.parse(body);

    mabel.command(data).then(responseBody => {
        const response = {
            statusCode: 200,
            body: JSON.stringify(responseBody),
        };

        callback(null, response);
    });
};

const interactive = (event, context, callback) => {
    const body = event.body;
    const data = queryString.parse(body);

    mabel.interactive(data).then(responseBody => {
        if (responseBody) {
            const response = {
                statusCode: 200,
                body: JSON.stringify(responseBody),
            };

            callback(null, response);
        } else {
            callback(null, false);
        }
    });
};

module.exports = {
    command,
    interactive,
};
