import { createApp } from "./routes.js";

const PORT = Number(process.env.PORT ?? 8080);
createApp().listen(PORT, () => console.log(`Chatbot API on http://localhost:${PORT}`));
