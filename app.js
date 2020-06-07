const markdown      = require('markdown').markdown;
const express       = require('express');
const app           = express();
const port          = 3000;
const axios         = require('axios');
const sha1          = require('sha1');
const fs            = require('fs');
const child_process = require('child_process');

axios.interceptors.request.use(request => {
  console.log(`${request.method} - ${request.url}`);
  return request
})

app.get('/', async (req, res) => {
  const directory = await getRemoteDirectory('https://api.github.com/repos/siriusastrebe/gitblog/contents/blogs?ref=master');

  const firstFivePosts = directory.slice(0, 5);

  const promises = firstFivePosts.map((metadata) => {
    if (metadata.sha !== getCachedSHA(metadata.name)) {
      return getRemoteContents(metadata.download_url, metadata.name);
    } else {
      return getCachedContents(metadata.name);
    }
  });

  const contents = await Promise.all(promises);

  res.send(HTMLFormat(contents, firstFivePosts));
});

app.listen(port, () => console.log(`Gitblog running on http://localhost:${port}`))

// ----------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------
async function getRemoteDirectory(url) {
  let cacheExists = false;
  let defaultToCache = false;

  try {
    const file = await fs.promises.open(`./cachedBlogs.txt`, 'r');
    const stat = await file.stat(`./cachedBlogs.txt`);
    await file.close();

    cacheExists = true;
    if ((new Date().getTime() - stat.mtime) < 60000) {
      defaultToCache = true;
    }
  } catch {
    // Default to making an API call if cached directory data is unavailable
  }

  if (defaultToCache) {
    const file = await fs.promises.open(`./cachedBlogs.txt`, 'r');
    const contents = await file.readFile({encoding: 'utf8'});
    await file.close();

    return JSON.parse(contents);
  } else {
    try {
      const response = await axios.get(url);
      const contents = response.data;

      // Save results to cache
      const file = await fs.promises.open(`./cachedBlogs.txt`, 'w');
      await file.writeFile(JSON.stringify(contents), 'utf8');
      await file.close();

      return contents
    } catch (e) {
      if (cacheExists) {  
        const file = await fs.promises.open(`./cachedBlogs.txt`, 'r');
        const contents = await file.readFile({encoding: 'utf8'});
        await file.close();

        return JSON.parse(contents)
      } else {
        return []
      }
    }
  }
}

async function getRemoteContents(url, name) {
  try {
    const response = await axios.get(url, {timeout: 5000});
    const contents = response.data;

    const file = await fs.promises.open(`./cache/${name}`, 'w');
    await file.writeFile(contents, 'utf8');
    await file.close();

    return contents;
  } catch {
    return getCachedContents(name).catch();
  }
}
async function getCachedContents(filename) {
  const file = await fs.promises.open(`./cache/${filename}`, 'r');
  const contents = await file.readFile({encoding: 'utf8'});
  await file.close();

  return contents;
}
function getCachedSHA(filename) {
  try {
    return child_process.execSync(`git hash-object "./cache/${filename}"`, {timeout: 100, encoding: 'utf8', stdio: ['pipe', 'pipe', null]}).trim();
  } catch {
    return null
  }
}

function HTMLFormat(posts, metadatas) {
  let html = "<!DOCTYPE html><html><body>";


  posts.forEach((post, i) => {
    html += formatFile(post, metadatas[i].name);
  });

  html += "</body>";
  html += "<style type=\"text/css\">body{margin:40px auto;max-width:800px;line-height:1.6;font-size:18px;color:#444;padding:0 10px}h1,h2,h3{line-height:1.2}pre{background:lightyellow;overflow:scroll}</style>";
  html += "</html>";
  return html;
}

function formatFile(contents, name) {
  const extension = name.split('.')[name.split('.').length - 1];
  switch (extension) {
    case 'md':
      return markdown.toHTML(contents);
    case 'html':
      return contents;
  }
}
