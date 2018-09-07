'use strict';
const dd = require('dedent');
const joi = require('joi');
const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;
const createRouter = require('@arangodb/foxx/router');
const Mytest = require('../models/mytest');

const mytestItems = module.context.collection('mytest');
const keySchema = joi.string().required()
.description('The key of the mytest');

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const router = createRouter();
module.exports = router;


router.tag('mytest');


router.get(function (req, res) {
  res.send(mytestItems.all());
}, 'list')
.response([Mytest], 'A list of mytestItems.')
.summary('List all mytestItems hi i am here')
.description(dd`
  Retrieves a list of all mytestItems.
`);


router.post(function (req, res) {
  const mytest = req.body;
  let meta;
  try {
    meta = mytestItems.save(mytest);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_DUPLICATE) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(mytest, meta);
  res.status(201);
  res.set('location', req.makeAbsolute(
    req.reverse('detail', {key: mytest._key})
  ));
  res.send(mytest);
}, 'create')
.body(Mytest, 'The mytest to create.')
.response(201, Mytest, 'The created mytest.')
.error(HTTP_CONFLICT, 'The mytest already exists.')
.summary('Create a new mytest')
.description(dd`
  Creates a new mytest from the request body and
  returns the saved document.
`);


router.get(':key', function (req, res) {
  const key = req.pathParams.key;
  let mytest
  try {
    mytest = mytestItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
  res.send(mytest);
}, 'detail')
.pathParam('key', keySchema)
.response(Mytest, 'The mytest.')
.summary('Fetch a mytest')
.description(dd`
  Retrieves a mytest by its key.
`);


router.put(':key', function (req, res) {
  const key = req.pathParams.key;
  const mytest = req.body;
  let meta;
  try {
    meta = mytestItems.replace(key, mytest);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  Object.assign(mytest, meta);
  res.send(mytest);
}, 'replace')
.pathParam('key', keySchema)
.body(Mytest, 'The data to replace the mytest with.')
.response(Mytest, 'The new mytest.')
.summary('Replace a mytest')
.description(dd`
  Replaces an existing mytest with the request body and
  returns the new document.
`);


router.patch(':key', function (req, res) {
  const key = req.pathParams.key;
  const patchData = req.body;
  let mytest;
  try {
    mytestItems.update(key, patchData);
    mytest = mytestItems.document(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    if (e.isArangoError && e.errorNum === ARANGO_CONFLICT) {
      throw httpError(HTTP_CONFLICT, e.message);
    }
    throw e;
  }
  res.send(mytest);
}, 'update')
.pathParam('key', keySchema)
.body(joi.object().description('The data to update the mytest with.'))
.response(Mytest, 'The updated mytest.')
.summary('Update a mytest')
.description(dd`
  Patches a mytest with the request body and
  returns the updated document.
`);


router.delete(':key', function (req, res) {
  const key = req.pathParams.key;
  try {
    mytestItems.remove(key);
  } catch (e) {
    if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
      throw httpError(HTTP_NOT_FOUND, e.message);
    }
    throw e;
  }
}, 'delete')
.pathParam('key', keySchema)
.response(null)
.summary('Remove a mytest')
.description(dd`
  Deletes a mytest from the database.
`);
