module.exports = {
  apps: [
    {
      name: "index",
      script: "index.js",
      env: {
        AI_PROVIDER: "ollama",
        OLLAMA_BASE_URL: "http://136.110.10.217:11434",
        OLLAMA_MODEL: "qwen2.5:3b",
	OLLAMA_TIMEOUT_MS: "180000"
      }
    }
  ]
};
