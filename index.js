'use strict';

let express = require('express');
let redis = require('redis').createClient(process.env.REDIS_URL);
let shortid = require('shortid');
let app = express();

app.set('port', (process.env.PORT || 5000));

// need to make it middleware to properly handle the given URL
app.use('/new/*', function(request, response, next) {
  let url = request.originalUrl.replace(/^\/new\//, '');
  
  if (url.match(/^https?:\/\/[\w\d_-]+(\.[\w\d_-]+){1,}(\/[^\/]*)*/)) {
    redis.get(url, (err, reply) => {
      let sid = reply;
      if (sid === null) {
        sid = shortid.generate();
        // this ensures we can look it up by shortid or URL,
        // which means we won't store the same URL multiple times
        redis.set(url, sid);
        redis.set(sid, url);
      }
      response.send( { original_url: url, short_url: sid } );
      next();
    });
  }
  else {
    response.send( { error: "Invalid URL"} );
    next(); 
  }
});

app.get('/:id', function(request, response) {
  redis.get(request.params.id, (err, reply) => {
    if (reply === null) {
      response.send( { error: "Unknown URL ID"} )
    }
    else {
      response.redirect(reply);
    }
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

