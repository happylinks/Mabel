if (!global._babelPolyfill) {
   require('babel-polyfill');
}

const queryString = require('query-string');

const mabel = require('./mabel');

module.exports.hello = (event, context, callback) => {
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v1.0! Your function executed successfully!',
      input: event,
    }),
  };

  callback(null, response);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};

module.exports.mabel = (event, context, callback) => {
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
