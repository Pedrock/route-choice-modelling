# route-choice-modelling

> Driving simulation with OpenStreetMaps and Google StreetView. Used for obtaining data for agent based route choice modelling. 

## Environment Setup

Install Node.js and PostgreSQL + Postgis. 

Import the database.sql dump file present in the database_sql directory of this project.

Copy the .env.example file to .env and edit it accordingly.

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run in production
npm start
```

For detailed explanation on how things work, checkout the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
