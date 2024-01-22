FROM node:18

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

# Expose port 5000
EXPOSE 5000

# ENV variables
ENV PORT=5000 \ 
    HOST=0.0.0.0 \ 
    PROTOCOL=http \ 
    ROBOFLOW_API_KEY=YgFG7woPQL6ga80YeEwX \ 
    ROBOFLOW_MODEL_URL=aaa-rg3if/2 \
    DB_HOST=localhost \
    DB_PORT=5432 \
    DB_USER=postgres \
    DB_PASSWORD= \
    DB_NAME=db_name \
    DB_SSL=false 
   

# Start the app
CMD [ "npm", "start" ]