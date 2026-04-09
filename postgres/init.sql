-- SupaChat demo blog analytics schema + seed data
-- This runs automatically when the postgres container starts fresh

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT,
  author TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  read_time_minutes INT
);

CREATE TABLE IF NOT EXISTS article_views (
  id SERIAL PRIMARY KEY,
  article_id INT REFERENCES articles(id),
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  country TEXT,
  device TEXT
);

CREATE TABLE IF NOT EXISTS article_engagement (
  id SERIAL PRIMARY KEY,
  article_id INT REFERENCES articles(id),
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO articles (title, topic, author, published_at, read_time_minutes) VALUES
  ('Getting Started with AI', 'AI', 'Alice', NOW() - INTERVAL '60 days', 5),
  ('Docker Deep Dive', 'DevOps', 'Bob', NOW() - INTERVAL '55 days', 8),
  ('React Performance Tips', 'Frontend', 'Carol', NOW() - INTERVAL '50 days', 4),
  ('PostgreSQL Indexing Guide', 'Database', 'Dave', NOW() - INTERVAL '45 days', 6),
  ('Kubernetes vs Docker Swarm', 'DevOps', 'Eve', NOW() - INTERVAL '40 days', 10),
  ('Building LLM Apps', 'AI', 'Alice', NOW() - INTERVAL '35 days', 7),
  ('Next.js 14 App Router', 'Frontend', 'Carol', NOW() - INTERVAL '30 days', 6),
  ('Prometheus & Grafana Setup', 'DevOps', 'Bob', NOW() - INTERVAL '25 days', 9),
  ('Vector Databases Explained', 'AI', 'Dave', NOW() - INTERVAL '20 days', 8),
  ('CI/CD with GitHub Actions', 'DevOps', 'Eve', NOW() - INTERVAL '15 days', 5),
  ('CSS Grid Mastery', 'Frontend', 'Carol', NOW() - INTERVAL '10 days', 4),
  ('RAG Pipelines with LangChain', 'AI', 'Alice', NOW() - INTERVAL '5 days', 11),
  ('Node.js Streams', 'Backend', 'Bob', NOW() - INTERVAL '3 days', 6),
  ('TypeScript Tips & Tricks', 'Frontend', 'Dave', NOW() - INTERVAL '2 days', 5),
  ('Fine-tuning LLMs on Custom Data', 'AI', 'Alice', NOW() - INTERVAL '1 day', 12);

INSERT INTO article_views (article_id, viewed_at, country, device)
SELECT
  (random() * 14 + 1)::int,
  NOW() - (random() * 60)::int * INTERVAL '1 day' - (random() * 24)::int * INTERVAL '1 hour',
  (ARRAY['India','USA','UK','Germany','Canada','Australia','France','Brazil'])[ceil(random()*8)::int],
  (ARRAY['mobile','desktop','tablet'])[ceil(random()*3)::int]
FROM generate_series(1, 3000);

INSERT INTO article_engagement (article_id, likes, comments, shares, recorded_at)
SELECT
  id,
  (random() * 500)::int,
  (random() * 80)::int,
  (random() * 120)::int,
  NOW() - (random() * 60)::int * INTERVAL '1 day'
FROM articles;
