# 1. ใช้ Node.js เวอร์ชัน 22 ขึ้นไป (เพื่อให้ตรงกับความต้องการของ better-sqlite3)
FROM node:22-alpine

# 2. กำหนด Working Directory
WORKDIR /usr/src/app

# 3. ติดตั้ง Build Tools ที่จำเป็นสำหรับการคอมไพล์ Native Modules (เช่น better-sqlite3)
RUN apk add --no-cache python3 make g++

# 4. คัดลอก package.json และ package-lock.json
COPY package*.json ./

# 5. ติดตั้ง Dependencies เฉพาะ production
RUN npm ci --omit=dev

# 6. คัดลอกโค้ดส่วนที่เหลือทั้งหมด
COPY . .

# 7. คำสั่งรันบอท
CMD ["node", "index.js"]