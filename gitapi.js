const markdown = require('markdown').markdown;
const express  = require('express');
const app      = express();
const port     = 3000;
const axios    = require('axios');

const blogUrl = 'https://api.github.com/repos/siriusastrebe/gitblog/contents/blogs?ref=master'

app.get('/', async (req, res) => {

  // Make a GET request to a public GIT repository
  const gitReq = await axios.get(blogUrl);

  const data = gitReq.data;
  res.send(data);
});

app.listen(port, () => console.log(`Gitblog running on http://localhost:${port}`))
