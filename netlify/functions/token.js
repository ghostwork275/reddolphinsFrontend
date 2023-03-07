const axios = require('axios')

exports.handler = async function (event, context) {
  try {
    const data = {token: process.env.REACT_APP_SESSION_TOKEN}
    return {
      statusCode: 200,
      body: JSON.stringify(data.token),
    };
  } catch (err) {
      return {
        statusCode: 404,
        body: err.toString(),
      };
  }
};