const markdown = require('markdown').markdown;
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  const html = markdown.toHTML('#Hello\nBeautiful *World*!');
  res.send("<html><body>" + html + "</body></html>");
});

app.listen(port, () => console.log(`Gitblog running on http://localhost:${port}`))



