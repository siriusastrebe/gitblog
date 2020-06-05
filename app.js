const markdown = require('markdown').markdown;
const express  = require('express');
const app      = express();
const port     = 3000;
const axios    = require('axios');

axios.interceptors.request.use(request => {
  console.log(`${request.method} - ${request.url}`);
  return request
})

const blogUrl = 'https://api.github.com/repos/siriusastrebe/gitblog/contents/blogs'
const params  = '?ref=master'

app.get('/', async (req, res) => {
  const directory = await axios.get(blogUrl + params);

  const firstFivePosts = directory.data.slice(0, 5);

  const promises = firstFivePosts.map((metadata) => {
    return axios.get(metadata.download_url);
  });

  const blogPosts = await Promise.all(promises);

  const html = HTMLFormat(blogPosts);

  res.send(html);
});

app.listen(port, () => console.log(`Gitblog running on http://localhost:${port}`))

// ----------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------
function HTMLFormat(posts) {
  let html = "<!DOCTYPE html><html><body>";

  posts.forEach((post) => {
    html += formatFile(post.request.path, post.data);
  });

  html += "</body></html>"
  return html;
}

function formatFile(name, contents) {
  const extension = name.split('.')[name.split('.').length - 1];
  switch (extension) {
    case 'md': 
      return markdown.toHTML(contents);
    case 'html':
      return contents;
  }
}
