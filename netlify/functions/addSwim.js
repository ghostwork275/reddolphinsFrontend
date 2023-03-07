const axios = require('axios')

exports.handler = async function (event, context) {
  try {
    const {data} = await axios.post(`${process.env.REACT_APP_API_URL}/api/addswim`, JSON.parse(event.body), {
      auth: {
        username: process.env.REACT_APP_API_UNAME,
        password: process.env.REACT_APP_API_PASS
        }
      })
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
      return {
        statusCode: 404,
        body: err.toString(),
      };
  }
};