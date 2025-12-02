# Suna Frontend

## Quick Setup

The easiest way to get your frontend configured is to use the setup wizard from the project root:

```bash
cd .. # Navigate to project root if you're in the frontend directory
python setup.py
```

This will configure all necessary environment variables automatically.

## Environment Configuration

The setup wizard automatically creates a `.env.local` file with the following configuration:

```sh
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000/api
NEXT_PUBLIC_URL=http://localhost:3000
NEXT_PUBLIC_ENV_MODE=LOCAL
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

## Development Notes

- The frontend connects to the backend API at `http://localhost:8000/api`
- Supabase is used for authentication and database operations
- The app runs on `http://localhost:3000` by default
- Environment variables are automatically configured by the setup wizard

## Model Selection

The application supports selecting different AI models through the settings interface. Navigate to **Settings > Model** to configure your preferred AI model.

### Features

- **Model Selection**: Choose from a variety of AI models including premium and free tier options
- **Custom Models (Local Mode)**: When running in local mode (`NEXT_PUBLIC_ENV_MODE=LOCAL`), you can add custom models from [OpenRouter](https://openrouter.ai/models)
- **Persistent Settings**: Your model preference is saved locally and persists across sessions

### Adding Custom Models

In local mode, you can add custom OpenRouter models:

1. Go to **Settings > Model**
2. Click "Add Custom Model"
3. Enter the model ID (e.g., `openrouter/meta-llama/llama-4-maverick`)
4. The model will be available for selection immediately

### Model Tiers

- **Premium Models**: Require an active subscription. These models offer enhanced reasoning, accuracy, and capabilities
- **Free Models**: Available to all users with basic capabilities
- **Custom Models**: User-defined models available in local mode only
