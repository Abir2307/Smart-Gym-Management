import 'dotenv/config';
import { createApp } from "./app.js";

const port = process.env.PORT || 4000;

const app = await createApp();

app.listen(port, () => {
  console.log(`Smart Gym API running on http://localhost:${port}`);
});