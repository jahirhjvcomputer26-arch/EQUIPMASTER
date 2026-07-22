FROM node:20-alpine

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install

COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

COPY backend/ ./backend/
RUN rm -rf backend/public && mkdir -p backend/public && cp -r frontend/dist/* backend/public/

EXPOSE 3001

CMD ["node", "backend/src/index.js"]
