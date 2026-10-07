"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const service_routes_1 = __importDefault(require("./routes/service.routes"));
const job_routes_1 = __importDefault(require("./routes/job.routes"));
const bid_routes_1 = __importDefault(require("./routes/bid.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const review_routes_1 = __importDefault(require("./routes/review.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const recommendation_routes_1 = __importDefault(require("./routes/recommendation.routes"));
const socket_1 = require("./socket");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Render (and most PaaS hosts) sit behind a reverse proxy, so without this
// req.ip would resolve to the proxy's address for every request, making
// IP-based rate limiting useless. Trusting one hop is safe for a single
// reverse proxy in front of the app.
app.set('trust proxy', 1);
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Gigverse API', timestamp: new Date().toISOString() });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/services', service_routes_1.default);
app.use('/api/jobs', job_routes_1.default);
app.use('/api/bids', bid_routes_1.default);
app.use('/api/messages', message_routes_1.default);
app.use('/api/reviews', review_routes_1.default);
app.use('/api/payments', payment_routes_1.default);
app.use('/api/recommendations', recommendation_routes_1.default);
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
const httpServer = http_1.default.createServer(app);
(0, socket_1.setupSocket)(httpServer); // Real-time chat & presence engine
httpServer.listen(PORT, () => {
    console.log(`Gigverse server running on port ${PORT}`);
});
exports.default = app;
