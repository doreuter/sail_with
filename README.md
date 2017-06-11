# Project X
**Master** [![Build Status](https://travis-ci.com/kreftk/projectX.svg?token=rctt6EZqMUB78rqY6gyB&branch=master)](https://travis-ci.com/kreftk/projectX)
**Development** [![Build Status](https://travis-ci.com/kreftk/projectX.svg?token=rctt6EZqMUB78rqY6gyB&branch=dev)](https://travis-ci.com/kreftk/projectX)


Your own movie database based on the popular MEAN-Stack.


## Installation

Project X requires [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) to run.

Install the dependencies and devDependencies and start the server.

```sh
$ cd projectX
$ npm install
$ npm start
```

## Run local env

Start mongoDB
```sh
$ cd mongodb/bin
$ ./mongod
```

Start server
```sh
$ npm start
```

Generate gulp files
```sh
$ gulp dev && gulp watch
```
