# Local AI Models Setup Guide

This guide will help you connect your local AI models from LM Studio, Ollama, and other local AI servers to OpenModel.

## 🏠 Supported Local AI Servers

### 1. LM Studio
**Download:** [lmstudio.ai](https://lmstudio.ai)

**Setup Steps:**
1. Download and install LM Studio
2. Download a model (e.g., Llama 2, Mistral, Code Llama)
3. Load the model in LM Studio
4. Start the local server (usually runs on `localhost:1234`)
5. In OpenModel, select "Custom" provider and use endpoint: `http://localhost:1234/v1/chat/completions`

**Popular Models:**
- Llama 2 7B/13B/70B
- Code Llama 7B/13B
- Mistral 7B
- Mixtral 8x7B
- Phi-2
- Gemma 2B/7B

### 2. Ollama
**Download:** [ollama.ai](https://ollama.ai)

**Setup Steps:**
1. Install Ollama
2. Pull a model: `ollama pull llama2`
3. Start the server: `ollama serve`
4. In OpenModel, select "Custom" provider and use endpoint: `http://localhost:11434/api/generate`

**Popular Models:**
```bash
ollama pull llama2
ollama pull codellama
ollama pull mistral
ollama pull mixtral
ollama pull phi
ollama pull gemma
```

### 3. Text Generation WebUI
**Download:** [GitHub Repository](https://github.com/oobabooga/text-generation-webui)

**Setup Steps:**
1. Clone and install the repository
2. Download models and start the web UI
3. Enable API mode in settings
4. In OpenModel, select "Custom" provider and use endpoint: `http://localhost:5000/v1/chat/completions`

### 4. Docker Containers 🐳
**Benefits:** Easy setup, isolation, consistent environment

#### Docker Ollama
```bash
# Pull and run Ollama in Docker
docker run -d -p 11434:11434 --name ollama ollama/ollama

# Pull a model
docker exec -it ollama ollama pull llama2

# Check if running (from host)
curl http://localhost:11434/api/tags

# Check if running (from another Docker container)
curl http://host.docker.internal:11434/api/tags
```

#### Docker Text Generation WebUI
```bash
# Run Text Generation WebUI in Docker
docker run -d -p 5000:5000 --name textgen \
  -v /path/to/models:/models \
  --gpus all \
  ghcr.io/oobabooga/text-generation-webui

# Access from host: http://localhost:5000
# Access from Docker: http://host.docker.internal:5000
```

#### Docker LM Studio Compatible
```bash
# Run LM Studio compatible server
docker run -d -p 1234:1234 --name lm-studio-server \
  -v /path/to/models:/models \
  your-lm-studio-image

# Access from host: http://localhost:1234
# Access from Docker: http://host.docker.internal:1234
```

## 🔧 Configuration in OpenModel

### Step 1: Select Custom Provider
1. Go to Dashboard → Add AI Model
2. Click on "Custom" provider card

### Step 2: Choose Your Local Server
Select from the dropdown:

**Native Installation:**
- **LM Studio** (localhost:1234)
- **Ollama** (localhost:11434)
- **Text Generation WebUI** (localhost:5000)

**Docker Containers:**
- **🐳 LM Studio Docker** (localhost:1234)
- **🐳 Ollama Docker** (localhost:11434)
- **🐳 Text Generation WebUI Docker** (localhost:5000)

**Custom:**
- **Custom Server** (enter your own endpoint)

### Step 3: Configure Model
1. **Model Name:** Give your model a friendly name
2. **Description:** Describe what this model is for
3. **Model ID:** Select from popular local models or choose "Custom Model"
4. **Endpoint URL:** Will auto-fill based on your server selection
5. **API Key:** Leave empty for most local servers

### Step 4: Test Connection
After adding the model, you can test it in the chat interface.

## 📋 Common Endpoints

| Server | Default Endpoint | Notes |
|--------|------------------|-------|
| LM Studio | `http://localhost:1234/v1/chat/completions` | OpenAI-compatible API |
| Ollama | `http://localhost:11434/api/generate` | Native Ollama API |
| Text Generation WebUI | `http://localhost:5000/v1/chat/completions` | OpenAI-compatible API |
| **Docker LM Studio** | `http://host.docker.internal:1234/v1/chat/completions` | Use host.docker.internal for Docker networking |
| **Docker Ollama** | `http://host.docker.internal:11434/api/generate` | Use host.docker.internal for Docker networking |
| **Docker Text Generation WebUI** | `http://host.docker.internal:5000/v1/chat/completions` | Use host.docker.internal for Docker networking |
| Custom | Your endpoint | Any compatible API |

## 🚀 Popular Local Models

### Code Generation
- **Code Llama 7B/13B** - Excellent for coding tasks
- **Phi-2** - Microsoft's small but capable model
- **StarCoder** - Specialized for code completion

### General Purpose
- **Llama 2 7B/13B/70B** - Meta's versatile models
- **Mistral 7B** - Fast and efficient
- **Mixtral 8x7B** - Mixture of experts model

### Lightweight
- **Gemma 2B/7B** - Google's efficient models
- **Phi-2** - Small but powerful

## 🔍 Troubleshooting

### Connection Issues
1. **Check if server is running** - Make sure your local AI server is started
2. **Verify endpoint URL** - Ensure the URL is correct and accessible
3. **Check firewall** - Make sure localhost connections are allowed
4. **Test with curl** - Try: `curl http://localhost:1234/v1/models`

### Model Loading Issues
1. **Check model size** - Ensure you have enough RAM/VRAM
2. **Verify model format** - Make sure the model is compatible with your server
3. **Check logs** - Look at server logs for error messages

### Performance Tips
1. **Use appropriate model size** - Smaller models for faster responses
2. **Adjust context length** - Reduce if you're running out of memory
3. **Close other applications** - Free up system resources

## 🔒 Security Notes

- Local models run entirely on your machine
- No data is sent to external servers
- API keys are optional for most local servers
- Your conversations remain private

## 📚 Additional Resources

- [LM Studio Documentation](https://lmstudio.ai/docs)
- [Ollama Documentation](https://ollama.ai/docs)
- [Text Generation WebUI Wiki](https://github.com/oobabooga/text-generation-webui/wiki)
- [Model Comparison Guide](https://huggingface.co/models)

## 💡 Tips for Best Experience

1. **Start with smaller models** - Test with 7B models first
2. **Use GPU acceleration** - Enable CUDA/ROCm for better performance
3. **Monitor system resources** - Keep an eye on RAM/VRAM usage
4. **Experiment with different models** - Find what works best for your use case
5. **Join communities** - Get help from other users on Discord/Reddit

Happy local AI chatting! 🎉
