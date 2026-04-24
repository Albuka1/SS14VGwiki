const fs = require('node:fs');
const path = require('node:path');

const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');

const { createToken, requireAuth } = require('./middleware/auth');
const { createPage, deletePage, getPageById, getPageBySlug, listPages, updatePage } = require('./db');
const { createSlug } = require('./utils/slugify');

dotenv.config({
  path: path.resolve(__dirname, '../.env')
});

const app = express();
const port = Number(process.env.PORT) || 3001;
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'change-me';

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_request, response) => {
  response.json({
    status: 'ok'
  });
});

app.post('/api/auth/login', (request, response) => {
  const username = String(request.body?.username ?? '').trim();
  const password = String(request.body?.password ?? '');

  if (!username || !password) {
    return response.status(400).json({
      message: 'Username and password are required.'
    });
  }

  if (username !== adminUsername || password !== adminPassword) {
    return response.status(401).json({
      message: 'Invalid username or password.'
    });
  }

  return response.json({
    token: createToken({ username: adminUsername }),
    user: {
      username: adminUsername
    }
  });
});

app.get('/api/auth/me', requireAuth, (request, response) => {
  response.json({
    user: {
      username: request.user.username
    }
  });
});

app.get('/api/pages', (_request, response) => {
  response.set('Cache-Control', 'private, max-age=15');
  response.json(listPages(_request.query.q));
});

app.get('/api/pages/id/:id', requireAuth, (request, response) => {
  const page = getPageById(Number(request.params.id));

  if (!page) {
    return response.status(404).json({
      message: 'Page not found.'
    });
  }

  return response.json(page);
});

app.get('/api/pages/:slug', (request, response) => {
  response.set('Cache-Control', 'private, max-age=60');
  const page = getPageBySlug(createSlug(request.params.slug));

  if (!page) {
    return response.status(404).json({
      message: 'Page not found.'
    });
  }

  return response.json(page);
});

app.post('/api/pages', requireAuth, (request, response) => {
  const title = String(request.body?.title ?? '').trim();
  const content = String(request.body?.content ?? '');

  if (!title) {
    return response.status(400).json({
      message: 'Title is required.'
    });
  }

  try {
    const page = createPage({
      title,
      slug: request.body?.slug,
      content
    });

    return response.status(201).json(page);
  } catch (error) {
    if (error.code === 'SLUG_CONFLICT') {
      return response.status(409).json({
        message: 'A page with this slug already exists.'
      });
    }

    return response.status(500).json({
      message: 'Failed to create page.'
    });
  }
});

app.put('/api/pages/:id', requireAuth, (request, response) => {
  const title = String(request.body?.title ?? '').trim();

  if (!title) {
    return response.status(400).json({
      message: 'Title is required.'
    });
  }

  try {
    const page = updatePage(Number(request.params.id), {
      title,
      slug: request.body?.slug,
      content: request.body?.content
    });

    if (!page) {
      return response.status(404).json({
        message: 'Page not found.'
      });
    }

    return response.json(page);
  } catch (error) {
    if (error.code === 'SLUG_CONFLICT') {
      return response.status(409).json({
        message: 'A page with this slug already exists.'
      });
    }

    return response.status(500).json({
      message: 'Failed to update page.'
    });
  }
});

app.delete('/api/pages/:id', requireAuth, (request, response) => {
  const deleted = deletePage(Number(request.params.id));

  if (!deleted) {
    return response.status(404).json({
      message: 'Page not found.'
    });
  }

  return response.status(204).send();
});

const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get(/^(?!\/api).*/, (_request, response) => {
    response.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use('/api', (_request, response) => {
  response.status(404).json({
    message: 'API route not found.'
  });
});

app.listen(port, () => {
  console.log(`Wiki server running on http://localhost:${port}`);
  console.log(`Admin username: ${adminUsername}`);

  if (!process.env.ADMIN_PASSWORD) {
    console.log('Admin password: change-me');
  } else {
    console.log('Admin password loaded from server/.env');
  }
});
